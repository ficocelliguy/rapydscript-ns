/*
 * test/unit/language-service-hover.js
 *
 * Unit tests for src/monaco-language-service/hover.js (Phase 5).
 *
 * Usage:
 *   node test/unit/language-service-hover.js              # run all tests
 *   node test/unit/language-service-hover.js <test-name>  # run a single test by name
 */
"use strict";

var assert          = require("assert");
var path            = require("path");
var url             = require("url");
var compiler_module = require("../../tools/compiler");
var utils           = require("../../tools/utils");
var colored         = utils.safe_colored;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pos(line, col) { return { lineNumber: line, column: col }; }

/** Return the first contents value string from a hover result. */
function hover_text(result) {
    return result && result.contents && result.contents[0]
        ? result.contents[0].value
        : null;
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

function make_tests(HoverEngine, SourceAnalyzer, RS) {

    function make_engine() { return new HoverEngine(); }

    function analyze(src) {
        return new SourceAnalyzer(RS).analyze(src, {});
    }

    var TESTS = [

        // ── Basic symbol lookup ───────────────────────────────────────────

        {
            name: "hover_function",
            description: "Hovering over a function name shows its signature",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def add(x, y):",
                    "    return x + y",
                    "z = add(1, 2)",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(4, 1), "add");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("function") !== -1, "should mention 'function'");
                assert.ok(text.indexOf("add")       !== -1, "should include function name");
                assert.ok(text.indexOf("x")         !== -1, "should include param x");
                assert.ok(text.indexOf("y")         !== -1, "should include param y");
            },
        },

        {
            name: "hover_class",
            description: "Hovering over a class name shows its kind",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "class Dog:",
                    "    def bark(self):",
                    "        return 'woof'",
                    "d = Dog()",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(5, 1), "Dog");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("class") !== -1, "should mention 'class'");
                assert.ok(text.indexOf("Dog")   !== -1, "should include class name");
            },
        },

        {
            name: "hover_variable",
            description: "Hovering over a variable shows its kind",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("my_var = 42\npass");

                var result = engine.getHover(scopeMap, pos(1, 1), "my_var");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("variable") !== -1, "should mention 'variable'");
                assert.ok(text.indexOf("my_var")   !== -1, "should include var name");
            },
        },

        {
            name: "hover_import",
            description: "Hovering over an import name shows its kind",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "from math import sqrt",
                    "x = sqrt(4)",
                    "pass",
                ].join("\n"), {});

                var result = engine.getHover(scopeMap, pos(3, 1), "sqrt");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("import") !== -1, "should mention 'import'");
                assert.ok(text.indexOf("sqrt")   !== -1, "should include symbol name");
            },
        },

        // ── Docstring in hover ────────────────────────────────────────────

        {
            name: "hover_with_docstring",
            description: "Hover includes the docstring when present",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def greet(name):",
                    '    """Say hello to someone."""',
                    "    return name",
                    "x = greet('world')",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(5, 1), "greet");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("Say hello") !== -1,
                    "hover should include docstring: " + text);
            },
        },

        {
            name: "hover_no_docstring",
            description: "Hover works cleanly when no docstring is present",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def plain(a):",
                    "    return a",
                    "x = plain(1)",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(4, 1), "plain");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("plain") !== -1, "should include function name");
            },
        },

        // ── Parameter display ─────────────────────────────────────────────

        {
            name: "hover_star_args",
            description: "Hover shows *args with asterisk in signature",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def variadic(first, *rest):",
                    "    return first",
                    "x = variadic(1)",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(4, 1), "variadic");
                var text = hover_text(result);
                assert.ok(text.indexOf("*rest") !== -1, "should show *rest");
            },
        },

        {
            name: "hover_kwargs",
            description: "Hover shows **kwargs with double asterisk in signature",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def configure(host, **opts):",
                    "    return host",
                    "x = configure('localhost')",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(4, 1), "configure");
                var text = hover_text(result);
                assert.ok(text.indexOf("**opts") !== -1, "should show **opts");
            },
        },

        // ── Null / unknown symbol cases ───────────────────────────────────

        {
            name: "hover_unknown_word",
            description: "Hover returns null for a word not in the ScopeMap",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("x = 1\npass");

                var result = engine.getHover(scopeMap, pos(2, 1), "unknown_sym");
                assert.strictEqual(result, null, "unknown symbol → null");
            },
        },

        {
            name: "hover_null_scopemap",
            description: "Hover returns null when scopeMap is null",
            run: function () {
                var engine = make_engine();
                var result = engine.getHover(null, pos(1, 1), "foo");
                assert.strictEqual(result, null, "null scopeMap → null");
            },
        },

        {
            name: "hover_null_word",
            description: "Hover returns null when word is null",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("x = 1\npass");
                var result   = engine.getHover(scopeMap, pos(1, 1), null);
                assert.strictEqual(result, null, "null word → null");
            },
        },

        // ── Contents structure ────────────────────────────────────────────

        {
            name: "hover_contents_structure",
            description: "Hover result has a contents array with value strings",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("my_val = 99\npass");

                var result = engine.getHover(scopeMap, pos(1, 1), "my_val");
                assert.ok(result, "expected hover result");
                assert.ok(Array.isArray(result.contents), "contents should be an array");
                assert.ok(result.contents.length > 0,    "contents should not be empty");
                assert.strictEqual(typeof result.contents[0].value, "string",
                    "contents[0].value should be a string");
            },
        },

        {
            name: "hover_code_block",
            description: "Hover signature is wrapped in a code block",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def f(a):",
                    "    return a",
                    "x = f(1)",
                    "pass",
                ].join("\n"));

                var result = engine.getHover(scopeMap, pos(4, 1), "f");
                var text   = hover_text(result);
                assert.ok(text.indexOf("```") !== -1, "signature should be in a code block");
            },
        },

        // ── Method hover ──────────────────────────────────────────────────

        {
            name: "hover_method",
            description: "Hovering over a method inside a class shows method kind",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "class Calc:",
                    "    def square(self, n):",
                    "        return n * n",
                    "c = Calc()",
                    "pass",
                ].join("\n"));

                // 'square' is in the class frame; query inside the class range (line 2)
                var result = engine.getHover(scopeMap, pos(2, 5), "square");
                assert.ok(result, "expected hover result");
                var text = hover_text(result);
                assert.ok(text.indexOf("method") !== -1,  "should mention 'method'");
                assert.ok(text.indexOf("square") !== -1,  "should include method name");
                assert.ok(text.indexOf("self")   !== -1,  "should include self param");
                assert.ok(text.indexOf("n")      !== -1,  "should include n param");
            },
        },

    ];

    return TESTS;
}

// ---------------------------------------------------------------------------
// Runner
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
        console.log(colored("All " + tests.length + " language-service-hover tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var hover_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/hover.js")
).href;

var analyzer_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/analyzer.js")
).href;

var filter = process.argv[2] || null;

Promise.all([
    import(hover_path),
    import(analyzer_path),
]).then(function (mods) {
    var HoverEngine    = mods[0].HoverEngine;
    var SourceAnalyzer = mods[1].SourceAnalyzer;
    var RS             = compiler_module.create_compiler();
    var TESTS          = make_tests(HoverEngine, SourceAnalyzer, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load hover module:", "red"), e);
    process.exit(1);
});
