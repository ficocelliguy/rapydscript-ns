/*
 * test/unit/language-service-index.js
 *
 * Tests for src/monaco-language-service/index.js (RapydScriptLanguageService).
 * Focuses on the automatic virtualFiles population from open Monaco models,
 * which enables cross-file return-type inference without explicit setVirtualFiles calls.
 *
 * Usage:
 *   node test/unit/language-service-index.js              # run all tests
 *   node test/unit/language-service-index.js <test-name>  # run a single test
 */
"use strict";

var assert          = require("assert");
var path            = require("path");
var url             = require("url");
var fs              = require("fs");
var compiler_module = require("../../tools/compiler");
var utils           = require("../../tools/utils");
var colored         = utils.safe_colored;

// ---------------------------------------------------------------------------
// Mock Monaco helpers
// ---------------------------------------------------------------------------

/**
 * Create a minimal mock Monaco environment.
 * initial_models: models that exist before registerRapydScript is called.
 */
function make_mock_monaco(initial_models) {
    var models = (initial_models || []).slice();
    var create_listeners  = [];
    var dispose_listeners = [];

    var mock = {
        MarkerSeverity: { Error: 8, Warning: 4, Info: 2, Hint: 1 },
        languages: {
            getLanguages: function() { return []; },
            register: function() {},
            registerCompletionItemProvider: function() { return { dispose: function() {} }; },
            registerSignatureHelpProvider:  function() { return { dispose: function() {} }; },
            registerHoverProvider:          function() { return { dispose: function() {} }; },
            setMonarchTokensProvider:       function() {},
            setLanguageConfiguration:       function() {},
            CompletionItemKind: { Function: 1, Variable: 6, Class: 5, Module: 8, Keyword: 17, Method: 0 },
        },
        editor: {
            getModels:          function() { return models.slice(); },
            setModelMarkers:    function() {},
            onDidCreateModel:   function(cb) { create_listeners.push(cb);  return { dispose: function() {} }; },
            onWillDisposeModel: function(cb) { dispose_listeners.push(cb); return { dispose: function() {} }; },
        },
        // Test helpers — simulate adding/removing a model after service creation
        _addModel: function(model) {
            models.push(model);
            create_listeners.forEach(function(cb) { cb(model); });
        },
        _disposeModel: function(model) {
            models = models.filter(function(m) { return m !== model; });
            dispose_listeners.forEach(function(cb) { cb(model); });
        },
    };
    return mock;
}

/**
 * Create a minimal mock Monaco TextModel.
 * @param {string}  code     - source content
 * @param {string}  uri_path - the path portion of the URI (e.g. '/scripts/utils.py')
 * @param {string}  [lang]   - language id (default: 'rapydscript')
 */
function make_model(code, uri_path, lang) {
    lang = lang || 'rapydscript';
    var listeners = [];
    var current_code = code;
    return {
        getLanguageId:      function()    { return lang; },
        getValue:           function()    { return current_code; },
        uri:                { path: uri_path || '/unnamed.py' },
        onDidChangeContent: function(cb)  { listeners.push(cb); return { dispose: function() {} }; },
        // Test helper — simulate an edit
        _setContent: function(new_code) {
            current_code = new_code;
            listeners.forEach(function(cb) { cb({ changes: [] }); });
        },
    };
}

/** Wait for all pending setTimeout(fn, 0) callbacks to fire. */
function flush(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms || 20); });
}

// ---------------------------------------------------------------------------
// Test definitions  (each test returns a Promise or is sync)
// ---------------------------------------------------------------------------

