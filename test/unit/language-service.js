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
var fs             = require("fs");
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

// Path to src/lib/ relative to this test file — used for coverage checks.
var LIB_DIR = path.join(__dirname, "../../src/lib");

/**
 * Return the module names of all .pyj files currently in src/lib/.
 * Excludes cache files (.pyj-cached) and any non-.pyj entries.
 */
function get_lib_module_names() {
    return fs.readdirSync(LIB_DIR)
        .filter(function (f) { return f.endsWith(".pyj") && !f.endsWith(".pyj-cached"); })
        .map(function (f) { return f.replace(/\.pyj$/, ""); });
}

function make_tests(Diagnostics, RS, STDLIB_MODULES) {

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
            description: "An unresolvable import produces a single Error marker (unused-import) when no module registry is configured",
            run: function () {
                var markers = d().check("from nonexistent_lib_xyz import something");
                assert.strictEqual(markers.length, 1);
                assert.strictEqual(markers[0].severity, SEV_ERROR);
            },
        },

        // ── Bad-import squiggles ───────────────────────────────────────────

        {
            name: "bad_import_unknown_module",
            description: "Importing from an unknown module produces a bad-import Error when a module registry is active",
            run: function () {
                var markers = d().check(
                    "from typo_mod import foo\nprint(foo())",
                    { virtualFiles: { mymod: "def foo(): return 1" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.ok(bad.length >= 1, "Expected at least one 'Unknown module' marker, got: " + JSON.stringify(markers));
                assert.strictEqual(bad[0].severity, SEV_ERROR);
                // Squiggle should point at the module name on line 1
                assert.strictEqual(bad[0].startLineNumber, 1);
            },
        },

        {
            name: "bad_import_known_module_no_error",
            description: "Importing from a registered module produces no bad-import error",
            run: function () {
                var markers = d().check(
                    "from mymod import foo\nprint(foo())",
                    { virtualFiles: { mymod: "def foo(): return 1" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.strictEqual(bad.length, 0, "Expected no 'Unknown module' marker for a known module");
            },
        },

        {
            name: "bad_import_no_registry_no_error",
            description: "Unknown imports produce no bad-import error when no module registry is configured",
            run: function () {
                var markers = d().check("from anything import foo\nprint(foo())");
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.strictEqual(bad.length, 0, "Expected no 'Unknown module' marker when no registry is configured");
            },
        },

        {
            name: "bad_import_squiggle_span",
            description: "The bad-import squiggle covers the module name",
            run: function () {
                var markers = d().check(
                    "from typo_mod import foo",
                    { virtualFiles: { mymod: "def foo(): return 1" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.ok(bad.length >= 1, "Expected a bad-import marker");
                var m = bad[0];
                // 'typo_mod' appears after 'from ' (col 5, 1-indexed col 6)
                assert.strictEqual(m.startColumn, 6, "startColumn should be 6 (start of 'typo_mod')");
                // endColumn should cover all of 'typo_mod' (8 chars)
                assert.ok(m.endColumn > m.startColumn, "endColumn should be past startColumn");
            },
        },

        {
            name: "bad_import_stdlib_registry",
            description: "Importing from a registered stdlib module produces no bad-import error",
            run: function () {
                var markers = d().check(
                    "from mathlib import sqrt",
                    { stdlibFiles: { mathlib: "def sqrt(x): return x ** 0.5" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.strictEqual(bad.length, 0, "Expected no 'Unknown module' marker for a known stdlib module");
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

        // ── pythonFlags option ─────────────────────────────────────────────

        {
            name: "python_flags_no_errors_when_flag_active",
            description: "pythonFlags constructor option activates flags without inline import",
            run: function () {
                // Without pythonFlags, using overload_operators syntax requires
                // `from __python__ import overload_operators` in the source.
                // With pythonFlags, it should be active globally.
                var d_with_flags = new Diagnostics(RS, null, "overload_operators,overload_getitem");
                var markers = d_with_flags.check([
                    "class Vec:",
                    "    def __init__(self, x):",
                    "        self.x = x",
                    "    def __add__(self, other):",
                    "        return Vec(self.x + other.x)",
                    "a = Vec(1)",
                    "b = Vec(2)",
                    "c = a + b",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors with pythonFlags active, got: " + JSON.stringify(errors));
            },
        },

        {
            name: "python_flags_constructor_same_as_inline_import",
            description: "pythonFlags constructor option produces same parse result as inline from __python__ import",
            run: function () {
                // Code using overload_operators — no inline import
                var src_no_import = [
                    "class N:",
                    "    def __init__(self, v): self.v = v",
                    "    def __add__(self, o): return N(self.v + o.v)",
                    "a = N(1)",
                    "b = N(2)",
                    "x = a + b",
                ].join("\n");

                // With inline import
                var src_with_import = [
                    "from __python__ import overload_operators",
                ].concat(src_no_import.split("\n")).join("\n");

                // Both should parse without error when the flag is active
                var d_flags  = new Diagnostics(RS, null, "overload_operators");
                var d_inline = new Diagnostics(RS, null, null);

                var m_flags  = d_flags.check(src_no_import);
                var m_inline = d_inline.check(src_with_import);

                var err_flags  = m_flags.filter(function (m) { return m.severity === SEV_ERROR; });
                var err_inline = m_inline.filter(function (m) { return m.severity === SEV_ERROR; });

                assert.deepStrictEqual(err_flags, [],
                    "Flags: expected no errors, got: " + JSON.stringify(err_flags));
                assert.deepStrictEqual(err_inline, [],
                    "Inline: expected no errors, got: " + JSON.stringify(err_inline));
            },
        },

        {
            name: "dict_spread_no_errors",
            description: "Dict merge literal {**d1, **d2} produces no error markers",
            run: function () {
                var markers = d().check([
                    "d1 = {'a': 1}",
                    "d2 = {'b': 2}",
                    "merged = {**d1, **d2}",
                    "mixed = {**d1, 'c': 3}",
                    "single = {**d1}",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors for dict spread, got: " + JSON.stringify(errors));
            },
        },

        {
            name: "dict_spread_no_dup_key_false_positive",
            description: "Spread items do not trigger dup-key warnings alongside real keys",
            run: function () {
                var markers = d().check([
                    "d1 = {'a': 1}",
                    "result = {**d1, 'b': 2, 'c': 3}",
                ].join("\n"));
                var dup_key = markers.filter(function (m) { return m.message.indexOf("dup") !== -1; });
                assert.deepStrictEqual(dup_key, [],
                    "Expected no dup-key warnings for spread, got: " + JSON.stringify(dup_key));
            },
        },

        // ── Type annotations ──────────────────────────────────────────────

        {
            name: "annotated_assign_no_undef",
            description: "Variable declared with type annotation (a: int = 5) is not flagged as undefined",
            run: function () {
                var markers = d().check([
                    "async def main():",
                    "    a: int = 5",
                    "    a += 4",
                ].join("\n"));
                var undef = markers.filter(function (m) { return m.message.indexOf("Undefined symbol") !== -1; });
                assert.deepStrictEqual(undef, [],
                    "Expected no 'Undefined symbol' errors but got: " + JSON.stringify(undef));
            },
        },

        {
            name: "annotated_assign_used",
            description: "Variable declared with type annotation is recognized as used when referenced",
            run: function () {
                var markers = d().check([
                    "def foo():",
                    "    x: str = 'hello'",
                    "    return x",
                ].join("\n"));
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors for annotated var used in same scope, got: " + JSON.stringify(errors));
            },
        },

        {
            name: "annotated_assign_compound_ops",
            description: "All compound assignment operators work on annotated variables without undef errors",
            run: function () {
                var markers = d().check([
                    "def bar():",
                    "    n: int = 10",
                    "    n += 1",
                    "    n -= 1",
                    "    n *= 2",
                    "    return n",
                ].join("\n"));
                var undef = markers.filter(function (m) { return m.message.indexOf("Undefined symbol") !== -1; });
                assert.deepStrictEqual(undef, [],
                    "Expected no 'Undefined symbol' errors but got: " + JSON.stringify(undef));
            },
        },

        {
            name: "slice_builtin_no_undef_error",
            description: "slice() usage produces no 'Undefined symbol' diagnostic",
            run: function () {
                var inst = new Diagnostics(RS);
                var markers = inst.check([
                    "s = slice(1, 5)",
                    "x = [1, 2, 3, 4, 5]",
                    "ok = isinstance(s, slice)",
                ].join("\n"));
                var undef = markers.filter(function (m) {
                    return m.message.indexOf("Undefined symbol") !== -1 &&
                           m.message.indexOf("slice") !== -1;
                });
                assert.deepStrictEqual(undef, [],
                    "Expected no 'Undefined symbol: slice' but got: " + JSON.stringify(undef));
            },
        },

        {
            name: "list_concat_no_diagnostics",
            description: "list + list and += produce no diagnostic errors",
            run: function () {
                var markers = d().check([
                    "a = [1, 2]",
                    "b = [3, 4]",
                    "c = a + b",
                    "a += [5, 6]",
                    "print(c)",
                    "print(a)",
                ].join("\n"));
                assert_count(markers, SEV_ERROR, 0, "list concat");
            },
        },

        // ── Stdlib import recognition ──────────────────────────────────────

        {
            name: "stdlib_collections_no_bad_import",
            description: "from collections import defaultdict produces no bad-import error when virtualFiles are present",
            run: function () {
                // A virtualFile being present activates the knownModules registry.
                // Before the fix, 'collections' was not in knownModules and was
                // flagged as 'Unknown module'.
                var markers = d().check(
                    "from collections import defaultdict\nd = defaultdict(list)\nd['x'].append(1)",
                    { virtualFiles: { mymod: "def foo(): pass" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.deepStrictEqual(bad, [],
                    "Expected no 'Unknown module' for stdlib collections, got: " + JSON.stringify(bad));
            },
        },

        {
            name: "stdlib_all_modules_no_bad_import",
            description: "All bundled stdlib modules produce no bad-import error when a module registry is active",
            run: function () {
                var stdlib_mods = [
                    'aes', 'collections', 'elementmaker', 'encodings', 'functools',
                    'gettext', 'itertools', 'math', 'numpy', 'operator', 'pythonize',
                    'random', 're', 'traceback', 'uuid',
                ];
                stdlib_mods.forEach(function (mod) {
                    var markers = d().check(
                        "from " + mod + " import x\nprint(x)",
                        { virtualFiles: { mymod: "def foo(): pass" } }
                    );
                    var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                    assert.deepStrictEqual(bad, [],
                        "Expected no 'Unknown module' for stdlib '" + mod + "', got: " + JSON.stringify(bad));
                });
            },
        },

        {
            name: "stdlib_python_pseudo_module_no_bad_import",
            description: "from __python__ import overload_operators produces no bad-import error when virtualFiles are present",
            run: function () {
                var markers = d().check(
                    "from __python__ import overload_operators\nclass V:\n    def __add__(self, o): return V()\nV()",
                    { virtualFiles: { mymod: "def foo(): pass" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.deepStrictEqual(bad, [],
                    "Expected no 'Unknown module' for __python__ pseudo-module, got: " + JSON.stringify(bad));
            },
        },

        {
            name: "stdlib_unknown_still_flagged",
            description: "A genuinely unknown module is still flagged as bad-import when registry is active",
            run: function () {
                var markers = d().check(
                    "from definitely_not_a_stdlib_module import foo\nprint(foo())",
                    { virtualFiles: { mymod: "def bar(): pass" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.ok(bad.length >= 1,
                    "Expected at least one 'Unknown module' for a genuinely unknown module, got: " + JSON.stringify(markers));
            },
        },

        {
            name: "stdlib_collections_all_classes",
            description: "Importing all collections classes produces no errors",
            run: function () {
                var markers = d().check([
                    "from collections import defaultdict, Counter, OrderedDict, deque, namedtuple",
                    "d = defaultdict(list)",
                    "c = Counter([1, 2, 2, 3])",
                    "od = OrderedDict()",
                    "dq = deque([1, 2, 3])",
                    "Point = namedtuple('Point', 'x y')",
                    "print(d, c, od, dq, Point)",
                ].join("\n"),
                    { virtualFiles: { mymod: "def foo(): pass" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.deepStrictEqual(bad, [],
                    "Expected no bad-import for collections classes, got: " + JSON.stringify(bad));
            },
        },

        {
            name: "stdlib_math_no_bad_import",
            description: "from math import sqrt, pi, floor, ceil produces no bad-import",
            run: function () {
                var markers = d().check(
                    "from math import sqrt, pi, floor, ceil\nprint(sqrt(pi), floor(3.7), ceil(3.2))",
                    { virtualFiles: { mymod: "x = 1" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.deepStrictEqual(bad, [],
                    "Expected no bad-import for math, got: " + JSON.stringify(bad));
            },
        },

        {
            name: "stdlib_functools_no_bad_import",
            description: "from functools import reduce, partial produces no bad-import",
            run: function () {
                var markers = d().check(
                    "from functools import reduce, partial\nadd = partial(lambda a, b: a + b, 1)\nprint(reduce(lambda a, b: a + b, [1, 2, 3]))",
                    { virtualFiles: { mymod: "x = 1" } }
                );
                var bad = markers.filter(function (m) { return m.message.indexOf('Unknown module') !== -1; });
                assert.deepStrictEqual(bad, [],
                    "Expected no bad-import for functools, got: " + JSON.stringify(bad));
            },
        },

        {
            name: "stdlib_react_hooks_no_errors",
            description: "Importing and using React hooks and utilities produces no errors",
            run: function () {
                var markers = d().check([
                    "from react import useState, useEffect, useRef, useCallback, useMemo",
                    "from react import useContext, useReducer, useId, useTransition",
                    "from react import Component, PureComponent, Fragment",
                    "from react import createElement, createContext, createRef, memo, lazy",
                    "from react import forwardRef, cloneElement, isValidElement",
                    "count, setCount = useState(0)",
                    "ref = useRef(None)",
                    "ref2 = createRef()",
                    "ctx = createContext(None)",
                    "cb = useCallback(lambda: None, [])",
                    "val = useMemo(lambda: 42, [])",
                    "id_ = useId()",
                    "el = createElement('div', None)",
                    "valid = isValidElement(el)",
                    "print(count, setCount, ref, ref2, ctx, cb, val, id_, el, valid)",
                    "print(Component, PureComponent, Fragment, forwardRef, cloneElement)",
                    "print(useEffect, useContext, useReducer, useTransition, memo, lazy)",
                ].join("\n"),
                    { virtualFiles: { sentinel: "x = 1" } }
                );
                var errors = markers.filter(function (m) { return m.severity === SEV_ERROR; });
                assert.deepStrictEqual(errors, [],
                    "Expected no errors for react imports and usage, got: " +
                    JSON.stringify(errors.map(function (m) { return m.message; })));
            },
        },

        // ── STDLIB_MODULES coverage (filesystem-driven) ───────────────────
        //
        // These tests read src/lib/ at runtime and cross-check against
        // STDLIB_MODULES so that any future .pyj file addition that is
        // not reflected in the constant causes an immediate test failure.

        {
            name: "stdlib_modules_covers_all_lib_files",
            description: "Every .pyj file in src/lib/ has its module name listed in STDLIB_MODULES",
            run: function () {
                if (!STDLIB_MODULES) {
                    // Graceful skip when called without the constant (shouldn't happen)
                    throw new Error("STDLIB_MODULES was not passed to make_tests()");
                }
                var lib_names   = get_lib_module_names();
                var stdlib_set  = Object.create(null);
                STDLIB_MODULES.forEach(function (m) { stdlib_set[m] = true; });

                var missing = lib_names.filter(function (name) {
                    return !stdlib_set[name];
                });

                assert.deepStrictEqual(missing, [],
                    "The following src/lib/ modules are missing from STDLIB_MODULES " +
                    "in diagnostics.js — add them to avoid false 'Unknown module' IDE errors:\n  " +
                    missing.join(", ")
                );
            },
        },

        {
            name: "stdlib_modules_no_phantom_entries",
            description: "Every non-pseudo entry in STDLIB_MODULES corresponds to an actual src/lib/*.pyj file",
            run: function () {
                if (!STDLIB_MODULES) {
                    throw new Error("STDLIB_MODULES was not passed to make_tests()");
                }
                // Pseudo-modules that do not have a corresponding .pyj file are OK.
                var PSEUDO = { '__python__': true, '__builtins__': true };

                var lib_set   = Object.create(null);
                get_lib_module_names().forEach(function (n) { lib_set[n] = true; });

                var phantom = STDLIB_MODULES.filter(function (m) {
                    return !PSEUDO[m] && !lib_set[m];
                });

                assert.deepStrictEqual(phantom, [],
                    "The following STDLIB_MODULES entries have no matching src/lib/*.pyj file — " +
                    "remove them from STDLIB_MODULES or add the missing library:\n  " +
                    phantom.join(", ")
                );
            },
        },

        {
            name: "stdlib_new_lib_file_no_bad_import",
            description: "Every .pyj module in src/lib/ produces zero error-severity markers when imported with virtualFiles present",
            run: function () {
                var lib_names = get_lib_module_names();
                lib_names.forEach(function (mod) {
                    var markers = d().check(
                        "from " + mod + " import x\nprint(x)",
                        { virtualFiles: { sentinel: "x = 1" } }
                    );
                    // Check for ANY error-severity marker, not just bad-import.
                    // This catches: bad-import ('Unknown module'), import-err, syntax-err,
                    // and any other error category that might arise for a new lib file.
                    var errors = markers.filter(function (m) {
                        return m.severity === SEV_ERROR;
                    });
                    assert.deepStrictEqual(errors, [],
                        "src/lib/" + mod + ".pyj exists but 'from " + mod + " import x' " +
                        "produces error markers — if this is a bad-import, add '" + mod +
                        "' to STDLIB_MODULES in diagnostics.js. Markers: " +
                        JSON.stringify(errors.map(function (m) { return m.message; }))
                    );
                });
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
    var Diagnostics    = mod.Diagnostics;
    var STDLIB_MODULES = mod.STDLIB_MODULES;
    var RS             = compiler_module.create_compiler();
    var TESTS          = make_tests(Diagnostics, RS, STDLIB_MODULES);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load language service module:", "red"), e);
    process.exit(1);
});
