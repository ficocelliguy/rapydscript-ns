/*
 * test/unit/web-repl.js
 *
 * Tests that exercise the web-repl bundle (web-repl/rapydscript.js) end-to-end:
 * load the bundle into a Node.js vm sandbox, compile RapydScript via
 * RapydScript.web_repl().compile(), run the output with Node's vm, and assert
 * expected values.
 *
 * Usage:
 *   node test/unit/web-repl.js              # run all tests
 *   node test/unit/web-repl.js <test-name>  # run a specific test
 */
"use strict";

var fs      = require("fs");
var vm      = require("vm");
var path    = require("path");
var assert  = require("assert");
var utils   = require("../../tools/utils");
var colored = utils.safe_colored;

// ---------------------------------------------------------------------------
// Load the web-repl bundle into a Node.js vm sandbox
// ---------------------------------------------------------------------------

var BASE_PATH   = path.resolve(__dirname, "../..");
var bundle_path = path.join(BASE_PATH, "web-repl", "rapydscript.js");

if (!utils.path_exists(bundle_path)) {
    console.error("web-repl/rapydscript.js not found — run: node bin/web-repl-export web-repl");
    process.exit(1);
}

// The bundle ends with `})(this)` so it assigns to `this` (the sandbox global).
// env.js inside the bundle uses `document.createElement('iframe')` to create
// an isolated evaluation context for the repl's runjs.  We provide a minimal
// Node-compatible stub: each createContext() call allocates a real Node vm
// context; properties written to the fake contentWindow are mirrored into it
// so that setup code (baselib init, print replacement, etc.) takes effect.
var bundle_sandbox = vm.createContext({
    console: console,
    document: {
        createElement: function () {
            var repl_ctx = vm.createContext({});
            // A plain object that delegates eval() into the real Node ctx, and
            // proxies property writes so initialisation code (ctx.foo = bar)
            // lands in the Node ctx too.
            var win = {
                eval: function (code) {
                    return vm.runInContext(
                        code.replace(/^export ((?:async )?function |let )/gm, "$1"),
                        repl_ctx
                    );
                },
            };
            // Intercept property assignments the bundle makes via Object.keys copy
            var orig_win = win;
            win = new Proxy(win, {
                set: function (target, prop, value) {
                    target[prop] = value;
                    try { repl_ctx[prop] = value; } catch (e) {}
                    return true;
                },
                get: function (target, prop) {
                    if (prop in target) return target[prop];
                    try { return repl_ctx[prop]; } catch (e) {}
                },
            });
            return { style: { display: "" }, contentWindow: win };
        },
        body: { appendChild: function () {} },
    },
});

vm.runInContext(fs.readFileSync(bundle_path, "utf-8"), bundle_sandbox);
var RS = bundle_sandbox.RapydScript;

if (!RS || typeof RS.web_repl !== "function") {
    console.error("Failed to load RapydScript.web_repl from bundle");
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Patch assert.deepEqual to handle RapydScript list objects (extra properties)
var _deepEqual = assert.deepEqual;
assert.deepEqual = function (a, b, message) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a === b) return;
        if (a.length !== b.length)
            throw new assert.AssertionError({ actual: a, expected: b, operator: "deepEqual", stackStartFunction: assert.deepEqual });
        for (var i = 0; i < a.length; i++) assert.deepEqual(a[i], b[i], message);
    } else if (a !== undefined && a !== null && typeof a.__eq__ === "function") {
        if (!a.__eq__(b))
            throw new assert.AssertionError({ actual: a, expected: b, operator: "deepEqual", stackStartFunction: assert.deepEqual });
    } else {
        return _deepEqual(a, b, message);
    }
};

// Compile RapydScript using the web-repl's own compile() path (same as browser)
function bundle_compile(repl, src) {
    return repl.compile(src, {
        omit_function_metadata: false,
        tree_shake: false,
        keep_baselib: true,
    });
}

// Run compiled JS in a fresh Node vm context with assrt available
function run_js(js) {
    return vm.runInNewContext(js, {
        __name__          : "<test>",
        console           : console,
        assrt             : assert,
        ρσ_last_exception : undefined,
    });
}

// Minimal React stub — mirrors the one in web-repl/env.js so that compiled
// code that imports from the react library can run in a plain Node vm context.
var REACT_STUB = (function () {
    var Fragment = Symbol("React.Fragment");
    function createElement(type, props) {
        var children = Array.prototype.slice.call(arguments, 2);
        return { type: type, props: Object.assign({ children: children.length === 1 ? children[0] : children }, props) };
    }
    function useState(initial) {
        var s = typeof initial === "function" ? initial() : initial;
        return [s, function (v) { s = typeof v === "function" ? v(s) : v; }];
    }
    function useEffect(fn)    { fn(); }
    function useLayoutEffect(fn) { fn(); }
    function useMemo(fn)      { return fn(); }
    function useCallback(fn)  { return fn; }
    function useRef(initial)  { return { current: initial }; }
    function useContext(ctx)  { return ctx && ctx._currentValue !== undefined ? ctx._currentValue : undefined; }
    function useReducer(reducer, initial) { return [initial, function (a) {}]; }
    function useImperativeHandle(ref, create) { if (ref) ref.current = create(); }
    function useDebugValue() {}
    function useId() { return ":r" + (Math.random() * 1e9 | 0) + ":"; }
    function useTransition() { return [false, function (fn) { fn(); }]; }
    function useDeferredValue(v) { return v; }
    function useSyncExternalStore(sub, get) { return get(); }
    function useInsertionEffect(fn) { fn(); }
    function createContext(def) { return { _currentValue: def }; }
    function createRef() { return { current: null }; }
    function forwardRef(render) { return function (props) { return render(props, null); }; }
    function memo(C)  { return C; }
    function lazy(f)  { return f; }
    function cloneElement(el, props) { return Object.assign({}, el, { props: Object.assign({}, el.props, props) }); }
    function isValidElement(o) { return o !== null && typeof o === "object" && o.type !== undefined; }
    function Component() {}
    Component.prototype.setState = function (u) { this.state = Object.assign({}, this.state, typeof u === "function" ? u(this.state) : u); };
    function PureComponent() {}
    PureComponent.prototype = Object.create(Component.prototype);
    PureComponent.prototype.constructor = PureComponent;
    return {
        Fragment: Fragment, createElement: createElement,
        useState: useState, useEffect: useEffect, useLayoutEffect: useLayoutEffect,
        useMemo: useMemo, useCallback: useCallback, useRef: useRef,
        useContext: useContext, useReducer: useReducer,
        useImperativeHandle: useImperativeHandle, useDebugValue: useDebugValue,
        useId: useId, useTransition: useTransition, useDeferredValue: useDeferredValue,
        useSyncExternalStore: useSyncExternalStore, useInsertionEffect: useInsertionEffect,
        createContext: createContext, createRef: createRef, forwardRef: forwardRef,
        memo: memo, lazy: lazy, cloneElement: cloneElement, isValidElement: isValidElement,
        Component: Component, PureComponent: PureComponent,
        StrictMode: {}, Suspense: {}, Profiler: {},
    };
})();

