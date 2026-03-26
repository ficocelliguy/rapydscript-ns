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
