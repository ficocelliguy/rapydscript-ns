// RapydScript playground: Python-flavoured source on the left, the JavaScript it compiles to on
// the right, program output below. The source recompiles on every edit. Hovering or selecting a
// line on either side highlights the lines it maps to on the other, via the compiler's source map.

const $ = (id) => document.getElementById(id);
const RS = window.RapydScript;
const { EXAMPLES, VIRTUAL_FILES } = window.RapydScriptExamples;
const FILENAME = "main.py";
const RUN_TIMEOUT_MS = 10_000;
const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/";
const COMPILE_MARKER_OWNER = "rapydscript-compile";
const CAN_USE_WORKERS = typeof Worker !== "undefined" && location.protocol !== "file:";

// ---------------------------------------------------------------- source maps

function decodeMappings(mappings) {
    const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const out = [];
    let srcLine = 0;
    let srcCol = 0;
    mappings.split(";").forEach((line, genLine) => {
        let genCol = 0;
        for (const seg of line.split(",")) {
            if (!seg) continue;
            const vals = [];
            let shift = 0;
            let value = 0;
            for (const ch of seg) {
                const d = B64.indexOf(ch);
                value += (d & 31) << shift;
                if (d & 32) shift += 5;
                else {
                    vals.push(value & 1 ? -(value >> 1) : value >> 1);
                    value = shift = 0;
                }
            }
            genCol += vals[0];
            srcLine += vals[2];
            srcCol += vals[3];
            out.push({ genLine, genCol, srcLine, srcCol });
        }
    });
    return out;
}

/** Python position (0-based) for a JS position (0-based): the closest mapping at or before it on that line. */
function originalPosition(segs, genLine, genCol) {
    let best = null;
    for (const m of segs) {
        if (m.genLine === genLine && m.genCol <= genCol && (!best || m.genCol >= best.genCol)) best = m;
    }
    return best ?? segs.find((m) => m.genLine === genLine) ?? null;
}

/**
 * For each JS line that starts with a closing bracket, the index of the line holding its opener
 * (else -1). Closing `}` / `})();` lines carry no mappings of their own; they borrow the opener's,
 * so hovering a Python `def` lights up the whole function body, braces included.
 */
function closerOpeners(lines) {
    const openers = new Array(lines.length).fill(-1);
    const stack = [];
    let quote = null;
    let blockComment = false;
    lines.forEach((line, i) => {
        const first = line.search(/\S/);
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];
            if (blockComment) {
                if (ch === "*" && line[c + 1] === "/") (blockComment = false), c++;
                continue;
            }
            if (quote) {
                if (ch === "\\") c++;
                else if (ch === quote) quote = null;
                continue;
            }
            if (ch === "/" && line[c + 1] === "/") break;
            if (ch === "/" && line[c + 1] === "*") (blockComment = true), c++;
            else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
            else if (ch === "{" || ch === "(" || ch === "[") stack.push(i);
            else if (ch === "}" || ch === ")" || ch === "]") {
                const open = stack.pop();
                if (c === first && open !== undefined) openers[i] = open;
            }
        }
        if (quote !== "`") quote = null; // only template literals span lines
    });
    return openers;
}

function buildLineMap(code, segs) {
    const lines = code.split("\n");
    const jsToPy = lines.map(() => new Set());
    for (const s of segs) jsToPy[s.genLine]?.add(s.srcLine);
    closerOpeners(lines).forEach((open, i) => {
        if (open >= 0 && !jsToPy[i].size) jsToPy[i] = new Set(jsToPy[open]);
    });
    const pyToJs = new Map();
    jsToPy.forEach((pyLines, jsLine) => {
        for (const p of pyLines) {
            if (!pyToJs.has(p)) pyToJs.set(p, []);
            pyToJs.get(p).push(jsLine);
        }
    });
    return { segs, jsToPy, pyToJs };
}

/** "3–7, 12" for [3,4,5,6,7,12] (1-based output for 0-based input). */
function formatRanges(lines) {
    const sorted = [...new Set(lines)].sort((a, b) => a - b);
    const parts = [];
    for (let i = 0; i < sorted.length; i++) {
        let j = i;
        while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
        parts.push(i === j ? `${sorted[i] + 1}` : `${sorted[i] + 1}–${sorted[j] + 1}`);
        i = j;
    }
    return parts.join(", ");
}

