/*
 * test/unit/language-service-completions.js
 *
 * Unit tests for src/monaco-language-service/completions.js (Phase 3).
 *
 * Usage:
 *   node test/unit/language-service-completions.js              # run all tests
 *   node test/unit/language-service-completions.js <test-name>  # run a single test by name
 */
"use strict";

var assert          = require("assert");
var path            = require("path");
var url             = require("url");
var compiler_module = require("../../tools/compiler");
var utils           = require("../../tools/utils");
var colored         = utils.safe_colored;

// ---------------------------------------------------------------------------
// Mock Monaco CompletionItemKind  (numeric values match Monaco's spec)
// ---------------------------------------------------------------------------

var MockKind = {
    Method:    0,
    Function:  1,
    Class:     5,
    Variable:  6,
    Module:    8,
};

// Mock Monaco position object
function pos(line, col) { return { lineNumber: line, column: col }; }

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Extract suggestion labels from a CompletionList */
function labels(list) {
    return list.suggestions.map(function (s) { return s.label; });
}

/** Assert that list.suggestions contains an item with the given label */
function assert_has(list, label, msg) {
    var found = list.suggestions.some(function (s) { return s.label === label; });
    assert.ok(found, (msg || "") + ": expected label '" + label + "' in " + JSON.stringify(labels(list)));
}

/** Assert that list.suggestions does NOT contain an item with the given label */
function assert_missing(list, label, msg) {
    var found = list.suggestions.some(function (s) { return s.label === label; });
    assert.ok(!found, (msg || "") + ": did not expect label '" + label + "' in " + JSON.stringify(labels(list)));
}

