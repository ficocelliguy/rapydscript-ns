/*
 * test/unit/index.js
 *
 * Snapshot-style unit tests: compile RapydScript → JS, verify emitted code
 * patterns, run the JS, and assert expected values via embedded `assrt` calls.
 *
 * Usage:
 *   node test/unit/index.js              # run all tests
 *   node test/unit/index.js <test-name>  # run a single test by name
 */
"use strict";

var path    = require("path");
var fs      = require("fs");
var vm      = require("vm");
var assert  = require("assert");
var utils   = require("../../tools/utils");
var colored = utils.safe_colored;

// ── Compiler setup ───────────────────────────────────────────────────────────

var BASE_PATH = path.resolve(__dirname, "../..");
var LIB_PATH  = path.join(BASE_PATH, "src", "lib");

var compiler_dir = path.join(BASE_PATH, "dev");
if (!utils.path_exists(path.join(compiler_dir, "compiler.js"))) {
    compiler_dir = path.join(BASE_PATH, "release");
}

var RapydScript = require("../../tools/compiler").create_compiler();
var baselib     = fs.readFileSync(
    path.join(compiler_dir, "baselib-plain-pretty.js"), "utf-8"
);

// ── assert.deepEqual patch ───────────────────────────────────────────────────
// RapydScript arrays carry extra properties; compare them as plain arrays,
// same as tools/test.js does.

