#!/usr/bin/env node
// tools/build-language-service.js
// Bundles src/monaco-language-service/*.js into a single ES module.
// No external dependencies — pure Node.js string processing.
//
// Usage:
//   node tools/build-language-service.js [--out <path>]
//   npm run build:ls

"use strict";

var fs   = require("fs");
var path = require("path");

var SRC_DIR     = path.join(__dirname, "..", "src", "monaco-language-service");
var COMPILER_JS = path.join(__dirname, "..", "web-repl", "rapydscript.js");
var DEFAULT_OUT = path.join(__dirname, "..", "web-repl", "language-service.js");

// Parse --out flag
var out_path = DEFAULT_OUT;
var argv = process.argv.slice(2);
var out_idx = argv.indexOf("--out");
if (out_idx !== -1 && argv[out_idx + 1]) {
    out_path = path.resolve(argv[out_idx + 1]);
}

// ── Dependency order ──────────────────────────────────────────────────────────
// Files are listed in topological order so that when imports are stripped,
// all referenced identifiers are already defined above.

var FILES = [
    "scope.js",        // no internal deps
    "diagnostics.js",  // no internal deps
    "analyzer.js",     // imports from scope.js
    "completions.js",  // imports from analyzer.js
    "signature.js",    // no internal deps
    "dts.js",          // no internal deps
    "builtins.js",     // no internal deps
    "hover.js",        // imports from dts.js, builtins.js (type refs only)
    "index.js",        // imports from all above
];

// ── Public exports ────────────────────────────────────────────────────────────
// Only registerRapydScript is part of the public API.
// Internal classes (ScopeMap, SourceAnalyzer, Diagnostics, …) remain accessible
// via the returned service object but are not re-exported.

var PUBLIC_EXPORTS = ["registerRapydScript", "web_repl"];

// ── Embed the RapydScript compiler ────────────────────────────────────────────
// rapydscript.js uses (function(external_namespace){...})(this) to attach to
// the global.  In strict ES modules `this` is undefined, so we wrap it in an
// IIFE that passes a plain object and captures the result as _RS_COMPILER.

var compiler_src = fs.readFileSync(COMPILER_JS, "utf8").replace(/\r\n/g, "\n");

// Strip leading vim modeline comment (first line).
compiler_src = compiler_src.replace(/^\/\/[^\n]*\n/, "");

// Replace the trailing })(this); with })(_container); so the namespace is
// captured into our container object instead of being attached to the global.
compiler_src = compiler_src.replace(/\}\)\(this\)\s*;?\s*$/, "})(_container);");

// Augmentation code injected inside the IIFE (has access to `namespace` and
// `create_compiler` which are private locals inside rapydscript.js).
// The language service needs parse(), OutputStream, SyntaxError, ImportError,
// NATIVE_CLASSES, tree_shake, and ALL AST_* classes — all of which live on the
// inner compiler object returned by create_compiler(), not on the outer namespace.
// We expose them lazily: on first access the inner compiler is eval'd once and
// ALL of its keys (including every AST_ class) are copied onto namespace.
var augment_src = [
    "",
    "// Expose inner compiler API (parse, OutputStream, AST_*, etc.) on namespace",
    "// for the language service. Lazily initialises the inner compiler on first",
    "// property access so the large eval() only runs when actually needed.",
    "(function() {",
    "    var _inner = null;",
    "    function _initInner() {",
    "        if (_inner) return;",
    "        _inner = create_compiler();",
    "        // Copy every key from the inner compiler (including all AST_* classes)",
    "        // directly onto namespace, skipping keys that already have lazy getters.",
    "        var keys = Object.keys(_inner);",
    "        for (var i = 0; i < keys.length; i++) {",
    "            var k = keys[i];",
    "            if (!(k in namespace)) namespace[k] = _inner[k];",
    "        }",
    "    }",
    "    // Install lazy getters for a small set of sentinel keys so that the",
    "    // inner compiler is initialised on first use.  The getter returns",
    "    // _inner[k] directly to avoid re-entering the getter (namespace[k]",
    "    // would recurse because the getter is still installed).",
    "    var LAZY_KEYS = ['parse','OutputStream','SyntaxError','ImportError','NATIVE_CLASSES','tree_shake'];",
    "    LAZY_KEYS.forEach(function(k) {",
    "        if (!(k in namespace)) {",
    "            Object.defineProperty(namespace, k, {",
    "                get: function() { _initInner(); return _inner[k]; },",
    "                configurable: true,",
    "                enumerable:   false,",
    "            });",
    "        }",
    "    });",
    "})();",
    "",
].join("\n");

