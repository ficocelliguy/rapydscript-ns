/*
 * test/unit/language-service-signature.js
 *
 * Unit tests for src/monaco-language-service/signature.js (Phase 4).
 *
 * Usage:
 *   node test/unit/language-service-signature.js              # run all tests
 *   node test/unit/language-service-signature.js <test-name>  # run a single test by name
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

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

function make_tests(SignatureHelpEngine, detect_call_context, SourceAnalyzer, RS) {

    function make_engine() {
        return new SignatureHelpEngine();
    }

    function analyze(src) {
        var analyzer = new SourceAnalyzer(RS);
        return analyzer.analyze(src, {});
    }

    var TESTS = [

        // ── detect_call_context ───────────────────────────────────────────

        {
            name: "ctx_simple_call",
            description: "detect_call_context finds callee and param 0 for 'func('",
            run: function () {
                var ctx = detect_call_context("func(");
                assert.ok(ctx, "should return a context");
                assert.strictEqual(ctx.callee, "func");
                assert.strictEqual(ctx.activeParameter, 0);
            },
        },

        {
            name: "ctx_second_param",
            description: "detect_call_context returns activeParameter 1 after first comma",
            run: function () {
                var ctx = detect_call_context("func(a, ");
                assert.ok(ctx, "should return context");
                assert.strictEqual(ctx.callee, "func");
                assert.strictEqual(ctx.activeParameter, 1);
            },
        },

        {
            name: "ctx_third_param",
            description: "detect_call_context returns activeParameter 2 after two commas",
            run: function () {
                var ctx = detect_call_context("func(a, b, ");
                assert.ok(ctx, "should return context");
                assert.strictEqual(ctx.activeParameter, 2);
            },
        },

        {
            name: "ctx_nested_call_ignored",
            description: "Commas inside nested calls don't count as argument separators",
            run: function () {
                // outer(inner(x, y), <cursor> — outer's second arg
                var ctx = detect_call_context("outer(inner(x, y), ");
                assert.ok(ctx, "should return context");
                assert.strictEqual(ctx.callee, "outer");
                assert.strictEqual(ctx.activeParameter, 1);
            },
        },

        {
            name: "ctx_not_in_call",
            description: "detect_call_context returns null when not inside a call",
            run: function () {
                var ctx = detect_call_context("x = 1");
                assert.strictEqual(ctx, null, "should return null");
            },
        },

        {
            name: "ctx_closed_paren",
            description: "detect_call_context returns null when all parens are closed",
            run: function () {
                var ctx = detect_call_context("func(a, b)");
                assert.strictEqual(ctx, null, "should return null — paren is closed");
            },
        },

        {
            name: "ctx_method_call",
            description: "detect_call_context handles obj.method( prefix",
            run: function () {
                var ctx = detect_call_context("obj.method(");
                assert.ok(ctx, "should return context");
                assert.strictEqual(ctx.callee, "method");
                assert.strictEqual(ctx.activeParameter, 0);
            },
        },

        {
            name: "ctx_nested_bracket",
            description: "Commas inside [] don't count as argument separators",
            run: function () {
                // func([1, 2, 3], <cursor>
                var ctx = detect_call_context("func([1, 2, 3], ");
                assert.ok(ctx, "should return context");
                assert.strictEqual(ctx.callee, "func");
                assert.strictEqual(ctx.activeParameter, 1);
            },
        },

        // ── SignatureHelpEngine.getSignatureHelp ──────────────────────────

        // NOTE: The scopeMap is built from clean, parseable source.
        // The linePrefix (e.g. "greet(") is passed separately and does NOT need
        // to match what is literally on that line of the source.
        // We query at col 1 of the last "pass" line so the position is safely
        // inside the module scope range.

        {
            name: "help_basic",
            description: "getSignatureHelp returns signature for a known function",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def greet(name, age):",
                    "    return name",
                    "x = greet(1, 2)",
                    "pass",
                ].join("\n"));

                // Simulate cursor inside "greet(" at line 4 col 1
                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "greet(");
                assert.ok(help, "expected signature help");
                assert.strictEqual(help.value.signatures.length, 1);
                assert.ok(help.value.signatures[0].label.indexOf("name") !== -1, "label includes 'name'");
                assert.ok(help.value.signatures[0].label.indexOf("age")  !== -1, "label includes 'age'");
                assert.strictEqual(help.value.activeParameter, 0);
                assert.strictEqual(help.value.activeSignature, 0);
            },
        },

        {
            name: "help_second_param",
            description: "getSignatureHelp highlights the second parameter after a comma",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def greet(name, age):",
                    "    return name",
                    "x = greet(1, 2)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "greet(x, ");
                assert.ok(help, "expected signature help");
                assert.strictEqual(help.value.activeParameter, 1);
            },
        },

        {
            name: "help_star_args",
            description: "getSignatureHelp includes *args in signature label",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def variadic(first, *rest):",
                    "    return first",
                    "x = variadic(1)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "variadic(");
                assert.ok(help, "expected signature help");
                assert.ok(help.value.signatures[0].label.indexOf("*rest") !== -1,
                    "label should include *rest");
            },
        },

        {
            name: "help_kwargs",
            description: "getSignatureHelp includes **kwargs in signature label",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def configure(host, **opts):",
                    "    return host",
                    "x = configure('localhost')",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "configure(");
                assert.ok(help, "expected signature help");
                assert.ok(help.value.signatures[0].label.indexOf("**opts") !== -1,
                    "label should include **opts");
            },
        },

        {
            name: "help_param_objects",
            description: "getSignatureHelp includes parameter objects matching the label",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def add(x, y):",
                    "    return x + y",
                    "z = add(1, 2)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "add(");
                assert.ok(help, "expected signature help");
                var params = help.value.signatures[0].parameters;
                assert.strictEqual(params.length, 2, "should have 2 parameter objects");
                assert.strictEqual(params[0].label, "x", "first param label");
                assert.strictEqual(params[1].label, "y", "second param label");
            },
        },

        {
            name: "help_unknown_function",
            description: "getSignatureHelp returns null for an unknown function",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("x = 1\npass");

                var help = engine.getSignatureHelp(scopeMap, pos(2, 1), "unknown_func(");
                assert.strictEqual(help, null, "unknown function → null");
            },
        },

        {
            name: "help_no_params",
            description: "getSignatureHelp returns null for a function with no params",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def noop():",
                    "    pass",
                    "noop()",
                    "pass",
                ].join("\n"));

                // Query at line 4 col 1
                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "noop(");
                assert.strictEqual(help, null, "no-param function → null (nothing to show)");
            },
        },

        {
            name: "help_null_scopemap",
            description: "getSignatureHelp returns null when scopeMap is null",
            run: function () {
                var engine = make_engine();
                var help   = engine.getSignatureHelp(null, pos(1, 5), "func(");
                assert.strictEqual(help, null, "null scopeMap → null");
            },
        },

        {
            name: "help_not_in_call",
            description: "getSignatureHelp returns null when cursor is not inside a call",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze("x = 1\npass");

                var help = engine.getSignatureHelp(scopeMap, pos(2, 1), "x = 1");
                assert.strictEqual(help, null, "not in call → null");
            },
        },

        {
            name: "help_clamp_active_param",
            description: "activeParameter is clamped to last param index when cursor is past all params",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def two(a, b):",
                    "    return a",
                    "z = two(1, 2)",
                    "pass",
                ].join("\n"));

                // Simulate cursor at a third arg slot, but function only has 2 params
                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "two(x, y, ");
                assert.ok(help, "expected signature help even past last param");
                assert.strictEqual(help.value.activeParameter, 1,
                    "should clamp to last param index (1)");
            },
        },

        {
            name: "help_posonly_separator",
            description: "Signature label includes '/' for positional-only parameters",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def f(a, b, /, c):",
                    "    return a",
                    "z = f(1, 2, 3)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "f(");
                assert.ok(help, "expected signature help");
                var label = help.value.signatures[0].label;
                assert.ok(label.indexOf("/") !== -1, "label should contain '/'");
                assert.ok(label.indexOf("a") !== -1, "label should contain 'a'");
                assert.ok(label.indexOf("c") !== -1, "label should contain 'c'");
            },
        },

        {
            name: "help_kwonly_separator",
            description: "Signature label includes '*' bare separator for keyword-only parameters",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def g(a, *, b, c=1):",
                    "    return a",
                    "z = g(1, b=2)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "g(");
                assert.ok(help, "expected signature help");
                var label = help.value.signatures[0].label;
                assert.ok(label.indexOf("*") !== -1, "label should contain '*' separator");
                assert.ok(label.indexOf("b") !== -1, "label should contain 'b'");
            },
        },

        {
            name: "help_posonly_and_kwonly",
            description: "Signature label shows both '/' and '*' separators",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def h(a, /, b, *, c):",
                    "    return a",
                    "z = h(1, 2, c=3)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "h(");
                assert.ok(help, "expected signature help");
                var label = help.value.signatures[0].label;
                assert.ok(label.indexOf("/") !== -1, "label should contain '/'");
                assert.ok(label.indexOf("*") !== -1, "label should contain '*'");
            },
        },

        {
            name: "help_dispose_is_function",
            description: "Returned help object has a dispose() function",
            run: function () {
                var engine   = make_engine();
                var scopeMap = analyze([
                    "def f(a):",
                    "    return a",
                    "z = f(1)",
                    "pass",
                ].join("\n"));

                var help = engine.getSignatureHelp(scopeMap, pos(4, 1), "f(");
                assert.ok(help, "expected help");
                assert.strictEqual(typeof help.dispose, "function", "dispose should be a function");
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
        console.log(colored("All " + tests.length + " language-service-signature tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var signature_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/signature.js")
).href;

var analyzer_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/analyzer.js")
).href;

var filter = process.argv[2] || null;

Promise.all([
    import(signature_path),
    import(analyzer_path),
]).then(function (mods) {
    var SignatureHelpEngine  = mods[0].SignatureHelpEngine;
    var detect_call_context  = mods[0].detect_call_context;
    var SourceAnalyzer       = mods[1].SourceAnalyzer;
    var RS                   = compiler_module.create_compiler();
    var TESTS                = make_tests(SignatureHelpEngine, detect_call_context, SourceAnalyzer, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load signature module:", "red"), e);
    process.exit(1);
});
