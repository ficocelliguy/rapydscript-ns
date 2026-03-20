/*
 * test/unit/language-service-bundle.js
 *
 * Verifies that the built language-service/index.js can be loaded as an
 * ES module without errors (e.g. duplicate top-level declarations).
 *
 * Usage:
 *   node test/unit/language-service-bundle.js
 */
"use strict";

var path   = require("path");
var url    = require("url");
var fs     = require("fs");
var utils  = require("../../tools/utils");
var colored = utils.safe_colored;

var bundle_path = path.join(__dirname, "../../language-service/index.js");

if (!fs.existsSync(bundle_path)) {
    console.error(colored("SKIP  language_service_bundle_loads", "yellow") +
        "  –  language-service/index.js not found; run: npm run build:ls");
    process.exit(0);
}

var bundle_url = url.pathToFileURL(bundle_path).href;

import(bundle_url).then(function (mod) {
    var passed = 0;
    var failed = 0;

    function pass(name, desc) {
        passed++;
        console.log(colored("PASS  " + name, "green") + "  \u2013  " + desc);
    }
    function fail(name, desc, err) {
        failed++;
        console.log(colored("FAIL  " + name, "red") +
            "  \u2013  " + desc + "\n      " + (err.message || String(err)));
    }

    // Test 1: module loads without parse/runtime errors (implicit — we got here)
    pass("language_service_bundle_loads",
        "language-service/index.js loads as an ES module without errors");

    // Test 2: registerRapydScript is exported
    try {
        if (typeof mod.registerRapydScript !== "function")
            throw new Error("registerRapydScript is not a function, got: " + typeof mod.registerRapydScript);
        pass("language_service_bundle_exports_register",
            "registerRapydScript is exported as a function");
    } catch (e) {
        fail("language_service_bundle_exports_register",
            "registerRapydScript is exported as a function", e);
    }

    // Test 3: web_repl is exported
    try {
        if (typeof mod.web_repl !== "function")
            throw new Error("web_repl is not a function, got: " + typeof mod.web_repl);
        pass("language_service_bundle_exports_web_repl",
            "web_repl is exported as a function");
    } catch (e) {
        fail("language_service_bundle_exports_web_repl",
            "web_repl is exported as a function", e);
    }

    console.log("");
    if (failed) {
        console.log(colored(failed + " test(s) failed.", "red"));
        process.exit(1);
    } else {
        console.log(colored("All " + passed + " language-service-bundle tests passed!", "green"));
    }

}).catch(function (e) {
    console.log(colored("FAIL  language_service_bundle_loads", "red") +
        "  \u2013  language-service/index.js failed to load as an ES module");
    console.log("      " + (e.message || String(e)));
    console.log("");
    console.log(colored("1 test(s) failed.", "red"));
    process.exit(1);
});