// ---------------------------------------------------------------- compile

const compiler = RS.web_repl();

function compileSource(source) {
    const t0 = performance.now();
    try {
        // reset() so classes and __python__ flags from the previous keystroke's compile don't leak in.
        compiler.reset();
        const ast = compiler.parse(source, { virtual_files: VIRTUAL_FILES });
        const last = ast.body[ast.body.length - 1];
        // Echo the program's final value, REPL-style, when it ends in a bare expression like `x * 2`.
        const showResult =
            last?.constructor.name === "AST_SimpleStatement" &&
            !["AST_Call", "AST_Assign"].includes(last.body?.constructor.name);
        compiler.reset();
        const out = compiler.compile_mapped(source, { virtual_files: VIRTUAL_FILES });
        const map = JSON.parse(out.sourceMap);
        map.sources = [FILENAME];
        return {
            ok: true,
            source,
            code: out.code,
            sourceMap: JSON.stringify(map),
            lineMap: buildLineMap(out.code, decodeMappings(map.mappings)),
            showResult,
            ms: performance.now() - t0,
        };
    } catch (e) {
        return {
            ok: false,
            source,
            error: { message: e.message || String(e), line: e.line, col: e.col, internal: !e.line, stack: e.stack },
            ms: performance.now() - t0,
        };
    }
}

// ---------------------------------------------------------------- run

let spareWorker = null;

function takeWorker() {
    const w = spareWorker ?? new Worker("runner.js");
    // Warm the next one now: importing the compiler bundle is most of a worker's start-up time.
    spareWorker = new Worker("runner.js");
    return w;
}

/** Run a successful compile. Returns { promise (resolves to exit code), stop() }. */
function runProgram(compiled, onEvent) {
    const message = { code: compiled.code, filename: FILENAME, source_map: compiled.sourceMap, show_result: compiled.showResult };

    if (!CAN_USE_WORKERS) {
        // file:// pages can't start workers: run in the page. Stop can't interrupt an infinite loop here.
        const onRejection = (ev) => {
            ev.preventDefault();
            handle.report_error(ev.reason);
        };
        window.addEventListener("unhandledrejection", onRejection);
        const handle = window.RapydScriptRunner.run(RS, window, { ...message, post: onEvent });
        const cleanup = () => {
            handle.restore();
            window.removeEventListener("unhandledrejection", onRejection);
        };
        let stopped;
        const stop = new Promise((resolve) => (stopped = resolve));
        return {
            promise: Promise.race([handle.promise, stop]).then((code) => (cleanup(), code)),
            stop: () => stopped(130),
        };
    }

    const worker = takeWorker();
    let finish;
    const promise = new Promise((resolve) => {
        let done = false;
        const timer = setTimeout(() => {
            onEvent({ type: "error", name: "Timeout", message: `stopped after ${RUN_TIMEOUT_MS / 1000} s (an infinite loop, or a timer that never stops?)`, stack: "" });
            finish(124);
        }, RUN_TIMEOUT_MS);
        finish = (code) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            worker.terminate();
            resolve(code);
        };
        worker.onmessage = ({ data }) => (data.type === "done" ? finish(data.exit_code) : onEvent(data));
        worker.onerror = (e) => {
            e.preventDefault();
            onEvent({ type: "error", name: "Error", message: e.message || "the runner worker failed to start", stack: "" });
            finish(1);
        };
        worker.postMessage(message);
    });
    return { promise, stop: () => finish(130) };
}

const FRAME_RE_V8 = new RegExp(`^\\s*at (?:(.+?) \\()?.*?${FILENAME.replace(/\./g, "\\.")}\\.js:(\\d+):(\\d+)\\)?$`);
const FRAME_RE_FF = new RegExp(`^(.*?)@.*?${FILENAME.replace(/\./g, "\\.")}\\.js:(\\d+):(\\d+)$`);

function pythonFunctionName(jsName) {
    let name = (jsName || "").replace(/^(async|new) /, "");
    if (!name || name === "eval") return "<module>";
    name = name.split(".").pop();
    return name === "ρσ_anonfunc" ? "<lambda>" : name;
}

