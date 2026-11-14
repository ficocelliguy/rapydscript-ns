/* vim:fileencoding=utf-8
 *
 * Runs one compiled RapydScript program and reports what it does as a stream of events:
 *   { type: "out" | "err" | "warn" | "result" | "error" | "done", ... }
 *
 * Three hosts load this file:
 *   - a dedicated Worker (the normal case), so a runaway loop can be terminated;
 *   - the page itself, when Workers are unavailable (e.g. index.html opened via file://);
 *   - Node, for test/unit/web-repl.js.
 */
(function (root) {
    "use strict";

    // Captured before run() instruments the timers, so polling below never counts itself.
    var host_set_timeout = setTimeout;
    var host_clear_timeout = clearTimeout;

    function format_arg(x) {
        if (typeof x === "string") return x;
        try {
            if (x && typeof x === "object" && !(x instanceof Error)) return JSON.stringify(x);
        } catch (e) { /* fall through */ }
        return String(x);
    }

    function error_event(e) {
        if (e && typeof e === "object") {
            return {
                type: "error",
                name: String(e.name || (e.constructor && e.constructor.name) || "Error"),
                message: String(e.message === undefined ? e : e.message),
                stack: String(e.stack || ""),
            };
        }
        return { type: "error", name: "Error", message: String(e), stack: "" };
    }

    function source_suffix(filename, source_map) {
        var suffix = "\n//# sourceURL=" + filename + ".js\n";
        if (source_map && typeof btoa === "function") {
            // Lets browser devtools step through the Python source.
            var bytes = new TextEncoder().encode(source_map), bin = "";
            for (var i = 0; i < bytes.length; i += 0x8000)
                bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
            suffix += "//# sourceMappingURL=data:application/json;base64," + btoa(bin) + "\n";
        }
        return suffix;
    }

    /**
     * Run `code` (output of web_repl().compile_mapped) in a fresh REPL context.
     *
     *   RS      the RapydScript namespace (from rapydscript.js)
     *   g       the global object compiled code resolves `console` / timers against;
     *           its console and timer functions are replaced for the duration of the run
     *   opts    { filename, source_map, show_result, post(event) }
     *
     * Resolves with the exit code once the program and every timer it started have finished.
     * Exceptions from timer callbacks are reported; host-specific hooks (unhandledrejection)
     * can report more through the returned `report_error`.
     */
    function run(RS, g, opts) {
        var post = opts.post;
        var failed = false;
        var pending = new Set();
        var saved = {
            console: g.console, setTimeout: g.setTimeout, clearTimeout: g.clearTimeout,
            setInterval: g.setInterval, clearInterval: g.clearInterval,
        };

        function report_error(e) {
            failed = true;
            post(error_event(e));
        }

        function guarded(fn, args) {
            try {
                if (typeof fn === "function") fn.apply(null, args);
            } catch (e) {
                report_error(e);
            }
        }

        var log = function (type) {
            return function () { post({ type: type, text: Array.prototype.map.call(arguments, format_arg).join(" ") }); };
        };
        g.console = { log: log("out"), info: log("out"), debug: log("out"), warn: log("warn"), error: log("err") };
        g.setTimeout = function (fn, ms) {
            var args = Array.prototype.slice.call(arguments, 2);
            var id = host_set_timeout(function () { pending.delete(id); guarded(fn, args); }, ms);
            pending.add(id);
            return id;
        };
        g.clearTimeout = function (id) { pending.delete(id); host_clear_timeout(id); };
        g.setInterval = function (fn, ms) {
            var args = Array.prototype.slice.call(arguments, 2);
            var handle = {};
            var tick = function () {
                handle.id = host_set_timeout(tick, ms);
                guarded(fn, args);
            };
            handle.id = host_set_timeout(tick, ms);
            pending.add(handle);
            return handle;
        };
        g.clearInterval = function (handle) {
            if (handle && handle.id !== undefined) host_clear_timeout(handle.id);
            pending.delete(handle);
        };

        var repl;
        try {
            repl = RS.web_repl();
            repl.replace_print(function (text) { post({ type: "out", text: text }); });
            var value = repl.runjs(opts.code + source_suffix(opts.filename, opts.source_map));
            if (opts.show_result && value !== undefined) post({ type: "result", text: String(value) });
        } catch (e) {
            report_error(e);
        }

        var promise = new Promise(function (resolve) {
            (function settle() {
                // A zero-delay wait also drains pending promise callbacks.
                if (pending.size) return host_set_timeout(settle, 10);
                host_set_timeout(function () {
                    if (pending.size) return settle();
                    resolve(failed ? 1 : 0);
                }, 0);
            })();
        });
        return {
            promise: promise,
            report_error: report_error,
            restore: function () { Object.keys(saved).forEach(function (k) { g[k] = saved[k]; }); },
        };
    }

    var api = { run: run, error_event: error_event };

    var in_worker = typeof WorkerGlobalScope !== "undefined" && root instanceof WorkerGlobalScope;
    if (in_worker) {
        root.importScripts("rapydscript.js");
        var current = null;
        root.addEventListener("unhandledrejection", function (ev) {
            ev.preventDefault();
            if (current) current.report_error(ev.reason);
        });
        root.addEventListener("error", function (ev) {
            ev.preventDefault();
            if (current) current.report_error(ev.error || ev.message);
        });
        root.onmessage = function (msg) {
            var data = msg.data;
            current = run(root.RapydScript, root, {
                code: data.code, filename: data.filename, source_map: data.source_map,
                show_result: data.show_result,
                post: function (ev) { root.postMessage(ev); },
            });
            current.promise.then(function (exit_code) { root.postMessage({ type: "done", exit_code: exit_code }); });
        };
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    } else {
        root.RapydScriptRunner = api;
    }
})(typeof self !== "undefined" ? self : this);
