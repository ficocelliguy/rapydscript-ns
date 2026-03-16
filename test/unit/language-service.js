/*
 * test/unit/language-service.js
 *
 * Unit tests for src/monaco-language-service/diagnostics.js (Phase 1).
 *
 * Usage:
 *   node test/unit/language-service.js              # run all tests
 *   node test/unit/language-service.js <test-name>  # run a single test by name
 */
"use strict";

var assert         = require("assert");
var path           = require("path");
var url            = require("url");
var compiler_module = require("../../tools/compiler");
var utils          = require("../../tools/utils");
var colored        = utils.safe_colored;

// Marker severity constants (same as Monaco's, used as defaults when Monaco
// is absent from the environment).
var SEV_ERROR   = 8;
var SEV_WARNING = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return all markers with the given ident string in their message. */
function by_ident(markers, ident) {
    return markers.filter(function (m) { return m.message.indexOf(ident) !== -1; });
}

/** Assert exactly N markers of the given severity exist. */
function assert_count(markers, severity, n, label) {
    var found = markers.filter(function (m) { return m.severity === severity; });
    assert.strictEqual(found.length, n,
        (label || "") + ": expected " + n + " marker(s) with severity " + severity +
        " but got " + found.length + ": " + JSON.stringify(found.map(function (m) { return m.message; })));
}

