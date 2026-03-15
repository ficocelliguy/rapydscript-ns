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
