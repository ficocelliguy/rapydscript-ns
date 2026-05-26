/* vim:fileencoding=utf-8
 *
 * Copyright (C) 2016 Kovid Goyal <kovid at kovidgoyal.net>
 *
 * Distributed under terms of the BSD license
 */

var namespace = {}, jsSHA = {};

var write_cache = {};

// ─── Sandbox error type ─────────────────────────────────────────────
// Thrown when the vm-shim cannot construct or evaluate code in a
// sandboxed context. The original error (if any) is attached as .cause
// so callers can inspect platform-specific details. The .hint string
// names the likely root cause and remediation.
function RapydScriptSandboxError(message, opts) {
    var err = new Error(message);
    this.name = 'RapydScriptSandboxError';
    this.message = message;
    this.stack = err.stack;
    if (opts) {
        if (opts.cause !== undefined) this.cause = opts.cause;
        if (opts.hint) this.hint = opts.hint;
    }
}
RapydScriptSandboxError.prototype = Object.create(Error.prototype);
RapydScriptSandboxError.prototype.constructor = RapydScriptSandboxError;
namespace.RapydScriptSandboxError = RapydScriptSandboxError;

// ─── Async "tools ready" helper ─────────────────────────────────────
// Resolves when the host environment is far enough along to evaluate
// compiled code: document.body present (in a browser), or immediately
// in non-browser hosts (Worker, SSR, Node test sandbox). Bounded by
// timeout_ms — we always resolve, never reject; downstream code is
// responsible for surfacing a clear error if it still can't work.
function _rs_await_tools_ready(timeout_ms) {
    if (typeof timeout_ms !== 'number' || timeout_ms < 0) timeout_ms = 2000;
    return new Promise(function (resolve) {
        // Non-browser host: there is no DOM to wait on.
        if (typeof document === 'undefined') return resolve();
        // Already ready.
        if (document.readyState !== 'loading' && document.body) return resolve();

        var resolved = false;
        var poll_handle = null;
        var timer_handle = null;
        function settle() {
            if (resolved) return;
            resolved = true;
            if (poll_handle && typeof clearInterval === 'function') clearInterval(poll_handle);
            if (timer_handle && typeof clearTimeout === 'function') clearTimeout(timer_handle);
            resolve();
        }
        function check() { if (document.body) settle(); }

        if (typeof document.addEventListener === 'function') {
            try {
                document.addEventListener('DOMContentLoaded', check, { once: true });
                document.addEventListener('readystatechange', check);
            } catch (e) { /* IE-style addEventListener may not accept options */ }
        }
        // Belt-and-suspenders: poll in case events miss (e.g. body becomes
        // available between readystatechange firings).
        if (typeof setInterval === 'function') {
            poll_handle = setInterval(check, 50);
        }
        if (typeof setTimeout === 'function') {
            timer_handle = setTimeout(settle, timeout_ms);
        } else {
            // No timer available — resolve now rather than hang.
            settle();
        }
    });
}
namespace._rs_await_tools_ready = _rs_await_tools_ready;

// ─── Sandbox error explanation helper ───────────────────────────────
// Translates platform errors from eval / new Function into a domain
// error with a remediation hint. We deliberately do NOT rewrap if it's
// already one of our errors.
function _rs_explain_sandbox_failure(e, filename) {
    if (e && e.name === 'RapydScriptSandboxError') return e;
    var raw = (e && (e.message || e.toString && e.toString())) || String(e);
    var hint;
    if (/unsafe-eval|Content Security Policy|Refused to evaluate|EvalError/i.test(raw)) {
        hint = "Content Security Policy blocks eval/new Function — script-src 'unsafe-eval' is required to run the RapydScript compiler in this environment.";
    } else if (typeof document === 'undefined' && typeof window === 'undefined') {
        hint = "No browser-like global is available — the RapydScript bundle is being used in a Worker or non-DOM context.";
    } else {
        hint = "JS evaluation failed inside the RapydScript sandbox; see .cause for the original error.";
    }
    var msg = 'RapydScript sandbox failed' + (filename ? ' (' + filename + ')' : '') + ': ' + raw;
    return new RapydScriptSandboxError(msg, { cause: e, hint: hint });
}

