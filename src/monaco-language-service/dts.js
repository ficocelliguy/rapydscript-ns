// dts.js — Minimal .d.ts parser and type registry for the RapydScript language service.
//
// Parses a useful subset of TypeScript declaration syntax:
//   declare var / let / const name: Type;
//   declare function name(params): ReturnType;
//   declare class Name { ... }
//   interface Name { ... }
//   declare namespace Name { ... }
//   type Alias = Type;
//
// Usage:
//   import { DtsRegistry } from './dts.js';
//   const reg = new DtsRegistry();
//   reg.addDts('lib.dom', dtsText);
//   reg.getGlobalNames();          // string[]
//   reg.getGlobal('alert');        // TypeInfo | null
//   reg.getHoverMarkdown('alert'); // string  | null

// ---------------------------------------------------------------------------
// TypeInfo
// ---------------------------------------------------------------------------

export class TypeInfo {
    /**
     * @param {object} opts
     * @param {string}   opts.name
     * @param {string}   opts.kind  'var'|'function'|'class'|'interface'|'namespace'|'method'|'property'
     * @param {Array|null}  [opts.params]       [{name,type,optional,rest}]
     * @param {string|null} [opts.return_type]
     * @param {Map|null}    [opts.members]      Map<string, TypeInfo>
     * @param {string|null} [opts.doc]
     * @param {string}      [opts.source]       'dts'
     */
    constructor(opts) {
        this.name        = opts.name;
        this.kind        = opts.kind;
        this.params      = opts.params      || null;
        this.return_type = opts.return_type || null;
        this.members     = opts.members     || null;
        this.doc         = opts.doc         || null;
        this.source      = opts.source      || 'dts';
    }
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Find the index of the closing parenthesis that matches the opening one at
 * `start` in `str`.  Returns -1 if not found.
 */
function find_close_paren(str, start) {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
        if (str[i] === '(')      depth++;
        else if (str[i] === ')') { depth--; if (depth === 0) return i; }
    }
    return -1;
}

/**
 * Split a parameter list string on commas at depth 0, respecting
 * generic brackets `<>`, parens `()`, and square brackets `[]`.
 */
function split_params(s) {
    const parts = [];
    let depth = 0;
    let cur   = '';
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '<' || ch === '(' || ch === '[' || ch === '{') depth++;
        else if (ch === '>' || ch === ')' || ch === ']' || ch === '}') depth--;
        else if (ch === ',' && depth === 0) {
            parts.push(cur.trim());
            cur = '';
            continue;
        }
        cur += ch;
    }
    if (cur.trim()) parts.push(cur.trim());
    return parts;
}

/**
 * Parse a single parameter token like `name: Type`, `name?: Type`,
 * `...name: Type[]` into `{name, type, optional, rest}`.
 */
function parse_one_param(s) {
    const rest = s.startsWith('...');
    if (rest) s = s.slice(3);

    const colon = s.indexOf(':');
    let name, type;
    if (colon !== -1) {
        name = s.slice(0, colon).replace(/\?$/, '').trim();
        type = s.slice(colon + 1).trim();
    } else {
        name = s.replace(/\?$/, '').trim();
        type = 'any';
    }
    const optional = colon !== -1
        ? s.slice(0, colon).trimEnd().endsWith('?')
        : s.trimEnd().endsWith('?');

    return { name, type, optional, rest };
}

/**
 * Parse a `(...)` parameter section from a declaration string.
 * `decl` is the portion of text starting with `(`.
 * Returns `{ params, rest }` where `rest` is the text after the closing `)`.
 */
function parse_params_from(decl) {
    if (!decl.startsWith('(')) return { params: [], rest: decl };
    const close = find_close_paren(decl, 0);
    if (close < 0) return { params: [], rest: '' };
    const inner  = decl.slice(1, close);
    const rest   = decl.slice(close + 1);
    const params = inner.trim()
        ? split_params(inner).map(parse_one_param)
        : [];
    return { params, rest };
}

/**
 * Extract the return type from text like `: ReturnType;` or `): ReturnType {`.
 * Returns null if no type annotation is found.
 */