/** Find a suggestion by label, or null */
function find_item(list, label) {
    return list.suggestions.find(function (s) { return s.label === label; }) || null;
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

function make_tests(CompletionEngine, detect_context, SourceAnalyzer, DtsRegistry, RS) {

    function make_engine(virtual_files, extra_builtins, dts_registry, builtins_mod) {
        var analyzer = new SourceAnalyzer(RS);
        var builtins_registry = null;
        if (builtins_mod) {
            builtins_registry = new builtins_mod.BuiltinsRegistry();
        }
        return new CompletionEngine(analyzer, {
            virtualFiles:     virtual_files    || {},
            builtinNames:     extra_builtins   || ['print', 'len', 'range'],
            dtsRegistry:      dts_registry     || null,
            builtinsRegistry: builtins_registry,
        });
    }

    var TESTS = [

        // ── detect_context ────────────────────────────────────────────────

        {
            name: "ctx_identifier",
            description: "detect_context returns identifier type for plain word prefix",
            run: function () {
                var ctx = detect_context("pri");
                assert.strictEqual(ctx.type, 'identifier');
                assert.strictEqual(ctx.prefix, 'pri');
            },
        },

        {
            name: "ctx_dot",
            description: "detect_context returns dot type for 'obj.'",
            run: function () {
                var ctx = detect_context("my_obj.me");
                assert.strictEqual(ctx.type, 'dot');
                assert.strictEqual(ctx.objectName, 'my_obj');
                assert.strictEqual(ctx.prefix, 'me');
            },
        },

        {
            name: "ctx_dot_empty_prefix",
            description: "detect_context handles 'obj.' with no attribute prefix",
            run: function () {
                var ctx = detect_context("dog.");
                assert.strictEqual(ctx.type, 'dot');
                assert.strictEqual(ctx.objectName, 'dog');
                assert.strictEqual(ctx.prefix, '');
            },
        },

        {
            name: "ctx_from_import",
            description: "detect_context returns from_import for 'from mod import p'",
            run: function () {
                var ctx = detect_context("from mymod import fo");
                assert.strictEqual(ctx.type, 'from_import');
                assert.strictEqual(ctx.moduleName, 'mymod');
                assert.strictEqual(ctx.prefix, 'fo');
            },
        },

        {
            name: "ctx_import",
            description: "detect_context returns import for 'import p'",
            run: function () {
                var ctx = detect_context("import my");
                assert.strictEqual(ctx.type, 'import');
                assert.strictEqual(ctx.prefix, 'my');
            },
        },

        // ── Scope completions ─────────────────────────────────────────────

        {
            name: "scope_local_vars",
            description: "Local variable and function names appear in scope completions",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "my_var = 42",
                    "def my_func():",
                    "    return my_var",
                ].join("\n"), {});

                var list = engine.getCompletions(scopeMap, pos(3, 1), "", MockKind);
                assert_has(list, 'my_var',  'local variable');
                assert_has(list, 'my_func', 'function name');
            },
        },

        {
            name: "scope_prefix_filter",
            description: "Prefix filtering narrows results to matching symbols",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "alpha = 1",
                    "beta = 2",
                    "alpha_two = 3",
                ].join("\n"), {});

                var list = engine.getCompletions(scopeMap, pos(3, 4), "alp", MockKind);
                assert_has(list,    'alpha',     'alpha matches');
                assert_has(list,    'alpha_two', 'alpha_two matches');
                assert_missing(list,'beta',      'beta does not match alp');
            },
        },

        {
            name: "scope_builtins_included",
            description: "Built-in names appear in scope completions",
            run: function () {
                var engine = make_engine({}, ['print', 'len', 'range']);
                var scopeMap = new (require(path.join(__dirname, '../../src/monaco-language-service/scope.js')).ScopeMap)();
                var list = engine.getCompletions(scopeMap, pos(1, 1), "", MockKind);
                assert_has(list, 'print', 'print builtin');
                assert_has(list, 'len',   'len builtin');
            },
        },

        {
            name: "scope_sort_local_before_builtin",
            description: "Local variables sort before builtins",
            run: function () {
                var engine = make_engine({}, ['print']);
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze("x = 1\nprint(x)", {});

                var list = engine.getCompletions(scopeMap, pos(2, 1), "", MockKind);
                var x_item     = find_item(list, 'x');
                var print_item = find_item(list, 'print');
                assert.ok(x_item,     'x should be in list');
                assert.ok(print_item, 'print should be in list');
                // Module-level symbols start with '1_', builtins '2_'
                assert.ok(x_item.sortText < print_item.sortText,
                    'x should sort before print: ' + x_item.sortText + ' vs ' + print_item.sortText);
            },
        },

        {
            name: "scope_null_scopemap_safe",
            description: "getCompletions handles null ScopeMap without throwing",
            run: function () {
                var engine = make_engine();
                var list   = engine.getCompletions(null, pos(1, 1), "", MockKind);
                assert.ok(Array.isArray(list.suggestions), 'suggestions should be an array');
            },
        },

        // ── Item structure ────────────────────────────────────────────────

        {
            name: "item_range_set",
            description: "Completion items have a valid range covering the prefix",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze("my_var = 1", {});

                // Cursor at col 6, prefix 'my_va' (5 chars)
                var list = engine.getCompletions(scopeMap, pos(1, 6), "my_va", MockKind);
                var item = find_item(list, 'my_var');
                assert.ok(item, 'my_var should be in suggestions');
                assert.strictEqual(item.range.startColumn, 1, 'startColumn should be col - prefix.length');
                assert.strictEqual(item.range.endColumn,   6, 'endColumn should be col');
            },
        },

        {
            name: "item_function_detail",
            description: "Function completion items show parameter list in detail",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "def greet(name, *args):",
                    "    return name",
                ].join("\n"), {});

                var list = engine.getCompletions(scopeMap, pos(2, 1), "", MockKind);
                var item = find_item(list, 'greet');
                assert.ok(item, 'greet should be in list');
                assert.ok(item.detail.indexOf('name') !== -1, 'detail should include param name');
                assert.ok(item.detail.indexOf('*args') !== -1, 'detail should include *args');
            },
        },

        // ── Dot completions ───────────────────────────────────────────────

        {
            name: "dot_class_methods",
            description: "Dot completion on a class name returns its methods",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                // Source must parse cleanly — the "Dog." prefix is passed separately.
                // The extra line ensures the module scope extends past line 6.
                var scopeMap = analyzer.analyze([
                    "class Dog:",
                    "    def bark(self):",
                    "        return 'woof'",
                    "    def fetch(self):",
                    "        return 'ball'",
                    "result = Dog",
                    "pass",       // extra statement so col 1 of line 6 is inside module scope
                ].join("\n"), {});

                // Query at col 1 of line 6 — safely inside the module scope range
                var list = engine.getCompletions(scopeMap, pos(6, 1), "Dog.", MockKind);
                assert_has(list, 'bark',  'Dog.bark');
                assert_has(list, 'fetch', 'Dog.fetch');
            },
        },

        {
            name: "dot_instance_inferred_class",
            description: "Dot completion on x = ClassName() infers class members",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                // Source must parse cleanly — no trailing incomplete expression.
                var scopeMap = analyzer.analyze([
                    "class Cat:",
                    "    def meow(self):",
                    "        return 'mrrr'",
                    "my_cat = Cat()",
                    "x = my_cat",
                    "pass",       // extra statement so line 5 col 1 is inside module scope
                ].join("\n"), {});

                // Query at col 1 of line 5 — safely inside the module scope
                var list = engine.getCompletions(scopeMap, pos(5, 1), "my_cat.", MockKind);
                assert_has(list, 'meow', 'Cat.meow via inferred_class');
            },
        },

        {
            name: "dot_no_class_empty",
            description: "Dot completion on unknown object returns empty list",
            run: function () {
                var engine = make_engine();
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze("x = 1\ny = x\npass", {});

                // x is a plain variable with no inferred_class; query at col 1 of line 2
                var list = engine.getCompletions(scopeMap, pos(2, 1), "x.", MockKind);
                assert.strictEqual(list.suggestions.length, 0, 'unknown type → no dot suggestions');
            },
        },

        // ── from X import completions ─────────────────────────────────────

        {
            name: "from_import_lists_exports",
            description: "from X import shows top-level names from virtual file",
            run: function () {
                var vf = {
                    mymod: [
                        "def foo():",
                        "    return 1",
                        "def bar():",
                        "    return 2",
                        "BAZ = 42",
                    ].join("\n"),
                };
                var engine = make_engine(vf);
                var list = engine.getCompletions(null, pos(1, 22), "from mymod import ", MockKind);
                assert_has(list, 'foo', 'foo from virtual file');
                assert_has(list, 'bar', 'bar from virtual file');
                assert_has(list, 'BAZ', 'BAZ from virtual file');
            },
        },

        {
            name: "from_import_prefix_filter",
            description: "from X import with prefix filters results",
            run: function () {
                var vf = {
                    mymod: "def foo():\n    return 1\ndef far():\n    return 2\ndef bar():\n    return 3",
                };
                var engine = make_engine(vf);
                var list = engine.getCompletions(null, pos(1, 23), "from mymod import f", MockKind);
                assert_has(list,    'foo', 'foo matches f');
                assert_has(list,    'far', 'far matches f');
                assert_missing(list,'bar', 'bar does not match f');
            },
        },

        {
            name: "from_import_unknown_module",
            description: "from X import for unknown module returns empty list",
            run: function () {
                var engine = make_engine({});
                var list = engine.getCompletions(null, pos(1, 25), "from unknown_mod import ", MockKind);
                assert.strictEqual(list.suggestions.length, 0, 'unknown module → empty suggestions');
            },
        },

        // ── import module name completions ────────────────────────────────

        {
            name: "import_module_names",
            description: "import shows available virtual module names",
            run: function () {
                var vf = { mymod: "x = 1", othermod: "y = 2" };
                var engine = make_engine(vf);
                var list = engine.getCompletions(null, pos(1, 7), "import ", MockKind);
                assert_has(list, 'mymod',    'mymod in import suggestions');
                assert_has(list, 'othermod', 'othermod in import suggestions');
            },
        },

        {
            name: "import_prefix_filter",
            description: "import with prefix filters module names",
            run: function () {
                var vf = { mymod: "x = 1", othermod: "y = 2" };
                var engine = make_engine(vf);
                var list = engine.getCompletions(null, pos(1, 9), "import my", MockKind);
                assert_has(list,    'mymod',    'mymod matches "my"');
                assert_missing(list,'othermod', 'othermod does not match "my"');
            },
        },

        // ── DTS dot completions ───────────────────────────────────────────

        {
            name: "dot_dts_namespace_members",
            description: "Dot completion on a DTS namespace returns its members",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "declare namespace Math {",
                    "    function abs(x: number): number;",
                    "    function sqrt(x: number): number;",
                    "    const PI: number;",
                    "}",
                ].join("\n"));
                var engine = make_engine({}, [], reg);
                // null scopeMap — Math is a pure DTS global
                var list = engine.getCompletions(null, pos(1, 5), "Math.", MockKind);
                assert_has(list, 'abs',  'Math.abs from DTS');
                assert_has(list, 'sqrt', 'Math.sqrt from DTS');
                assert_has(list, 'PI',   'Math.PI from DTS');
            },
        },

        {
            name: "dot_dts_interface_members",
            description: "Dot completion on a DTS interface returns its members",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "interface Console {",
                    "    log(...data: any[]): void;",
                    "    error(message?: any): void;",
                    "    warn(message?: any): void;",
                    "}",
                    "declare var console: Console;",
                ].join("\n"));
                var engine = make_engine({}, [], reg);
                var list = engine.getCompletions(null, pos(1, 8), "console.", MockKind);
                assert_has(list, 'log',   'console.log from DTS');
                assert_has(list, 'error', 'console.error from DTS');
                assert_has(list, 'warn',  'console.warn from DTS');
            },
        },

        {
            name: "dot_dts_prefix_filter",
            description: "DTS dot completion respects prefix filter",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "declare namespace Math {",
                    "    function abs(x: number): number;",
                    "    function sqrt(x: number): number;",
                    "    function sin(x: number): number;",
                    "}",
                ].join("\n"));
                var engine = make_engine({}, [], reg);
                var list = engine.getCompletions(null, pos(1, 6), "Math.s", MockKind);
                assert_has(list,    'sqrt', 'sqrt matches s');
                assert_has(list,    'sin',  'sin matches s');
                assert_missing(list,'abs',  'abs does not match s');
            },
        },

        {
            name: "dot_dts_method_item_structure",
            description: "DTS method completion item has method kind and detail",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "declare namespace JSON {",
                    "    function stringify(value: any): string;",
                    "}",
                ].join("\n"));
                var engine = make_engine({}, [], reg);
                var list = engine.getCompletions(null, pos(1, 5), "JSON.", MockKind);
                var item = find_item(list, 'stringify');
                assert.ok(item, 'stringify should be in suggestions');
                assert.strictEqual(item.kind, MockKind.Method, 'should have Method kind');
            },
        },

        {
            name: "dot_dts_no_registry",
            description: "Dot completion without DTS registry still works (empty for unknown)",
            run: function () {
                var engine = make_engine({}, [], null);
                var list = engine.getCompletions(null, pos(1, 5), "Math.", MockKind);
                assert.strictEqual(list.suggestions.length, 0,
                    'no DTS registry → no Math members');
            },
        },

        // ── Built-in type dot completions ─────────────────────────────────

        {
            name: "dot_list_literal_members",
            description: "Dot completion on myArr = [] shows list members (length, append, push…)",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "myArr = []",
                    "pass",
                ].join("\n"), {});

                // Query on line 2 — position-based lookup finds myArr in module scope
                var list = engine.getCompletions(scopeMap, pos(2, 1), "myArr.", MockKind);
                assert_has(list, 'length', 'list.length property');
                assert_has(list, 'append', 'list.append method');
                assert_has(list, 'push',   'list.push method');
                assert_has(list, 'map',    'list.map method');
                assert_has(list, 'filter', 'list.filter method');
            },
        },

        {
            name: "dot_str_literal_members",
            description: "Dot completion on myStr = 'x' shows str members (length, upper, split…)",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "myStr = 'hello'",
                    "pass",
                ].join("\n"), {});

                var list = engine.getCompletions(scopeMap, pos(2, 1), "myStr.", MockKind);
                assert_has(list, 'length',      'str.length property');
                assert_has(list, 'upper',        'str.upper method');
                assert_has(list, 'split',        'str.split method');
                assert_has(list, 'startswith',   'str.startswith method');
            },
        },

        {
            name: "dot_dict_literal_members",
            description: "Dot completion on myObj = {} shows dict members (keys, values, get…)",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "myObj = {}",
                    "pass",
                ].join("\n"), {});

                var list = engine.getCompletions(scopeMap, pos(2, 1), "myObj.", MockKind);
                assert_has(list, 'keys',   'dict.keys method');
                assert_has(list, 'values', 'dict.values method');
                assert_has(list, 'get',    'dict.get method');
                assert_has(list, 'update', 'dict.update method');
            },
        },

        {
            name: "dot_builtin_type_prefix_filter",
            description: "Prefix filter narrows built-in type members (myArr.le → length only)",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze("myArr = []\npass", {});

                var list = engine.getCompletions(scopeMap, pos(2, 3), "myArr.le", MockKind);
                assert_has(list,    'length',  'length matches le');
                assert_missing(list,'append',  'append does not match le');
                assert_missing(list,'push',    'push does not match le');
            },
        },

        {
            name: "dot_builtin_type_wins_over_dts",
            description: "Built-in type members take precedence over DTS when inferred_class is set",
            run: function () {
                // DTS has a 'myArr' namespace; but myArr is a list literal so type members win
                var reg = new DtsRegistry();
                reg.addDts("lib", "declare namespace myArr { function dts_only(): void; }");
                var engine = make_engine({}, [], reg,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze("myArr = []\npass", {});

                var list = engine.getCompletions(scopeMap, pos(2, 1), "myArr.", MockKind);
                assert_has(list,    'length',   'list.length present');
                assert_missing(list,'dts_only', 'DTS member absent when inferred_class matches');
            },
        },

        // ── Function-local variable dot completions (scope fallback) ──────

        {
            name: "dot_function_local_list",
            description: "Dot completion on function-local myArr = [] shows list members",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                // Parse includes the dot-access line so the function range covers it.
                var scopeMap = analyzer.analyze([
                    "def main():",
                    "    myArr = []",
                    "    x = myArr",
                ].join("\n"), {});

                // Query on line 3 (inside the function) — the function scope must be found
                var list = engine.getCompletions(scopeMap, pos(3, 5), "myArr.", MockKind);
                assert_has(list, 'length', 'list.length in function scope');
                assert_has(list, 'append', 'list.append in function scope');
                assert_has(list, 'push',   'list.push in function scope');
            },
        },

        {
            name: "dot_function_local_scope_fallback",
            description: "Dot completion works when cursor is past the last parsed scope boundary",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                // Simulate the debounce scenario: the scopeMap was built from code that
                // ends at line 2, but completions are requested at line 3 (new line).
                var scopeMap = analyzer.analyze([
                    "def main():",
                    "    myArr = []",
                ].join("\n"), {});

                // Line 3 col 7 is past the end of any parsed scope range.
                // The fallback all-frames search must still find myArr.
                var list = engine.getCompletions(scopeMap, pos(3, 7), "myArr.", MockKind);
                assert_has(list, 'length', 'list.length via scope fallback');
                assert_has(list, 'append', 'list.append via scope fallback');
            },
        },

        {
            name: "dot_function_local_str_fallback",
            description: "Scope fallback finds str type for function-local string variable",
            run: function () {
                var engine = make_engine({}, [], null,
                    require(path.join(__dirname, '../../src/monaco-language-service/builtins.js')));
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "async def main():",
                    "    myStr = 'hello'",
                ].join("\n"), {});

                // Cursor past end of parsed scopes
                var list = engine.getCompletions(scopeMap, pos(3, 7), "myStr.", MockKind);
                assert_has(list, 'length', 'str.length via scope fallback');
                assert_has(list, 'upper',  'str.upper via scope fallback');
                assert_has(list, 'split',  'str.split via scope fallback');
            },
        },

        {
            name: "dot_scopemap_wins_over_dts",
            description: "ScopeMap class members take precedence over DTS for same name",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "declare namespace MyClass {",
                    "    function dts_only(): void;",
                    "}",
                ].join("\n"));
                var engine = make_engine({}, [], reg);
                var analyzer = new SourceAnalyzer(RS);
                var scopeMap = analyzer.analyze([
                    "class MyClass:",
                    "    def user_method(self):",
                    "        return 1",
                    "x = MyClass",
                    "pass",
                ].join("\n"), {});
                // Query at line 5 (pass) — MyClass is in module scope
                var list = engine.getCompletions(scopeMap, pos(5, 1), "MyClass.", MockKind);
                assert_has(list,    'user_method', 'ScopeMap method present');
                assert_missing(list,'dts_only',    'DTS member absent when ScopeMap matches');
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
        console.log(colored("All " + tests.length + " language-service-completions tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var completions_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/completions.js")
).href;

var analyzer_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/analyzer.js")
).href;

var dts_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/dts.js")
).href;

var filter = process.argv[2] || null;

Promise.all([
    import(completions_path),
    import(analyzer_path),
    import(dts_path),
]).then(function (mods) {
    var CompletionEngine = mods[0].CompletionEngine;
    var detect_context   = mods[0].detect_context;
    var SourceAnalyzer   = mods[1].SourceAnalyzer;
    var DtsRegistry      = mods[2].DtsRegistry;
    var RS               = compiler_module.create_compiler();
    var TESTS            = make_tests(CompletionEngine, detect_context, SourceAnalyzer, DtsRegistry, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load completions module:", "red"), e);
    process.exit(1);
});