var _deepEqual = assert.deepEqual;
assert.deepEqual = function (a, b, message) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a === b) return;
        if (a.length !== b.length)
            throw new assert.AssertionError({
                actual: a, expected: b,
                operator: "deepEqual",
                stackStartFunction: assert.deepEqual,
            });
        for (var i = 0; i < a.length; i++) assert.deepEqual(a[i], b[i], message);
    } else if (a !== undefined && a !== null && typeof a.__eq__ === "function") {
        if (!a.__eq__(b))
            throw new assert.AssertionError({
                actual: a, expected: b,
                operator: "deepEqual",
                stackStartFunction: assert.deepEqual,
            });
    } else {
        return _deepEqual(a, b, message);
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function compile(src) {
    var ast = RapydScript.parse(src, {
        filename : "<unit-test>",
        toplevel : null,
        basedir  : BASE_PATH,
        libdir   : LIB_PATH,
    });
    var output = new RapydScript.OutputStream({
        baselib_plain : baselib,
        beautify      : true,
        js_version    : 6,
    });
    ast.print(output);
    return output.toString();
}

function run_js(js) {
    return vm.runInNewContext(js, {
        __name__           : "<unit-test>",
        console            : console,
        assrt              : assert,
        // ρσ_last_exception must be in the global scope for try/except to work
        ρσ_last_exception  : undefined,
    }, {filename: "<unit-test>"});
}

// Verify every pattern in `checks` appears in `js`.
// Each entry may be a plain string (substring match) or a RegExp.
function check_js_patterns(test_name, js, checks) {
    (checks || []).forEach(function (pat) {
        var ok = (pat instanceof RegExp) ? pat.test(js) : js.indexOf(pat) !== -1;
        if (!ok) {
            var desc = (pat instanceof RegExp) ? String(pat) : JSON.stringify(pat);
            throw new Error(
                "compiled JS missing expected pattern " + desc +
                "\n  in test: " + test_name
            );
        }
    });
}

// ── Test definitions ─────────────────────────────────────────────────────────
//
// Each test object:
//   name        {string}  – unique identifier (used for filtering)
//   description {string}  – what this test exercises
//   src         {string}  – RapydScript source; embed assertions with `assrt`
//   js_checks   {Array}   – (optional) strings/RegExps to find in compiled JS
//
// The RapydScript source may use `assrt.equal`, `assrt.deepEqual`, `assrt.ok`,
// and `assrt.throws`.  A failing assertion or thrown exception fails the test.

var TESTS = [

    // ── Operators ─────────────────────────────────────────────────────────

    {
        name: "floor_division",
        description: "// operator compiles to Math.floor(x / y)",
        src: [
            "# globals: assrt",
            "assrt.equal(7 // 2, 3)",
            "assrt.equal(-7 // 2, -4)",
            "assrt.equal(10 // 3, 3)",
        ].join("\n"),
        js_checks: ["Math.floor(7 / 2)", "Math.floor(-7 / 2)"],
    },

    {
        name: "exponentiation",
        description: "** operator compiles to Math.pow(x, y)",
        src: [
            "# globals: assrt",
            "assrt.equal(2 ** 10, 1024)",
            "assrt.equal(3 ** 3, 27)",
            "assrt.equal(10 ** 0, 1)",
        ].join("\n"),
        js_checks: ["Math.pow(2, 10)", "Math.pow(3, 3)", "Math.pow(10, 0)"],
    },

    {
        name: "not_operator",
        description: '"not" compiles to "!"',
        src: [
            "# globals: assrt",
            "assrt.equal(not True, False)",
            "assrt.equal(not False, True)",
            "assrt.equal(not (1 is 2), True)",
        ].join("\n"),
        js_checks: ["!true", "!false"],
    },

    {
        name: "is_and_is_not",
        description: '"is" compiles to "==="; "is not" compiles to "!=="',
        src: [
            "# globals: assrt",
            "assrt.equal(1 is 1, True)",
            "assrt.equal(1 is not 2, True)",
            'assrt.equal("a" is not "b", True)',
            "assrt.equal(None is None, True)",
        ].join("\n"),
        js_checks: ["1 === 1", "1 !== 2", '"a" !== "b"', "null === null"],
    },

    {
        name: "and_or_operators",
        description: '"and" / "or" compile to "&&" / "||"',
        src: [
            "# globals: assrt",
            "assrt.equal(True and False, False)",
            "assrt.equal(False or True, True)",
            "assrt.equal(True and True, True)",
            "assrt.equal(False or False, False)",
        ].join("\n"),
        js_checks: ["true && false", "false || true"],
    },

    {
        name: "ternary_expression",
        description: '"x if cond else y" compiles to "(cond) ? x : y"',
        src: [
            "# globals: assrt",
            "assrt.equal(1 if True else 2, 1)",
            'assrt.equal("yes" if 5 > 3 else "no", "yes")',
            "assrt.equal(0 if False else 99, 99)",
        ].join("\n"),
        js_checks: ["? 1 : 2", '? "yes" : "no"'],
    },

    {
        name: "chained_comparison",
        description: "Chained comparisons (a < b < c) lower to && in JS",
        src: [
            "# globals: assrt",
            "x = 5",
            "assrt.equal(1 < x < 10, True)",
            "assrt.equal(0 < x < 4, False)",
            "assrt.equal(5 <= x <= 5, True)",
        ].join("\n"),
        // Chained comparisons always produce at least one &&
        js_checks: ["&&"],
    },

    // ── Strings ───────────────────────────────────────────────────────────

    {
        name: "f_string",
        description: "f-strings compile to concatenation via ρσ_str.format",
        src: [
            '# globals: assrt',
            'name = "World"',
            'assrt.equal(f"Hello {name}", "Hello World")',
            'n = 42',
            'assrt.equal(f"n={n}", "n=42")',
            'assrt.equal(f"{1 + 1} is two", "2 is two")',
        ].join("\n"),
        js_checks: ["ρσ_str.format"],
    },

    {
        name: "string_methods",
        description: "str.upper/lower/strip/split work via the str global; native JS methods also available",
        src: [
            '# globals: assrt',
            // str.* form (ρσ_str methods)
            'assrt.equal(str.upper("hello"), "HELLO")',
            'assrt.equal(str.lower("WORLD"), "world")',
            'assrt.equal(str.strip("  hi  "), "hi")',
            // native JS String methods still work
            'parts = "a,b,c".split(",")',
            'assrt.equal(parts[0], "a")',
            'assrt.equal(parts.length, 3)',
            'assrt.equal("hello world".indexOf("world"), 6)',
        ].join("\n"),
        js_checks: [],
    },

    // ── Collections ───────────────────────────────────────────────────────

    {
        name: "list_comprehension",
        description: "List comprehensions with filter compile to a ρσ_Result push loop",
        src: [
            "# globals: assrt",
            "evens = [x for x in range(10) if x % 2 is 0]",
            "assrt.deepEqual(evens, [0, 2, 4, 6, 8])",
            "squares = [x**2 for x in [1, 2, 3]]",
            "assrt.deepEqual(squares, [1, 4, 9])",
        ].join("\n"),
        js_checks: ["ρσ_Result.push"],
    },

    {
        name: "dict_comprehension",
        description: "Dict comprehensions build objects via a ρσ_Result accumulator",
        src: [
            "# globals: assrt",
            "doubled = {k: k*2 for k in [1, 2, 3]}",
            "assrt.equal(doubled[1], 2)",
            "assrt.equal(doubled[2], 4)",
            "assrt.equal(doubled[3], 6)",
        ].join("\n"),
        js_checks: ["ρσ_Result", "ρσ_Index"],
    },

    // ── Control flow ──────────────────────────────────────────────────────

    {
        name: "range_for_loop",
        description: "range() for-loops compile to C-style indexed for loops",
        src: [
            "# globals: assrt",
            "total = 0",
            "for i in range(5):",
            "    total += i",
            "assrt.equal(total, 10)",
            "items = []",
            "for j in range(2, 8, 2):",
            "    items.push(j)",
            "assrt.deepEqual(items, [2, 4, 6])",
        ].join("\n"),
        js_checks: [
            // range(5) → for (var ρσ_IndexN = 0; ρσ_IndexN < 5; ρσ_IndexN++)
            /for \(var ρσ_Index\d+ = 0; ρσ_Index\d+ < 5; ρσ_Index\d+\+\+\)/,
        ],
    },

    {
        name: "while_loop",
        description: "while loops compile to JS while statements",
        src: [
            "# globals: assrt",
            "n = 1",
            "while n < 32:",
            "    n *= 2",
            "assrt.equal(n, 32)",
        ].join("\n"),
        js_checks: ["while (n < 32)"],
    },

    {
        name: "try_except",
        description: "try/except compiles to try/catch with an instanceof type guard",
        src: [
            "# globals: assrt, ρσ_last_exception",
            "caught = False",
            "msg = ''",
            "try:",
            '    raise ValueError("oops")',
            "except ValueError as e:",
            "    caught = True",
            "    msg = str(e)",
            "assrt.equal(caught, True)",
            'assrt.ok(msg.indexOf("oops") >= 0)',
        ].join("\n"),
        js_checks: ["catch (ρσ_Exception)", "instanceof ValueError"],
    },

    // ── Functions ─────────────────────────────────────────────────────────

    {
        name: "default_arguments",
        description: "Default argument values are applied when args are omitted",
        src: [
            "# globals: assrt",
            'def greet(name, greeting="Hello"):',
            '    return greeting + ", " + name',
            'assrt.equal(greet("World"), "Hello, World")',
            'assrt.equal(greet("Alice", "Hi"), "Hi, Alice")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "variadic_star_args",
        description: "*args functions are tagged __handles_kwarg_interpolation__",
        src: [
            "# globals: assrt",
            "def add(*args):",
            "    total = 0",
            "    for n in args:",
            "        total += n",
            "    return total",
            "assrt.equal(add(1, 2, 3), 6)",
            "assrt.equal(add(10, 20), 30)",
            "assrt.equal(add(), 0)",
        ].join("\n"),
        js_checks: ["__handles_kwarg_interpolation__"],
    },

    {
        name: "anonymous_function",
        description: "Anonymous def expressions compile to JS function expressions",
        src: [
            "# globals: assrt",
            "double = def(x): return x * 2;",
            "assrt.equal(double(3), 6)",
            "assrt.equal(double(7), 14)",
            "apply_fn = def(f, val): return f(val);",
            "assrt.equal(apply_fn(double, 5), 10)",
        ].join("\n"),
        js_checks: [/function\s*\(x\)\s*\{/],
    },

    {
        name: "nonlocal_closure",
        description: '"nonlocal" lets an inner function mutate an outer variable',
        src: [
            "# globals: assrt",
            "counter = 0",
            "def increment():",
            "    nonlocal counter",
            "    counter += 1",
            "increment()",
            "increment()",
            "increment()",
            "assrt.equal(counter, 3)",
        ].join("\n"),
        // nonlocal → the outer variable is accessed/modified directly
        js_checks: ["counter += 1"],
    },

    // ── Classes ───────────────────────────────────────────────────────────

    {
        name: "class_with_methods",
        description: "Classes compile to prototype objects; isinstance works",
        src: [
            "# globals: assrt",
            "class Greeter:",
            "    def __init__(self, name):",
            "        self.name = name",
            "    def greet(self):",
            '        return "Hello, " + self.name',
            'g = Greeter("Alice")',
            'assrt.equal(g.greet(), "Hello, Alice")',
            "assrt.ok(isinstance(g, Greeter))",
        ].join("\n"),
        js_checks: ["Greeter.prototype", "__init__"],
    },

    {
        name: "class_inheritance",
        description: "Subclasses use __extends__; isinstance sees the whole chain",
        src: [
            "# globals: assrt",
            "class Animal:",
            "    def __init__(self, name):",
            "        self.name = name",
            "    def speak(self):",
            '        return self.name + " speaks"',
            "class Dog(Animal):",
            "    def speak(self):",
            '        return self.name + " barks"',
            'a = Animal("Cat")',
            'd = Dog("Rex")',
            'assrt.equal(a.speak(), "Cat speaks")',
            'assrt.equal(d.speak(), "Rex barks")',
            "assrt.ok(isinstance(d, Dog))",
            "assrt.ok(isinstance(d, Animal))",
            "assrt.ok(not isinstance(a, Dog))",
        ].join("\n"),
        js_checks: ["ρσ_extends"],
    },

    // ── Verbatim JS ───────────────────────────────────────────────────────

    {
        name: "verbatim_js",
        description: 'v"..." expressions are emitted as-is in the JS output',
        src: [
            "# globals: assrt",
            'result = v"typeof undefined"',
            'assrt.equal(result, "undefined")',
            "arr = [1, 2, 3]",
            'len = v"arr.length"',
            "assrt.equal(len, 3)",
            'assrt.equal(v"Math.max(4, 7)", 7)',
        ].join("\n"),
        js_checks: ["typeof undefined", "arr.length", "Math.max(4, 7)"],
    },

];

// ── Runner ───────────────────────────────────────────────────────────────────

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
        var js;

        // 1 – compile RapydScript → JS
        try {
            js = compile(test.src);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        " [compile error]\n      " + e + "\n");
            return;
        }

        // 2 – verify expected patterns appear in the JS output
        try {
            check_js_patterns(test.name, js, test.js_checks);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        " [JS pattern mismatch]\n      " + e.message + "\n");
            return;
        }

        // 3 – run the JS; assertions embedded in src catch wrong values
        try {
            run_js(js);
        } catch (e) {
            failures.push(test.name);
            var msg = e.stack || String(e);
            console.log(colored("FAIL  " + test.name, "red") +
                        " [runtime]\n      " + msg + "\n");
            return;
        }

        console.log(colored("PASS  " + test.name, "green") +
                    "  –  " + test.description);
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " unit tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

var filter = process.argv[2] || null;
run_tests(filter);