function make_tests(registerRapydScript, RS) {

    var builtins_src = fs.readFileSync(
        path.join(__dirname, '../../dev/baselib-plain-pretty.js'), 'utf-8'
    );

    function make_service(models, extra_opts) {
        var compiler = RS.web_repl ? RS.web_repl() : RS;
        var monaco = make_mock_monaco(models);
        var svc = registerRapydScript(monaco, Object.assign({
            compiler: compiler,
        }, extra_opts || {}));
        return { svc: svc, monaco: monaco };
    }

    var TESTS = [

        // ── Module name derivation ────────────────────────────────────────

        {
            name: "module_name_from_uri_path",
            description: "ModelState derives a path-aware module name (preserves subdirs, strips extension)",
            run_async: function() {
                var utils_model = make_model("def foo():\n    return []\n", "/scripts/utils.py");
                var env = make_service([utils_model]);
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'scripts/utils'),
                        "Expected 'scripts/utils' in _virtualFiles after model _run(); got keys: " +
                        JSON.stringify(Object.keys(env.svc._virtualFiles))
                    );
                    assert.strictEqual(
                        env.svc._virtualFiles['scripts/utils'],
                        "def foo():\n    return []\n",
                        "virtualFiles['scripts/utils'] should contain the model source"
                    );
                });
            },
        },

        {
            name: "module_name_pyj_extension",
            description: "ModelState also handles .pyj extensions",
            run_async: function() {
                var model = make_model("x = 1\n", "/lib/helpers.pyj");
                var env = make_service([model]);
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'lib/helpers'),
                        "Expected 'lib/helpers' in _virtualFiles for .pyj model"
                    );
                });
            },
        },

        {
            name: "module_name_root_level_path",
            description: "Root-level URIs (e.g. /utils.py) still map to a bare module name",
            run_async: function() {
                var model = make_model("x = 1\n", "/utils.py");
                var env = make_service([model]);
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils'),
                        "Root-level /utils.py should map to key 'utils'; got keys: " +
                        JSON.stringify(Object.keys(env.svc._virtualFiles))
                    );
                });
            },
        },

        {
            name: "module_name_same_basename_no_collision",
            description: "Two open models with the same basename in different dirs don't clobber each other",
            run_async: function() {
                var a = make_model("A = 1\n", "/scripts/utils/math.pyj");
                var b = make_model("B = 2\n", "/scripts/servers/math.pyj");
                var env = make_service([a, b]);
                return flush().then(function() {
                    assert.strictEqual(env.svc._virtualFiles['scripts/utils/math'],   "A = 1\n");
                    assert.strictEqual(env.svc._virtualFiles['scripts/servers/math'], "B = 2\n");
                });
            },
        },

        {
            name: "module_name_custom_derivation",
            description: "options.moduleNameFromUri overrides the default (e.g. strip a 'home/' prefix)",
            run_async: function() {
                var model = make_model("x = 1\n", "/home/utils/math.pyj");
                var env   = make_service([model], {
                    moduleNameFromUri: function(uri) {
                        var p = (uri && uri.path) || '';
                        // Strip leading '/', 'home/' prefix, and the extension.
                        return p.replace(/^\/+/, '')
                                .replace(/^home\//, '')
                                .replace(/\.(?:pyj?x?)$/, '') || null;
                    },
                });
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils/math'),
                        "Custom callback should map /home/utils/math.pyj to 'utils/math'; got keys: " +
                        JSON.stringify(Object.keys(env.svc._virtualFiles))
                    );
                });
            },
        },

        {
            name: "module_name_custom_derivation_returns_null_skips_registration",
            description: "Returning null from the custom callback skips registering the model in _virtualFiles",
            run_async: function() {
                var model = make_model("x = 1\n", "/scratch/temp.pyj");
                var env   = make_service([model], {
                    moduleNameFromUri: function(uri) {
                        var p = (uri && uri.path) || '';
                        if (p.indexOf('/scratch/') === 0) return null;
                        return p.replace(/^\/+/, '').replace(/\.(?:pyj?x?)$/, '') || null;
                    },
                });
                return flush().then(function() {
                    assert.strictEqual(
                        Object.keys(env.svc._virtualFiles).length, 0,
                        "Expected _virtualFiles to be empty when callback returns null; got keys: " +
                        JSON.stringify(Object.keys(env.svc._virtualFiles))
                    );
                });
            },
        },

        // ── Auto-population on model attach ───────────────────────────────

        {
            name: "virtual_files_populated_on_attach",
            description: "Opening a second model after service creation populates _virtualFiles",
            run_async: function() {
                var main_model  = make_model("from utils import get_items\n", "/main.py");
                var utils_model = make_model("def get_items():\n    return []\n", "/utils.py");
                var env = make_service([main_model]);
                // utils.py is opened after initial service creation
                env.monaco._addModel(utils_model);
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils'),
                        "Expected 'utils' in _virtualFiles after model added dynamically; got keys: " +
                        JSON.stringify(Object.keys(env.svc._virtualFiles))
                    );
                });
            },
        },

        // ── Cleanup on model detach ───────────────────────────────────────

        {
            name: "virtual_files_cleaned_on_detach",
            description: "Closing a model removes its entry from _virtualFiles",
            run_async: function() {
                var utils_model = make_model("def get_items():\n    return []\n", "/utils.py");
                var env = make_service([utils_model]);
                return flush().then(function() {
                    assert.ok(
                        Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils'),
                        "Pre-condition: 'utils' should be in _virtualFiles before detach"
                    );
                    env.monaco._disposeModel(utils_model);
                    assert.ok(
                        !Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils'),
                        "Expected 'utils' to be removed from _virtualFiles after model detach"
                    );
                });
            },
        },

        // ── Content updates ───────────────────────────────────────────────

        {
            name: "virtual_files_updated_on_content_change",
            description: "Editing a model updates its entry in _virtualFiles",
            run_async: function() {
                var model = make_model("def get_items():\n    return []\n", "/utils.py");
                // Use parseDelay:0 so the re-run fires immediately after content change.
                var env   = make_service([model], { parseDelay: 0 });
                return flush().then(function() {
                    model._setContent("def get_items():\n    return {}\n");
                    return flush(20);
                }).then(function() {
                    assert.strictEqual(
                        env.svc._virtualFiles['utils'],
                        "def get_items():\n    return {}\n",
                        "_virtualFiles['utils'] should reflect the updated content"
                    );
                });
            },
        },

        // ── clearVirtualFiles ────────────────────────────────────────────

        {
            name: "clear_virtual_files_removes_manually_set_files",
            description: "clearVirtualFiles wipes entries added via setVirtualFiles",
            run_async: function() {
                var env = make_service([]);
                env.svc.setVirtualFiles({ mymod: "def foo():\n    return 1\n" });
                assert.strictEqual(
                    env.svc._virtualFiles['mymod'],
                    "def foo():\n    return 1\n",
                    "Pre-condition: 'mymod' should be present after setVirtualFiles"
                );
                env.svc.clearVirtualFiles();
                assert.ok(
                    !Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'mymod'),
                    "'mymod' should be removed after clearVirtualFiles; got keys: " +
                    JSON.stringify(Object.keys(env.svc._virtualFiles))
                );
                return Promise.resolve();
            },
        },

        {
            name: "clear_virtual_files_shares_reference_with_completions",
            description: "clearVirtualFiles keeps service._virtualFiles and completions._virtualFiles pointing at the same object (regression test — cross-file completions used to break silently after clear)",
            run_async: function() {
                var utils_model = make_model("def get_items():\n    return []\n", "/utils.py");
                var env = make_service([utils_model]);
                return flush().then(function() {
                    assert.strictEqual(
                        env.svc._virtualFiles, env.svc._completions._virtualFiles,
                        "Pre-condition: service and completions must share the same _virtualFiles reference"
                    );

                    env.svc.clearVirtualFiles();

                    // Immediately after the clear (before the async _run fires),
                    // the completions engine must still reference the same object.
                    assert.strictEqual(
                        env.svc._virtualFiles, env.svc._completions._virtualFiles,
                        "After clearVirtualFiles, service and completions must still share the same reference"
                    );

                    return flush();
                }).then(function() {
                    // The auto re-run has fired; the model re-registers itself
                    // into service._virtualFiles. Because completions shares the
                    // reference, it must see the same content — this is exactly
                    // what breaks when clearVirtualFiles hands the two sides
                    // different empty objects.
                    assert.strictEqual(
                        env.svc._virtualFiles['utils'],
                        "def get_items():\n    return []\n",
                        "Model should re-register itself in _virtualFiles after the scheduled re-run"
                    );
                    assert.strictEqual(
                        env.svc._completions._virtualFiles['utils'],
                        "def get_items():\n    return []\n",
                        "Completions engine must observe the re-registered model content via the shared reference"
                    );
                    assert.strictEqual(
                        env.svc._virtualFiles, env.svc._completions._virtualFiles,
                        "Post-run: service and completions must still share the same reference"
                    );
                });
            },
        },

        {
            name: "clear_virtual_files_reregisters_open_models",
            description: "clearVirtualFiles triggers a re-run of every attached model so their content is re-added",
            run_async: function() {
                var utils_model = make_model("def get_items():\n    return []\n", "/utils.py");
                var env = make_service([utils_model]);
                return flush().then(function() {
                    env.svc.setVirtualFiles({ scratch: "x = 1\n" });
                    assert.ok(
                        env.svc._virtualFiles['scratch'],
                        "Pre-condition: 'scratch' should be set via setVirtualFiles"
                    );
                    assert.ok(
                        env.svc._virtualFiles['utils'],
                        "Pre-condition: 'utils' should be auto-registered from the open model"
                    );

                    env.svc.clearVirtualFiles();
                    // Both entries are gone synchronously; the model re-registration
                    // is scheduled asynchronously via _schedule(0).
                    assert.ok(
                        !Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'scratch'),
                        "Manually-added 'scratch' should be gone immediately after clear"
                    );
                    assert.ok(
                        !Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'utils'),
                        "'utils' should be gone immediately after clear (before the async re-run)"
                    );

                    return flush();
                }).then(function() {
                    // After the async re-run, the open model has re-added itself,
                    // but the manually-added file stays gone.
                    assert.strictEqual(
                        env.svc._virtualFiles['utils'],
                        "def get_items():\n    return []\n",
                        "Open model should be re-registered after clearVirtualFiles triggers a re-run"
                    );
                    assert.ok(
                        !Object.prototype.hasOwnProperty.call(env.svc._virtualFiles, 'scratch'),
                        "Manually-added 'scratch' should remain gone after the async re-run"
                    );
                });
            },
        },

        // ── Cross-file inferred return type via auto-populated virtualFiles ─

        {
            name: "cross_file_inferred_return_type_list",
            description: "Importing from an open model resolves inferred return_type='list' for completions",
            run_async: function() {
                var builtins_mod = require(path.join(__dirname, '../../src/monaco-language-service/builtins.js'));
                var SourceAnalyzer  = require(url.fileURLToPath(url.pathToFileURL(
                    path.join(__dirname, '../../src/monaco-language-service/analyzer.js')
                ).href));

                var utils_model = make_model(
                    "def get_items():\n    return []\n",
                    "/utils.py"
                );
                var env = make_service([utils_model]);

                return flush().then(function() {
                    // _virtualFiles['utils'] should now be populated automatically
                    assert.ok(
                        env.svc._virtualFiles['utils'],
                        "Pre-condition: virtualFiles['utils'] must be set"
                    );

                    // Simulate the current file importing from utils
                    var CompletionEngine = require(url.fileURLToPath(url.pathToFileURL(
                        path.join(__dirname, '../../src/monaco-language-service/completions.js')
                    ).href));
                    var analyzer = new SourceAnalyzer.SourceAnalyzer(RS);
                    var engine   = new CompletionEngine.CompletionEngine(analyzer, {
                        virtualFiles:     env.svc._virtualFiles,
                        builtinNames:     ['print', 'len'],
                        builtinsRegistry: new builtins_mod.BuiltinsRegistry(),
                    });

                    var scopeMap = analyzer.analyze([
                        "from utils import get_items",
                        "items = get_items()",
                        "pass",
                    ].join("\n"), { virtualFiles: env.svc._virtualFiles });

                    // items. should suggest list members
                    var MockKind = { Function: 1, Variable: 6 };
                    var list = engine.getCompletions(scopeMap, { lineNumber: 3, column: 8 }, "items.", MockKind);
                    var labels = list.suggestions.map(function(s) { return s.label; });
                    assert.ok(labels.indexOf('append') !== -1,
                        "Expected 'append' in completions for items. (inferred list); got: " + JSON.stringify(labels));
                });
            },
        },

    ];

    return TESTS;
}