/** Stack frames that point into the program, innermost first, mapped to Python lines (1-based). */
function mapStack(stack, compiled) {
    const frames = [];
    for (const line of (stack || "").split("\n")) {
        const m = FRAME_RE_V8.exec(line) || FRAME_RE_FF.exec(line);
        if (!m) continue;
        const pos = originalPosition(compiled.lineMap.segs, Number(m[2]) - 1, Number(m[3]) - 1);
        if (pos) frames.push({ fn: pythonFunctionName(m[1]), line: pos.srcLine + 1, col: pos.srcCol + 1 });
    }
    return frames;
}

// ---------------------------------------------------------------- editors + state

let monaco;
let pyEditor;
let jsEditor;
let pyDecorations;
let jsDecorations;
let errorDecorations;
let current = null; // the latest successful compile
let latest = null; // the latest compile, successful or not
let running = null;
let usingLanguageService = false;
let hover = null; // { side: "py" | "js", line, col } while the mouse is over an editor line
let focusSide = "py";

function setStatus(text, isError = false) {
    $("status").textContent = text;
    $("status").classList.toggle("error", isError);
}

const versionLabel = () => `RapydScript-ns v${RS.rs_version}`;

/** True when `current` was compiled from what is in the editor right now. */
const mappingLive = () => current && pyEditor && current.source === pyEditor.getValue();

function recompile() {
    const out = compileSource(pyEditor.getValue());
    latest = out;
    const model = pyEditor.getModel();
    if (out.ok) {
        current = out;
        if (jsEditor.getValue() !== out.code) {
            const top = jsEditor.getScrollTop();
            jsEditor.setValue(out.code);
            jsEditor.setScrollTop(top);
        }
        monaco.editor.setModelMarkers(model, COMPILE_MARKER_OWNER, []);
        setStatus(`${versionLabel()} · compiled ${model.getLineCount()} lines in ${out.ms.toFixed(1)} ms`);
    } else {
        const { line, col, message, internal } = out.error;
        if (internal) console.error(out.error.stack);
        if (!usingLanguageService || internal) {
            // The language service reports syntax errors itself; don't underline them twice.
            const ln = Math.min(Math.max(line || 1, 1), model.getLineCount());
            const startColumn = (col ?? 0) + 1;
            const word = model.getWordAtPosition({ lineNumber: ln, column: startColumn });
            monaco.editor.setModelMarkers(model, COMPILE_MARKER_OWNER, [
                {
                    startLineNumber: ln,
                    startColumn,
                    endLineNumber: ln,
                    endColumn: word ? word.endColumn : startColumn + 1,
                    message: internal ? `compiler error: ${message}` : message,
                    severity: monaco.MarkerSeverity.Error,
                },
            ]);
        }
        setStatus(internal ? `compiler crashed: ${message}` : `line ${line}: ${message}`, true);
    }
    $("js-pane").classList.toggle("stale", !out.ok);
    $("stale").hidden = out.ok || !current;
    $("run").disabled = !out.ok || running !== null;
    refreshHighlight();
}

function renderDiagnostics() {
    const model = pyEditor.getModel();
    const seen = new Set();
    const markers = monaco.editor
        .getModelMarkers({ resource: model.uri })
        .filter((m) => m.severity >= monaco.MarkerSeverity.Info)
        .sort((a, b) => a.startLineNumber - b.startLineNumber || b.severity - a.severity)
        .filter((m) => {
            const key = `${m.startLineNumber}:${m.message}`;
            return !seen.has(key) && seen.add(key);
        });
    const kind = (m) =>
        m.severity === monaco.MarkerSeverity.Error ? "error" : m.severity === monaco.MarkerSeverity.Warning ? "warning" : "info";
    $("diagnostics").replaceChildren(
        ...markers.map((m) => {
            const li = document.createElement("li");
            li.className = kind(m);
            li.textContent = `${m.startLineNumber}:${m.startColumn}  ${kind(m)}: ${m.message}`;
            li.onclick = () => goToPyLine(m.startLineNumber, m.startColumn);
            return li;
        }),
    );
    const errors = markers.filter((m) => kind(m) === "error").length;
    const warnings = markers.filter((m) => kind(m) === "warning").length;
    $("diag-summary").textContent = errors || warnings ? `${errors} error(s), ${warnings} warning(s)` : "no problems";
    $("diag-summary").className = errors ? "line-err" : warnings ? "line-warn" : "muted";
}

function goToPyLine(line, column = 1) {
    pyEditor.setPosition({ lineNumber: line, column });
    pyEditor.revealLineInCenterIfOutsideViewport(line);
    pyEditor.focus();
}