function parse_return_type(s) {
    const m = s.match(/^\s*:\s*(.+?)(?:\s*[;{]|$)/);
    return m ? m[1].trim() : null;
}

/**
 * Collect lines from a `/**...* /` block and return the trimmed doc text.
 */
function extract_jsdoc(lines) {
    const text = lines
        .map(l => l
            .replace(/^\s*\/\*\*?\s?/, '')
            .replace(/\*\/$/, '')
            .replace(/^\s*\*\s?/, '')
            .trim()
        )
        .filter(l => l.length > 0)
        .join(' ');
    return text || null;
}

// ---------------------------------------------------------------------------
// Block body collector
// ---------------------------------------------------------------------------

/**
 * Starting at line index `i`, collect all text up to and including the
 * matching closing `}`, tracking brace depth.
 * Returns `{ body, next_i }`.
 */
function collect_block(lines, i) {
    const body_lines = [];
    let depth = 0;
    while (i < lines.length) {
        const l = lines[i];
        for (const ch of l) {
            if (ch === '{') depth++;
            else if (ch === '}') depth--;
        }
        body_lines.push(l);
        i++;
        if (depth === 0 && body_lines.length > 0) break;
    }
    const joined = body_lines.join('\n');
    const open   = joined.indexOf('{');
    const close  = joined.lastIndexOf('}');
    const inner  = (open >= 0 && close > open) ? joined.slice(open + 1, close) : '';
    return { inner, next_i: i };
}

// ---------------------------------------------------------------------------
// Member parser (inside class / interface / namespace bodies)
// ---------------------------------------------------------------------------

function parse_members(text) {
    const members = new Map();
    const lines   = text.split('\n');
    let jsdoc_lines = [];
    let i = 0;

    while (i < lines.length) {
        const raw  = lines[i];
        const line = raw.trim();

        // JSDoc block
        if (line.startsWith('/**') || (line.startsWith('/*') && !line.startsWith('*/'))  ) {
            jsdoc_lines = [line];
            // If the block isn't closed on this line, keep reading
            if (!line.includes('*/')) {
                i++;
                while (i < lines.length && !lines[i].includes('*/')) {
                    jsdoc_lines.push(lines[i].trim());
                    i++;
                }
                if (i < lines.length) { jsdoc_lines.push(lines[i].trim()); i++; }
            } else {
                i++;
            }
            continue;
        }

        if (line.startsWith('//') || !line) {
            if (!line) jsdoc_lines = [];
            i++;
            continue;
        }

        const doc = extract_jsdoc(jsdoc_lines);
        jsdoc_lines = [];

        // Strip access modifiers and declaration keywords
        let l = line.replace(
            /^(?:static\s+|readonly\s+|abstract\s+|override\s+|protected\s+|private\s+|public\s+)*/,
            ''
        ).trim();
        // Inside namespaces, members can be prefixed with function/const/let/var
        const fn_kw = l.match(/^function\s+/);
        if (fn_kw) l = l.slice(fn_kw[0].length).trim();
        const var_kw = l.match(/^(?:const|let|var)\s+/);
        if (var_kw) l = l.slice(var_kw[0].length).trim();

        // Skip index signatures [key: Type]: Type
        if (l.startsWith('[')) { i++; continue; }

        // Skip nested blocks (e.g. nested namespace)
        if (/^(?:class|interface|namespace|module)\s/.test(l)) { i++; continue; }

        // method(...): ReturnType; or method(...) {
        const paren_idx = l.indexOf('(');
        if (paren_idx > 0) {
            const name = l.slice(0, paren_idx).replace(/[?<].*$/, '').trim();
            if (name && /^\w+$/.test(name) && name !== 'constructor') {
                const after_name = l.slice(paren_idx);
                const { params, rest } = parse_params_from(after_name);
                const return_type = parse_return_type(rest);
                members.set(name, new TypeInfo({
                    name,
                    kind:  'method',
                    params,
                    return_type,
                    doc,
                }));
            }
            i++;
            continue;
        }

        // property: Type;
        const prop_m = l.match(/^(\w+)\??\s*:\s*(.+?)\s*[;,]?$/);
        if (prop_m) {
            members.set(prop_m[1], new TypeInfo({
                name:        prop_m[1],
                kind:        'property',
                return_type: prop_m[2],
                doc,
            }));
            i++;
            continue;
        }

        i++;
    }

    return members;
}

// ---------------------------------------------------------------------------
// Top-level parser
// ---------------------------------------------------------------------------

/**
 * Parse a .d.ts file and return an array of TypeInfo objects (top-level only).
 * @param {string} text
 * @returns {TypeInfo[]}
 */
export function parse_dts(text) {
    const lines   = text.split('\n');
    const results = [];
    let jsdoc_lines = [];
    let i = 0;

    while (i < lines.length) {
        const raw  = lines[i];
        const line = raw.trim();

        // Accumulate JSDoc
        if (line.startsWith('/**') || (line.startsWith('/*') && !line.startsWith('*/'))) {
            jsdoc_lines = [line];
            if (!line.includes('*/')) {
                i++;
                while (i < lines.length && !lines[i].includes('*/')) {
                    jsdoc_lines.push(lines[i].trim());
                    i++;
                }
                if (i < lines.length) { jsdoc_lines.push(lines[i].trim()); i++; }
            } else {
                i++;
            }
            continue;
        }

        if (line.startsWith('//') || !line) {
            if (!line) jsdoc_lines = [];
            i++;
            continue;
        }

        const doc = extract_jsdoc(jsdoc_lines);
        jsdoc_lines = [];

        // Strip `export` and `declare` prefixes
        let l = line
            .replace(/^export\s+default\s+/, '')
            .replace(/^export\s+/, '')
            .replace(/^declare\s+/, '')
            .trim();

        // ── var / let / const ──────────────────────────────────────────────
        const var_m = l.match(/^(?:var|let|const)\s+(\w+)\s*(?::\s*(.+?))?\s*[;=]/);
        if (var_m) {
            results.push(new TypeInfo({
                name:        var_m[1],
                kind:        'var',
                return_type: var_m[2] ? var_m[2].trim() : null,
                doc,
            }));
            i++;
            continue;
        }

        // ── function ───────────────────────────────────────────────────────
        const fn_paren = l.indexOf('(');
        const fn_m     = fn_paren > 0 && l.match(/^function\s+(\w+)/);
        if (fn_m) {
            const name        = fn_m[1];
            const after_name  = l.slice(l.indexOf('('));
            const { params, rest } = parse_params_from(after_name);
            const return_type = parse_return_type(rest);
            results.push(new TypeInfo({ name, kind: 'function', params, return_type, doc }));
            i++;
            continue;
        }

        // ── class / interface / abstract class / namespace / module ────────
        const block_m = l.match(/^(abstract\s+class|class|interface|namespace|module)\s+(\w+)/);
        if (block_m) {
            const kind_raw = block_m[1].replace('abstract ', '').trim();
            const kind     = (kind_raw === 'module') ? 'namespace' : kind_raw;
            const name     = block_m[2];

            if (l.includes('{')) {
                // Block opens on this line — collect to matching '}'
                const { inner, next_i } = collect_block(lines, i);
                const members = parse_members(inner);
                results.push(new TypeInfo({ name, kind, members, doc }));
                i = next_i;
            } else {
                // Declaration without body (e.g. `declare class Foo;`)
                results.push(new TypeInfo({ name, kind, doc }));
                i++;
            }
            continue;
        }

        // ── type alias (no body extracted — just register the name) ────────
        const type_m = l.match(/^type\s+(\w+)\s*(?:<[^>]*>)?\s*=/);
        if (type_m) {
            results.push(new TypeInfo({ name: type_m[1], kind: 'var', doc }));
            i++;
            continue;
        }

        i++;
        jsdoc_lines = [];
    }

    return results;
}

// ---------------------------------------------------------------------------
// DtsRegistry
// ---------------------------------------------------------------------------

export class DtsRegistry {
    constructor() {
        this._globals = new Map();  // name → TypeInfo
    }

    /**
     * Parse and register a .d.ts file.  Calling this multiple times merges
     * all declarations into the same global namespace.
     * @param {string} _name   a label for this file (reserved for future dedup)
     * @param {string} text    the .d.ts source text
     */
    addDts(_name, text) {
        const types = parse_dts(text);
        for (const ti of types) {
            this._globals.set(ti.name, ti);
        }
    }

    /**
     * Return all registered global symbol names.
     * @returns {string[]}
     */
    getGlobalNames() {
        return Array.from(this._globals.keys());
    }

    /**
     * Return the TypeInfo for a name, or null.
     * @param {string} name
     * @returns {TypeInfo|null}
     */
    getGlobal(name) {
        return this._globals.get(name) || null;
    }

    /**
     * Return a Monaco hover markdown string for a name, or null.
     * @param {string} name
     * @returns {string|null}
     */
    getHoverMarkdown(name) {
        const ti = this.getGlobal(name);
        return ti ? build_dts_hover(ti) : null;
    }

    /**
     * Return completion-style member names for a type (used for dot-completion
     * on .d.ts-typed variables when Phase 6 type inference is wired up).
     * @param {string} name
     * @returns {string[]}
     */
    getMemberNames(name) {
        const ti = this.getGlobal(name);
        if (!ti || !ti.members) return [];
        return Array.from(ti.members.keys());
    }

    /**
     * Follow a dot-path through the type registry and return the TypeInfo
     * for the named member at the end of the chain.
     *
     * Examples:
     *   getMemberInfo('ns', 'hack')               → TypeInfo for NS.hack
     *   getMemberInfo('ns.hacknet', 'purchaseNode') → TypeInfo for Hacknet.purchaseNode
     *
     * @param {string} objectPath  dot-separated path (e.g. 'ns' or 'ns.hacknet')
     * @param {string} memberName  the attribute being accessed
     * @returns {TypeInfo|null}
     */
    getMemberInfo(objectPath, memberName) {
        const parts = objectPath.split('.');
        let ti = this._globals.get(parts[0]);
        // Dereference var → type (e.g. var ns: NS → NS interface)
        if (ti && !ti.members && ti.return_type) {
            ti = this._globals.get(ti.return_type);
        }
        // Walk remaining path segments
        for (let i = 1; i < parts.length && ti; i++) {
            const member = ti.members ? ti.members.get(parts[i]) : null;
            if (!member) { ti = null; break; }
            if (member.members) {
                ti = member;
            } else if (member.return_type) {
                ti = this._globals.get(member.return_type);
            } else {
                ti = null;
            }
        }
        if (!ti || !ti.members) return null;
        return ti.members.get(memberName) || null;
    }

    /**
     * Return hover markdown for a member accessed via a dot-path, or null.
     * @param {string} objectPath
     * @param {string} memberName
     * @returns {string|null}
     */
    getMemberHoverMarkdown(objectPath, memberName) {
        const ti = this.getMemberInfo(objectPath, memberName);
        return ti ? build_dts_hover(ti) : null;
    }
}

// ---------------------------------------------------------------------------
// DTS hover rendering
// ---------------------------------------------------------------------------

function build_dts_sig(ti) {
    if (ti.kind === 'function' || ti.kind === 'method') {
        const param_str = ti.params
            ? ti.params.map(function (p) {
                let s = p.rest ? '...' : '';
                s += p.name;
                if (p.optional) s += '?';
                if (p.type && p.type !== 'any') s += ': ' + p.type;
                return s;
            }).join(', ')
            : '';
        let sig = '(' + ti.kind + ') ' + ti.name + '(' + param_str + ')';
        if (ti.return_type && ti.return_type !== 'void') sig += ': ' + ti.return_type;
        return sig;
    }
    if (ti.kind === 'property' || ti.kind === 'var') {
        let sig = '(' + ti.kind + ') ' + ti.name;
        if (ti.return_type) sig += ': ' + ti.return_type;
        return sig;
    }
    return '(' + ti.kind + ') ' + ti.name;
}

function build_dts_hover(ti) {
    const sig = build_dts_sig(ti);
    let md = '```typescript\n' + sig + '\n```';
    if (ti.doc) md += '\n\n' + ti.doc;
    return md;
}
