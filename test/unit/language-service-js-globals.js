/*
 * test/unit/language-service-js-globals.js
 *
 * Tests for the built-in JS / browser API d.ts that ships with the
 * language service (src/monaco-language-service/js-globals-dts.js).
 *
 * Verifies:
 *   - navigator, window, document, console, Math, JSON, etc. are registered
 *     as DTS globals on a freshly-constructed service
 *   - dot-completion on navigator surfaces Navigator interface members
 *   - hover on navigator returns the declared type
 *   - identifier completion for navigator shows a richer item with type info
 *   - disableJsGlobals opts out
 *   - diagnostics don't flag any of the added globals as undefined
 *
 * Usage:
 *   node test/unit/language-service-js-globals.js              # run all
 *   node test/unit/language-service-js-globals.js <test-name>  # one test
 */
"use strict";

var assert          = require("assert");
var path            = require("path");
var url             = require("url");
var compiler_module = require("../../tools/compiler");
var utils           = require("../../tools/utils");
var colored         = utils.safe_colored;

// ---------------------------------------------------------------------------
// Mock Monaco
// ---------------------------------------------------------------------------

function make_mock_monaco() {
    return {
        MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
        languages: {
            getLanguages: function () { return []; },
            register: function () {},
            registerCompletionItemProvider: function () { return { dispose: function () {} }; },
            registerSignatureHelpProvider:  function () { return { dispose: function () {} }; },
            registerHoverProvider:          function () { return { dispose: function () {} }; },
            setMonarchTokensProvider:       function () {},
            setLanguageConfiguration:       function () {},
            CompletionItemKind: {
                Method: 0, Function: 1, Class: 5, Variable: 6,
                Module: 8, Interface: 7, Property: 9, Keyword: 17,
            },
        },
        editor: {
            getModels:          function () { return []; },
            setModelMarkers:    function () {},
            onDidCreateModel:   function () { return { dispose: function () {} }; },
            onWillDisposeModel: function () { return { dispose: function () {} }; },
        },
    };
}

function pos(line, col) { return { lineNumber: line, column: col }; }

function labels(list) {
    return list.suggestions.map(function (s) { return s.label; });
}