// ─── React stub ─────────────────────────────────────────────────────
// Pulled out of createContext into a named factory so it can be reused
// without paying the cost on every context (and so tests/diagnostics
// can call it explicitly).
// ─── Top-level declaration scan ─────────────────────────────────────
// In the old iframe shim, code passed to runInContext would land in the
// iframe's window, so `function foo` / `let foo` / `var foo` declarations
// persisted across runInContext calls — that's what the REPL relies on
// to keep baselib helpers (ρσ_in, NameError, ρσ_desugar_kwargs, etc.)
// alive between the bootstrap step and later runjs() calls.
//
// Without the iframe we wrap user code in a Function and use direct
// `eval` inside it (so the user's expression value is the wrapper's
// return value, matching Node's vm.runInContext semantics). var/function
// declarations inside non-strict direct eval hoist into the wrapper
// scope; `let`/`const` do NOT. To capture all top-level decls we (a)
// rewrite line-leading `let`/`const` → `var` so they hoist, and (b)
// scan the source for the declared names and append explicit
// `ctx.NAME = NAME` assignments to copy them back into ctx after the
// eval returns.
//
// The scan is intentionally regex-based and only matches un-indented,
// line-leading declarations — that's the shape baselib and compiler
// output emit, and it's exactly the set we want. Indented (nested)
// declarations are deliberately ignored. Spurious matches inside
// template strings or comments are harmless: each capture sits in a
// try/catch and a ReferenceError just silently no-ops.
function _rs_find_top_level_decl_names(src) {
    // Normalize: insert a newline after every depth-0 `;` so each top-level
    // statement starts at column 0. Comments and string literals are skipped
    // so we don't mis-track braces inside them. Indented (nested) declarations
    // are unaffected because we only insert breaks at depth 0.
    var n = src.length;
    var out = '';
    var i = 0;
    var depth = 0;
    while (i < n) {
        var c = src.charAt(i);
        if (c === '"' || c === "'" || c === '`') {
            // Copy through string literal verbatim.
            var start = i;
            i++;
            while (i < n) {
                var cc = src.charAt(i);
                if (cc === '\\') { i += 2; continue; }
                if (cc === c) { i++; break; }
                i++;
            }
            out += src.substring(start, i);
            continue;
        }
        if (c === '/' && src.charAt(i + 1) === '/') {
            var nl = src.indexOf('\n', i);
            if (nl === -1) nl = n;
            out += src.substring(i, nl);
            i = nl;
            continue;
        }
        if (c === '/' && src.charAt(i + 1) === '*') {
            var endc = src.indexOf('*/', i + 2);
            if (endc === -1) endc = n;
            else endc += 2;
            out += src.substring(i, endc);
            i = endc;
            continue;
        }
        if (c === '{' || c === '(' || c === '[') depth++;
        else if (c === '}' || c === ')' || c === ']') depth--;
        out += c;
        if (c === ';' && depth === 0 && src.charAt(i + 1) !== '\n') {
            out += '\n';
            // Consume any horizontal whitespace so the next statement
            // starts at column 0 — `^let|var|const` requires no leading space.
            i++;
            while (i < n && (src.charAt(i) === ' ' || src.charAt(i) === '\t')) i++;
            continue;
        }
        i++;
    }
    var normalized = out;
    var names = Object.create(null);
    var m;
    var fn_re = /^function\s+([\p{L}_$][\p{L}\p{N}_$]*)/gmu;
    while ((m = fn_re.exec(normalized)) !== null) names[m[1]] = true;
    var cls_re = /^class\s+([\p{L}_$][\p{L}\p{N}_$]*)/gmu;
    while ((m = cls_re.exec(normalized)) !== null) names[m[1]] = true;
    var var_re = /^(?:let|var|const)\s+([^;{}]+)[;\n]/gm;
    while ((m = var_re.exec(normalized)) !== null) {
        m[1].split(',').forEach(function (decl) {
            // Strip initializer / type annotation — take only the bareword.
            var name = decl.trim().split(/[=\s:]/)[0];
            if (/^[\p{L}_$][\p{L}\p{N}_$]*$/u.test(name)) names[name] = true;
        });
    }
    // Also capture single-name `var X = ...` where the initializer contains
    // braces (e.g. `var AssertionError = function AssertionError() { ... };`).
    // The regex above stops at `{`, so those decls would otherwise be missed.
    var var_init_re = /^(?:let|var|const)\s+([\p{L}_$][\p{L}\p{N}_$]*)\s*=/gmu;
    while ((m = var_init_re.exec(normalized)) !== null) names[m[1]] = true;
    return Object.keys(names);
}
namespace._rs_find_top_level_decl_names = _rs_find_top_level_decl_names;

function _rs_rewrite_let_const_to_var(src) {
    // Only rewrite line-leading let/const (i.e. top-level in our generated
    // code). Indented let/const inside function/block bodies are left alone
    // to preserve their block-scoping semantics there.
    return src.replace(/^let(\s+)/gm, 'var$1').replace(/^const(\s+)/gm, 'var$1');
}
namespace._rs_rewrite_let_const_to_var = _rs_rewrite_let_const_to_var;

