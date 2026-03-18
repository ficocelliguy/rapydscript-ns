/*
 * test/unit/run-language-service.js
 *
 * Runs all language-service unit tests in sequence.
 * Each test file runs in its own Node.js process so ES-module imports
 * and process.exit() calls are fully isolated.
 *
 * Usage:
 *   node test/unit/run-language-service.js
 *   npm run test:ls
 */
"use strict";

var path  = require("path");
var spawn = require("child_process").spawnSync;
var utils = require("../../tools/utils");
var colored = utils.safe_colored;

var FILES = [
    "language-service.js",
    "language-service-scope.js",
    "language-service-completions.js",
    "language-service-signature.js",
    "language-service-hover.js",
    "language-service-dts.js",
    "language-service-builtins.js",
    "language-service-bundle.js",
    "web-repl.js",
];

var failed = false;

FILES.forEach(function (file) {
    var result = spawn(
        process.execPath,
        [path.join(__dirname, file)],
        { stdio: "inherit" }
    );
    if (result.status !== 0) failed = true;
});

process.exit(failed ? 1 : 0);