// ---------------------------------------------------------------- line mapping highlights

/**
 * 0-based lines covered by an editor's selection. Selecting whole lines (triple-click, clicking
 * line numbers, Shift+Down) leaves the selection ending at column 1 of the *next* line, which
 * must not count, or the highlight lands one line late.
 */
function selectedLines(editor) {
    const sel = editor.getSelection();
    if (!sel) return { lines: [], pos: null };
    let end = sel.endLineNumber;
    if (end > sel.startLineNumber && sel.endColumn === 1) end--;
    const lines = [];
    for (let l = sel.startLineNumber; l <= end; l++) lines.push(l - 1);
    return { lines, pos: sel.isEmpty() ? editor.getPosition() : null };
}

function lineDecorations(lines, className, gutterClass, rulerColor) {
    return lines.map((l) => ({
        range: new monaco.Range(l + 1, 1, l + 1, 1),
        options: {
            isWholeLine: true,
            className,
            linesDecorationsClassName: gutterClass,
            overviewRuler: rulerColor ? { color: rulerColor, position: monaco.editor.OverviewRulerLane.Full } : undefined,
        },
    }));
}

function refreshHighlight() {
    if (!pyDecorations) return;
    const clear = () => {
        pyDecorations.clear();
        jsDecorations.clear();
    };
    if (!mappingLive()) {
        clear();
        $("map-hint").textContent = latest && !latest.ok ? "fix the error to update the mapping" : "";
        return;
    }
    const { pyToJs, jsToPy, segs } = current.lineMap;
    let side;
    let lines;
    let pos = null;
    if (hover) {
        side = hover.side;
        lines = [hover.line];
        pos = { lineNumber: hover.line + 1, column: hover.col };
    } else {
        side = focusSide;
        ({ lines, pos } = selectedLines(side === "py" ? pyEditor : jsEditor));
    }

    const targets =
        side === "py" ? lines.flatMap((l) => pyToJs.get(l) ?? []) : lines.flatMap((l) => [...(jsToPy[l] ?? [])]);
    const unique = [...new Set(targets)];
    if (!unique.length) {
        clear();
        $("map-hint").textContent = side === "js" ? "runtime support code (no Python source)" : "no generated code";
        return;
    }
    const sourceLines = lines.filter((l) => (side === "py" ? pyToJs.has(l) : jsToPy[l]?.size));
    const [src, dst] = side === "py" ? [pyDecorations, jsDecorations] : [jsDecorations, pyDecorations];
    src.set(lineDecorations(sourceLines, "map-src", "map-src-gutter"));
    dst.set(lineDecorations(unique, "map-dst", "map-dst-gutter", "rgba(255, 212, 59, 0.7)"));

    const other = side === "py" ? jsEditor : pyEditor;
    other.revealLineInCenterIfOutsideViewport(Math.min(...unique) + 1, monaco.editor.ScrollType.Smooth);

    const srcName = side === "py" ? FILENAME : "main.js";
    const dstName = side === "py" ? "main.js" : FILENAME;
    let hint = `${srcName} ${formatRanges(lines)} → ${dstName} ${formatRanges(unique)}`;
    if (side === "js" && pos && lines.length === 1) {
        const m = originalPosition(segs, pos.lineNumber - 1, pos.column - 1);
        if (m) hint = `main.js ${pos.lineNumber}:${pos.column} → ${FILENAME} ${m.srcLine + 1}:${m.srcCol + 1}`;
    }
    $("map-hint").textContent = hint;
}

function setHover(side, position) {
    const next = position ? { side, line: position.lineNumber - 1, col: position.column } : null;
    if (next?.side === hover?.side && next?.line === hover?.line && next?.col === hover?.col) return;
    hover = next;
    refreshHighlight();
}

// ---------------------------------------------------------------- output

function log(text, cls = "") {
    const out = $("output");
    const atBottom = out.scrollHeight - out.scrollTop - out.clientHeight < 24;
    const span = document.createElement("span");
    if (cls) span.className = cls;
    span.textContent = text + "\n";
    $("output-log").append(span);
    if (atBottom) out.scrollTop = out.scrollHeight;
    return span;
}