function _rs_make_react_stub() {
    var Fragment = Symbol('React.Fragment');

    function createElement(type, props) {
        var children = Array.prototype.slice.call(arguments, 2);
        return {
            type: type,
            props: Object.assign({children: children.length === 1 ? children[0] : children}, props)
        };
    }

    function useState(initial) {
        var state = (typeof initial === 'function') ? initial() : initial;
        return [state, function(v) { state = (typeof v === 'function') ? v(state) : v; }];
    }

    function useEffect(fn /*, deps */) { fn(); }
    function useLayoutEffect(fn /*, deps */) { fn(); }
    function useMemo(fn /*, deps */) { return fn(); }
    function useCallback(fn /*, deps */) { return fn; }
    function useRef(initial) { return { current: initial }; }
    function useContext(ctx) { return ctx && ctx._currentValue !== undefined ? ctx._currentValue : undefined; }

    function useReducer(reducer, initial, init) {
        var state = (init !== undefined) ? init(initial) : initial;
        return [state, function(action) { state = reducer(state, action); }];
    }

    function useImperativeHandle(ref, create /*, deps */) {
        if (ref) ref.current = create();
    }

    function useDebugValue() {}
    function useId() { return ':r' + (Math.random() * 1e9 | 0) + ':'; }
    function useTransition() { return [false, function(fn) { fn(); }]; }
    function useDeferredValue(value) { return value; }
    function useSyncExternalStore(subscribe, getSnapshot) { return getSnapshot(); }
    function useInsertionEffect(fn /*, deps */) { fn(); }

    function createContext(defaultValue) {
        return { _currentValue: defaultValue, Provider: function(props) { return props.children; }, Consumer: function(props) { return props.children(defaultValue); } };
    }

    function createRef() { return { current: null }; }
    function forwardRef(render) { return function(props) { return render(props, null); }; }
    function memo(Component /*, compare */) { return Component; }
    function lazy(factory) { return factory; }

    function cloneElement(element, props) {
        return Object.assign({}, element, { props: Object.assign({}, element.props, props) });
    }

    function isValidElement(obj) {
        return obj !== null && typeof obj === 'object' && obj.type !== undefined;
    }

    function Component() {}
    Component.prototype.render = function() { return null; };
    Component.prototype.setState = function(update) {
        var next = (typeof update === 'function') ? update(this.state) : update;
        this.state = Object.assign({}, this.state, next);
    };

    function PureComponent() {}
    PureComponent.prototype = Object.create(Component.prototype);
    PureComponent.prototype.constructor = PureComponent;

    var StrictMode = { type: Symbol('React.StrictMode') };
    var Suspense = { type: Symbol('React.Suspense') };
    var Profiler = { type: Symbol('React.Profiler') };

    return {
        Fragment: Fragment,
        createElement: createElement,
        useState: useState,
        useEffect: useEffect,
        useLayoutEffect: useLayoutEffect,
        useMemo: useMemo,
        useCallback: useCallback,
        useRef: useRef,
        useContext: useContext,
        useReducer: useReducer,
        useImperativeHandle: useImperativeHandle,
        useDebugValue: useDebugValue,
        useId: useId,
        useTransition: useTransition,
        useDeferredValue: useDeferredValue,
        useSyncExternalStore: useSyncExternalStore,
        useInsertionEffect: useInsertionEffect,
        createContext: createContext,
        createRef: createRef,
        forwardRef: forwardRef,
        memo: memo,
        lazy: lazy,
        cloneElement: cloneElement,
        isValidElement: isValidElement,
        Component: Component,
        PureComponent: PureComponent,
        StrictMode: StrictMode,
        Suspense: Suspense,
        Profiler: Profiler,
    };
}
namespace._rs_make_react_stub = _rs_make_react_stub;

