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
var LIB_DIR     = path.join(__dirname, "../../src/lib");

if (!fs.existsSync(bundle_path)) {
    console.error(colored("SKIP  language_service_bundle_loads", "yellow") +
        "  –  language-service/index.js not found; run: npm run build:ls");
    process.exit(0);
}

// Return the module names of every importable library under src/lib/ — i.e.,
// every <name>.pyj file and every sub-package directory that contains an
// __init__.pyj.  Cache files (.pyj-cached) are skipped.
function get_lib_module_names() {
    var names = [];
    fs.readdirSync(LIB_DIR).forEach(function (f) {
        if (f.endsWith(".pyj-cached")) return;
        if (f.endsWith(".pyj")) {
            names.push(f.replace(/\.pyj$/, ""));
            return;
        }
        var full = path.join(LIB_DIR, f);
        try {
            var stat = fs.statSync(full);
            if (stat.isDirectory() && fs.existsSync(path.join(full, "__init__.pyj"))) {
                names.push(f);
            }
        } catch (e) {}
    });
    return names;
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

    // Test 4: STDLIB_MODULES is exported as a non-empty array
    try {
        if (!Array.isArray(mod.STDLIB_MODULES) || mod.STDLIB_MODULES.length === 0)
            throw new Error("STDLIB_MODULES is not a non-empty array, got: " +
                JSON.stringify(mod.STDLIB_MODULES));
        pass("language_service_bundle_exports_stdlib_modules",
            "STDLIB_MODULES is exported as a non-empty array");
    } catch (e) {
        fail("language_service_bundle_exports_stdlib_modules",
            "STDLIB_MODULES is exported as a non-empty array", e);
    }

    // Test 5: every module under src/lib/ is present in the bundle's STDLIB_MODULES.
    // This catches stale bundles where the built language-service drifts behind
    // newly added library files (the failure mode that caused the itertools
    // regression report against the 0.9.5 release).
    try {
        if (!Array.isArray(mod.STDLIB_MODULES))
            throw new Error("STDLIB_MODULES is not an array — earlier test should have caught this");
        var bundle_set = Object.create(null);
        mod.STDLIB_MODULES.forEach(function (n) { bundle_set[n] = true; });
        var lib_names = get_lib_module_names();
        var missing = lib_names.filter(function (name) { return !bundle_set[name]; });
        if (missing.length) {
            throw new Error(
                "The bundled language-service is missing these src/lib/ modules from " +
                "STDLIB_MODULES — rebuild with `npm run build:ls`:\n  " + missing.join(", ")
            );
        }
        pass("language_service_bundle_stdlib_covers_all_lib_files",
            "every src/lib/ module is recognised by the bundled STDLIB_MODULES");
    } catch (e) {
        fail("language_service_bundle_stdlib_covers_all_lib_files",
            "every src/lib/ module is recognised by the bundled STDLIB_MODULES", e);
    }

    // Test 6: every non-pseudo entry in the bundle's STDLIB_MODULES corresponds
    // to a real src/lib/*.pyj file.  Catches typos and modules removed from
    // src/lib/ but left behind in the constant.
    try {
        if (!Array.isArray(mod.STDLIB_MODULES))
            throw new Error("STDLIB_MODULES is not an array — earlier test should have caught this");
        var PSEUDO = { '__python__': true, '__builtins__': true };
        var lib_set = Object.create(null);
        get_lib_module_names().forEach(function (n) { lib_set[n] = true; });
        var phantom = mod.STDLIB_MODULES.filter(function (m) {
            return !PSEUDO[m] && !lib_set[m];
        });
        if (phantom.length) {
            throw new Error(
                "The bundled STDLIB_MODULES contains entries with no matching " +
                "src/lib/*.pyj file:\n  " + phantom.join(", ")
            );
        }
        pass("language_service_bundle_stdlib_no_phantom_entries",
            "every non-pseudo entry in the bundled STDLIB_MODULES exists in src/lib/");
    } catch (e) {
        fail("language_service_bundle_stdlib_no_phantom_entries",
            "every non-pseudo entry in the bundled STDLIB_MODULES exists in src/lib/", e);
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