function logTraceback(ev, compiled) {
    const frames = mapStack(ev.stack, compiled).reverse();
    const sourceLines = compiled.source.split("\n");
    if (frames.length) {
        log("Traceback (most recent call last):", "line-err");
        for (const f of frames) {
            const el = document.createElement("span");
            el.className = "frame";
            el.title = "Go to line";
            el.append(`  File "${FILENAME}", line ${f.line}, in ${f.fn}\n`);
            const code = (sourceLines[f.line - 1] ?? "").trim();
            if (code) el.append(Object.assign(document.createElement("span"), { className: "code", textContent: `    ${code}\n` }));
            el.onclick = () => goToPyLine(f.line, f.col);
            el.onmouseenter = () => mappingLive() && setHover("py", { lineNumber: f.line, column: f.col });
            el.onmouseleave = () => setHover(null);
            $("output-log").append(el);
        }
        const innermost = frames[frames.length - 1].line;
        if (compiled === current && mappingLive()) {
            errorDecorations.set([
                {
                    range: new monaco.Range(innermost, 1, innermost, 1),
                    options: {
                        isWholeLine: true,
                        className: "map-error",
                        overviewRuler: { color: "rgba(240, 107, 107, 0.8)", position: monaco.editor.OverviewRulerLane.Full },
                    },
                },
            ]);
        }
    }
    log(ev.name && ev.name !== "Error" && !ev.message.startsWith(ev.name) ? `${ev.name}: ${ev.message}` : ev.message || ev.name, "line-err");
}

function handleEvent(ev, compiled) {
    if (ev.type === "out") log(ev.text);
    else if (ev.type === "err") log(ev.text, "line-err");
    else if (ev.type === "warn") log(ev.text, "line-warn");
    else if (ev.type === "result") log(ev.text, "line-result");
    else if (ev.type === "error") logTraceback(ev, compiled);
}

function showTab(id) {
    document.querySelectorAll(".tabs button[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === id));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === id));
}

async function run() {
    if (running || !mappingLive()) return;
    const compiled = current;
    showTab("output");
    $("output-log").replaceChildren();
    errorDecorations.clear();
    $("run").disabled = true;
    $("stop").disabled = false;
    $("run-meta").textContent = "running…";
    const t0 = performance.now();
    running = runProgram(compiled, (ev) => handleEvent(ev, compiled));
    const exitCode = await running.promise;
    const ms = performance.now() - t0;
    const how = exitCode === 0 ? "finished" : exitCode === 130 ? "stopped" : exitCode === 124 ? "timed out" : `exited with ${exitCode}`;
    $("run-meta").textContent = `${how} in ${ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`}`;
    $("run-meta").className = exitCode === 0 ? "muted" : "line-err";
    running = null;
    $("stop").disabled = true;
    $("run").disabled = !mappingLive();
}

// ---------------------------------------------------------------- examples + sharing

function toBase64Url(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text) {
    const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function pipeThrough(bytes, stream) {
    return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

async function encodeShare(source) {
    const bytes = new TextEncoder().encode(source);
    if (typeof CompressionStream === "undefined") return `code=${toBase64Url(bytes)}`;
    return `z=${toBase64Url(await pipeThrough(bytes, new CompressionStream("deflate-raw")))}`;
}

async function decodeShare(hash) {
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    if (params.has("z")) return new TextDecoder().decode(await pipeThrough(fromBase64Url(params.get("z")), new DecompressionStream("deflate-raw")));
    if (params.has("code")) return new TextDecoder().decode(fromBase64Url(params.get("code")));
    return null;
}

function toast(text) {
    const el = Object.assign(document.createElement("div"), { className: "toast", textContent: text });
    document.body.append(el);
    setTimeout(() => el.remove(), 2200);
}

async function share() {
    const url = `${location.origin}${location.pathname}#${await encodeShare(pyEditor.getValue())}`;
    history.replaceState(null, "", url);
    try {
        await navigator.clipboard.writeText(url);
        toast("Link copied to clipboard");
    } catch {
        toast("Link is in the address bar");
    }
}

function loadSource(source) {
    hover = null;
    errorDecorations?.clear();
    pyEditor.setValue(source);
    pyEditor.setScrollTop(0);
    $("output-log").replaceChildren();
    $("run-meta").textContent = "";
}

function populateExamples(extra) {
    const options = [...(extra ? [extra] : []), ...EXAMPLES.map((e) => ({ id: e.id, label: e.label }))];
    $("examples").replaceChildren(
        ...options.map(({ id, label }) => Object.assign(document.createElement("option"), { value: id, textContent: label })),
    );
}