var builtin_modules = {
    'crypto' : {
        'createHash': function create_hash() {
            var ans = new jsSHA.jsSHA('SHA-1', 'TEXT');
            ans.digest = function hex_digest() { return ans.getHash('HEX'); };
            return ans;
        },
    },

    // The vm shim. Historically this used a hidden iframe so it could
    // hand back the iframe's window as a fresh global object with its
    // own `eval`. That broke whenever the iframe couldn't acquire a
    // contentWindow (DOM not ready, sandboxed Worker, CSP-restricted
    // iframes), throwing the opaque "Cannot set properties of null
    // (setting 'sha1sum')" deep inside the bundle.
    //
    // The shim now returns the caller's ctx directly (extended with the
    // host-provided shims) and runInContext wraps the code in a Function
    // whose parameters are the ctx keys — no DOM dependency, no separate
    // realm. Trade-off: top-level `var`/`function` declarations from
    // code passed to runInContext are scoped to the wrapper Function
    // and do NOT persist on ctx between calls. That's fine for the
    // compile-only path (which is what Bitburner and other consumers
    // need); the REPL's runjs path, which historically relied on the
    // iframe window for persistence, is documented as not supported in
    // this shim. Embedders that need a persistent eval context should
    // use Node's real `vm` module on the server.
    'vm': {
        'createContext': function create_context(ctx) {
            if (!ctx) ctx = {};
            if (!ctx.sha1sum) ctx.sha1sum = sha1sum;
            if (!ctx.require) ctx.require = require;
            if (!ctx.React) ctx.React = _rs_make_react_stub();
            return ctx;
        },

        'runInContext': function run_in_context(code, ctx, options) {
            if (ctx == null) {
                throw new RapydScriptSandboxError(
                    'vm.runInContext was given a null/undefined context. Call vm.createContext first.',
                    { hint: 'createContext returns the context object; pass it as the second argument.' }
                );
            }
            var src = String(code).replace(/^export ((?:async )?function |let )/gm, '$1');
            var filename = (options && options.filename) || undefined;
            // Hoist top-level let/const into var so they leak out of the
            // direct eval into the wrapper scope, where capture assignments
            // can copy them back to ctx.
            src = _rs_rewrite_let_const_to_var(src);
            var keys = Object.keys(ctx);
            var ctx_param = '__rs_ctx__';
            while (keys.indexOf(ctx_param) !== -1) ctx_param += '_';
            var decl_names = _rs_find_top_level_decl_names(src);
            var capture_assigns = decl_names.map(function (n) {
                return 'try{' + ctx_param + '[' + JSON.stringify(n) + ']=' + n + ';}catch(_rs_e){}';
            }).join('\n');
            // Direct eval inside the wrapper gives us:
            //   - expression-value return semantics (eval returns the value
            //     of the last expression statement, matching Node's vm.runInContext)
            //   - var/function hoisting from eval into the wrapper scope,
            //     so capture assignments below can see the new bindings.
            var body =
                'var __rs_ret__ = eval(' + JSON.stringify(src) + ');\n' +
                (capture_assigns ? capture_assigns + '\n' : '') +
                'return __rs_ret__;';
            var values = new Array(keys.length);
            for (var i = 0; i < keys.length; i++) values[i] = ctx[keys[i]];
            var all_params = keys.concat([ctx_param]);
            var all_values = values.concat([ctx]);
            var fn;
            try {
                fn = Function.apply(null, all_params.concat([body]));
            } catch (e) {
                throw _rs_explain_sandbox_failure(e, filename);
            }
            try {
                return fn.apply(ctx, all_values);
            } catch (e) {
                // Pass user-code runtime errors through unchanged; only
                // wrapper-construction failures get translated above.
                throw e;
            }
        },

        'runInThisContext': function run_in_this_context(code, options) {
            var src = String(code).replace(/^export ((?:async )?function |let )/gm, '$1');
            var filename = (options && options.filename) || undefined;
            try {
                // Indirect eval — evaluates in global scope of the calling
                // realm. Equivalent to the historical `eval` reference.
                return (0, eval)(src);
            } catch (e) {
                // Pass SyntaxError straight through (source-level problem),
                // and only translate platform errors that indicate the
                // sandbox itself can't run.
                if (e && (e instanceof EvalError ||
                        /unsafe-eval|Content Security Policy|Refused to evaluate/i.test(String(e.message || e)))) {
                    throw _rs_explain_sandbox_failure(e, filename);
                }
                throw e;
            }
        },
    },
    'path': {
        'join': function path_join() { return Array.prototype.slice.call(arguments).join('/'); },
        'dirname': function path_dirname(path) {
            return path.split('/').slice(0, -1).join('/');
        },
    },
    'inspect': function inspect(x) { return x.toString(); },

    'fs': {
        'readFileSync': function readfile(name) {
            if (namespace.virtual_file_system && namespace.virtual_file_system.read_file_sync) {
                data = namespace.virtual_file_system.read_file_sync(name);
                if (data !== null) return data;
            }
            var data = namespace.file_data[name];
            if (data) return data;
            data = write_cache[name];
            if (data) return data;
            var err = Error();
            err.code = 'ENOENT';
            throw err;
        },

        'writeFileSync': function writefile(name, data) {
            if (namespace.virtual_file_system && namespace.virtual_file_system.write_file_sync) {
                namespace.virtual_file_system.write_file_sync(name, data);
            } else write_cache[name] = data;
        },

    },
};

function require(name) {
    return builtin_modules[name] || {};
}

// Expose the internal vm shim + _rs_explain_sandbox_failure helper on the
// namespace. The vm shim was previously reachable only from code that ran
// inside the bundle (via require('vm')); making it available externally
// lets consumers — and the test suite — drive the shim directly and check
// its behaviour without having to round-trip through compile().
namespace.vm = builtin_modules.vm;
namespace._rs_explain_sandbox_failure = _rs_explain_sandbox_failure;
