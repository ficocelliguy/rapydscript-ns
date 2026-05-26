/*
 * test/unit/vm-shim.js
 *
 * Tests for the vm shim in web-repl/env.js (embedded into web-repl/rapydscript.js).
 * Exercises the post-iframe-removal behaviour:
 *   - vm.createContext works without a `document`
 *   - vm.runInContext captures top-level decls into ctx for REPL persistence
 *   - compile_async waits for DOM-ready with a bounded timeout
 *   - RapydScriptSandboxError is thrown with a useful .hint for sandbox failures
 *
 * Usage:
 *   node test/unit/vm-shim.js              # run all tests
 *   node test/unit/vm-shim.js <test-name>  # run a specific test
 */
"use strict";

var fs      = require("fs");
var vm      = require("vm");
var path    = require("path");
var assert  = require("assert");
var utils   = require("../../tools/utils");
var colored = utils.safe_colored;

var BASE_PATH   = path.resolve(__dirname, "../..");
var bundle_path = path.join(BASE_PATH, "web-repl", "rapydscript.js");

if (!utils.path_exists(bundle_path)) {
    console.error("web-repl/rapydscript.js not found — run: node bin/web-repl-export web-repl");
    process.exit(1);
}

var bundle_source = fs.readFileSync(bundle_path, "utf-8");

// ── Sandbox helpers ─────────────────────────────────────────────────────────
// Load the bundle into a fresh Node vm context. By default no `document` is
// provided, matching a Worker / SSR / pre-DOM environment. Tests that need
// a fake document opt in via the `withDocument` flag.
function load_bundle(opts) {
    opts = opts || {};
    var sandbox = {
        console: console,
        // Provide setTimeout/setInterval so the async helper's timer path can run.
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval,
        Promise: Promise,
    };
    if (opts.withDocument) sandbox.document = opts.withDocument;
    vm.createContext(sandbox);
    vm.runInContext(bundle_source, sandbox);
    if (!sandbox.RapydScript) throw new Error("Bundle failed to expose RapydScript");
    return { sandbox: sandbox, RS: sandbox.RapydScript };
}

// ── Tests ───────────────────────────────────────────────────────────────────