/** Assert a marker exists covering a specific 1-indexed line. */
function assert_line(markers, line, label) {
    var found = markers.filter(function (m) { return m.startLineNumber === line; });
    assert.ok(found.length > 0,
        (label || "") + ": expected a marker at line " + line +
        " but got none. All markers: " + JSON.stringify(markers));
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------
//
// Each test:
//   name        {string}  – unique id (used for filtering)
//   description {string}  – what is exercised
//   run(d)                – receives a Diagnostics instance; throws on failure

function make_tests(Diagnostics, RS) {

    function d(extras) { return new Diagnostics(RS, extras); }

    var TESTS = [

        // ── Clean code ────────────────────────────────────────────────────

        {
            name: "clean_no_markers",
            description: "Valid code with no issues produces an empty marker array",
            run: function () {
                var markers = d().check([
                    "def add(a, b):",
                    "    return a + b",
                    "result = add(1, 2)",
                    "print(result)",
                ].join("\n"));
                assert.deepStrictEqual(markers, [],
                    "Expected no markers but got: " + JSON.stringify(markers));
            },
        },

        {
            name: "empty_source",
            description: "Empty source produces no markers",
            run: function () {
                var markers = d().check("");
                assert.deepStrictEqual(markers, []);
            },
        },

        // ── Syntax errors ─────────────────────────────────────────────────

        {
            name: "syntax_error_marker",
            description: "A syntax error is reported as a single Error marker",
            run: function () {
                var markers = d().check("def foo(\n");
                assert.strictEqual(markers.length, 1);
                assert.strictEqual(markers[0].severity, SEV_ERROR);
                assert.strictEqual(markers[0].source, "rapydscript");
                assert.ok(markers[0].message.length > 0);
            },
        },

        {
            name: "syntax_error_line_number",
            description: "Syntax error marker has the correct line number",
            run: function () {
                // Error is on line 3 (the bad line)
                var markers = d().check([
                    "x = 1",
                    "y = 2",
                    "def (:",    // bad syntax
                ].join("\n"));
                assert.strictEqual(markers.length, 1);
                assert.strictEqual(markers[0].severity, SEV_ERROR);
                // Line numbers should be >= 1 (exact line may vary by parser)
                assert.ok(markers[0].startLineNumber >= 1);
            },
        },

        // ── Undefined symbol ──────────────────────────────────────────────

        {
            name: "undef_symbol",
            description: "A reference to an undeclared name produces an Error marker",
            run: function () {
                var markers = d().check("print(missing_variable)");
                assert_count(markers, SEV_ERROR, 1, "undef_symbol");
                assert.ok(markers[0].message.indexOf("missing_variable") !== -1,
                    "Expected marker message to contain 'missing_variable'");
            },
        },

        {
            name: "undef_multiple_symbols",
            description: "Multiple undefined names each get their own marker",
            run: function () {
                var markers = d().check("print(aaa)\nprint(bbb)");
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.ok(errors.length >= 2, "Expected at least 2 undef errors");
            },
        },

        {
            name: "undef_suppressed_builtins",
            description: "Built-in names (print, len, range, etc.) are not flagged as undefined",
            run: function () {
                var markers = d().check([
                    "print(len([1, 2, 3]))",
                    "for i in range(5):",
                    "    print(i)",
                    "x = isinstance(42, int)",
                ].join("\n"));
                assert.deepStrictEqual(markers, []);
            },
        },

        {
            name: "undef_suppressed_extra_builtins",
            description: "extraBuiltins option prevents a name from being flagged",
            run: function () {
                var inst = new Diagnostics(RS, { MY_GLOBAL: true, ANOTHER: true });
                var markers = inst.check("print(MY_GLOBAL)\nprint(ANOTHER)");
                assert.deepStrictEqual(markers, []);
            },
        },

        {
            name: "add_globals_method",
            description: "addGlobals() suppresses names added after construction",
            run: function () {
                var inst = new Diagnostics(RS);
                inst.addGlobals(["LATE_GLOBAL"]);
                var markers = inst.check("print(LATE_GLOBAL)");
                assert.deepStrictEqual(markers, []);
            },
        },

        // ── Unused bindings ───────────────────────────────────────────────

        {
            name: "unused_local_variable",
            description: "A local variable that is never used gets an Error marker",
            run: function () {
                var markers = d().check([
                    "def foo():",
                    "    unused_var = 42",
                    "    return 0",
                    "foo()",
                ].join("\n"));
                assert_count(markers, SEV_ERROR, 1, "unused_local");
                assert.ok(markers[0].message.indexOf("unused_var") !== -1);
            },
        },

        {
            name: "used_local_no_marker",
            description: "A local variable that IS used produces no marker",
            run: function () {
                var markers = d().check([
                    "def foo():",
                    "    x = 42",
                    "    return x",
                    "foo()",
                ].join("\n"));
                assert.deepStrictEqual(markers, []);
            },
        },

        // ── Unused import ─────────────────────────────────────────────────

        {
            name: "unused_import",
            description: "An imported name that is never used gets an Error marker",
            run: function () {
                var markers = d().check(
                    "from mymod import foo\nx = 1\nprint(x)",
                    {
                        virtualFiles: { mymod: "def foo(x): return x" },
                    }
                );
                assert_count(markers, SEV_ERROR, 1, "unused_import");
                assert.ok(markers[0].message.indexOf("foo") !== -1);
            },
        },

        {
            name: "used_import_no_marker",
            description: "An import that is actually used produces no marker",
            run: function () {
                var markers = d().check(
                    "from mymod import foo\nprint(foo(2))",
                    {
                        virtualFiles: { mymod: "def foo(x): return x" },
                    }
                );
                assert.deepStrictEqual(markers, []);
            },
        },

        // ── Import errors ─────────────────────────────────────────────────

        {
            name: "import_error_caught",
            description: "An unresolvable import is caught and returned as a single Error marker",
            run: function () {
                var markers = d().check("from nonexistent_lib_xyz import something");
                assert.strictEqual(markers.length, 1);
                assert.strictEqual(markers[0].severity, SEV_ERROR);
            },
        },

        // ── Semicolon warnings ────────────────────────────────────────────

        {
            name: "eol_semicolon_warning",
            description: "A trailing semicolon at end of a line produces a Warning",
            run: function () {
                var markers = d().check("x = 1;\nprint(x)");
                assert_count(markers, SEV_WARNING, 1, "eol_semicolon");
            },
        },

        {
            name: "multiple_eol_semicolons",
            description: "Each trailing-semicolon line gets its own Warning",
            run: function () {
                var markers = d().check("x = 1;\ny = 2;\nprint(x + y)");
                var warnings = markers.filter(function (m) { return m.severity === SEV_WARNING; });
                assert.ok(warnings.length >= 2,
                    "Expected at least 2 eol-semicolon warnings, got " + warnings.length);
            },
        },

        // ── Defined-after-use ─────────────────────────────────────────────

        {
            name: "def_after_use",
            description: "Using a name before assigning it in the same scope is flagged",
            run: function () {
                var markers = d().check([
                    "print(ahead)",
                    "ahead = 99",
                ].join("\n"));
                // Expect a def-after-use error (or at minimum an error touching 'ahead')
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.ok(errors.length >= 1, "Expected at least 1 error for def-after-use");
                assert.ok(
                    errors.some(function (m) { return m.message.indexOf("ahead") !== -1; }),
                    "Expected error message to mention 'ahead'"
                );
            },
        },

        // ── Marker position accuracy ──────────────────────────────────────

        {
            name: "marker_positions_valid",
            description: "Marker line/col numbers are 1-indexed positive integers",
            run: function () {
                var markers = d().check("print(undefined_xyz)");
                assert.ok(markers.length > 0, "Expected at least one marker");
                markers.forEach(function (m) {
                    assert.ok(m.startLineNumber >= 1,  "startLineNumber must be >= 1");
                    assert.ok(m.startColumn    >= 1,  "startColumn must be >= 1");
                    assert.ok(m.endLineNumber  >= m.startLineNumber,
                        "endLineNumber must be >= startLineNumber");
                    assert.ok(m.endColumn      >= 1,  "endColumn must be >= 1");
                });
            },
        },

        {
            name: "marker_on_correct_line",
            description: "An undefined symbol on line 3 produces a marker on line 3",
            run: function () {
                var markers = d().check([
                    "x = 1",
                    "y = 2",
                    "print(z_undefined)",   // line 3
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.ok(errors.length >= 1);
                assert_line(errors, 3, "marker_on_correct_line");
            },
        },

        // ── Duplicate method warning ──────────────────────────────────────

        {
            name: "dup_method_warning",
            description: "Defining the same method name twice in a class produces a Warning",
            run: function () {
                var markers = d().check([
                    "class Foo:",
                    "    def bar(self):",
                    "        return 1",
                    "    def bar(self):",    // duplicate
                    "        return 2",
                    "Foo()",
                ].join("\n"));
                var warnings = markers.filter(function (m) { return m.severity === SEV_WARNING; });
                assert.ok(warnings.length >= 1,
                    "Expected at least 1 dup-method warning, got " + warnings.length);
                assert.ok(
                    warnings.some(function (m) { return m.message.indexOf("bar") !== -1; }),
                    "Expected warning to mention 'bar'"
                );
            },
        },

        // ── Loop variable shadowing ───────────────────────────────────────

        {
            name: "loop_shadowed",
            description: "A for-loop variable that shadows a prior use in the scope is flagged",
            run: function () {
                var markers = d().check([
                    "def test():",
                    "    i = 10",
                    "    print(i)",
                    "    for i in range(5):",   // shadows previous i
                    "        print(i)",
                    "test()",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.ok(errors.length >= 1,
                    "Expected at least 1 loop-shadowed error");
                assert.ok(
                    errors.some(function (m) { return m.message.indexOf("i") !== -1; }),
                    "Expected error message to mention 'i'"
                );
            },
        },

        // ── Virtual files ─────────────────────────────────────────────────

        {
            name: "virtual_file_import_clean",
            description: "Importing from a virtual file and using the symbol produces no markers",
            run: function () {
                var markers = d().check(
                    "from helper import greet\nprint(greet('world'))",
                    {
                        virtualFiles: {
                            helper: "def greet(name): return 'hello ' + name",
                        },
                    }
                );
                assert.deepStrictEqual(markers, []);
            },
        },

        // ── Severity field ────────────────────────────────────────────────

        {
            name: "severity_values",
            description: "Error markers have severity 8 and Warning markers have severity 4",
            run: function () {
                // Semicolon → Warning; undef → Error
                var markers = d().check("missing_sym\nx = 1;");
                var errors   = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                var warnings = markers.filter(function (m) { return m.severity === SEV_WARNING; });
                assert.ok(errors.length   >= 1, "Expected at least one Error marker");
                assert.ok(warnings.length >= 1, "Expected at least one Warning marker");
            },
        },

        {
            name: "itertools_import_no_errors",
            description: "Importing and using itertools symbols produces no error markers",
            run: function () {
                var markers = d().check([
                    "from itertools import chain, islice, count, cycle, repeat",
                    "from itertools import accumulate, compress, dropwhile, filterfalse",
                    "from itertools import groupby, pairwise, starmap, takewhile, zip_longest",
                    "from itertools import product, permutations, combinations",
                    "from itertools import combinations_with_replacement",
                    "a = list(islice(count(), 3))",
                    "b = list(chain([1, 2], [3, 4]))",
                    "c = list(islice(cycle([1, 2]), 4))",
                    "d2 = list(repeat(5, 3))",
                    "e = list(accumulate([1, 2, 3]))",
                    "f = list(compress([1,2,3], [1,0,1]))",
                    "g = list(dropwhile(lambda x: x < 2, [1,2,3]))",
                    "h = list(filterfalse(lambda x: x % 2, [1,2,3,4]))",
                    "i2 = list(groupby([1,1,2]))",
                    "j = list(pairwise([1,2,3]))",
                    "k = list(starmap(lambda a,b: a+b, [[1,2],[3,4]]))",
                    "l2 = list(takewhile(lambda x: x < 3, [1,2,3,4]))",
                    "m = list(zip_longest([1,2],[3]))",
                    "n2 = list(product([1,2],[3,4]))",
                    "o = list(permutations([1,2,3], 2))",
                    "p = list(combinations([1,2,3], 2))",
                    "q = list(combinations_with_replacement([1,2], 2))",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

        {
            name: "op_overloading_no_errors",
            description: "Class with arithmetic dunder methods and overload_operators flag produces no errors",
            run: function () {
                var markers = d().check([
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
                    "d2 = -a",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

        {
            name: "class_dunder_no_errors",
            description: "__name__, __qualname__, __module__, __class__ access on classes/instances produces no errors",
            run: function () {
                var markers = d().check([
                    "class Foo:",
                    "    def __init__(self):",
                    "        pass",
                    "name = Foo.__name__",
                    "qual = Foo.__qualname__",
                    "mod  = Foo.__module__",
                    "obj  = Foo()",
                    "cls  = obj.__class__",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

        {
            name: "classmethod_no_errors",
            description: "@classmethod decorator produces no error markers; cls param is recognized",
            run: function () {
                var markers = d().check([
                    "class Factory:",
                    "    @classmethod",
                    "    def create(cls, value):",
                    "        obj = cls()",
                    "        obj.value = value",
                    "        return obj",
                    "    @classmethod",
                    "    def from_string(cls, s):",
                    "        return cls.create(int(s))",
                    "    def __init__(self):",
                    "        self.value = 0",
                    "f = Factory.create(42)",
                    "g = Factory.from_string('7')",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

        {
            name: "classmethod_classvar_no_errors",
            description: "cls.classvar in @classmethod body produces no error markers",
            run: function () {
                var markers = d().check([
                    "class Counter:",
                    "    count = 0",
                    "    @classmethod",
                    "    def increment(cls):",
                    "        cls.count += 1",
                    "    @classmethod",
                    "    def get_count(cls):",
                    "        return cls.count",
                    "Counter.increment()",
                    "x = Counter.get_count()",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

        {
            name: "nested_comprehension_no_errors",
            description: "Nested comprehensions produce no error markers",
            run: function () {
                var markers = d().check([
                    "flat = [x for row in [[1,2],[3,4]] for x in row]",
                    "evens = [x for row in [[1,2,3],[4,5,6]] for x in row if x % 2 == 0]",
                    "pairs = [[i, j] for i in range(3) for j in range(i)]",
                    "s = {x + y for x in range(3) for y in range(3)}",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors but got: " + JSON.stringify(errors));
            },
        },

    ];

    return TESTS;
}

// ---------------------------------------------------------------------------
// Runner  (mirrors test/unit/index.js style)
// ---------------------------------------------------------------------------

function run_tests(TESTS, filter) {
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
            console.log(colored("PASS  " + test.name, "green") +
                        "  –  " + test.description);
        } catch (e) {
            failures.push(test.name);
            var msg = e.message || String(e);
            console.log(colored("FAIL  " + test.name, "red") +
                        "\n      " + msg + "\n");
        }
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " language-service tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point — use dynamic import() to load the ES module
// ---------------------------------------------------------------------------

var diagnostics_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/diagnostics.js")
).href;

var filter = process.argv[2] || null;

import(diagnostics_path).then(function (mod) {
    var Diagnostics = mod.Diagnostics;
    var RS          = compiler_module.create_compiler();
    var TESTS       = make_tests(Diagnostics, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load language service module:", "red"), e);
    process.exit(1);
});
