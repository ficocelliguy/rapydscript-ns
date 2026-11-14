#!/usr/bin/env node
// tools/serve-repl.js
// Serves the repository over HTTP so the web REPL can run programs in a Worker and load the
// language service from ../language-service/ (neither works from file://).
//
// Usage:
//   node tools/serve-repl.js [port]      then open http://localhost:<port>/web-repl/
//   npm run repl

"use strict";

var fs = require("fs");
var http = require("http");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var PORT = Number(process.argv[2]) || Number(process.env.PORT) || 8765;
var TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".pyj": "text/plain; charset=utf-8",
    ".map": "application/json; charset=utf-8",
};

http.createServer(function (req, res) {
    var url_path = decodeURIComponent(req.url.split("?")[0]);
    if (url_path === "/") {
        res.writeHead(302, { Location: "/web-repl/" });
        return res.end();
    }
    var file = path.join(ROOT, url_path);
    if (file !== ROOT && file.indexOf(ROOT + path.sep) !== 0) {
        res.writeHead(403);
        return res.end("forbidden");
    }
    fs.stat(file, function (err, stat) {
        if (!err && stat.isDirectory()) file = path.join(file, "index.html");
        fs.readFile(file, function (err2, data) {
            if (err2) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                return res.end("not found: " + url_path);
            }
            res.writeHead(200, {
                "Content-Type": TYPES[path.extname(file)] || "application/octet-stream",
                "Cache-Control": "no-store",
            });
            res.end(data);
        });
    });
}).listen(PORT, function () {
    console.log("RapydScript REPL: http://localhost:" + PORT + "/web-repl/");
});