// ---------------------------------------------------------------- self-test

async function selfTest() {
    showTab("selftest-panel");
    const panel = $("selftest-results");
    const results = [];
    const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const render = (doneText) => {
        const passed = results.filter((r) => r.ok).length;
        const rows = results
            .map(
                (r) =>
                    `<tr><td class="${r.ok ? "pass" : "fail"}">${r.ok ? "PASS" : "FAIL"}</td><td>${escape(r.name)}</td><td>${escape(r.detail ?? "")}${
                        r.pre ? `<pre>${escape(r.pre)}</pre>` : ""
                    }</td></tr>`,
            )
            .join("");
        panel.innerHTML = `<p class="summary">${doneText ?? "running…"} <span class="${passed === results.length ? "pass" : "fail"}">${passed}/${results.length} passed</span>
            <button id="selftest" ${doneText ? "" : "disabled"}>Run again</button></p>
            <table><tr><th></th><th>check</th><th>detail</th></tr>${rows}</table>`;
        $("selftest").onclick = selfTest;
    };
    const add = (r) => {
        results.push(r);
        render();
    };
    const runCollect = async (compiled) => {
        const events = [];
        const exitCode = await runProgram(compiled, (ev) => events.push(ev)).promise;
        return {
            exitCode,
            stdout: events.filter((e) => e.type === "out").map((e) => e.text + "\n").join(""),
            error: events.find((e) => e.type === "error"),
        };
    };
    const t0 = performance.now();
    render();

    // 1. Every example compiles and prints exactly what it did when the examples were recorded.
    for (const ex of EXAMPLES) {
        const out = compileSource(ex.source);
        if (ex.expect_compile_error) {
            add({ ok: !out.ok && !out.error.internal, name: `example: ${ex.label}`, detail: out.ok ? "compiled, but should not have" : `line ${out.error.line}: ${out.error.message}` });
            continue;
        }
        if (!out.ok) {
            add({ ok: false, name: `example: ${ex.label}`, detail: `compile error: ${out.error.message}` });
            continue;
        }
        const { exitCode, stdout, error } = await runCollect(out);
        const ok = stdout === ex.expect && error?.name === ex.expect_error;
        let pre;
        if (!ok) {
            const want = ex.expect.split("\n");
            const got = stdout.split("\n");
            pre = want.flatMap((l, i) => (l === got[i] ? [] : [`line ${i + 1}: expected ${JSON.stringify(l)}, got ${JSON.stringify(got[i])}`])).join("\n");
            if (error?.name !== ex.expect_error) pre += `\nerror: expected ${ex.expect_error ?? "none"}, got ${error ? `${error.name}: ${error.message}` : "none"}`;
        }
        add({ ok, name: `example: ${ex.label}`, detail: `${want_lines(ex.expect)} lines, exit ${exitCode}, compiled in ${out.ms.toFixed(1)} ms`, pre });
    }

    // 2. Hovering `def fib():` finds `function fib(`, and back again.
    {
        const src = EXAMPLES.find((e) => e.id === "playground").source;
        const out = compileSource(src);
        const py = src.split("\n").findIndex((l) => l.startsWith("def fib("));
        const js = out.code.split("\n").findIndex((l) => /^function fib\(/.test(l));
        const forward = out.lineMap.pyToJs.get(py) ?? [];
        const back = [...(out.lineMap.jsToPy[js] ?? [])];
        add({
            ok: py >= 0 && js >= 0 && forward.includes(js) && back.length === 1 && back[0] === py,
            name: "line mapping: def fib() ↔ function fib()",
            detail: `${FILENAME} ${py + 1} → main.js ${formatRanges(forward)}; main.js ${js + 1} → ${FILENAME} ${formatRanges(back)}`,
        });
    }

    // 3. A runtime error's stack maps back to the Python lines of every frame.
    {
        const src = EXAMPLES.find((e) => e.id === "errors").source;
        const lines = src.split("\n");
        const want = [lines.findIndex((l) => l.includes("return table[key]")) + 1, lines.findIndex((l) => l.includes('"bob is"')) + 1];
        const out = compileSource(src);
        const { error } = await runCollect(out);
        const frames = error ? mapStack(error.stack, out) : [];
        const got = frames.map((f) => f.line);
        add({
            ok: got[0] === want[0] && got[1] === want[1] && frames[0].fn === "lookup" && frames[1].fn === "<module>",
            name: "traceback → Python lines",
            detail: frames.map((f) => `line ${f.line} in ${f.fn}`).join(", ") || "no frames mapped",
            pre: got[0] === want[0] && got[1] === want[1] ? undefined : `expected lines ${want.join(", ")}\n${error?.stack ?? ""}`,
        });
    }

    // 4. Runaway programs are stopped, not frozen.
    if (CAN_USE_WORKERS) {
        const out = compileSource("while True:\n    pass\n");
        const handle = runProgram(out, () => {});
        setTimeout(handle.stop, 300);
        const exitCode = await handle.promise;
        add({ ok: exitCode === 130, name: "infinite loop can be stopped", detail: `exit ${exitCode}` });
    }

    render(`done in ${((performance.now() - t0) / 1000).toFixed(1)} s.`);
    return results;
}

const want_lines = (text) => text.split("\n").length - 1;

// ---------------------------------------------------------------- layout

function initSplitters() {
    const layout = $("layout");
    const restore = (name) => {
        try {
            const v = localStorage.getItem(`rs-repl${name}`);
            if (v) layout.style.setProperty(name, v);
        } catch {
            /* storage unavailable */
        }
    };
    restore("--py-width");
    restore("--console-height");
    const drag = (handle, name, compute) => {
        handle.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            handle.setPointerCapture(e.pointerId);
            handle.classList.add("dragging");
            document.body.classList.add("resizing");
            const move = (ev) => layout.style.setProperty(name, compute(ev, layout.getBoundingClientRect()));
            const up = () => {
                handle.removeEventListener("pointermove", move);
                handle.removeEventListener("pointerup", up);
                handle.classList.remove("dragging");
                document.body.classList.remove("resizing");
                try {
                    localStorage.setItem(`rs-repl${name}`, layout.style.getPropertyValue(name));
                } catch {
                    /* storage unavailable */
                }
            };
            handle.addEventListener("pointermove", move);
            handle.addEventListener("pointerup", up);
        });
    };
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    drag($("split-v"), "--py-width", (e, r) => `${clamp(e.clientX - r.left, 220, r.width - 220)}px`);
    drag($("split-h"), "--console-height", (e, r) => `${clamp(r.bottom - e.clientY, 60, r.height - 140)}px`);
}