// Inject augmentation just before the closing })(_container);
compiler_src = compiler_src.replace(/\}\)\(_container\)\s*;?\s*$/, augment_src + "})(_container);");

var compiler_chunk = [
    "// ── rapydscript.js (embedded compiler) " + "─".repeat(29),
    "",
    "const _RS_COMPILER = (() => {",
    "    const _container = {};",
    compiler_src,
    "    return _container.RapydScript;",
    "})();",
    "",
].join("\n");

// ── Process each file ─────────────────────────────────────────────────────────

var chunks = [
    "// language-service.js — RapydScript Monaco Language Service",
    "// Auto-generated by tools/build-language-service.js — do not edit directly.",
    "// Source: src/monaco-language-service/  +  web-repl/rapydscript.js (embedded)",
    "// Usage:  import { registerRapydScript } from './language-service.js';",
    "//         No external compiler bundle needed — the compiler is bundled inside.",
    "",
    compiler_chunk,
];

FILES.forEach(function (file) {
    var src = fs.readFileSync(path.join(SRC_DIR, file), "utf8").replace(/\r\n/g, "\n");

    var processed = src
        // 1. Remove import lines (all resolved by concatenation order).
        //    Handles both single-line imports, including those with extra whitespace.
        .replace(/^import\s+\{[^}]*\}\s+from\s+['"][^'"]+['"]\s*;?\r?\n/gm, "")
        // 2. Strip the `export` keyword from inline class/function declarations.
        .replace(/^export\s+((?:class|function)\s)/gm, "$1")
        // 3. Remove any bare `export { ... };` blocks left over.
        .replace(/^export\s+\{[^}]*\}\s*;?\r?\n/gm, "")
        // 4. In index.js: make options.compiler optional — fall back to the
        //    embedded _RS_COMPILER captured above.
        .replace(
            "const compiler = options.compiler;\n        if (!compiler) throw new Error('registerRapydScript: options.compiler is required');",
            "const compiler = options.compiler || _RS_COMPILER;\n        if (!compiler) throw new Error('registerRapydScript: compiler bundle not found');"
        )
        // 5. Update the usage comment in index.js to reflect that compiler is optional.
        .replace(
            "//     compiler:     window.RapydScript,   // compiled rapydscript bundle",
            "//     compiler:     window.RapydScript,   // optional — embedded compiler is used by default"
        )
        .trimEnd();

    chunks.push(
        "",
        "// ── " + file + " " + "─".repeat(Math.max(1, 68 - file.length)),
        "",
        processed,
        ""
    );
});

// ── Compiler utility exports ──────────────────────────────────────────────────
chunks.push(
    "// ── Compiler utility exports " + "─".repeat(41),
    "",
    "/** Returns a web_repl compiler instance (same as RapydScript.web_repl()). */",
    "function web_repl() { return _RS_COMPILER.web_repl(); }",
    ""
);

// ── Final named export ────────────────────────────────────────────────────────
chunks.push("export { " + PUBLIC_EXPORTS.join(", ") + " };", "");

var output = chunks.join("\n");

// Ensure output directory exists
var out_dir = path.dirname(out_path);
if (!fs.existsSync(out_dir)) {
    fs.mkdirSync(out_dir, { recursive: true });
}

fs.writeFileSync(out_path, output, "utf8");

var rel = path.relative(process.cwd(), out_path);
var kb  = (output.length / 1024).toFixed(1);
console.log("Built: " + rel + " (" + kb + " KB)");