// Run compiled JS in a vm context that also has a React stub available.
function run_js_with_react(js) {
    return vm.runInNewContext(js, {
        __name__          : "<test>",
        console           : console,
        assrt             : assert,
        ρσ_last_exception : undefined,
        React             : REACT_STUB,
    });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

var TESTS = [

    {
        name: "bundle_loads",
        description: "web-repl bundle exports RapydScript with web_repl function",
        run: function () {
            assert.equal(typeof RS.compile,  "function");
            assert.equal(typeof RS.web_repl, "function");
            assert.ok(RS.rs_version, "rs_version is set");
        },
    },

    {
        name: "bundle_dict_from_counter",
        description: "dict(counter) works in the bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem",
                "from collections import Counter",
                "c = Counter('aab')",
                "d = dict(c)",
                "assrt.equal(d['a'], 2)",
                "assrt.equal(d['b'], 1)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dict_from_ordered_dict",
        description: "dict(ordered_dict) works in the bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem",
                "from collections import OrderedDict",
                "od = OrderedDict()",
                "od['x'] = 10",
                "od['y'] = 20",
                "d = dict(od)",
                "assrt.equal(d['x'], 10)",
                "assrt.equal(d['y'], 20)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dict_from_defaultdict",
        description: "dict(defaultdict) works — the original failing example",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem",
                "from collections import defaultdict",
                "groups = defaultdict(list)",
                "for name, dept in [('Alice', 'eng'), ('Bob', 'eng'), ('Carol', 'hr')]:",
                "    groups[dept].append(name)",
                "d = dict(groups)",
                "assrt.deepEqual(d['eng'], ['Alice', 'Bob'])",
                "assrt.deepEqual(d['hr'], ['Carol'])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_namedtuple",
        description: "namedtuple compiles and runs correctly via bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from collections import namedtuple",
                "Point = namedtuple('Point', ['x', 'y'])",
                "p = Point(3, 4)",
                "assrt.equal(p.x, 3)",
                "assrt.equal(p.y, 4)",
                "assrt.deepEqual(list(p), [3, 4])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_operator_overloading",
        description: "overload_operators flag works in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_operators",
                "class Vec:",
                "    def __init__(self, x, y):",
                "        self.x = x",
                "        self.y = y",
                "    def __add__(self, other):",
                "        return Vec(self.x + other.x, self.y + other.y)",
                "    def __neg__(self):",
                "        return Vec(-self.x, -self.y)",
                "a = Vec(1, 2)",
                "b = Vec(3, 4)",
                "c = a + b",
                "assrt.equal(c.x, 4)",
                "assrt.equal(c.y, 6)",
                "d = -a",
                "assrt.equal(d.x, -1)",
                "assrt.equal(d.y, -2)",
                // native fallback still works
                "assrt.equal(10 + 5, 15)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_counter_operators",
        description: "Counter +, -, |, & work via operator syntax in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem, overload_operators",
                "from collections import Counter",
                "c1 = Counter('aab')",
                "c2 = Counter('ab')",
                "c3 = c1 + c2",
                "assrt.equal(c3['a'], 3)",
                "assrt.equal(c3['b'], 2)",
                "c4 = c1 - c2",
                "assrt.equal(c4['a'], 1)",
                "assrt.equal(c4.get('b', 0), 0)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── itertools ─────────────────────────────────────────────────────────

    {
        name: "itertools_chain_web_repl",
        description: "itertools.chain works in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from itertools import chain, islice, count",
                "assrt.deepEqual(list(chain([1,2],[3,4])), [1,2,3,4])",
                "assrt.deepEqual(list(islice(count(5), 4)), [5,6,7,8])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "itertools_combinatorics_web_repl",
        description: "itertools combinatoric functions work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from itertools import product, permutations, combinations, combinations_with_replacement",
                "assrt.deepEqual(list(product([1,2],[3,4])), [[1,3],[1,4],[2,3],[2,4]])",
                "assrt.deepEqual(list(permutations([1,2,3],2)), [[1,2],[1,3],[2,1],[2,3],[3,1],[3,2]])",
                "assrt.deepEqual(list(combinations([1,2,3],2)), [[1,2],[1,3],[2,3]])",
                "assrt.deepEqual(list(combinations_with_replacement([1,2],2)), [[1,1],[1,2],[2,2]])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "itertools_filtering_web_repl",
        description: "itertools filtering/selecting functions work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from itertools import compress, dropwhile, filterfalse, takewhile, zip_longest",
                "assrt.deepEqual(list(compress([1,2,3,4,5],[1,0,1,0,1])), [1,3,5])",
                "assrt.deepEqual(list(dropwhile(lambda x: x < 3, [1,2,3,4])), [3,4])",
                "assrt.deepEqual(list(filterfalse(lambda x: x%2, [1,2,3,4])), [2,4])",
                "assrt.deepEqual(list(takewhile(lambda x: x < 3, [1,2,3,4])), [1,2])",
                "assrt.deepEqual(list(zip_longest([1,2],[3],fillvalue=0)), [[1,3],[2,0]])",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── nested comprehensions ─────────────────────────────────────────────

    {
        name: "nested_comprehension_web_repl",
        description: "nested list/set/dict comprehensions work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "flat = [x for row in [[1,2],[3,4],[5,6]] for x in row]",
                "assrt.deepEqual(flat, [1,2,3,4,5,6])",
                "evens = [x for row in [[1,2,3],[4,5,6]] for x in row if x % 2 == 0]",
                "assrt.deepEqual(evens, [2,4,6])",
                "coords = [[i,j] for i in range(2) for j in range(2)]",
                "assrt.deepEqual(coords, [[0,0],[0,1],[1,0],[1,1]])",
                "s = sorted(list({x+y for x in range(3) for y in range(3)}))",
                "assrt.deepEqual(s, [0,1,2,3,4])",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── python_flags via embedded compiler opts ────────────────────────────

    {
        name: "python_flags_overload_operators_web_repl",
        description: "python_flags='overload_operators' in compile opts activates operator overloading",
        run: function () {
            var repl = RS.web_repl();
            // Compile without inline import — flag passed via opts.python_flags
            var js = repl.compile([
                "class Vec:",
                "    def __init__(self, x):",
                "        self.x = x",
                "    def __add__(self, other):",
                "        return Vec(self.x + other.x)",
                "a = Vec(3)",
                "b = Vec(4)",
                "c = a + b",
                "assrt.equal(c.x, 7)",
            ].join("\n"), {
                keep_baselib: true,
                python_flags: "overload_operators",
            });
            assert.ok(js.indexOf("ρσ_op_add") !== -1,
                "Expected ρσ_op_add in output, got: " + js.slice(0, 500));
            run_js(js);
        },
    },

    {
        name: "python_flags_overload_getitem_web_repl",
        description: "python_flags='overload_getitem' in compile opts activates __getitem__",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                "class MyList:",
                "    def __init__(self):",
                "        self.data = [10, 20, 30]",
                "    def __getitem__(self, i):",
                "        return self.data[i]",
                "ml = MyList()",
                "assrt.equal(ml[1], 20)",
            ].join("\n"), {
                keep_baselib: true,
                python_flags: "overload_getitem",
            });
            assert.ok(js.indexOf("__getitem__") !== -1,
                "Expected __getitem__ in output");
            run_js(js);
        },
    },

    {
        name: "python_flags_multiple_web_repl",
        description: "python_flags with multiple comma-separated flags all activate",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                "class N:",
                "    def __init__(self, v):",
                "        self.v = v",
                "    def __add__(self, o):",
                "        return N(self.v + o.v)",
                "    def __getitem__(self, k):",
                "        return self.v * k",
                "a = N(3)",
                "b = N(4)",
                "c = a + b",
                "assrt.equal(c.v, 7)",
                "assrt.equal(a[2], 6)",
            ].join("\n"), {
                keep_baselib: true,
                python_flags: "overload_operators,overload_getitem",
            });
            assert.ok(js.indexOf("ρσ_op_add") !== -1, "Expected ρσ_op_add");
            assert.ok(js.indexOf("__getitem__") !== -1, "Expected __getitem__");
            run_js(js);
        },
    },

    {
        name: "bundle_dict_spread_js_object",
        description: "Dict merge literal {**d1, **d2} works for plain JS-object dicts in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "d1 = {'a': 1, 'b': 2}",
                "d2 = {'c': 3, 'b': 99}",
                "merged = {**d1, **d2}",
                "assrt.equal(merged['a'], 1)",
                "assrt.equal(merged['b'], 99)",
                "assrt.equal(merged['c'], 3)",
                "single = {**d1, 'extra': 42}",
                "assrt.equal(single['a'], 1)",
                "assrt.equal(single['extra'], 42)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dict_spread_pydict",
        description: "Dict merge literal {**d1, **d2} works for Python dicts (dict_literals) in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import dict_literals, overload_getitem",
                "pd1 = {'x': 10, 'y': 20}",
                "pd2 = {'y': 99, 'z': 30}",
                "merged = {**pd1, **pd2}",
                "assrt.equal(merged['x'], 10)",
                "assrt.equal(merged['y'], 99)",
                "assrt.equal(merged['z'], 30)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "nested_class_web_repl",
        description: "Nested class definitions compile and run correctly via the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "class Outer:",
                "    class Inner:",
                "        def __init__(self, val):",
                "            self.val = val",
                "    def __init__(self, v):",
                "        self.inner = Outer.Inner(v)",
                "o = Outer(99)",
                "assrt.equal(o.inner.val, 99)",
                "assrt.ok(isinstance(o.inner, Outer.Inner))",
                "assrt.ok(o.Inner is Outer.Inner)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── slice() builtin ───────────────────────────────────────────────────

    {
        name: "bundle_slice_constructor",
        description: "slice() constructor stores start/stop/step attributes correctly",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "s1 = slice(5)",
                "assrt.equal(s1.start, None)",
                "assrt.equal(s1.stop, 5)",
                "assrt.equal(s1.step, None)",
                "s2 = slice(2, 8)",
                "assrt.equal(s2.start, 2)",
                "assrt.equal(s2.stop, 8)",
                "assrt.equal(s2.step, None)",
                "s3 = slice(1, 9, 2)",
                "assrt.equal(s3.start, 1)",
                "assrt.equal(s3.stop, 9)",
                "assrt.equal(s3.step, 2)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_slice_subscript",
        description: "slice object used as list subscript returns the correct sub-list",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem",
                "lst = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]",
                "s = slice(2, 5)",
                "assrt.deepEqual(lst[s], [2, 3, 4])",
                "assrt.deepEqual(lst[slice(0, 6, 2)], [0, 2, 4])",
                "assrt.deepEqual(lst[slice(5, 1, -1)], [5, 4, 3, 2])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_slice_indices",
        description: "slice.indices() returns normalised (start, stop, step) tuple",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "s = slice(2, 8)",
                "idx = s.indices(10)",
                "assrt.equal(idx[0], 2)",
                "assrt.equal(idx[1], 8)",
                "assrt.equal(idx[2], 1)",
                "# negative indices normalised",
                "s2 = slice(-3, -1)",
                "idx2 = s2.indices(10)",
                "assrt.equal(idx2[0], 7)",
                "assrt.equal(idx2[1], 9)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_slice_repr",
        description: "str(slice(...)) produces the Python-style repr",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "assrt.equal(str(slice(1, 5, None)), 'slice(1, 5, None)')",
                "assrt.equal(str(slice(None, 5, 2)), 'slice(None, 5, 2)')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_slice_isinstance",
        description: "isinstance(slice(...), slice) returns True in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "s = slice(1, 5)",
                "assrt.ok(isinstance(s, slice))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_tuple_annotation_variable",
        description: "variable type annotation with tuple does not become a function call",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "# globals: assrt",
                "range_limits: tuple = (0, 100)",
                "assrt.equal(range_limits[0], 0)",
                "assrt.equal(range_limits[1], 100)",
            ].join("\n"));
            // Ensure it compiled to an assignment, not a call
            if (/range_limits\s*\(/.test(js)) throw new Error("range_limits was compiled as a function call:\n" + js);
            run_js(js);
        },
    },

    {
        name: "bundle_tuple_annotation_function_arg",
        description: "function argument type annotation with tuple and int works at runtime",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "# globals: assrt",
                "def clamp(val: int, bounds: tuple) -> int:",
                "    lo, hi = bounds",
                "    return max(lo, min(hi, val))",
                "range_limits: tuple = (0, 100)",
                "assrt.equal(clamp(150, range_limits), 100)",
                "assrt.equal(clamp(-5,  range_limits), 0)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_list_concatenation",
        description: "list + list returns a concatenated list in the bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "a = [1, 2]",
                "b = [3, 4]",
                "c = a + b",
                "assrt.deepEqual(c, [1, 2, 3, 4])",
                "assrt.deepEqual(a, [1, 2])",
                "assrt.deepEqual(b, [3, 4])",
                "# iadd extends in-place",
                "a += [5]",
                "assrt.deepEqual(a, [1, 2, 5])",
                "# numbers still work",
                "assrt.equal(1 + 2, 3)",
                "# strings still work",
                "assrt.equal('foo' + 'bar', 'foobar')",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── React stub tests ─────────────────────────────────────────────────────
    // These tests require a React mock in the vm context because the compiled
    // react.pyj module initialises with `React.*` references at load time.

    {
        name: "bundle_react_stub_memo",
        description: "web-repl React stub: memo() returns its argument (identity wrapper)",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import memo",
                "def MyComp(props): return props.x",
                "Memoised = memo(MyComp)",
                "assrt.equal(Memoised, MyComp)",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_usestate",
        description: "web-repl React stub: useState returns [initialValue, setter]",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import useState",
                "state, setState = useState(42)",
                "assrt.equal(state, 42)",
                "assrt.equal(jstype(setState), 'function')",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_useeffect",
        description: "web-repl React stub: useEffect calls its callback immediately",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import useEffect",
                "ran = [False]",
                "def effect(): ran[0] = True",
                "useEffect(effect, [])",
                "assrt.ok(ran[0])",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_usememo",
        description: "web-repl React stub: useMemo returns the computed value",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import useMemo",
                "result = useMemo(def(): return 6 * 7;, [])",
                "assrt.equal(result, 42)",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_useref",
        description: "web-repl React stub: useRef returns {current: initialValue}",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import useRef",
                "ref = useRef(None)",
                "assrt.equal(ref.current, None)",
                "ref.current = 'hello'",
                "assrt.equal(ref.current, 'hello')",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_usereducer",
        description: "web-repl React stub: useReducer returns [initialState, dispatch]",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import useReducer",
                "def reducer(state, action):",
                "    if action == 'inc': return state + 1",
                "    return state",
                "state, dispatch = useReducer(reducer, 0)",
                "assrt.equal(state, 0)",
                "assrt.equal(jstype(dispatch), 'function')",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_createcontext",
        description: "web-repl React stub: createContext returns a context with default value",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import createContext, useContext",
                "ThemeCtx = createContext('dark')",
                "theme = useContext(ThemeCtx)",
                "assrt.equal(theme, 'dark')",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_forwardref",
        description: "web-repl React stub: forwardRef wraps the render function",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from react import forwardRef",
                "def render(props, ref): return props['x']",
                "FancyInput = forwardRef(render)",
                "assrt.equal(jstype(FancyInput), 'function')",
                "assrt.equal(FancyInput({'x': 99}), 99)",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    {
        name: "bundle_react_stub_jsx_and_memo",
        description: "web-repl React stub: JSX component wrapped with memo compiles and runs",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import jsx",
                "from react import useState, memo",
                "def Counter(props):",
                "    count, setCount = useState(props.initial or 0)",
                "    return <span>{count}</span>",
                "MemoCounter = memo(Counter)",
                "assrt.equal(jstype(MemoCounter), 'function')",
                "el = MemoCounter({'initial': 7})",
                "assrt.equal(el.type, 'span')",
            ].join("\n"));
            run_js_with_react(js);
        },
    },

    // ── __import__() ─────────────────────────────────────────────────────

    {
        name: "bundle___import__-basic",
        description: "__import__(name) returns a stdlib module reference in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from collections import Counter",
                "m = __import__('collections')",
                // m.Counter should be the same object as the statically-imported Counter
                "assrt.ok(m.Counter is Counter)",
                "c = m.Counter('aabb')",
                "top = c.most_common(1)",
                "assrt.equal(top[0][0], 'a')",
                "assrt.equal(top[0][1], 2)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle___import__-fromlist",
        description: "__import__ with fromlist returns the exact named module",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from collections import deque",
                "m = __import__('collections', None, None, ['deque'])",
                "d = m.deque([1, 2, 3])",
                "assrt.equal(len(d), 3)",
                "assrt.equal(d.popleft(), 1)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── bytes / bytearray ────────────────────────────────────────────────────

    {
        name: "bundle_bytes_basic",
        description: "bytes() construction and basic operations work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = bytes([72, 101, 108, 108, 111])",
                "assrt.equal(len(b), 5)",
                "assrt.equal(b[0], 72)",
                "assrt.equal(b[-1], 111)",
                "assrt.ok(isinstance(b, bytes))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytes_from_string",
        description: "bytes(str, encoding) encodes a string to UTF-8 bytes in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = bytes('Hello', 'utf-8')",
                "assrt.equal(len(b), 5)",
                "assrt.equal(b[0], 72)",
                "assrt.equal(b.decode('utf-8'), 'Hello')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytes_hex",
        description: "bytes.hex() and bytes.fromhex() round-trip in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = bytes([0, 15, 255])",
                "assrt.equal(b.hex(), '000fff')",
                "b2 = bytes.fromhex('000fff')",
                "assrt.ok(b == b2)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytes_slice",
        description: "bytes slice returns bytes in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = bytes([10, 20, 30, 40, 50])",
                "s = b[1:4]",
                "assrt.ok(isinstance(s, bytes))",
                "assrt.equal(len(s), 3)",
                "assrt.equal(s[0], 20)",
                "assrt.equal(s[2], 40)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytearray_mutation",
        description: "bytearray append/extend/pop work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "ba = bytearray([1, 2, 3])",
                "assrt.ok(isinstance(ba, bytearray))",
                "ba.append(4)",
                "assrt.equal(len(ba), 4)",
                "assrt.equal(ba[3], 4)",
                "p = ba.pop()",
                "assrt.equal(p, 4)",
                "assrt.equal(len(ba), 3)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytes_repr",
        description: "repr(bytes(...)) returns b'...' notation in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = bytes([72, 101, 108, 108, 111])",
                "assrt.equal(repr(b), \"b'Hello'\")",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_bytes_literal_syntax",
        description: "b'...' bytes literal compiles and runs correctly in bundled compiler",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "b = b'Hello'",
                "assrt.ok(isinstance(b, bytes))",
                "assrt.equal(len(b), 5)",
                "assrt.equal(b[0], 72)",
                "assrt.equal(b[4], 111)",
                "assrt.ok(b == bytes([72, 101, 108, 108, 111]))",
                "# hex escapes",
                "b2 = b'\\x48\\x65\\x6c\\x6c\\x6f'",
                "assrt.ok(b2 == b)",
                "# empty literal",
                "e = b''",
                "assrt.equal(len(e), 0)",
                "# adjacent literal concatenation",
                "c = b'foo' b'bar'",
                "assrt.equal(len(c), 6)",
                "assrt.ok(c == bytes([102, 111, 111, 98, 97, 114]))",
                "# uppercase B prefix",
                "u = B'ABC'",
                "assrt.ok(isinstance(u, bytes))",
                "assrt.equal(u[0], 65)",
                "# repr shows b'...' notation",
                "assrt.equal(repr(b'Hi'), \"b'Hi'\")",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle___import__-error",
        description: "__import__ raises ModuleNotFoundError for unknown module in web-repl",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from collections import Counter",
                "caught = False",
                "try:",
                "    __import__('no_such_module')",
                "except ModuleNotFoundError as e:",
                "    caught = True",
                "assrt.ok(caught)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── Enum ─────────────────────────────────────────────────────────────────

    {
        name: "bundle_enum_basic",
        description: "Enum subclass .name and .value attributes work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from enum import Enum",
                "class Color(Enum):",
                "    RED   = 1",
                "    GREEN = 2",
                "    BLUE  = 3",
                "assrt.equal(Color.RED.name,   'RED')",
                "assrt.equal(Color.RED.value,  1)",
                "assrt.equal(Color.GREEN.name,  'GREEN')",
                "assrt.equal(Color.GREEN.value, 2)",
                "assrt.equal(Color.BLUE.name,   'BLUE')",
                "assrt.equal(Color.BLUE.value,  3)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_enum_identity",
        description: "Enum members are singletons — Color.RED is Color.RED",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from enum import Enum",
                "class Color(Enum):",
                "    RED   = 1",
                "    GREEN = 2",
                "assrt.ok(Color.RED is Color.RED)",
                "assrt.ok(Color.RED is not Color.GREEN)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_enum_iteration",
        description: "list(Color) and for-loop over an Enum class yield all members in order",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from enum import Enum",
                "class Color(Enum):",
                "    RED   = 1",
                "    GREEN = 2",
                "    BLUE  = 3",
                "members = list(Color)",
                "assrt.equal(len(members), 3)",
                "assrt.equal(members[0].name, 'RED')",
                "assrt.equal(members[1].name, 'GREEN')",
                "assrt.equal(members[2].name, 'BLUE')",
                "names = []",
                "for m in Color:",
                "    names.push(m.name)",
                "assrt.deepEqual(names, ['RED', 'GREEN', 'BLUE'])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_enum_isinstance",
        description: "isinstance(Color.RED, Color) and isinstance(Color.RED, Enum) both return True",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from enum import Enum",
                "class Color(Enum):",
                "    RED = 1",
                "assrt.ok(isinstance(Color.RED, Color))",
                "assrt.ok(isinstance(Color.RED, Enum))",
                "assrt.ok(not isinstance(1, Color))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_enum_repr_str",
        description: "repr() and str() of an enum member produce the expected strings",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from enum import Enum",
                "class Color(Enum):",
                "    RED = 1",
                "assrt.equal(repr(Color.RED), '<Color.RED: 1>')",
                "assrt.equal(str(Color.RED),  'Color.RED')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dataclasses_basic",
        description: "@dataclass generates __init__, __repr__, __eq__ in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from dataclasses import dataclass, field, is_dataclass",
                "@dataclass",
                "class Point:",
                "    x: int",
                "    y: int = 0",
                "p = Point(3, 4)",
                "assrt.equal(p.x, 3)",
                "assrt.equal(p.y, 4)",
                "assrt.ok(p == Point(3, 4))",
                "assrt.ok(p is not Point(3, 4))",
                "assrt.equal(repr(p), 'Point(x=3, y=4)')",
                "assrt.ok(is_dataclass(p))",
                "assrt.ok(is_dataclass(Point))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dataclasses_field_factory",
        description: "field(default_factory=...) gives each instance its own mutable default",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from dataclasses import dataclass, field",
                "@dataclass",
                "class Container:",
                "    items: list = field(default_factory=list)",
                "a = Container()",
                "b = Container()",
                "a.items.push(1)",
                "assrt.equal(a.items.length, 1)",
                "assrt.equal(b.items.length, 0)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dataclasses_asdict",
        description: "asdict() recursively converts a dataclass instance to a plain dict",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from dataclasses import dataclass, asdict",
                "@dataclass",
                "class Inner:",
                "    value: int",
                "@dataclass",
                "class Outer:",
                "    inner: object",
                "    tag: str",
                "d = asdict(Outer(Inner(42), 'hello'))",
                "assrt.equal(d['tag'], 'hello')",
                "assrt.equal(d['inner']['value'], 42)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_dataclasses_frozen",
        description: "frozen=True makes fields read-only (writable:false, assignment silently ignored outside strict mode)",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from dataclasses import dataclass",
                "@dataclass(frozen=True)",
                "class FP:",
                "    x: int",
                "    y: int",
                "fp = FP(1, 2)",
                "assrt.equal(fp.x, 1)",
                "assrt.equal(fp.y, 2)",
                "fp.x = 99",
                // In non-strict mode, writable:false assignment is silently ignored
                "assrt.equal(fp.x, 1)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_format_dunder",
        description: "__format__ dunder dispatches from format(), str.format(), and f-strings in web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "class Money:",
                "    def __init__(self, amount):",
                "        self.amount = amount",
                "    def __str__(self):",
                "        return str(self.amount)",
                "    def __format__(self, spec):",
                "        if spec == 'usd':",
                "            return '$' + str(self.amount)",
                "        return format(self.amount, spec)",
                "m = Money(42)",
                "assrt.equal(format(m, 'usd'), '$42')",
                "assrt.equal(str.format('{:usd}', m), '$42')",
                "assrt.equal(f'{m:usd}', '$42')",
                "assrt.equal(format(m, '.2f'), '42.00')",
                "assrt.equal(f'{m:.2f}', '42.00')",
                // Default __format__ (no custom __format__ defined)
                "class Plain:",
                "    def __str__(self):",
                "        return 'plain'",
                "p = Plain()",
                "assrt.equal(format(p), 'plain')",
                "assrt.equal(str.format('{}', p), 'plain')",
                "assrt.equal(f'{p}', 'plain')",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── object() builtin ──────────────────────────────────────────────────────

    {
        name: "bundle_object_sentinel",
        description: "object() returns distinct instances usable as sentinels",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "s1 = object()",
                "s2 = object()",
                "assrt.ok(s1 is not s2)",
                "assrt.ok(isinstance(s1, object))",
                "assrt.ok(isinstance(s2, object))",
                "h1 = hash(s1)",
                "h2 = hash(s2)",
                "assrt.ok(h1 is not h2)",
                "assrt.equal(hash(s1), h1)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_object_subclass",
        description: "class Foo(object) works and isinstance checks succeed",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "class Node(object):",
                "    def __init__(self, val):",
                "        self.val = val",
                "n = Node(42)",
                "assrt.ok(isinstance(n, Node))",
                "assrt.ok(isinstance(n, object))",
                "assrt.equal(n.val, 42)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── float.is_integer() ───────────────────────────────────────────────────

    {
        name: "bundle_float_is_integer",
        description: "float.is_integer() returns True for whole numbers and False for fractions/inf/nan",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "assrt.equal((1.0).is_integer(), True)",
                "assrt.equal((1.5).is_integer(), False)",
                "assrt.equal((0.0).is_integer(), True)",
                "assrt.equal((-2.0).is_integer(), True)",
                "assrt.equal((-2.5).is_integer(), False)",
                "assrt.equal((1e10).is_integer(), True)",
                "assrt.equal(v'Infinity'.is_integer(), False)",
                "assrt.equal(v'NaN'.is_integer(), False)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── int.bit_length() ─────────────────────────────────────────────────────

    {
        name: "bundle_int_bit_length",
        description: "int.bit_length() returns the number of bits needed to represent the integer",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "assrt.equal((0).bit_length(), 0)",
                "assrt.equal((1).bit_length(), 1)",
                "assrt.equal((255).bit_length(), 8)",
                "assrt.equal((256).bit_length(), 9)",
                "assrt.equal((1023).bit_length(), 10)",
                "assrt.equal((1024).bit_length(), 11)",
                "assrt.equal((-1).bit_length(), 1)",
                "assrt.equal((-5).bit_length(), 3)",
                "assrt.equal((-255).bit_length(), 8)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── abc module ───────────────────────────────────────────────────────────

    {
        name: "bundle_abc_basic",
        description: "ABC + @abstractmethod raises TypeError when abstract class is instantiated",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from abc import ABC, abstractmethod",
                "class Shape(ABC):",
                "    @abstractmethod",
                "    def area(self): pass",
                "raised = False",
                "try:",
                "    Shape()",
                "except TypeError:",
                "    raised = True",
                "assrt.ok(raised)",
                "assrt.ok('area' in Shape.__abstractmethods__)",
                "assrt.equal(len(Shape.__abstractmethods__), 1)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_abc_concrete",
        description: "Concrete ABC subclass can be instantiated; isinstance sees the full chain",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from abc import ABC, abstractmethod",
                "class Shape(ABC):",
                "    @abstractmethod",
                "    def area(self): pass",
                "class Circle(Shape):",
                "    def __init__(self, r):",
                "        self.r = r",
                "    def area(self):",
                "        return 3.14159 * self.r * self.r",
                "c = Circle(5)",
                "assrt.ok(isinstance(c, Circle))",
                "assrt.ok(isinstance(c, Shape))",
                "assrt.ok(isinstance(c, ABC))",
                "assrt.equal(c.r, 5)",
                "assrt.ok(abs(c.area() - 78.53975) < 0.001)",
                "assrt.equal(len(Circle.__abstractmethods__), 0)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_abc_register",
        description: "ABC.register() makes isinstance return True for virtual subclasses",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from abc import ABC, abstractmethod",
                "class MyABC(ABC):",
                "    @abstractmethod",
                "    def do_it(self): pass",
                "class External:",
                "    def do_it(self): return 42",
                "MyABC.register(External)",
                "assrt.ok(isinstance(External(), MyABC))",
                "class Unrelated:",
                "    def do_it(self): return 99",
                "assrt.ok(not isinstance(Unrelated(), MyABC))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_abc_protocol",
        description: "@runtime_checkable Protocol enables structural isinstance() checks",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from abc import Protocol, runtime_checkable",
                "@runtime_checkable",
                "class Drawable(Protocol):",
                "    def draw(self): pass",
                "class Canvas:",
                "    def draw(self):",
                "        return 'painting'",
                "class NotDrawable:",
                "    def paint(self): pass",
                "assrt.ok(isinstance(Canvas(), Drawable))",
                "assrt.ok(not isinstance(NotDrawable(), Drawable))",
                "assrt.ok(not isinstance(42, Drawable))",
                "assrt.ok('draw' in Drawable.__protocol_attrs__)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── eval / exec ───────────────────────────────────────────────────────

    {
        name: "bundle_zip_strict",
        description: "zip(strict=True) raises ValueError on length mismatch in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                // equal-length: no error
                "assrt.deepEqual(list(zip([1,2], [3,4], strict=True)), [[1,3],[2,4]])",
                // zero iterables with strict: empty result, no error
                "assrt.deepEqual(list(zip(strict=True)), [])",
                // first longer than second
                "err1 = False",
                "try:",
                "    list(zip([1,2], [3], strict=True))",
                "except ValueError:",
                "    err1 = True",
                "assrt.ok(err1)",
                // second longer than first
                "err2 = False",
                "try:",
                "    list(zip([1], [3,4], strict=True))",
                "except ValueError:",
                "    err2 = True",
                "assrt.ok(err2)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_eval_exec",
        description: "eval and exec builtins work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                // eval — basic expression
                "assrt.equal(eval('1 + 2'), 3)",
                "assrt.equal(eval('10 * 5'), 50)",
                "assrt.equal(eval('True'), True)",
                // eval with globals dict
                "assrt.equal(eval('x + y', {'x': 10, 'y': 5}), 15)",
                "assrt.equal(eval('a * b', {'a': 3, 'b': 4}), 12)",
                // eval with locals overriding globals
                "assrt.equal(eval('x', {'x': 1}, {'x': 99}), 99)",
                // exec returns None (null in JS)
                "assrt.equal(exec('1 + 2'), None)",
                // exec side-effects via mutable object in globals
                "log = []",
                "exec(\"log.push('hello')\", {'log': log})",
                "assrt.equal(log[0], 'hello')",
                "exec('log.push(1 + 2)', {'log': log})",
                "assrt.equal(log[1], 3)",
                // exec with function in globals
                "out = []",
                "def _add(a, b): out.push(a + b);",
                "exec('fn(10, 7)', {'fn': _add, 'out': out})",
                "assrt.equal(out[0], 17)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── complex numbers ───────────────────────────────────────────────────────

    {
        name: "bundle_complex_constructor",
        description: "complex() constructor and .real/.imag attributes work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "c = complex(3, 4)",
                "assrt.equal(c.real, 3)",
                "assrt.equal(c.imag, 4)",
                "c0 = complex()",
                "assrt.equal(c0.real, 0)",
                "assrt.equal(c0.imag, 0)",
                "c1 = complex(5)",
                "assrt.equal(c1.real, 5)",
                "assrt.equal(c1.imag, 0)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_complex_j_literal",
        description: "j-suffix imaginary literal compiles and runs correctly in bundled compiler",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "c = 4j",
                "assrt.equal(c.real, 0)",
                "assrt.equal(c.imag, 4)",
                "c2 = 3+4j",
                "assrt.equal(c2.real, 3)",
                "assrt.equal(c2.imag, 4)",
                "assrt.ok(isinstance(c, complex))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_complex_arithmetic",
        description: "complex arithmetic (+, -, *, /) and abs() work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "a = complex(1, 2)",
                "b = complex(3, 4)",
                "assrt.ok(a + b == complex(4, 6))",
                "assrt.ok(b - a == complex(2, 2))",
                "assrt.ok(a * b == complex(-5, 10))",
                "assrt.ok(b / complex(1, 0) == b)",
                "assrt.equal(abs(complex(3, 4)), 5)",
                "assrt.ok(-complex(3, 4) == complex(-3, -4))",
                "assrt.ok(complex(3, 4).conjugate() == complex(3, -4))",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_complex_repr",
        description: "repr() and str() of complex produce Python-style notation in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "assrt.equal(repr(complex(0, 0)), '0j')",
                "assrt.equal(repr(complex(1, 0)), '(1+0j)')",
                "assrt.equal(repr(complex(0, 1)), '1j')",
                "assrt.equal(repr(complex(3, 4)), '(3+4j)')",
                "assrt.equal(repr(complex(3, -4)), '(3-4j)')",
                "assrt.equal(str(complex(3, 4)), '(3+4j)')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_vars_locals_globals",
        description: "vars(), locals(), globals() work in bundled baselib",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_getitem",
                "class Point:",
                "    def __init__(self, x, y):",
                "        self.x = x",
                "        self.y = y",
                "p = Point(7, 9)",
                "d = vars(p)",
                "assrt.equal(d['x'], 7)",
                "assrt.equal(d['y'], 9)",
                // snapshot — mutation does not affect original
                "d['x'] = 0",
                "assrt.equal(p.x, 7)",
                // vars() with no arg returns empty dict
                "v = vars()",
                "assrt.ok(v is not None)",
                "assrt.ok(isinstance(v, dict))",
                // locals() returns empty dict
                "loc = locals()",
                "assrt.ok(isinstance(loc, dict))",
                // globals() returns dict
                "g = globals()",
                "assrt.ok(isinstance(g, dict))",
                // vars(obj) returns dict instance
                "assrt.ok(isinstance(vars(Point(1, 2)), dict))",
            ].join("\n"));
            run_js(js);
        },
    },

    // -------------------------------------------------------------------------
    // Context-persistence tests: compile WITHOUT keep_baselib, run in the repl
    // vm context.  These catch "ReferenceError: ρσ_X is not defined" bugs that
    // only surface when baselib symbols are `let`-declared (not `var` / function
    // declarations) and therefore don't persist between vm.runInContext calls.
    // -------------------------------------------------------------------------

    {
        name: "repl_in_operator_persistence",
        description: "ρσ_in accessible after baselib init — 'in' operator regression in web-repl context",
        run: function () {
            var repl = RS.web_repl();
            // Compile WITHOUT keep_baselib so the output does not include the
            // baselib — the compiled code references ρσ_in from the persistent ctx.
            var js = repl.compile([
                "assert 'x' in ['x', 'y', 'z'], \"'x' in list should be True\"",
                "assert 'a' not in ['x', 'y', 'z'], \"'a' not in list should be True\"",
                "assert 2 in {1: 'one', 2: 'two'}, '2 in dict should be True'",
                // Original failing case: 'Math' in globals() must not throw
                "g = globals()",
                "result = 'Math' in g",  // just must not throw ReferenceError
            ].join("\n"), {export_main: true, tree_shake: false});
            repl.runjs(js);
        },
    },

    {
        name: "repl_kwargs_persistence",
        description: "ρσ_desugar_kwargs accessible after baselib init — **kwargs in web-repl context",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                "def greet(name, greeting='Hello'):",
                "    return greeting + ', ' + name + '!'",
                "result = greet('World', greeting='Hi')",
                "assert result == 'Hi, World!', 'kwargs call should produce Hi, World!'",
            ].join("\n"), {export_main: true, tree_shake: false});
            repl.runjs(js);
        },
    },

    {
        name: "repl_nameerror_persistence",
        description: "NameError accessible after baselib init — except NameError in web-repl context",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                "caught = False",
                "try:",
                "    raise NameError('test error')",
                "except NameError:",
                "    caught = True",
                "assert caught, 'NameError should be catchable in except clause'",
            ].join("\n"), {export_main: true, tree_shake: false});
            repl.runjs(js);
        },
    },

    {
        name: "repl_getattr_persistence",
        description: "ρσ_JS_Proxy/ρσ_attr_proxy_handler accessible after baselib init — __getattr__ in web-repl context",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                "class Magic:",
                "    def __getattr__(self, name):",
                "        return name + '_value'",
                "m = Magic()",
                "assert m.foo == 'foo_value', '__getattr__ should return foo_value'",
                "assert m.bar == 'bar_value', '__getattr__ should return bar_value'",
            ].join("\n"), {export_main: true, tree_shake: false});
            repl.runjs(js);
        },
    },

    // ── datetime stdlib ───────────────────────────────────────────────────────

    {
        name: "bundle_datetime_basic",
        description: "datetime stdlib: date/time/datetime/timedelta construct and report attributes correctly",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from datetime import date, time, datetime, timedelta, MINYEAR, MAXYEAR",
                "assrt.equal(MINYEAR, 1)",
                "assrt.equal(MAXYEAR, 9999)",
                // date
                "d = date(2024, 6, 15)",
                "assrt.equal(d.year,  2024)",
                "assrt.equal(d.month,    6)",
                "assrt.equal(d.day,     15)",
                "assrt.equal(str(d),  '2024-06-15')",
                // time
                "t = time(14, 30, 5)",
                "assrt.equal(t.hour,   14)",
                "assrt.equal(t.minute, 30)",
                "assrt.equal(str(t),   '14:30:05')",
                // datetime
                "dt = datetime(2024, 6, 15, 14, 30, 5)",
                "assrt.equal(dt.year,   2024)",
                "assrt.equal(dt.hour,   14)",
                "assrt.equal(str(dt),   '2024-06-15 14:30:05')",
                // timedelta
                "td = timedelta(1)",
                "assrt.equal(td.days, 1)",
                "assrt.equal(td.total_seconds(), 86400)",
                "assrt.equal(str(td), '1 day, 0:00:00')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_datetime_arithmetic",
        description: "datetime stdlib: date/datetime arithmetic via overload_operators",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from __python__ import overload_operators",
                "from datetime import date, datetime, timedelta",
                // date + timedelta
                "d1 = date(2024, 1, 31)",
                "d2 = d1 + timedelta(1)",
                "assrt.equal(d2.month, 2)",
                "assrt.equal(d2.day,   1)",
                // date - date
                "delta = date(2024, 6, 15) - date(2024, 1, 1)",
                "assrt.ok(delta.days > 0)",
                // datetime + timedelta
                "dt1 = datetime(2024, 1, 15, 23, 30, 0)",
                "dt2 = dt1 + timedelta(0, 3600)",
                "assrt.equal(dt2.day,    16)",
                "assrt.equal(dt2.hour,    0)",
                "assrt.equal(dt2.minute, 30)",
                // datetime - datetime
                "diff = datetime(2024, 1, 10, 0, 0) - datetime(2024, 1, 5, 0, 0)",
                "assrt.equal(diff.days, 5)",
                // timedelta + timedelta
                "td = timedelta(1) + timedelta(0, 3600)",
                "assrt.equal(td.days,    1)",
                "assrt.equal(td.seconds, 3600)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_datetime_fromisoformat",
        description: "datetime stdlib: fromisoformat parses ISO strings correctly",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from datetime import date, datetime",
                "d = date.fromisoformat('2024-06-15')",
                "assrt.equal(d.year,  2024)",
                "assrt.equal(d.month,    6)",
                "assrt.equal(d.day,     15)",
                "dt = datetime.fromisoformat('2024-06-15T09:30:45.123456')",
                "assrt.equal(dt.hour,        9)",
                "assrt.equal(dt.minute,     30)",
                "assrt.equal(dt.second,     45)",
                "assrt.equal(dt.microsecond, 123456)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_datetime_strftime",
        description: "datetime stdlib: strftime formats date and datetime correctly",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from datetime import date, datetime",
                "d = date(2024, 1, 15)",
                "assrt.equal(d.strftime('%Y-%m-%d'),  '2024-01-15')",
                "assrt.equal(d.strftime('%B %d, %Y'), 'January 15, 2024')",
                "assrt.equal(d.strftime('%a'),        'Mon')",
                "assrt.equal(d.strftime('%%'),        '%')",
                "dt = datetime(2024, 1, 15, 14, 5, 9)",
                "assrt.equal(dt.strftime('%H:%M:%S'), '14:05:09')",
                "assrt.equal(dt.strftime('%I:%M %p'), '02:05 PM')",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── contextlib ────────────────────────────────────────────────────────

    {
        name: "bundle_contextlib_suppress",
        description: "contextlib.suppress silences listed exceptions in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from contextlib import suppress",
                // matched exception is suppressed
                "reached = False",
                "with suppress(ValueError):",
                "    raise ValueError('ignored')",
                "reached = True",
                "assrt.equal(reached, True)",
                // non-matching exception propagates
                "propagated = False",
                "try:",
                "    with suppress(KeyError):",
                "        raise ValueError('not suppressed')",
                "except ValueError:",
                "    propagated = True",
                "assrt.equal(propagated, True)",
                // suppress multiple types
                "hit = False",
                "with suppress(TypeError, KeyError):",
                "    raise KeyError('one of two')",
                "hit = True",
                "assrt.equal(hit, True)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_contextlib_closing",
        description: "contextlib.closing calls close() on exit in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from contextlib import closing",
                "class _Obj:",
                "    def __init__(self):",
                "        self.closed = False",
                "    def close(self):",
                "        self.closed = True",
                "obj = _Obj()",
                "with closing(obj) as c:",
                "    assrt.equal(c, obj)",
                "    assrt.equal(c.closed, False)",
                "assrt.equal(obj.closed, True)",
                // close() is called even on exception
                "obj2 = _Obj()",
                "try:",
                "    with closing(obj2):",
                "        raise ValueError('test')",
                "except ValueError:",
                "    pass",
                "assrt.equal(obj2.closed, True)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── json stdlib ──────────────────────────────────────────────────────────

    {
        name: "bundle_json_dumps_loads_basic",
        description: "json stdlib: dumps/loads round-trip for basic types and collections",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from json import dumps, loads",
                // basic scalars
                "assrt.equal(dumps(None),    'null')",
                "assrt.equal(dumps(True),    'true')",
                "assrt.equal(dumps(False),   'false')",
                "assrt.equal(dumps(42),      '42')",
                "assrt.equal(dumps('hello'), '\"hello\"')",
                // list round-trip
                "assrt.deepEqual(loads(dumps([1, 2, 3])), [1, 2, 3])",
                // object round-trip
                "obj = loads(dumps({'a': 1, 'b': 2}))",
                "assrt.equal(obj.a, 1)",
                "assrt.equal(obj.b, 2)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_json_dumps_options",
        description: "json stdlib: dumps respects sort_keys, indent, and separators",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from json import dumps",
                // sort_keys
                "assrt.equal(dumps({'b': 2, 'a': 1}, sort_keys=True), '{\"a\":1,\"b\":2}')",
                // indent produces newlines
                "pretty = dumps([1, 2], indent=2)",
                "assrt.ok(pretty.indexOf('\\n') >= 0)",
                // compact separators
                "assrt.equal(dumps({'a': 1}, sort_keys=True, separators=(',', ':')), '{\"a\":1}')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_json_loads_hooks",
        description: "json stdlib: loads supports object_hook and JSONDecodeError",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from json import loads, JSONDecodeError",
                // object_hook
                "hits = []",
                "def hook(d):",
                "    hits.push(1)",
                "    return d",
                "loads('{\"x\": 1}', object_hook=hook)",
                "assrt.equal(hits.length, 1)",
                // JSONDecodeError on bad JSON
                "got_err = False",
                "try:",
                "    loads('{bad json}')",
                "except JSONDecodeError:",
                "    got_err = True",
                "assrt.ok(got_err)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_json_dump_load_file",
        description: "json stdlib: dump/load work with file-like objects",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from json import dump, load",
                "class _SIO:",
                "    def __init__(self): self._buf = ''",
                "    def write(self, s): self._buf += s",
                "    def read(self): return self._buf",
                "sio = _SIO()",
                "dump({'key': 'value', 'n': 7}, sio)",
                "result = load(sio)",
                "assrt.equal(result.key, 'value')",
                "assrt.equal(result.n, 7)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_contextlib_nullcontext",
        description: "contextlib.nullcontext works as a no-op context manager in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from contextlib import nullcontext",
                "with nullcontext() as v:",
                "    assrt.equal(v, None)",
                "with nullcontext(42) as v:",
                "    assrt.equal(v, 42)",
                "with nullcontext('hi') as v:",
                "    assrt.equal(v, 'hi')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_contextlib_contextmanager",
        description: "contextlib.contextmanager creates generator-based context managers in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from contextlib import contextmanager",
                "log = []",
                "@contextmanager",
                "def _cm(name):",
                "    log.append('enter:' + name)",
                "    try:",
                "        yield name.upper()",
                "    finally:",
                "        log.append('exit:' + name)",
                "with _cm('hello') as v:",
                "    assrt.equal(v, 'HELLO')",
                "    log.append('body')",
                "assrt.deepEqual(log, ['enter:hello', 'body', 'exit:hello'])",
                // exception propagates through finally
                "log2 = []",
                "@contextmanager",
                "def _cm2():",
                "    try:",
                "        yield",
                "    finally:",
                "        log2.append('cleanup')",
                "caught = False",
                "try:",
                "    with _cm2():",
                "        raise ValueError('oops')",
                "except ValueError:",
                "    caught = True",
                "assrt.equal(caught, True)",
                "assrt.deepEqual(log2, ['cleanup'])",
                // generator can suppress exceptions
                "@contextmanager",
                "def _cm3():",
                "    try:",
                "        yield",
                "    except ValueError:",
                "        pass",
                "after = False",
                "with _cm3():",
                "    raise ValueError('suppressed')",
                "after = True",
                "assrt.equal(after, True)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_contextlib_exitstack",
        description: "contextlib.ExitStack enters/exits context managers in LIFO order in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from contextlib import ExitStack",
                "exit_order = []",
                "class _CM:",
                "    def __init__(self, label):",
                "        self.label = label",
                "    def __enter__(self):",
                "        return self.label",
                "    def __exit__(self, exc_type=None, exc_val=None, exc_tb=None):",
                "        exit_order.append(self.label)",
                "        return False",
                "with ExitStack() as stack:",
                "    a = stack.enter_context(_CM('a'))",
                "    b = stack.enter_context(_CM('b'))",
                "    c = stack.enter_context(_CM('c'))",
                "    assrt.equal(a, 'a')",
                "    assrt.equal(b, 'b')",
                "    assrt.equal(c, 'c')",
                "assrt.deepEqual(exit_order, ['c', 'b', 'a'])",
                // callback
                "cb_log = []",
                "def _append_done():",
                "    cb_log.append('done')",
                "with ExitStack() as stack:",
                "    stack.callback(_append_done)",
                "assrt.deepEqual(cb_log, ['done'])",
                // close() outside with
                "close_log = []",
                "class _CM2:",
                "    def __enter__(self): return self",
                "    def __exit__(self, exc_type=None, exc_val=None, exc_tb=None):",
                "        close_log.append('closed')",
                "        return False",
                "s2 = ExitStack()",
                "s2.enter_context(_CM2())",
                "s2.close()",
                "assrt.deepEqual(close_log, ['closed'])",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_io_stringio_basic",
        description: "io.StringIO: write, seek, read, getvalue work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from io import StringIO",
                // basic write + seek + read
                "sio = StringIO()",
                "sio.write('hello')",
                "sio.write(' world')",
                "sio.seek(0)",
                "assrt.equal(sio.read(), 'hello world')",
                // getvalue independent of position
                "sio.seek(3)",
                "assrt.equal(sio.getvalue(), 'hello world')",
                // tell / seek with whence
                "sio.seek(0)",
                "assrt.equal(sio.tell(), 0)",
                "sio.seek(0, 2)",
                "assrt.equal(sio.tell(), 11)",
                // readline
                "ml = StringIO('line1\\nline2\\nline3')",
                "assrt.equal(ml.readline(), 'line1\\n')",
                "assrt.equal(ml.readline(), 'line2\\n')",
                "assrt.equal(ml.readline(), 'line3')",
                "assrt.equal(ml.readline(), '')",
                // truncate
                "tr = StringIO('hello world')",
                "tr.truncate(5)",
                "assrt.equal(tr.getvalue(), 'hello')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_io_stringio_context",
        description: "io.StringIO: context manager and closed attribute work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from io import StringIO",
                // context manager
                "result = ''",
                "cm = StringIO('context text')",
                "with cm as f:",
                "    result = f.read()",
                "assrt.equal(result, 'context text')",
                "assrt.equal(cm.closed, True)",
                // ValueError on read after close
                "got_err = False",
                "try:",
                "    cm.read()",
                "except ValueError:",
                "    got_err = True",
                "assrt.ok(got_err)",
                // readable / writable / seekable
                "s2 = StringIO()",
                "assrt.ok(s2.readable())",
                "assrt.ok(s2.writable())",
                "assrt.ok(s2.seekable())",
                // init with value
                "s3 = StringIO('preset')",
                "assrt.equal(s3.read(), 'preset')",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_io_bytesio_basic",
        description: "io.BytesIO: write, seek, read, getvalue work in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from io import BytesIO",
                // basic write + seek + read
                "bio = BytesIO()",
                "bio.write(bytes([1, 2, 3]))",
                "bio.write(bytes([4, 5]))",
                "bio.seek(0)",
                "data = bio.read()",
                "assrt.equal(len(data), 5)",
                "assrt.equal(data[0], 1)",
                "assrt.equal(data[4], 5)",
                // getvalue
                "bio.seek(2)",
                "assrt.equal(len(bio.getvalue()), 5)",
                // partial read
                "bio.seek(0)",
                "chunk = bio.read(3)",
                "assrt.equal(len(chunk), 3)",
                "assrt.equal(chunk[2], 3)",
                // init from bytes
                "bio2 = BytesIO(bytes([10, 20, 30]))",
                "bio2.seek(0)",
                "assrt.equal(bio2.read()[1], 20)",
                // seek whence=2
                "bio2.seek(0)",
                "bio2.seek(-1, 2)",
                "assrt.equal(bio2.tell(), 2)",
                // truncate
                "bt = BytesIO(bytes([1, 2, 3, 4, 5]))",
                "bt.truncate(3)",
                "assrt.equal(len(bt.getvalue()), 3)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "bundle_io_bytesio_context",
        description: "io.BytesIO: context manager, readline, and writelines in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                "from io import BytesIO",
                // context manager
                "bcm = BytesIO(bytes([7, 8, 9]))",
                "with bcm as bf:",
                "    bf.seek(0)",
                "    got = bf.read()",
                "assrt.equal(got[0], 7)",
                "assrt.equal(bcm.closed, True)",
                // ValueError on closed
                "berr = False",
                "try:",
                "    bcm.read()",
                "except ValueError:",
                "    berr = True",
                "assrt.ok(berr)",
                // writelines
                "bwl = BytesIO()",
                "bwl.writelines([bytes([1, 2]), bytes([3, 4])])",
                "assrt.equal(len(bwl.getvalue()), 4)",
                // readline
                "brl = BytesIO(bytes([65, 66, 10, 67, 68]))",
                "first = brl.readline()",
                "assrt.equal(len(first), 3)",
                "assrt.equal(first[2], 10)",
                "second = brl.readline()",
                "assrt.equal(len(second), 2)",
            ].join("\n"));
            run_js(js);
        },
    },

    // ── float() special string values ────────────────────────────────────────

    {
        name: "bundle_float_special_inf_nan",
        description: "float() accepts 'inf', '-inf', 'infinity', 'nan' (and variants) in the web-repl bundle",
        run: function () {
            var repl = RS.web_repl();
            var js = bundle_compile(repl, [
                // positive infinity
                "assrt.equal(float('inf'),       Infinity)",
                "assrt.equal(float('+inf'),      Infinity)",
                "assrt.equal(float('INF'),       Infinity)",
                "assrt.equal(float('infinity'),  Infinity)",
                "assrt.equal(float('+infinity'), Infinity)",
                "assrt.equal(float('Infinity'),  Infinity)",
                "assrt.equal(float('INFINITY'),  Infinity)",
                // negative infinity
                "assrt.equal(float('-inf'),      -Infinity)",
                "assrt.equal(float('-infinity'), -Infinity)",
                "assrt.equal(float('-Infinity'), -Infinity)",
                // nan
                "assrt.ok(isNaN(float('nan')))",
                "assrt.ok(isNaN(float('NaN')))",
                "assrt.ok(isNaN(float('NAN')))",
                "assrt.ok(isNaN(float('+nan')))",
                "assrt.ok(isNaN(float('-nan')))",
                // whitespace stripped
                "assrt.equal(float('  inf  '),  Infinity)",
                "assrt.equal(float('  -inf '),  -Infinity)",
                "assrt.ok(isNaN(float('  nan  ')))",
                // numeric strings still work
                "assrt.equal(float('3.14'), 3.14)",
                "assrt.equal(float('-2.5'), -2.5)",
                // real Infinity passes through
                "assrt.equal(float(Infinity),  Infinity)",
                "assrt.equal(float(-Infinity), -Infinity)",
                // ValueError still raised for bad strings
                "_err = False",
                "try:",
                "    float('bad')",
                "except ValueError:",
                "    _err = True",
                "assrt.ok(_err)",
            ].join("\n"));
            run_js(js);
        },
    },

    {
        name: "repl_exists_persistence",
        description: "ρσ_exists accessible after baselib init — existential operator on non-SymbolRef in web-repl context",
        run: function () {
            var repl = RS.web_repl();
            var js = repl.compile([
                // fns['key'] is a subscript (not SymbolRef) — emits ρσ_exists.c(fns['key'])()
                "def get_val(): return 42",
                "fns = {'key': get_val}",
                "result = fns['key']?()",
                "assert result == 42, 'existential call via subscript should return 42'",
                // None value: dict lookup miss returns None, existential function call returns undefined
                "missing = fns.get('nokey')",
                "result2 = missing?()",
                "assert result2 is undefined, 'existential call on None should return undefined'",
            ].join("\n"), {export_main: true, tree_shake: false});
            repl.runjs(js);
        },
    },

];

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function run_tests(filter) {
    var tests = filter
        ? TESTS.filter(function (t) { return t.name === filter; })
        : TESTS;

    if (tests.length === 0) {
        console.error(colored("No test found: " + filter, "red"));
        process.exit(1);
    }

    var failures = [];
    tests.forEach(function (test) {
        try {
            test.run();
            console.log(colored("PASS  " + test.name, "green") + "  –  " + test.description);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") + "\n      " + (e.stack || String(e)) + "\n");
        }
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " web-repl tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

run_tests(process.argv[2] || null);