// ---------------------------------------------------------------- boot

async function loadMonaco() {
    window.MonacoEnvironment = {
        getWorkerUrl: () =>
            `data:text/javascript;charset=utf-8,${encodeURIComponent(
                `self.MonacoEnvironment = { baseUrl: "${MONACO_BASE}" }; importScripts("${MONACO_BASE}vs/base/worker/workerMain.js");`,
            )}`,
    };
    window.require.config({ paths: { vs: `${MONACO_BASE}vs` } });
    await new Promise((resolve, reject) => window.require(["vs/editor/editor.main"], resolve, reject));
    return window.monaco;
}

/**
 * Completions, hovers and lint from the language service: ./language-service/ in the GitHub Pages
 * build, ../language-service/ when served from the repo. The page works without it.
 */
async function importLanguageService() {
    let lastError;
    for (const path of ["./language-service/index.js", "../language-service/index.js"]) {
        try {
            return await import(new URL(path, import.meta.url).href);
        } catch (e) {
            lastError = e;
        }
    }
    throw lastError;
}

async function loadLanguageService() {
    if (location.protocol === "file:") return;
    try {
        const t0 = performance.now();
        const { registerRapydScript } = await importLanguageService();
        // The service attaches only to models that are already "rapydscript" when it registers.
        monaco.languages.register({ id: "rapydscript" });
        monaco.editor.setModelLanguage(pyEditor.getModel(), "rapydscript");
        registerRapydScript(monaco, { virtualFiles: VIRTUAL_FILES });
        usingLanguageService = true;
        if (latest?.ok !== false || !latest.error.internal) monaco.editor.setModelMarkers(pyEditor.getModel(), COMPILE_MARKER_OWNER, []);
        console.info(`RapydScript language service loaded in ${(performance.now() - t0).toFixed(0)} ms`);
    } catch (e) {
        console.info("RapydScript language service not available; editing without completions.", e);
    }
}

