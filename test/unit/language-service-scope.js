/*
 * test/unit/language-service-scope.js
 *
 * Unit tests for Phase 2: src/monaco-language-service/analyzer.js
 * (ScopeBuilder + SourceAnalyzer + ScopeMap queries)
 *
 * Usage:
 *   node test/unit/language-service-scope.js              # all tests
 *   node test/unit/language-service-scope.js <test-name>  # single test
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

function names_of(symbols) {
    return symbols.map(function (s) { return s.name; }).sort();
}

function find(symbols, name) {
    return symbols.find(function (s) { return s.name === name; }) || null;
}

function assert_has(symbols, name, label) {
    assert.ok(
        symbols.some(function (s) { return s.name === name; }),
        (label || "") + ": expected symbol '" + name + "' in [" + names_of(symbols).join(", ") + "]"
    );
}

function assert_not_has(symbols, name, label) {
    assert.ok(
        !symbols.some(function (s) { return s.name === name; }),
        (label || "") + ": symbol '" + name + "' should NOT appear in [" + names_of(symbols).join(", ") + "]"
    );
}

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------

function make_tests(SourceAnalyzer, RS) {

    function analyze(code, opts) {
        var a = new SourceAnalyzer(RS);
        return a.analyze(code, opts || {});
    }

    var TESTS = [

        // ── Basic structure ───────────────────────────────────────────────

        {
            name: "returns_scopemap",
            description: "analyze() always returns a ScopeMap object",
            run: function () {
                var m = analyze("x = 1");
                assert.ok(m,                         "ScopeMap should be truthy");
                assert.ok(Array.isArray(m.frames),   "ScopeMap.frames should be an array");
            },
        },

        {
            name: "empty_source_gives_module_frame",
            description: "Empty source produces a single module-scoped frame",
            run: function () {
                var m = analyze("");
                assert.ok(m.frames.length >= 1, "Expected at least the module frame");
                var mod = m.frames.find(function (f) { return f.kind === "module"; });
                assert.ok(mod, "Expected a 'module' frame");
            },
        },

        {
            name: "syntax_error_returns_empty_map",
            description: "A parse error returns an empty (0-frame) ScopeMap without throwing",
            run: function () {
                var m = analyze("def foo(");
                // No frames, no throw
                assert.ok(m.frames.length === 0, "Expected 0 frames on parse error");
            },
        },

        // ── Module-level symbols ──────────────────────────────────────────

        {
            name: "module_variable",
            description: "A top-level assignment appears as a variable in the module frame",
            run: function () {
                var m = analyze("x = 42");
                var syms = m.getAllSymbols();
                assert_has(syms, "x", "module_variable");
                var sym = find(syms, "x");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        {
            name: "module_function",
            description: "A top-level def appears as a function symbol in the module frame",
            run: function () {
                var m = analyze("def greet(name):\n    return name");
                var syms = m.getAllSymbols();
                assert_has(syms, "greet", "module_function");
                var sym = find(syms, "greet");
                assert.strictEqual(sym.kind, "function");
            },
        },

        {
            name: "module_class",
            description: "A top-level class appears as a class symbol in the module frame",
            run: function () {
                var m = analyze("class Foo:\n    pass");
                var syms = m.getAllSymbols();
                assert_has(syms, "Foo", "module_class");
                var sym = find(syms, "Foo");
                assert.strictEqual(sym.kind, "class");
            },
        },

        // ── Function scope ────────────────────────────────────────────────

        {
            name: "function_params_in_function_scope",
            description: "Function parameters appear with kind='parameter' inside the function frame",
            run: function () {
                var m = analyze([
                    "def add(a, b):",
                    "    return a + b",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "a");
                assert_has(syms, "b");
                var a_sym = find(syms, "a");
                assert.strictEqual(a_sym.kind, "parameter");
            },
        },

        {
            name: "local_variable_in_function_scope",
            description: "Assignments inside a function appear in the function frame",
            run: function () {
                var m = analyze([
                    "def foo():",
                    "    result = 42",
                    "    return result",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "result");
                var sym = find(syms, "result");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        {
            name: "function_frame_created",
            description: "A def creates a frame with kind='function'",
            run: function () {
                var m = analyze("def bar():\n    pass");
                var fn_frame = m.frames.find(function (f) { return f.kind === "function"; });
                assert.ok(fn_frame, "Expected a 'function' frame");
            },
        },

        // ── Class scope ───────────────────────────────────────────────────

        {
            name: "class_frame_created",
            description: "A class creates a frame with kind='class'",
            run: function () {
                var m = analyze("class MyClass:\n    def method(self):\n        return self");
                var cls_frame = m.frames.find(function (f) { return f.kind === "class"; });
                assert.ok(cls_frame, "Expected a 'class' frame");
                assert.strictEqual(cls_frame.name, "MyClass");
            },
        },

        {
            name: "method_appears_in_class_scope",
            description: "A method appears with kind='method' in the class frame",
            run: function () {
                var m = analyze([
                    "class Dog:",
                    "    def bark(self):",
                    "        return 'woof'",
                ].join("\n"));
                var cls_frame = m.frames.find(function (f) { return f.kind === "class"; });
                assert.ok(cls_frame, "Expected a class frame");
                var method_sym = cls_frame.getSymbol("bark");
                assert.ok(method_sym, "Expected 'bark' in class frame");
                assert.strictEqual(method_sym.kind, "method");
            },
        },

        {
            name: "self_param_in_method_scope",
            description: "'self' appears as a parameter inside a method frame",
            run: function () {
                var m = analyze([
                    "class Foo:",
                    "    def do_thing(self, x):",
                    "        return x",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "self");
                assert_has(syms, "x");
                var self_sym = find(syms, "self");
                assert.strictEqual(self_sym.kind, "parameter");
            },
        },

        // ── Imports ───────────────────────────────────────────────────────

        {
            name: "from_import_symbol",
            description: "'from mod import name' produces an import symbol",
            run: function () {
                var m = analyze("from mymod import foo\nfoo()", {
                    virtualFiles: { mymod: "def foo(): pass" },
                });
                var syms = m.getAllSymbols();
                assert_has(syms, "foo");
                var sym = find(syms, "foo");
                assert.strictEqual(sym.kind, "import");
            },
        },

        {
            name: "from_import_alias",
            description: "'from mod import name as alias' records the alias",
            run: function () {
                var m = analyze("from mymod import foo as bar\nbar()", {
                    virtualFiles: { mymod: "def foo(): pass" },
                });
                var syms = m.getAllSymbols();
                assert_has(syms, "bar");
                assert_not_has(syms, "foo", "from_import_alias: original name should not appear");
            },
        },

        // ── For-loop variable ─────────────────────────────────────────────

        {
            name: "for_loop_variable",
            description: "Loop variable from a for-in loop appears as a variable symbol",
            run: function () {
                var m = analyze([
                    "for item in [1, 2, 3]:",
                    "    print(item)",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "item");
                var sym = find(syms, "item");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        // ── *args and **kwargs ────────────────────────────────────────────

        {
            name: "star_args_captured",
            description: "*args appears as a parameter in the function frame",
            run: function () {
                var m = analyze("def f(*args):\n    return args");
                var syms = m.getAllSymbols();
                assert_has(syms, "args");
                var sym = find(syms, "args");
                assert.strictEqual(sym.kind, "parameter");
            },
        },

        // ── params metadata on function SymbolInfo ────────────────────────

        {
            name: "function_params_metadata",
            description: "A function SymbolInfo carries its parameter list",
            run: function () {
                var m = analyze("def greet(name, greeting):\n    return greeting + name");
                var sym = find(m.getAllSymbols(), "greet");
                assert.ok(sym, "Expected 'greet' symbol");
                assert.ok(Array.isArray(sym.params), "Expected params to be an array");
                var param_names = sym.params.map(function (p) { return p.name; });
                assert.ok(param_names.indexOf("name")     >= 0, "Expected param 'name'");
                assert.ok(param_names.indexOf("greeting") >= 0, "Expected param 'greeting'");
            },
        },

        // ── Position queries ──────────────────────────────────────────────

        {
            name: "getScopesAtPosition_module",
            description: "A position in module scope returns a module frame",
            run: function () {
                var m = analyze("x = 1\ny = 2");
                var scopes = m.getScopesAtPosition(1, 1);
                assert.ok(scopes.length >= 1);
                var kinds = scopes.map(function (s) { return s.kind; });
                assert.ok(kinds.indexOf("module") >= 0, "Expected 'module' in scopes");
            },
        },

        {
            name: "getScopesAtPosition_inside_function",
            description: "A position inside a function body returns both function and module frames",
            run: function () {
                //  line 1: def foo():
                //  line 2:     x = 1
                var m = analyze("def foo():\n    x = 1");
                // Position on line 2 is inside the function
                var scopes = m.getScopesAtPosition(2, 5);
                var kinds = scopes.map(function (s) { return s.kind; });
                assert.ok(kinds.indexOf("function") >= 0, "Expected 'function' frame at line 2");
                assert.ok(kinds.indexOf("module")   >= 0, "Expected 'module' frame at line 2");
            },
        },

        {
            name: "getSymbolsAtPosition_module_visible_in_function",
            description: "Module-level symbols are visible inside a function",
            run: function () {
                // line 1: CONST = 99
                // line 2: def foo():
                // line 3:     return CONST
                var m = analyze("CONST = 99\ndef foo():\n    return CONST");
                // Query inside foo's body
                var syms = m.getSymbolsAtPosition(3, 5);
                assert_has(syms, "CONST", "getSymbolsAtPosition_module_visible");
                assert_has(syms, "foo",   "getSymbolsAtPosition_module_visible");
            },
        },

        {
            name: "getSymbolsAtPosition_inner_shadows_outer",
            description: "An inner-scope definition of the same name shadows the outer one",
            run: function () {
                // line 1: x = "outer"
                // line 2: def foo():
                // line 3:     x = "inner"
                // line 4:     return x
                var m = analyze("x = 'outer'\ndef foo():\n    x = 'inner'\n    return x");
                var syms = m.getSymbolsAtPosition(4, 5);  // inside foo
                // getSymbolsAtPosition deduplicates: inner x wins
                var x_matches = syms.filter(function (s) { return s.name === "x"; });
                assert.strictEqual(x_matches.length, 1, "Expected exactly one 'x' (inner shadows outer)");
                // The inner x's scope_depth should be greater than 0 (module depth)
                assert.ok(x_matches[0].scope_depth > 0, "Expected inner 'x' to have scope_depth > 0");
            },
        },

        {
            name: "getSymbol_lookup",
            description: "getSymbol() returns the correct SymbolInfo for a name at a position",
            run: function () {
                // line 1: def calculate(a, b):
                // line 2:     total = a + b
                // line 3:     return total
                var m = analyze("def calculate(a, b):\n    total = a + b\n    return total");
                var sym = m.getSymbol("a", 2, 5);
                assert.ok(sym, "Expected to find 'a'");
                assert.strictEqual(sym.kind, "parameter");

                var total = m.getSymbol("total", 3, 5);
                assert.ok(total, "Expected to find 'total'");
                assert.strictEqual(total.kind, "variable");
            },
        },

        {
            name: "getSymbol_not_visible_outside_function",
            description: "A function-local symbol is not visible from module scope",
            run: function () {
                // line 1: def foo():
                // line 2:     local_var = 1
                // line 3: x = 2
                var m = analyze("def foo():\n    local_var = 1\n\nx = 2");
                // Query from module scope (line 4 = after foo's body)
                var sym = m.getSymbol("local_var", 4, 1);
                assert.ok(!sym, "Expected 'local_var' to be invisible at module scope");
            },
        },

        {
            name: "getSymbol_returns_null_for_unknown",
            description: "getSymbol() returns null for a name not in any visible scope",
            run: function () {
                var m = analyze("x = 1");
                var sym = m.getSymbol("totally_unknown", 1, 1);
                assert.strictEqual(sym, null);
            },
        },

        // ── Defined-at positions ──────────────────────────────────────────

        {
            name: "defined_at_line_number",
            description: "defined_at.line matches the 1-indexed line of the definition",
            run: function () {
                // line 1: x = 1    ← defined at line 1
                // line 2: y = 2    ← defined at line 2
                var m = analyze("x = 1\ny = 2");
                var syms = m.getAllSymbols();
                var x_sym = find(syms, "x");
                var y_sym = find(syms, "y");
                assert.ok(x_sym && x_sym.defined_at, "Expected defined_at on x");
                assert.ok(y_sym && y_sym.defined_at, "Expected defined_at on y");
                assert.strictEqual(x_sym.defined_at.line, 1, "x should be on line 1");
                assert.strictEqual(y_sym.defined_at.line, 2, "y should be on line 2");
            },
        },

        // ── Docstrings ────────────────────────────────────────────────────

        {
            name: "function_docstring_captured",
            description: "A function docstring is captured in SymbolInfo.doc",
            run: function () {
                var m = analyze([
                    'def described():',
                    '    "This function does something"',
                    '    return 1',
                ].join("\n"));
                var sym = find(m.getAllSymbols(), "described");
                assert.ok(sym, "Expected 'described' symbol");
                assert.ok(sym.doc && sym.doc.indexOf("does something") >= 0,
                    "Expected docstring to be captured, got: " + JSON.stringify(sym.doc));
            },
        },

        // ── Nested functions ──────────────────────────────────────────────

        {
            name: "nested_function_scope",
            description: "A function nested inside another creates its own inner frame",
            run: function () {
                var m = analyze([
                    "def outer():",
                    "    def inner():",
                    "        return 1",
                    "    return inner()",
                ].join("\n"));
                var fn_frames = m.frames.filter(function (f) { return f.kind === "function"; });
                assert.ok(fn_frames.length >= 2, "Expected at least 2 function frames (outer + inner)");
                var depths = fn_frames.map(function (f) { return f.depth; });
                assert.ok(Math.max.apply(null, depths) >= 2,
                    "Expected at least one nested frame at depth >= 2");
            },
        },

        // ── Exception variable ────────────────────────────────────────────

        {
            name: "except_variable_captured",
            description: "The variable in an except clause appears as a symbol",
            run: function () {
                var m = analyze([
                    "try:",
                    "    x = 1",
                    "except Exception as e:",
                    "    print(e)",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "e", "except_variable_captured");
                var sym = find(syms, "e");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        // ── getAllSymbols ─────────────────────────────────────────────────

        {
            name: "getAllSymbols_returns_all",
            description: "getAllSymbols() includes symbols from all frames",
            run: function () {
                var m = analyze([
                    "module_var = 1",
                    "def fn(param):",
                    "    local = 2",
                    "class Cls:",
                    "    def method(self):",
                    "        return self",
                ].join("\n"));
                var names = names_of(m.getAllSymbols());
                ["module_var", "fn", "param", "local", "Cls", "method", "self"].forEach(function (n) {
                    assert.ok(names.indexOf(n) >= 0, "Expected '" + n + "' in getAllSymbols");
                });
            },
        },

        // ── inferred_class from literal assignments ───────────────────────

        {
            name: "inferred_class_list_literal",
            description: "myArr = [] sets inferred_class to 'list'",
            run: function () {
                var m = analyze("myArr = []\npass");
                var sym = find(m.getAllSymbols(), "myArr");
                assert.ok(sym, "Expected 'myArr' symbol");
                assert.strictEqual(sym.inferred_class, "list");
            },
        },

        {
            name: "inferred_class_dict_literal",
            description: "myObj = {} sets inferred_class to 'dict'",
            run: function () {
                var m = analyze("myObj = {}\npass");
                var sym = find(m.getAllSymbols(), "myObj");
                assert.ok(sym, "Expected 'myObj' symbol");
                assert.strictEqual(sym.inferred_class, "dict");
            },
        },

        {
            name: "inferred_class_str_literal",
            description: "myStr = 'hello' sets inferred_class to 'str'",
            run: function () {
                var m = analyze("myStr = 'hello'\npass");
                var sym = find(m.getAllSymbols(), "myStr");
                assert.ok(sym, "Expected 'myStr' symbol");
                assert.strictEqual(sym.inferred_class, "str");
            },
        },

        {
            name: "inferred_class_number_literal",
            description: "myNum = 42 sets inferred_class to 'number'",
            run: function () {
                var m = analyze("myNum = 42\npass");
                var sym = find(m.getAllSymbols(), "myNum");
                assert.ok(sym, "Expected 'myNum' symbol");
                assert.strictEqual(sym.inferred_class, "number");
            },
        },

        {
            name: "inferred_class_constructor_call",
            description: "x = Foo() sets inferred_class to 'Foo'",
            run: function () {
                var m = analyze("class Foo:\n    pass\nx = Foo()\npass");
                var sym = find(m.getAllSymbols(), "x");
                assert.ok(sym, "Expected 'x' symbol");
                assert.strictEqual(sym.inferred_class, "Foo");
            },
        },

        {
            name: "inferred_class_function_local_list",
            description: "Inside a function, myArr = [] sets inferred_class to 'list'",
            run: function () {
                var m = analyze([
                    "def main():",
                    "    myArr = []",
                    "    return myArr",
                ].join("\n"));
                var sym = find(m.getAllSymbols(), "myArr");
                assert.ok(sym, "Expected 'myArr' symbol in function scope");
                assert.strictEqual(sym.inferred_class, "list",
                    "Expected inferred_class='list', got: " + sym.inferred_class);
            },
        },

        {
            name: "inferred_class_function_local_dict",
            description: "Inside a function, myObj = {} sets inferred_class to 'dict'",
            run: function () {
                var m = analyze([
                    "def main():",
                    "    myObj = {}",
                    "    return myObj",
                ].join("\n"));
                var sym = find(m.getAllSymbols(), "myObj");
                assert.ok(sym, "Expected 'myObj' symbol in function scope");
                assert.strictEqual(sym.inferred_class, "dict");
            },
        },

        {
            name: "inferred_class_function_local_str",
            description: "Inside a function, myStr = 'x' sets inferred_class to 'str'",
            run: function () {
                var m = analyze([
                    "def main():",
                    "    myStr = 'hello'",
                    "    return myStr",
                ].join("\n"));
                var sym = find(m.getAllSymbols(), "myStr");
                assert.ok(sym, "Expected 'myStr' symbol in function scope");
                assert.strictEqual(sym.inferred_class, "str");
            },
        },

        {
            name: "inferred_class_async_function_local",
            description: "Inside async def, list literal sets inferred_class to 'list'",
            run: function () {
                var m = analyze([
                    "async def main():",
                    "    myArr = []",
                    "    return myArr",
                ].join("\n"));
                var sym = find(m.getAllSymbols(), "myArr");
                assert.ok(sym, "Expected 'myArr' symbol in async function scope");
                assert.strictEqual(sym.inferred_class, "list");
            },
        },

        {
            name: "inferred_class_no_inference_for_variable_rhs",
            description: "x = some_var does not set inferred_class (unknown rhs)",
            run: function () {
                var m = analyze("some_var = 1\nx = some_var\npass");
                var sym = find(m.getAllSymbols(), "x");
                assert.ok(sym, "Expected 'x' symbol");
                assert.ok(!sym.inferred_class,
                    "Expected no inferred_class for variable assignment, got: " + sym.inferred_class);
            },
        },

        // ── Walrus operator (:=) ─────────────────────────────────────────────

        {
            name: "walrus_registers_symbol_in_scope",
            description: "name := expr registers name as a variable in the enclosing scope",
            run: function () {
                var m = analyze([
                    "if (n := 42) > 0:",
                    "    pass",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "n", "walrus LHS should be registered");
                var sym = find(syms, "n");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        {
            name: "walrus_in_function_scope",
            description: "walrus inside a function registers name in the function scope",
            run: function () {
                var m = analyze([
                    "def check(data):",
                    "    if (result := len(data)) > 0:",
                    "        return result",
                    "    return 0",
                ].join("\n"));
                var syms = m.getAllSymbols();
                assert_has(syms, "result", "walrus LHS in function should be registered");
                var sym = find(syms, "result");
                assert.strictEqual(sym.kind, "variable");
            },
        },

        // ── Virtual file imports ──────────────────────────────────────────

        {
            name: "virtual_import_creates_symbol",
            description: "Importing from a virtual file produces an import symbol",
            run: function () {
                var m = analyze("from helper import square\nprint(square(4))", {
                    virtualFiles: { helper: "def square(n): return n * n" },
                });
                var syms = m.getAllSymbols();
                assert_has(syms, "square");
                var sym = find(syms, "square");
                assert.strictEqual(sym.kind, "import");
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
            console.log(colored("FAIL  " + test.name, "red") +
                        "\n      " + (e.message || String(e)) + "\n");
        }
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " scope-analysis tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var analyzer_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/analyzer.js")
).href;

var filter = process.argv[2] || null;

import(analyzer_path).then(function (mod) {
    var SourceAnalyzer = mod.SourceAnalyzer;
    var RS             = compiler_module.create_compiler();
    var TESTS          = make_tests(SourceAnalyzer, RS);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load analyzer module:", "red"), e);
    process.exit(1);
});
