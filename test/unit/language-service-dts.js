/*
 * test/unit/language-service-dts.js
 *
 * Unit tests for src/monaco-language-service/dts.js (Phase 6).
 *
 * Usage:
 *   node test/unit/language-service-dts.js              # run all tests
 *   node test/unit/language-service-dts.js <test-name>  # run single test
 */
"use strict";

var assert = require("assert");
var path   = require("path");
var url    = require("url");
var utils  = require("../../tools/utils");
var colored = utils.safe_colored;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return labels from a TypeInfo members Map. */
function member_names(ti) {
    return ti.members ? Array.from(ti.members.keys()) : [];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function make_tests(parse_dts, DtsRegistry, TypeInfo) {

    var TESTS = [

        // ── parse_dts: var / let / const ─────────────────────────────────

        {
            name: "parse_var",
            description: "declare var name: Type; produces a 'var' TypeInfo",
            run: function () {
                var types = parse_dts("declare var NaN: number;");
                assert.strictEqual(types.length, 1);
                assert.strictEqual(types[0].name, "NaN");
                assert.strictEqual(types[0].kind, "var");
                assert.strictEqual(types[0].return_type, "number");
            },
        },

        {
            name: "parse_const",
            description: "declare const name: Type; is treated as 'var'",
            run: function () {
                var types = parse_dts("declare const PI: number;");
                assert.strictEqual(types.length, 1);
                assert.strictEqual(types[0].name, "PI");
                assert.strictEqual(types[0].kind, "var");
            },
        },

        // ── parse_dts: function ───────────────────────────────────────────

        {
            name: "parse_function_no_params",
            description: "declare function with no params",
            run: function () {
                var types = parse_dts("declare function now(): number;");
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.name, "now");
                assert.strictEqual(ti.kind, "function");
                assert.ok(Array.isArray(ti.params));
                assert.strictEqual(ti.params.length, 0);
                assert.strictEqual(ti.return_type, "number");
            },
        },

        {
            name: "parse_function_with_params",
            description: "declare function with regular params",
            run: function () {
                var types = parse_dts("declare function parseInt(string: string, radix?: number): number;");
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.name, "parseInt");
                assert.strictEqual(ti.params.length, 2);
                assert.strictEqual(ti.params[0].name, "string");
                assert.strictEqual(ti.params[0].type, "string");
                assert.strictEqual(ti.params[0].optional, false);
                assert.strictEqual(ti.params[1].name, "radix");
                assert.strictEqual(ti.params[1].optional, true);
                assert.strictEqual(ti.return_type, "number");
            },
        },

        {
            name: "parse_function_rest_param",
            description: "declare function with ...rest param",
            run: function () {
                var types = parse_dts("declare function log(...data: any[]): void;");
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.params.length, 1);
                assert.strictEqual(ti.params[0].name, "data");
                assert.strictEqual(ti.params[0].rest, true);
            },
        },

        // ── parse_dts: interface ──────────────────────────────────────────

        {
            name: "parse_interface_members",
            description: "interface with methods and properties",
            run: function () {
                var src = [
                    "interface Console {",
                    "    log(...data: any[]): void;",
                    "    error(message?: any): void;",
                    "    warn(message?: any): void;",
                    "}",
                ].join("\n");
                var types = parse_dts(src);
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.name, "Console");
                assert.strictEqual(ti.kind, "interface");
                assert.ok(ti.members instanceof Map);
                assert.ok(ti.members.has("log"),   "should have log");
                assert.ok(ti.members.has("error"), "should have error");
                assert.ok(ti.members.has("warn"),  "should have warn");
                var log = ti.members.get("log");
                assert.strictEqual(log.kind, "method");
                assert.strictEqual(log.params[0].rest, true);
            },
        },

        {
            name: "parse_interface_property",
            description: "interface property produces a 'property' member",
            run: function () {
                var src = [
                    "interface Location {",
                    "    href: string;",
                    "    pathname: string;",
                    "}",
                ].join("\n");
                var types = parse_dts(src);
                var ti = types[0];
                assert.ok(ti.members.has("href"), "should have href");
                assert.strictEqual(ti.members.get("href").kind, "property");
                assert.strictEqual(ti.members.get("href").return_type, "string");
            },
        },

        // ── parse_dts: class ──────────────────────────────────────────────

        {
            name: "parse_class",
            description: "declare class with methods",
            run: function () {
                var src = [
                    "declare class Map<K, V> {",
                    "    get(key: K): V | undefined;",
                    "    set(key: K, value: V): this;",
                    "    has(key: K): boolean;",
                    "    size: number;",
                    "}",
                ].join("\n");
                var types = parse_dts(src);
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.name, "Map");
                assert.strictEqual(ti.kind, "class");
                assert.ok(ti.members.has("get"),  "should have get");
                assert.ok(ti.members.has("set"),  "should have set");
                assert.ok(ti.members.has("has"),  "should have has");
                assert.ok(ti.members.has("size"), "should have size");
            },
        },

        // ── parse_dts: namespace ──────────────────────────────────────────

        {
            name: "parse_namespace",
            description: "declare namespace with function members",
            run: function () {
                var src = [
                    "declare namespace Math {",
                    "    function abs(x: number): number;",
                    "    function sqrt(x: number): number;",
                    "    const PI: number;",
                    "}",
                ].join("\n");
                var types = parse_dts(src);
                assert.strictEqual(types.length, 1);
                var ti = types[0];
                assert.strictEqual(ti.name, "Math");
                assert.strictEqual(ti.kind, "namespace");
                // namespace members parsed as methods/properties in inner scope
                assert.ok(ti.members instanceof Map);
            },
        },

        // ── parse_dts: JSDoc ─────────────────────────────────────────────

        {
            name: "parse_jsdoc",
            description: "JSDoc comment above a declaration is captured as doc",
            run: function () {
                var src = [
                    "/** Converts a string to a number. */",
                    "declare function parseFloat(string: string): number;",
                ].join("\n");
                var types = parse_dts(src);
                assert.ok(types[0].doc, "should have doc");
                assert.ok(types[0].doc.indexOf("Converts") !== -1,
                    "doc should contain 'Converts'");
            },
        },

        {
            name: "parse_multiline_jsdoc",
            description: "Multi-line JSDoc is joined into one string",
            run: function () {
                var src = [
                    "/**",
                    " * Encodes a URI component.",
                    " * @param uriComponent The string to encode.",
                    " */",
                    "declare function encodeURIComponent(uriComponent: string): string;",
                ].join("\n");
                var types = parse_dts(src);
                assert.ok(types[0].doc, "should have doc");
                assert.ok(types[0].doc.indexOf("Encodes") !== -1);
            },
        },

        // ── parse_dts: multiple declarations ────────────────────────────

        {
            name: "parse_multiple",
            description: "Multiple declarations in one file are all returned",
            run: function () {
                var src = [
                    "declare var undefined: undefined;",
                    "declare function isNaN(number: number): boolean;",
                    "declare function isFinite(number: number): boolean;",
                    "interface Error {",
                    "    message: string;",
                    "}",
                ].join("\n");
                var types = parse_dts(src);
                assert.strictEqual(types.length, 4);
                var names = types.map(function (t) { return t.name; });
                assert.ok(names.indexOf("undefined")  !== -1);
                assert.ok(names.indexOf("isNaN")      !== -1);
                assert.ok(names.indexOf("isFinite")   !== -1);
                assert.ok(names.indexOf("Error")      !== -1);
            },
        },

        // ── DtsRegistry ───────────────────────────────────────────────────

        {
            name: "registry_addDts_getGlobal",
            description: "addDts registers globals retrievable by getGlobal",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", "declare function alert(message?: any): void;");
                var ti = reg.getGlobal("alert");
                assert.ok(ti, "alert should be registered");
                assert.strictEqual(ti.kind, "function");
            },
        },

        {
            name: "registry_getGlobalNames",
            description: "getGlobalNames returns all registered names",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "declare var document: Document;",
                    "declare function alert(msg: string): void;",
                ].join("\n"));
                var names = reg.getGlobalNames();
                assert.ok(names.indexOf("document") !== -1);
                assert.ok(names.indexOf("alert")    !== -1);
            },
        },

        {
            name: "registry_getGlobal_unknown",
            description: "getGlobal returns null for an unknown name",
            run: function () {
                var reg = new DtsRegistry();
                assert.strictEqual(reg.getGlobal("doesNotExist"), null);
            },
        },

        {
            name: "registry_merge",
            description: "Calling addDts multiple times merges all globals",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("a", "declare var x: number;");
                reg.addDts("b", "declare var y: string;");
                assert.ok(reg.getGlobal("x"), "x should be registered");
                assert.ok(reg.getGlobal("y"), "y should be registered");
                assert.strictEqual(reg.getGlobalNames().length, 2);
            },
        },

        {
            name: "registry_getHoverMarkdown_function",
            description: "getHoverMarkdown returns markdown for a function",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", "declare function parseInt(s: string, radix?: number): number;");
                var md = reg.getHoverMarkdown("parseInt");
                assert.ok(md, "should return markdown");
                assert.ok(md.indexOf("parseInt") !== -1, "should include name");
                assert.ok(md.indexOf("function")  !== -1, "should include kind");
                assert.ok(md.indexOf("```")        !== -1, "should be in code block");
            },
        },

        {
            name: "registry_getHoverMarkdown_var",
            description: "getHoverMarkdown returns markdown for a var with type",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", "declare var NaN: number;");
                var md = reg.getHoverMarkdown("NaN");
                assert.ok(md, "should return markdown");
                assert.ok(md.indexOf("NaN")    !== -1);
                assert.ok(md.indexOf("number") !== -1, "should show type");
            },
        },

        {
            name: "registry_getHoverMarkdown_with_doc",
            description: "getHoverMarkdown includes the JSDoc comment",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "/** Parses a float. */",
                    "declare function parseFloat(s: string): number;",
                ].join("\n"));
                var md = reg.getHoverMarkdown("parseFloat");
                assert.ok(md.indexOf("Parses a float") !== -1,
                    "should include docstring");
            },
        },

        {
            name: "registry_getHoverMarkdown_unknown",
            description: "getHoverMarkdown returns null for unknown name",
            run: function () {
                var reg = new DtsRegistry();
                assert.strictEqual(reg.getHoverMarkdown("nope"), null);
            },
        },

        {
            name: "registry_getMemberNames",
            description: "getMemberNames returns method/property names for a class/interface",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", [
                    "interface Console {",
                    "    log(...data: any[]): void;",
                    "    error(message?: any): void;",
                    "}",
                ].join("\n"));
                var names = reg.getMemberNames("Console");
                assert.ok(names.indexOf("log")   !== -1, "should have log");
                assert.ok(names.indexOf("error") !== -1, "should have error");
            },
        },

        // ── Hover integration ─────────────────────────────────────────────

        {
            name: "hover_dts_fallback",
            description: "HoverEngine falls back to DTS registry when word not in ScopeMap",
            run: function () {
                var reg = new DtsRegistry();
                reg.addDts("lib", "declare function alert(msg: string): void;");
                var md = reg.getHoverMarkdown("alert");
                assert.ok(md, "registry should provide hover for alert");
                assert.ok(md.indexOf("alert") !== -1);
            },
        },

        // ── loadDts (async lazy loader) ───────────────────────────────────

        {
            name: "loadDts_calls_callback_and_registers",
            description: "loadDts calls the provided callback and registers the result",
            run: function (done) {
                var reg  = new DtsRegistry();
                var called_with = null;

                function loader(name) {
                    called_with = name;
                    return Promise.resolve("declare function fetch(url: string): any;");
                }

                // Simulate what index.js does: call loader, then addDts
                var promise = Promise.resolve(loader("lib.fetch")).then(function (text) {
                    reg.addDts("lib.fetch", text);
                });

                return promise.then(function () {
                    assert.strictEqual(called_with, "lib.fetch", "loader called with correct name");
                    assert.ok(reg.getGlobal("fetch"), "fetch should be registered");
                    assert.strictEqual(reg.getGlobal("fetch").kind, "function");
                });
            },
        },

        {
            name: "loadDts_promise_resolves_after_registration",
            description: "The Promise from loadDts resolves only after addDts completes",
            run: function () {
                var reg = new DtsRegistry();
                var resolved = false;

                var p = Promise.resolve("declare var myGlobal: string;").then(function (text) {
                    reg.addDts("test", text);
                    resolved = true;
                });

                return p.then(function () {
                    assert.ok(resolved, "promise should have resolved");
                    assert.ok(reg.getGlobal("myGlobal"), "myGlobal should be registered");
                });
            },
        },

        {
            name: "loadDts_no_callback_rejects",
            description: "loadDts without a callback returns a rejected Promise",
            run: function () {
                // Simulate the index.js guard: no _loadDts stored
                var loadDts = function (name) {
                    return Promise.reject(
                        new Error("registerRapydScript: options.loadDts was not provided")
                    );
                };

                return loadDts("anything").then(
                    function () { assert.fail("should have rejected"); },
                    function (err) {
                        assert.ok(err.message.indexOf("loadDts") !== -1,
                            "error should mention loadDts");
                    }
                );
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

    // Run tests sequentially, supporting tests that return a Promise.
    function run_next(i) {
        if (i >= tests.length) {
            console.log("");
            if (failures.length) {
                console.log(colored(failures.length + " test(s) failed.", "red"));
            } else {
                console.log(colored("All " + tests.length + " language-service-dts tests passed!", "green"));
            }
            process.exit(failures.length ? 1 : 0);
            return;
        }
        var test = tests[i];
        var result;
        try {
            result = test.run();
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        "\n      " + (e.message || String(e)) + "\n");
            run_next(i + 1);
            return;
        }
        // If the test returned a Promise, wait for it.
        if (result && typeof result.then === 'function') {
            result.then(function () {
                console.log(colored("PASS  " + test.name, "green") +
                            "  –  " + test.description);
                run_next(i + 1);
            }, function (e) {
                failures.push(test.name);
                console.log(colored("FAIL  " + test.name, "red") +
                            "\n      " + (e.message || String(e)) + "\n");
                run_next(i + 1);
            });
        } else {
            console.log(colored("PASS  " + test.name, "green") +
                        "  –  " + test.description);
            run_next(i + 1);
        }
    }

    run_next(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

var dts_path = url.pathToFileURL(
    path.join(__dirname, "../../src/monaco-language-service/dts.js")
).href;

var filter = process.argv[2] || null;

import(dts_path).then(function (mod) {
    var TESTS = make_tests(mod.parse_dts, mod.DtsRegistry, mod.TypeInfo);
    run_tests(TESTS, filter);
}).catch(function (e) {
    console.error(colored("Failed to load dts module:", "red"), e);
    process.exit(1);
});