async function boot() {
    setStatus(`${versionLabel()} · loading editor…`);
    monaco = await loadMonaco();
    // The generated JS is read-only output; linting it is noise.
    monaco.languages.typescript?.javascriptDefaults.setDiagnosticsOptions({ noSemanticValidation: true, noSyntaxValidation: true });
    monaco.editor.defineTheme("rapydscript", {
        base: "vs-dark",
        inherit: true,
        rules: [],
        colors: {
            "editor.background": "#0e1117",
            "editorGutter.background": "#0e1117",
            "editor.lineHighlightBackground": "#151a2299",
            "editorLineNumber.foreground": "#4a5468",
            "editorLineNumber.activeForeground": "#9aa5b8",
        },
    });
    const common = {
        theme: "rapydscript",
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        fontFamily: getComputedStyle(document.documentElement).getPropertyValue("--mono"),
        scrollBeyondLastLine: false,
        renderLineHighlight: "gutter",
        lineDecorationsWidth: 8,
        // Generated code is full of ρσ_ helpers; don't flag them as look-alike characters.
        unicodeHighlight: { ambiguousCharacters: false },
    };
    pyEditor = monaco.editor.create($("py-editor"), {
        ...common,
        model: monaco.editor.createModel("", "python", monaco.Uri.parse(`file:///${FILENAME}`)),
        tabSize: 4,
        insertSpaces: true,
    });
    jsEditor = monaco.editor.create($("js-editor"), { ...common, language: "javascript", readOnly: true, value: "", domReadOnly: true });
    pyDecorations = pyEditor.createDecorationsCollection();
    jsDecorations = jsEditor.createDecorationsCollection();
    errorDecorations = pyEditor.createDecorationsCollection();

    let timer;
    pyEditor.onDidChangeModelContent(() => {
        errorDecorations.clear();
        refreshHighlight(); // the map is stale until the recompile lands
        clearTimeout(timer);
        timer = setTimeout(recompile, 150);
    });
    pyEditor.onDidChangeCursorSelection(() => ((focusSide = "py"), refreshHighlight()));
    jsEditor.onDidChangeCursorSelection(() => ((focusSide = "js"), refreshHighlight()));
    pyEditor.onDidFocusEditorText(() => ((focusSide = "py"), refreshHighlight()));
    jsEditor.onDidFocusEditorText(() => ((focusSide = "js"), refreshHighlight()));
    pyEditor.onMouseMove((e) => setHover("py", e.target.position));
    jsEditor.onMouseMove((e) => setHover("js", e.target.position));
    pyEditor.onMouseLeave(() => setHover(null));
    jsEditor.onMouseLeave(() => setHover(null));
    monaco.editor.onDidChangeMarkers((uris) => {
        if (uris.some((u) => u.toString() === pyEditor.getModel().uri.toString())) renderDiagnostics();
    });
    for (const ed of [pyEditor, jsEditor]) ed.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, run);
    window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            run();
        }
    });

    document.querySelectorAll(".tabs button[data-tab]").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
    $("run").onclick = run;
    $("stop").onclick = () => running?.stop();
    $("share").onclick = share;
    $("selftest").onclick = selfTest;
    $("clear").onclick = () => {
        $("output-log").replaceChildren();
        $("run-meta").textContent = "";
    };
    $("examples").onchange = (e) => {
        const ex = EXAMPLES.find((x) => x.id === e.target.value);
        if (!ex) return;
        history.replaceState(null, "", location.pathname + location.search);
        loadSource(ex.source);
    };
    initSplitters();

    let shared = null;
    try {
        shared = location.hash ? await decodeShare(location.hash) : null;
    } catch (e) {
        console.warn("could not read the shared program from the URL", e);
    }
    populateExamples(shared !== null ? { id: "shared", label: "Shared program" } : null);
    loadSource(shared ?? EXAMPLES[0].source);
    recompile();
    renderDiagnostics();
    pyEditor.focus();
    if (CAN_USE_WORKERS) spareWorker = new Worker("runner.js");
    else console.info("Opened from file:// — programs run in the page, so Stop can't interrupt an infinite loop. Serve the folder over HTTP for a sandboxed worker.");

    window.rapydscriptRepl = { compile: compileSource, run, selfTest, py: pyEditor, js: jsEditor };
    loadLanguageService();
}

boot().catch((e) => {
    console.error(e);
    setStatus(`failed to start: ${e.message}`, true);
});
