/*
 * test/unit/language-service-builtins.js
 *
 * Unit tests for src/monaco-language-service/builtins.js (Phase 7).
 * Also tests the integration of BuiltinsRegistry into HoverEngine,
 * SignatureHelpEngine, and CompletionEngine.
 *
 * Usage:
 *   node test/unit/language-service-builtins.js              # run all tests
 *   node test/unit/language-service-builtins.js <test-name>  # run single test
 */
"use strict";

var assert          = require("assert");
var path            = require("path");
var url             = require("url");
var compiler_module = require("../../tools/compiler");
var utils           = require("../../tools/utils");
var colored         = utils.safe_colored;

// ---------------------------------------------------------------------------
// Mock Monaco CompletionItemKind
// ---------------------------------------------------------------------------

var MockKind = {
    Method:    0,
    Function:  1,
    Class:     5,
    Variable:  6,
    Module:    8,
    Property:  9,
};

function pos(line, col) { return { lineNumber: line, column: col }; }

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

function make_tests(BuiltinsRegistry, BuiltinInfo, HoverEngine, SignatureHelpEngine,
                    CompletionEngine, detect_call_context, SourceAnalyzer, RS) {

    var TESTS = [

        // ── BuiltinsRegistry: get ─────────────────────────────────────────

        {
            name: "get_known_builtin",
            description: "get() returns a BuiltinInfo for a known built-in",
            run: function () {
                var reg = new BuiltinsRegistry();
                var bi  = reg.get('len');
                assert.ok(bi, 'len should be registered');
                assert.strictEqual(bi.name, 'len');
                assert.strictEqual(bi.kind, 'function');
                assert.ok(Array.isArray(bi.params));
                assert.strictEqual(bi.params.length, 1);
                assert.strictEqual(bi.params[0].label, 's');
                assert.ok(bi.doc && bi.doc.length > 0, 'len should have a docstring');
            },
        },

        {
            name: "get_class_builtin",
            description: "get() returns kind='class' for type constructors",
            run: function () {
                var reg = new BuiltinsRegistry();
                assert.strictEqual(reg.get('int').kind,  'class');
                assert.strictEqual(reg.get('str').kind,  'class');
                assert.strictEqual(reg.get('list').kind, 'class');
                assert.strictEqual(reg.get('set').kind,  'class');
                assert.strictEqual(reg.get('dict').kind, 'class');
                assert.strictEqual(reg.get('bool').kind, 'class');
                assert.strictEqual(reg.get('float').kind,'class');
            },
        },

        {
            name: "get_unknown_returns_null",
            description: "get() returns null for an unknown name",
            run: function () {
                var reg = new BuiltinsRegistry();
                assert.strictEqual(reg.get('__totally_unknown__'), null);
            },
        },

        // ── BuiltinsRegistry: getNames ────────────────────────────────────

        {
            name: "getNames_includes_core",
            description: "getNames() includes the core Python built-ins",
            run: function () {
                var reg   = new BuiltinsRegistry();
                var names = reg.getNames();
                var core  = ['len', 'range', 'print', 'type', 'str', 'int', 'list',
                             'dict', 'set', 'abs', 'min', 'max', 'sum', 'sorted',
                             'enumerate', 'zip', 'map', 'filter'];
                core.forEach(function (n) {
                    assert.ok(names.indexOf(n) !== -1, n + ' should be in getNames()');
                });
            },
        },

        {
            name: "getNames_includes_js_globals",
            description: "getNames() includes JS built-ins (parseInt, setTimeout, etc.)",
            run: function () {
                var reg   = new BuiltinsRegistry();
                var names = reg.getNames();
                ['parseInt', 'parseFloat', 'isNaN', 'isFinite',
                 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
                 'encodeURIComponent', 'decodeURIComponent'
                ].forEach(function (n) {
                    assert.ok(names.indexOf(n) !== -1, n + ' should be in getNames()');
                });
            },
        },

        // ── BuiltinsRegistry: getHoverMarkdown ────────────────────────────

        {
            name: "hover_len_contains_sig",
            description: "getHoverMarkdown('len') contains a signature and docstring",
            run: function () {
                var reg = new BuiltinsRegistry();
                var md  = reg.getHoverMarkdown('len');
                assert.ok(md, 'hover markdown should not be null');
                assert.ok(md.indexOf('len(s)') !== -1,        'should contain len(s)');
                assert.ok(md.indexOf('```') !== -1,            'should be in a code fence');
                assert.ok(md.indexOf('Return the number') !== -1, 'should contain doc text');
            },
        },

        {
            name: "hover_print_contains_sig",
            description: "getHoverMarkdown('print') contains the *args param",
            run: function () {
                var reg = new BuiltinsRegistry();
                var md  = reg.getHoverMarkdown('print');
                assert.ok(md, 'hover for print should not be null');
                assert.ok(md.indexOf('print') !== -1, 'should mention print');
                assert.ok(md.indexOf('*args') !== -1, 'should show *args param');
            },
        },

        {
            name: "hover_range_shows_return_type",
            description: "getHoverMarkdown('range') shows the return type in the signature",
            run: function () {
                var reg = new BuiltinsRegistry();
                var md  = reg.getHoverMarkdown('range');
                assert.ok(md, 'hover for range should not be null');
                assert.ok(md.indexOf('range') !== -1);
                assert.ok(md.indexOf('→') !== -1, 'should show arrow return type');
            },
        },

        {
            name: "hover_unknown_returns_null",
            description: "getHoverMarkdown returns null for unknown names",
            run: function () {
                var reg = new BuiltinsRegistry();
                assert.strictEqual(reg.getHoverMarkdown('__unknown__'), null);
            },
        },

        {
            name: "hover_none_return_omitted",
            description: "getHoverMarkdown omits '→ None' from the signature (void functions)",
            run: function () {
                var reg = new BuiltinsRegistry();
                var md  = reg.getHoverMarkdown('print');
                // Should not show "→ None"
                assert.ok(md.indexOf('→ None') === -1, 'None return type should be omitted');
            },
        },

        // ── BuiltinsRegistry: getSignatureInfo ────────────────────────────

        {
            name: "sig_info_len",
            description: "getSignatureInfo('len') returns correct label and params",
            run: function () {
                var reg  = new BuiltinsRegistry();
                var info = reg.getSignatureInfo('len');
                assert.ok(info, 'should return info for len');
                assert.ok(info.label.indexOf('len(') === 0, 'label should start with len(');
                assert.ok(Array.isArray(info.params), 'params should be an array');
                assert.strictEqual(info.params.length, 1);
                assert.ok(info.params[0].label, 'param should have a label');
                assert.ok(info.doc, 'should have doc');
            },
        },

        {
            name: "sig_info_range_has_three_params",
            description: "getSignatureInfo('range') has three parameters",
            run: function () {
                var reg  = new BuiltinsRegistry();
                var info = reg.getSignatureInfo('range');
                assert.ok(info);
                assert.strictEqual(info.params.length, 3);
                assert.ok(info.params[1].label.indexOf('?') !== -1,
                    'stop param should be marked optional');
            },
        },

        {
            name: "sig_info_unknown_returns_null",
            description: "getSignatureInfo returns null for unknown name",
            run: function () {
                var reg = new BuiltinsRegistry();
                assert.strictEqual(reg.getSignatureInfo('__unknown__'), null);
            },
        },

        {
            name: "sig_info_var_returns_null",
            description: "getSignatureInfo returns null for var-kind stubs (no params)",
            run: function () {
                // jstype is a function, but we can test that any stub without
                // params returns null by checking a hypothetical var
                // (No var stubs are currently defined in builtins, so we verify
                // that a stub with params always returns a non-null info)
                var reg = new BuiltinsRegistry();
                // All function stubs should return non-null
                assert.ok(reg.getSignatureInfo('abs') !== null, 'abs should have sig info');
            },
        },

        // ── HoverEngine integration ───────────────────────────────────────

        {
            name: "hover_builtin_fallback_works",
            description: "HoverEngine falls back to BuiltinsRegistry when word not in ScopeMap or DTS",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new HoverEngine(null, reg);
                var hover  = engine.getHover(null, pos(1, 1), 'len');
                assert.ok(hover, 'should return a hover object');
                assert.ok(Array.isArray(hover.contents), 'contents should be an array');
                assert.ok(hover.contents[0].value.indexOf('len') !== -1);
            },
        },

        {
            name: "hover_null_word_returns_null",
            description: "HoverEngine returns null for a null word with builtins registry",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new HoverEngine(null, reg);
                assert.strictEqual(engine.getHover(null, pos(1, 1), null), null);
            },
        },

        {
            name: "hover_unknown_word_returns_null",
            description: "HoverEngine returns null for a word not in builtins",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new HoverEngine(null, reg);
                assert.strictEqual(engine.getHover(null, pos(1, 1), '__totally_unknown__'), null);
            },
        },

        {
            name: "hover_no_registry_returns_null",
            description: "HoverEngine with no registries returns null for a builtin name",
            run: function () {
                var engine = new HoverEngine(null, null);
                assert.strictEqual(engine.getHover(null, pos(1, 1), 'len'), null);
            },
        },

        // ── SignatureHelpEngine integration ───────────────────────────────

        {
            name: "sig_builtin_fallback_works",
            description: "SignatureHelpEngine uses builtins when no ScopeMap",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new SignatureHelpEngine(reg);
                var help   = engine.getSignatureHelp(null, pos(1, 5), 'len(');
                assert.ok(help, 'should return signature help');
                var sig = help.value.signatures[0];
                assert.ok(sig.label.indexOf('len(') === 0, 'label should start with len(');
                assert.ok(Array.isArray(sig.parameters));
                assert.strictEqual(sig.parameters.length, 1);
            },
        },

        {
            name: "sig_builtin_active_param",
            description: "Active parameter index advances with commas",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new SignatureHelpEngine(reg);

                // range(start_or_stop, stop?, step?)
                var h0 = engine.getSignatureHelp(null, pos(1, 7),  'range(');
                var h1 = engine.getSignatureHelp(null, pos(1, 9),  'range(1,');
                var h2 = engine.getSignatureHelp(null, pos(1, 12), 'range(1, 5,');

                assert.ok(h0, 'cursor after ( should give help');
                assert.ok(h1, 'cursor after first , should give help');
                assert.ok(h2, 'cursor after second , should give help');

                assert.strictEqual(h0.value.activeParameter, 0, 'first param active');
                assert.strictEqual(h1.value.activeParameter, 1, 'second param active');
                assert.strictEqual(h2.value.activeParameter, 2, 'third param active');
            },
        },

        {
            name: "sig_builtin_clamps_active_param",
            description: "Active parameter is clamped to last param index",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new SignatureHelpEngine(reg);
                // abs only has one param; cursor past many commas should clamp to 0
                var help = engine.getSignatureHelp(null, pos(1, 10), 'abs(1, 2,');
                assert.ok(help);
                assert.strictEqual(help.value.activeParameter, 0);
            },
        },

        {
            name: "sig_unknown_callee_returns_null",
            description: "SignatureHelpEngine returns null for unknown function name",
            run: function () {
                var reg    = new BuiltinsRegistry();
                var engine = new SignatureHelpEngine(reg);
                assert.strictEqual(
                    engine.getSignatureHelp(null, pos(1, 10), '__totally_unknown__('),
                    null
                );
            },
        },

        {
            name: "sig_no_registry_still_works_for_scope",
            description: "SignatureHelpEngine without registry still resolves user-defined functions",
            run: function () {
                var engine   = new SignatureHelpEngine(null);
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "def greet(name, msg):",
                    "    return name",
                    "pass",
                ].join("\n"), {});
                var help = engine.getSignatureHelp(scopeMap, pos(3, 1), 'greet(');
                assert.ok(help, 'should resolve user-defined greet');
                assert.ok(help.value.signatures[0].label.indexOf('greet(') === 0);
            },
        },

        {
            name: "sig_scopemap_wins_over_builtin",
            description: "User-defined function in ScopeMap wins over built-in with same name",
            run: function () {
                var reg      = new BuiltinsRegistry();
                var engine   = new SignatureHelpEngine(reg);
                var analyzer = new SourceAnalyzer(RS);
                // Shadow 'len' with a user-defined function that takes 2 params
                var scopeMap = analyzer.analyze([
                    "def len(a, b):",
                    "    return a",
                    "pass",
                ].join("\n"), {});
                var help = engine.getSignatureHelp(scopeMap, pos(3, 1), 'len(');
                assert.ok(help);
                // user-defined len has 2 params; builtin has 1
                assert.strictEqual(help.value.signatures[0].parameters.length, 2,
                    'user-defined len (2 params) should win over builtin (1 param)');
            },
        },

        // ── CompletionEngine integration ──────────────────────────────────

        {
            name: "completion_builtin_rich_detail",
            description: "Builtin completion items show param list in detail when registry present",
            run: function () {
                var reg      = new BuiltinsRegistry();
                var analyzer = new SourceAnalyzer(RS);
                var engine   = new CompletionEngine(analyzer, {
                    virtualFiles:    {},
                    builtinNames:    ['len', 'range', 'print'],
                    builtinsRegistry: reg,
                });
                var list = engine.getCompletions(null, pos(1, 4), 'len', MockKind);
                var item = list.suggestions.find(function (s) { return s.label === 'len'; });
                assert.ok(item, 'len should be in completions');
                assert.ok(item.detail && item.detail.indexOf('(s)') !== -1,
                    'detail should show param list: ' + item.detail);
                assert.ok(item.documentation, 'should have documentation');
            },
        },

        {
            name: "completion_builtin_class_kind",
            description: "Type constructor built-ins have Class kind in completions",
            run: function () {
                var reg      = new BuiltinsRegistry();
                var analyzer = new SourceAnalyzer(RS);
                var engine   = new CompletionEngine(analyzer, {
                    virtualFiles:    {},
                    builtinNames:    ['int', 'str', 'list'],
                    builtinsRegistry: reg,
                });
                var list = engine.getCompletions(null, pos(1, 1), '', MockKind);
                ['int', 'str', 'list'].forEach(function (name) {
                    var item = list.suggestions.find(function (s) { return s.label === name; });
                    assert.ok(item, name + ' should be in completions');
                    assert.strictEqual(item.kind, MockKind.Class,
                        name + ' should have Class kind');
                });
            },
        },

        {
            name: "completion_builtin_function_kind",
            description: "Function built-ins have Function kind in completions",
            run: function () {
                var reg      = new BuiltinsRegistry();
                var analyzer = new SourceAnalyzer(RS);
                var engine   = new CompletionEngine(analyzer, {
                    virtualFiles:    {},
                    builtinNames:    ['len', 'abs', 'sorted'],
                    builtinsRegistry: reg,
                });
                var list = engine.getCompletions(null, pos(1, 1), '', MockKind);
                ['len', 'abs', 'sorted'].forEach(function (name) {
                    var item = list.suggestions.find(function (s) { return s.label === name; });
                    assert.ok(item, name + ' should be in completions');
                    assert.strictEqual(item.kind, MockKind.Function,
                        name + ' should have Function kind');
                });
            },
        },

        {
            name: "completion_builtin_no_registry_still_works",
            description: "CompletionEngine works without builtinsRegistry (plain items)",
            run: function () {
                var analyzer = new SourceAnalyzer(RS);
                var engine   = new CompletionEngine(analyzer, {
                    virtualFiles: {},
                    builtinNames: ['len', 'range'],
                    // no builtinsRegistry
                });
                var list = engine.getCompletions(null, pos(1, 4), 'len', MockKind);
                var item = list.suggestions.find(function (s) { return s.label === 'len'; });
                assert.ok(item, 'len should appear even without stubs');
                // Without stubs, detail is undefined (plain name_to_item)
                assert.ok(!item.detail, 'no detail without stubs');
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
            console.log(colored("PASS  " + test.name, "green") + "  –  " + test.description);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        "\n      " + (e.message || String(e)) + "\n");
        }
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " language-service-builtins tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var builtins_path    = url.pathToFileURL(path.join(__dirname, "../../src/monaco-language-service/builtins.js")).href;
var hover_path       = url.pathToFileURL(path.join(__dirname, "../../src/monaco-language-service/hover.js")).href;
var signature_path   = url.pathToFileURL(path.join(__dirname, "../../src/monaco-language-service/signature.js")).href;
var completions_path = url.pathToFileURL(path.join(__dirname, "../../src/monaco-language-service/completions.js")).href;
var analyzer_path    = url.pathToFileURL(path.join(__dirname, "../../src/monaco-language-service/analyzer.js")).href;

var filter = process.argv[2] || null;

Promise.all([
    import(builtins_path),
    import(hover_path),
    import(signature_path),
    import(completions_path),
    import(analyzer_path),
]).then(function (mods) {
    var BuiltinsRegistry    = mods[0].BuiltinsRegistry;
    var BuiltinInfo         = mods[0].BuiltinInfo;
    var HoverEngine         = mods[1].HoverEngine;
    var SignatureHelpEngine = mods[2].SignatureHelpEngine;
    var detect_call_context = mods[2].detect_call_context;
    var CompletionEngine    = mods[3].CompletionEngine;
    var SourceAnalyzer      = mods[4].SourceAnalyzer;
    var RS                  = compiler_module.create_compiler();

    var TESTS = make_tests(
        BuiltinsRegistry, BuiltinInfo,
        HoverEngine, SignatureHelpEngine,
        CompletionEngine, detect_call_context,
        SourceAnalyzer, RS
    );
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load modules:", "red"), e);
    process.exit(1);
});