function find_item(list, label) {
    return list.suggestions.find(function (s) { return s.label === label; }) || null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function make_tests(registerRapydScript, RS) {

    function make_service(extra_opts) {
        var compiler = RS.web_repl ? RS.web_repl() : RS;
        return registerRapydScript(make_mock_monaco(), Object.assign({
            compiler: compiler,
        }, extra_opts || {}));
    }

    return [

        // ── Registration ─────────────────────────────────────────────────────

        {
            name: "navigator_registered_as_dts_global",
            description: "registerRapydScript auto-loads the JS globals d.ts so navigator is a known global",
            run: function () {
                var svc = make_service();
                var ti = svc._dts.getGlobal('navigator');
                assert.ok(ti, "navigator should be registered as a DTS global");
                assert.strictEqual(ti.kind, 'var');
                assert.strictEqual(ti.return_type, 'Navigator');
            },
        },

        {
            name: "navigator_interface_registered",
            description: "The Navigator interface is registered alongside the navigator var",
            run: function () {
                var svc = make_service();
                var nav_iface = svc._dts.getGlobal('Navigator');
                assert.ok(nav_iface, "Navigator interface should be registered");
                assert.strictEqual(nav_iface.kind, 'interface');
                assert.ok(nav_iface.members, "Navigator interface should have parsed members");
                assert.ok(nav_iface.members.has('userAgent'),  "Navigator.userAgent should be a member");
                assert.ok(nav_iface.members.has('language'),   "Navigator.language should be a member");
                assert.ok(nav_iface.members.has('clipboard'),  "Navigator.clipboard should be a member");
                assert.ok(nav_iface.members.has('sendBeacon'), "Navigator.sendBeacon should be a member");
            },
        },

        {
            name: "all_major_globals_registered",
            description: "All major JS/browser globals are registered after auto-load",
            run: function () {
                var svc = make_service();
                var EXPECTED = [
                    'navigator', 'window', 'document', 'console',
                    'location', 'history', 'screen',
                    'localStorage', 'sessionStorage',
                    'Math', 'JSON', 'Object', 'Array', 'Number',
                    'Promise', 'Date', 'Symbol', 'Reflect',
                    'Map', 'Set', 'WeakMap', 'WeakSet',
                    'performance', 'crypto', 'URL', 'globalThis',
                    'fetch', 'btoa', 'atob',
                    'requestAnimationFrame', 'queueMicrotask', 'structuredClone',
                ];
                var missing = EXPECTED.filter(function (n) { return !svc._dts.getGlobal(n); });
                assert.deepStrictEqual(missing, [],
                    "Expected all globals to be registered; missing: " + JSON.stringify(missing));
            },
        },

        // ── Opt-out ──────────────────────────────────────────────────────────

        {
            name: "disable_js_globals_opt_out",
            description: "disableJsGlobals: true prevents auto-loading the built-in d.ts",
            run: function () {
                var svc = make_service({ disableJsGlobals: true });
                assert.strictEqual(svc._dts.getGlobal('navigator'), null,
                    "navigator should NOT be registered when disableJsGlobals is true");
                assert.strictEqual(svc._dts.getGlobal('localStorage'), null,
                    "localStorage should NOT be registered when disableJsGlobals is true");
            },
        },

        // ── Dot completion ───────────────────────────────────────────────────

        {
            name: "navigator_dot_completion",
            description: "navigator.<dot> shows Navigator interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 11), "navigator.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['userAgent', 'language', 'languages', 'platform',
                 'onLine', 'clipboard', 'geolocation', 'sendBeacon']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in navigator.* completions; got " + JSON.stringify(names));
                    });
            },
        },

        {
            name: "navigator_dot_prefix_filter",
            description: "navigator.cli filters dot-completions by prefix",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 14), "navigator.cli",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                assert.ok(names.indexOf('clipboard') !== -1, "clipboard should match prefix 'cli'");
                assert.ok(names.indexOf('userAgent') === -1, "userAgent should NOT match prefix 'cli'");
            },
        },

        {
            name: "navigator_clipboard_chain_dot_completion",
            description: "navigator.clipboard.<dot> walks the Clipboard interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 21), "navigator.clipboard.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['readText', 'writeText'].forEach(function (m) {
                    assert.ok(names.indexOf(m) !== -1,
                        "Expected '" + m + "' in navigator.clipboard.* completions; got " + JSON.stringify(names));
                });
            },
        },

        {
            name: "document_dot_completion",
            description: "document.<dot> shows Document interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 10), "document.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['getElementById', 'querySelector', 'createElement', 'body', 'title']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in document.* completions; got " + JSON.stringify(names));
                    });
            },
        },

        {
            name: "window_dot_completion",
            description: "window.<dot> shows Window interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 8), "window.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['alert', 'confirm', 'innerWidth', 'innerHeight',
                 'localStorage', 'scrollTo', 'requestAnimationFrame']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in window.* completions; got " + JSON.stringify(names));
                    });
            },
        },

        {
            name: "localStorage_dot_completion",
            description: "localStorage.<dot> shows Storage interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 14), "localStorage.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['getItem', 'setItem', 'removeItem', 'clear', 'length']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in localStorage.* completions");
                    });
            },
        },

        {
            name: "console_dot_completion",
            description: "console.<dot> shows Console interface members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 9), "console.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['log', 'info', 'warn', 'error', 'debug', 'table', 'time', 'group']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in console.* completions");
                    });
            },
        },

        {
            name: "math_namespace_dot_completion",
            description: "Math.<dot> shows the parsed namespace members",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 6), "Math.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['PI', 'E', 'abs', 'floor', 'ceil', 'sqrt', 'pow', 'max', 'min', 'random']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in Math.* completions");
                    });
            },
        },

        {
            name: "json_namespace_dot_completion",
            description: "JSON.<dot> shows parse and stringify",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 6), "JSON.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                assert.ok(names.indexOf('parse')     !== -1, "JSON.parse should appear");
                assert.ok(names.indexOf('stringify') !== -1, "JSON.stringify should appear");
            },
        },

        {
            name: "object_dot_completion",
            description: "Object.<dot> shows the ObjectConstructor static helpers",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 8), "Object.",
                    svc._monaco.languages.CompletionItemKind
                );
                var names = labels(list);
                ['keys', 'values', 'entries', 'assign', 'freeze', 'create']
                    .forEach(function (m) {
                        assert.ok(names.indexOf(m) !== -1,
                            "Expected '" + m + "' in Object.* completions");
                    });
            },
        },

        // ── Hover ────────────────────────────────────────────────────────────

        {
            name: "navigator_hover",
            description: "Hover on navigator returns the var declaration markdown",
            run: function () {
                var svc = make_service();
                var hov = svc._hover.getHover(null, pos(1, 5), 'navigator', '');
                assert.ok(hov, "Hover should not be null");
                var md = hov.contents[0].value;
                assert.ok(md.indexOf('navigator') !== -1, "Hover should mention navigator: " + md);
                assert.ok(md.indexOf('Navigator') !== -1, "Hover should mention the Navigator type: " + md);
            },
        },

        {
            name: "navigator_member_hover",
            description: "Hover on userAgent in 'navigator.userAgent' shows the member's docstring",
            run: function () {
                var svc = make_service();
                var hov = svc._hover.getHover(null, pos(1, 15), 'userAgent', 'navigator.');
                assert.ok(hov, "Hover should not be null");
                var md = hov.contents[0].value;
                assert.ok(md.indexOf('userAgent') !== -1, "Hover should mention userAgent");
                assert.ok(md.toLowerCase().indexOf('user agent') !== -1,
                    "Hover should mention the documented description; got: " + md);
            },
        },

        // ── Identifier completion with DTS detail ────────────────────────────

        {
            name: "navigator_identifier_completion_has_type_detail",
            description: "Top-level identifier completion for navigator includes the DTS type in detail",
            run: function () {
                var svc = make_service();
                var list = svc._completions.getCompletions(
                    null, pos(1, 4), "nav",
                    svc._monaco.languages.CompletionItemKind
                );
                var item = find_item(list, 'navigator');
                assert.ok(item, "navigator should appear in identifier completions; got " + JSON.stringify(labels(list)));
                assert.strictEqual(item.detail, 'Navigator',
                    "navigator item should have detail 'Navigator'; got " + JSON.stringify(item.detail));
                assert.ok(item.documentation && item.documentation.indexOf('Navigator') !== -1,
                    "navigator item should have the JSDoc docstring; got " + JSON.stringify(item.documentation));
            },
        },

        // ── Diagnostics ──────────────────────────────────────────────────────

        {
            name: "diagnostics_no_undef_for_navigator",
            description: "Using navigator does not produce an 'undefined symbol' diagnostic",
            run: function () {
                var svc = make_service();
                var markers = svc._diagnostics.check(
                    "ua = navigator.userAgent\n",
                    { virtualFiles: {}, stdlibFiles: {}, markerSeverity: svc._monaco.MarkerSeverity }
                );
                var undef_navigator = markers.filter(function (m) {
                    return m.message && m.message.indexOf('"navigator"') !== -1;
                });
                assert.strictEqual(undef_navigator.length, 0,
                    "Expected no 'undefined navigator' marker; got " + JSON.stringify(undef_navigator));
            },
        },

        {
            name: "diagnostics_no_undef_for_localStorage_and_fetch",
            description: "localStorage and fetch are recognized as globals (no undef warnings)",
            run: function () {
                var svc = make_service();
                var src = "v = localStorage.getItem('k')\nfetch('https://example.com')\n";
                var markers = svc._diagnostics.check(src, {
                    virtualFiles: {}, stdlibFiles: {}, markerSeverity: svc._monaco.MarkerSeverity,
                });
                var bad = markers.filter(function (m) {
                    return m.message && (
                        m.message.indexOf('"localStorage"') !== -1 ||
                        m.message.indexOf('"fetch"') !== -1
                    );
                });
                assert.strictEqual(bad.length, 0,
                    "Expected no undef markers for localStorage / fetch; got " + JSON.stringify(bad));
            },
        },

        {
            name: "disable_js_globals_navigator_is_undef",
            description: "With disableJsGlobals, navigator falls back to BASE_BUILTINS (no entry → undef)",
            run: function () {
                var svc = make_service({ disableJsGlobals: true });
                var markers = svc._diagnostics.check(
                    "ua = navigator.userAgent\n",
                    { virtualFiles: {}, stdlibFiles: {}, markerSeverity: svc._monaco.MarkerSeverity }
                );
                var undef_navigator = markers.filter(function (m) {
                    return m.message && m.message.indexOf('"navigator"') !== -1;
                });
                assert.ok(undef_navigator.length > 0,
                    "Expected an 'undefined navigator' marker when disableJsGlobals is true");
            },
        },

    ];
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

function run_tests(tests, filter) {
    if (filter) tests = tests.filter(function (t) { return t.name === filter; });
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
            var msg = e.message || String(e);
            console.log(colored("FAIL  " + test.name, "red") + "\n      " + msg + "\n");
        }
    });
    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " language-service-js-globals tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var index_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/index.js")
).href;

var filter = process.argv[2] || null;

import(index_path).then(function (mod) {
    var registerRapydScript = mod.registerRapydScript;
    var RS = compiler_module.create_compiler();
    var TESTS = make_tests(registerRapydScript, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load index module:", "red"), e);
    process.exit(1);
});
