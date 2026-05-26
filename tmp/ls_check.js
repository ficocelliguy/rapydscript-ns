"use strict";
// Try the language service on multi-line anon defs.
const RS = require("C:/Users/Mike/work/rapydscript-n/tools/compiler").create_compiler();
const { Diagnostics } = require("C:/Users/Mike/work/rapydscript-n/src/monaco-language-service/diagnostics.js");

const src = [
    "def apply(fn, value):",
    "    return fn(value)",
    "",
    "answer = apply(def(x):",
    "    y = x + 1",
    "    z = y * 2",
    "    return z",
    ", 10)",
    "print(answer)",
].join("\n");

const d = new Diagnostics(RS, {});
const markers = d.check(src);
console.log(JSON.stringify(markers, null, 2));