var TESTS = [
    {
        name: "compile_works_without_document",
        description: "RS.compile runs in a Worker-like env (no document) — the iframe shim is no longer required",
        run: function () {
            var loaded = load_bundle();
            var js = loaded.RS.compile("x = 1 + 2", "<test>", {
                bare: true,
                omit_baselib: true,
            });
            assert.ok(typeof js === "string" && js.length > 0, "compile should return a non-empty string");
            // RapydScript wraps `+` with ρσ_list_add by default; just verify the
            // input made it through to the output in some recognisable form.
            assert.ok(/\bx\b/.test(js) && /\b1\b/.test(js) && /\b2\b/.test(js),
                      "compiled output should reflect input: " + js);
        },
    },

    {
        name: "compile_async_resolves_without_document",
        description: "RS.compile_async returns a Promise that resolves in a no-document env",
        run: async function () {
            var loaded = load_bundle();
            assert.equal(typeof loaded.RS.compile_async, "function", "compile_async must be exported");
            var js = await loaded.RS.compile_async("y = 'hello'", "<test>", {
                bare: true,
                omit_baselib: true,
                bootstrap_timeout: 100,
            });
            assert.ok(typeof js === "string" && /y\s*=\s*['"]hello['"]/.test(js), "expected y='hello' in output");
        },
    },

    {
        name: "compile_async_bounded_wait_resolves",
        description: "compile_async resolves within bootstrap_timeout even if document.body never appears",
        run: async function () {
            // Document present but readyState=loading and no body — simulates very
            // early page boot. The bounded wait should give up after the timeout
            // and proceed to compile anyway (which works fine since the iframe is gone).
            var stub_doc = {
                readyState: "loading",
                body: null,
                addEventListener: function () {},
            };
            var loaded = load_bundle({ withDocument: stub_doc });
            var t0 = Date.now();
            var js = await loaded.RS.compile_async("z = 7", "<test>", {
                bare: true,
                omit_baselib: true,
                bootstrap_timeout: 150,
            });
            var elapsed = Date.now() - t0;
            assert.ok(/z\s*=\s*7/.test(js), "compile_async should still produce output");
            assert.ok(elapsed < 1000, "bounded wait should not stall past timeout; elapsed=" + elapsed);
            // Should have waited at least close to the bounded timeout (allow ~50ms slack).
            assert.ok(elapsed >= 100, "wait should respect bootstrap_timeout; elapsed=" + elapsed);
        },
    },

    {
        name: "compile_async_resolves_immediately_when_ready",
        description: "compile_async takes the fast path when document.body is already present",
        run: async function () {
            var stub_doc = { readyState: "complete", body: {}, addEventListener: function () {} };
            var loaded = load_bundle({ withDocument: stub_doc });
            var t0 = Date.now();
            await loaded.RS.compile_async("a = 1", "<test>", {
                bare: true,
                omit_baselib: true,
                bootstrap_timeout: 2000,
            });
            var elapsed = Date.now() - t0;
            assert.ok(elapsed < 200, "should not wait when DOM is already ready; elapsed=" + elapsed);
        },
    },

    {
        name: "sandbox_error_exported",
        description: "RapydScriptSandboxError class is exported on the namespace and the public RS object",
        run: function () {
            var loaded = load_bundle();
            assert.equal(typeof loaded.RS.RapydScriptSandboxError, "function",
                         "RapydScriptSandboxError must be exported on RS");
            // It must subclass Error so try/catch (Error) still catches it.
            var inst = new loaded.RS.RapydScriptSandboxError("nope", { hint: "test hint" });
            assert.equal(inst.name, "RapydScriptSandboxError");
            assert.equal(inst.message, "nope");
            assert.equal(inst.hint, "test hint");
            // Must look like an Error to host catch blocks.
            assert.ok(inst instanceof Error || inst.stack, "should carry an Error stack");
        },
    },

    {
        name: "runInContext_persists_function_declarations",
        description: "Top-level function declarations land on ctx so subsequent runInContext calls see them",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var ctx = shim_vm.createContext({});
            shim_vm.runInContext('function greet(n){return "hi " + n;}', ctx);
            var result = shim_vm.runInContext('greet("Mike")', ctx);
            assert.equal(result, "hi Mike",
                         "second runInContext call should see the function from the first");
        },
    },

    {
        name: "runInContext_persists_let_and_var",
        description: "Top-level let/var declarations are captured into ctx for subsequent runInContext calls",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var ctx = shim_vm.createContext({});
            shim_vm.runInContext('let a = 10; var b = 20;', ctx);
            var sum = shim_vm.runInContext('a + b', ctx);
            assert.equal(sum, 30, "let a + var b should equal 30 across calls");
        },
    },

    {
        name: "runInContext_persists_multi_let",
        description: "Multi-name let declarations (let X, Y, Z) all get captured",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var ctx = shim_vm.createContext({});
            shim_vm.runInContext('let p, q, r; p = 1; q = 2; r = 3;', ctx);
            var sum = shim_vm.runInContext('p + q + r', ctx);
            assert.equal(sum, 6, "let p,q,r should all be captured");
        },
    },

    {
        name: "runInContext_throws_specific_error_on_null_ctx",
        description: "Passing a null ctx to runInContext throws RapydScriptSandboxError, not a vague TypeError",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var caught = null;
            try { shim_vm.runInContext('1+1', null); } catch (e) { caught = e; }
            assert.ok(caught, "should throw");
            assert.equal(caught.name, "RapydScriptSandboxError",
                         "should be the named error, got " + (caught && caught.name));
            assert.ok(/null|undefined|createContext/i.test(caught.message),
                      "message should mention the null ctx / createContext: " + caught.message);
            assert.ok(caught.hint, "should carry a remediation hint");
        },
    },

    {
        name: "createContext_attaches_shims_when_ctx_missing",
        description: "createContext({}) populates sha1sum, require, React on the returned ctx",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var ctx = shim_vm.createContext({});
            var keys = Object.keys(ctx).sort();
            assert.deepEqual(keys, ["React", "require", "sha1sum"]);
        },
    },

    {
        name: "createContext_preserves_user_props",
        description: "Properties already on the input ctx are not overwritten by the shim defaults",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var my_sha1 = function () { return "fake"; };
            var ctx = shim_vm.createContext({ sha1sum: my_sha1, custom: 42 });
            assert.equal(ctx.sha1sum, my_sha1, "user-provided sha1sum should win");
            assert.equal(ctx.custom, 42, "user-provided custom prop should pass through");
        },
    },

    {
        name: "find_top_level_decl_names_helper_correctness",
        description: "_rs_find_top_level_decl_names captures function / let / var / multi-decl, ignores indented",
        run: function () {
            var loaded = load_bundle();
            var shim_vm = loaded.RS.vm;
            var ctx = shim_vm.createContext({});
            var src = [
                "function top(){ function inner(){} return inner; }",
                "let single;",
                "let m1 = 1, m2 = 2, m3 = 3;",
                "var initonly = top;",
                "    function indented(){}",  // indented → must NOT be captured
            ].join("\n");
            shim_vm.runInContext(src, ctx);
            assert.equal(typeof ctx.top, "function", "top-level function should be captured");
            assert.ok("single" in ctx, "let with no init still creates a slot");
            assert.equal(ctx.m1, 1, "multi-let first name");
            assert.equal(ctx.m2, 2, "multi-let second name");
            assert.equal(ctx.m3, 3, "multi-let third name");
            assert.equal(typeof ctx.initonly, "function", "var-initialised reference to a function");
            assert.equal("indented" in ctx, false, "indented (nested) declaration must NOT be captured");
        },
    },

    {
        name: "await_tools_ready_resolves_in_no_dom_env",
        description: "_rs_await_tools_ready resolves immediately when document is not defined",
        run: async function () {
            var loaded = load_bundle();
            var helper = loaded.RS._rs_await_tools_ready;
            assert.equal(typeof helper, "function", "_rs_await_tools_ready should be exported on RS");
            var t0 = Date.now();
            await helper(5000);
            var elapsed = Date.now() - t0;
            assert.ok(elapsed < 100, "should resolve immediately when no document; elapsed=" + elapsed);
        },
    },

    {
        name: "sandbox_error_translates_csp_style_errors",
        description: "_rs_explain_sandbox_failure attaches a CSP-specific .hint when the error mentions unsafe-eval",
        run: function () {
            var loaded = load_bundle();
            var explain = loaded.RS._rs_explain_sandbox_failure;
            assert.equal(typeof explain, "function", "_rs_explain_sandbox_failure should be exported on RS");
            var csp_err = new Error("Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script");
            var translated = explain(csp_err, "foo.js");
            assert.equal(translated.name, "RapydScriptSandboxError");
            assert.ok(/unsafe-eval|Content Security Policy/i.test(translated.hint),
                      "should attach a CSP-specific hint: " + translated.hint);
            assert.ok(/foo\.js/.test(translated.message),
                      "should include the filename in the message: " + translated.message);
            assert.equal(translated.cause, csp_err, "should preserve original error as .cause");
        },
    },

    {
        name: "sandbox_error_translates_generic_errors",
        description: "_rs_explain_sandbox_failure leaves a generic hint when no specific signal is present",
        run: function () {
            var loaded = load_bundle();
            var explain = loaded.RS._rs_explain_sandbox_failure;
            var generic = new Error("Something exploded");
            var translated = explain(generic, undefined);
            assert.equal(translated.name, "RapydScriptSandboxError");
            assert.ok(translated.hint && translated.hint.length > 0, "should have a non-empty hint");
            assert.equal(translated.cause, generic);
        },
    },

    {
        name: "sandbox_error_idempotent",
        description: "_rs_explain_sandbox_failure does not double-wrap an already-translated error",
        run: function () {
            var loaded = load_bundle();
            var explain = loaded.RS._rs_explain_sandbox_failure;
            var original = explain(new Error("first"), "a.js");
            var second = explain(original, "b.js");
            assert.strictEqual(original, second, "passing in an existing sandbox error should return it unchanged");
        },
    },
];