// ---------------------------------------------------------------------------
// Async-aware runner
// ---------------------------------------------------------------------------

function run_tests(TESTS, filter) {
    var tests = filter
        ? TESTS.filter(function(t) { return t.name === filter; })
        : TESTS;

    if (tests.length === 0) {
        console.error(colored("No test found: " + filter, "red"));
        process.exit(1);
    }

    var failures = [];

    function run_next(i) {
        if (i >= tests.length) {
            console.log("");
            if (failures.length) {
                console.log(colored(failures.length + " test(s) failed.", "red"));
                process.exit(1);
            } else {
                console.log(colored("All " + tests.length + " language-service-index tests passed!", "green"));
                process.exit(0);
            }
            return;
        }

        var test = tests[i];

        function on_pass() {
            console.log(colored("PASS  " + test.name, "green") + "  \u2013  " + test.description);
            run_next(i + 1);
        }
        function on_fail(e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        "\n      " + (e.message || String(e)) + "\n");
            run_next(i + 1);
        }

        if (typeof test.run_async === "function") {
            Promise.resolve().then(function() {
                return test.run_async();
            }).then(on_pass).catch(on_fail);
        } else {
            try {
                test.run();
                on_pass();
            } catch (e) {
                on_fail(e);
            }
        }
    }

    run_next(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var index_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/index.js")
).href;

var filter = process.argv[2] || null;

import(index_path).then(function(mod) {
    var registerRapydScript = mod.registerRapydScript;
    var RS = compiler_module.create_compiler();
    var TESTS = make_tests(registerRapydScript, RS);
    run_tests(TESTS, filter);
}).catch(function(e) {
    console.error(colored("Failed to load index module:", "red"), e);
    process.exit(1);
});