// ── Runner ──────────────────────────────────────────────────────────────────

async function run_tests(filter) {
    var tests = filter
        ? TESTS.filter(function (t) { return t.name === filter; })
        : TESTS;
    if (!tests.length) {
        console.error(colored("No test found: " + filter, "red"));
        process.exit(1);
    }
    var failures = [];
    for (var i = 0; i < tests.length; i++) {
        var test = tests[i];
        try {
            var ret = test.run();
            if (ret && typeof ret.then === "function") await ret;
            console.log(colored("PASS  " + test.name, "green") + "  –  " + test.description);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") + "\n      " + (e.stack || String(e)) + "\n");
        }
    }
    var passed = tests.length - failures.length;
    console.log("");
    if (failures.length) {
        console.log(colored("Failed tests:", "red"));
        failures.forEach(function (n) { console.log(colored("  ✗ " + n, "red")); });
        console.log("");
    }
    console.log("vm-shim tests — " +
        colored("passed: " + passed, "green") + "  " +
        (failures.length ? colored("failed: " + failures.length, "red") : colored("failed: 0", "green")) +
        "  total: " + tests.length);
    process.exit(failures.length ? 1 : 0);
}

run_tests(process.argv[2] || null).catch(function (e) {
    console.error(colored("Test runner crashed: " + (e.stack || e), "red"));
    process.exit(2);
});
