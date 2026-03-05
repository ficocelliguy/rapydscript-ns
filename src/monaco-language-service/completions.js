// completions.js — Completion item provider for the RapydScript language service.
//
// Usage:
//   import { CompletionEngine } from './completions.js';
//   const engine = new CompletionEngine(analyzer, { virtualFiles, builtinNames });
//   const items  = engine.getCompletions(scopeMap, position, linePrefix, monacoKind);

import { SourceAnalyzer } from './analyzer.js';

// ---------------------------------------------------------------------------
// Context detection
// ---------------------------------------------------------------------------

/**
 * Inspect the text before the cursor and classify what kind of completion
 * is appropriate.
 *
 * Returns one of:
 *   { type: 'dot',         objectName: string, prefix: string }
 *   { type: 'from_import', moduleName: string, prefix: string }
 *   { type: 'import',      prefix: string }
 *   { type: 'identifier',  prefix: string }
 *
 * @param {string} linePrefix  text from column 1 up to (but not including) the cursor
 * @returns {{ type: string, objectName?: string, moduleName?: string, prefix: string }}
 */
export function detect_context(linePrefix) {
    // `obj.attr` — dot access
    const dot_match = linePrefix.match(/(\w+)\.([\w]*)$/);
    if (dot_match) {
        return { type: 'dot', objectName: dot_match[1], prefix: dot_match[2] };
    }

    // `from modname import partial`
    const from_match = linePrefix.match(/^\s*from\s+([\w.]+)\s+import\s+([\w]*)$/);
    if (from_match) {
        return { type: 'from_import', moduleName: from_match[1], prefix: from_match[2] };
    }

    // `import partial` (bare import at start of line)
    const import_match = linePrefix.match(/^\s*import\s+([\w.]*)$/);
    if (import_match) {
        return { type: 'import', prefix: import_match[1] };
    }

    // Default: identifier completion
    const ident_match = linePrefix.match(/(\w*)$/);
    return { type: 'identifier', prefix: ident_match ? ident_match[1] : '' };
}

// ---------------------------------------------------------------------------
// Monaco item helpers
// ---------------------------------------------------------------------------

/**
 * Build a Monaco IRange covering the word currently being typed.
 * @param {{lineNumber:number,column:number}} position  Monaco 1-indexed position
 * @param {string} prefix  the portion of the word already typed
 * @returns {{startLineNumber,startColumn,endLineNumber,endColumn}}
 */
function word_range(position, prefix) {
    return {
        startLineNumber: position.lineNumber,
        startColumn:     position.column - prefix.length,
        endLineNumber:   position.lineNumber,
        endColumn:       position.column,
    };
}

/**
 * Map a SymbolInfo kind to a Monaco CompletionItemKind value.
 * monacoKind is the Monaco.languages.CompletionItemKind enum object.
 * @param {string} kind
 * @param {object} monacoKind
 * @returns {number}
 */
function kind_to_monaco(kind, monacoKind) {
    switch (kind) {
        case 'function':  return monacoKind.Function;
        case 'method':    return monacoKind.Method;
        case 'class':     return monacoKind.Class;
        case 'parameter': return monacoKind.Variable;
        case 'import':    return monacoKind.Module;
        default:          return monacoKind.Variable;
    }
}

/**
 * Build a Monaco CompletionItem from a SymbolInfo.
 * @param {import('./scope.js').SymbolInfo} sym
 * @param {object} range   Monaco IRange
 * @param {object} monacoKind  Monaco CompletionItemKind enum
 * @param {string} sortPrefix  e.g. '0', '1', '2' for ranking
 * @returns {object}  Monaco CompletionItem
 */
function symbol_to_item(sym, range, monacoKind, sortPrefix) {
    let detail = sym.kind;
    if (sym.params) {
        const param_str = sym.params.map(p => {
            if (p.is_kwargs) return '**' + p.name;
            if (p.is_rest)   return '*'  + p.name;
            return p.name;
        }).join(', ');
        detail = '(' + param_str + ')';
    }
    return {
        label:            sym.name,
        kind:             kind_to_monaco(sym.kind, monacoKind),
        detail,
        documentation:    sym.doc || undefined,
        sortText:         sortPrefix + '_' + sym.name,
        insertText:       sym.name,
        range,
    };
}

/**
 * Build a simple completion item from a plain name string (e.g. a builtin with no stub).
 * @param {string} name
 * @param {object} range
 * @param {object} monacoKind
 * @returns {object}
 */
function name_to_item(name, range, monacoKind) {
    return {
        label:      name,
        kind:       monacoKind.Variable,
        sortText:   '2_' + name,
        insertText: name,
        range,
    };
}

/**
 * Build a Monaco CompletionItem from a BuiltinInfo stub (richer than name_to_item).
 * @param {import('./builtins.js').BuiltinInfo} stub
 * @param {object} range
 * @param {object} monacoKind
 * @returns {object}
 */
function _builtin_to_item(stub, range, monacoKind) {
    const kind = stub.kind === 'function' ? monacoKind.Function :
                 stub.kind === 'class'    ? monacoKind.Class    : monacoKind.Variable;
    let detail = stub.kind;
    if (stub.params) {
        const ps = stub.params.map(function (p) {
            let s = p.label;
            if (p.type && p.type !== 'any') s += ': ' + p.type;
            return s;
        }).join(', ');
        detail = '(' + ps + ')';
        if (stub.return_type && stub.return_type !== 'None') {
            detail += ' → ' + stub.return_type;
        }
    } else if (stub.return_type) {
        detail = stub.return_type;
    }
    return {
        label:         stub.name,
        kind,
        detail,
        documentation: stub.doc || undefined,
        sortText:      '2_' + stub.name,
        insertText:    stub.name,
        range,
    };
}

/**
 * Build a Monaco CompletionItem from a DTS TypeInfo member (method or property).
 * @param {import('./dts.js').TypeInfo} member
 * @param {object} range
 * @param {object} monacoKind
 * @returns {object}
 */
function _dts_member_to_item(member, range, monacoKind) {
    const kind = member.kind === 'method' ? monacoKind.Method : monacoKind.Property;
    let detail = member.kind;
    if (member.kind === 'method' && member.params) {
        const ps = member.params.map(function (p) {
            let s = p.rest ? '...' : '';
            s += p.name;
            if (p.optional) s += '?';
            return s;
        }).join(', ');
        detail = '(' + ps + ')';
        if (member.return_type && member.return_type !== 'void') {
            detail += ': ' + member.return_type;
        }
    } else if (member.return_type) {
        detail = member.return_type;
    }
    return {
        label:         member.name,
        kind,
        detail,
        documentation: member.doc || undefined,
        sortText:      '0_' + member.name,
        insertText:    member.name,
        range,
    };
}

// ---------------------------------------------------------------------------
// CompletionEngine
// ---------------------------------------------------------------------------

export class CompletionEngine {
    /**
     * @param {import('./analyzer.js').SourceAnalyzer} analyzer
     * @param {object} opts
     * @param {object} [opts.virtualFiles]   module-name → source
     * @param {string[]} [opts.builtinNames] names always available (BASE_BUILTINS + extras)
     * @param {import('./dts.js').DtsRegistry|null}      [opts.dtsRegistry]      DTS globals for dot completion
     * @param {import('./builtins.js').BuiltinsRegistry|null} [opts.builtinsRegistry] stubs for rich builtin items
     */
    constructor(analyzer, opts) {
        this._analyzer     = analyzer;
        this._virtualFiles = opts.virtualFiles    || {};
        this._builtinNames = opts.builtinNames    || [];
        this._dts          = opts.dtsRegistry     || null;
        this._builtins     = opts.builtinsRegistry || null;
    }

    /**
     * Update the virtual files available to import analysis.
     * @param {object} virtualFiles
     */
    setVirtualFiles(virtualFiles) {
        this._virtualFiles = virtualFiles;
    }

    /**
     * Produce Monaco completion items for the given position.
     *
     * @param {import('./scope.js').ScopeMap|null} scopeMap
     * @param {{lineNumber:number,column:number}} position  1-indexed Monaco position
     * @param {string} linePrefix  text on the current line up to the cursor
     * @param {object} monacoKind  Monaco.languages.CompletionItemKind enum
     * @returns {{ suggestions: object[] }}  Monaco CompletionList
     */
    getCompletions(scopeMap, position, linePrefix, monacoKind) {
        const ctx = detect_context(linePrefix);

        if (ctx.type === 'dot') {
            return { suggestions: this._dot_completions(scopeMap, position, ctx, monacoKind) };
        }
        if (ctx.type === 'from_import') {
            return { suggestions: this._from_import_completions(position, ctx, monacoKind) };
        }
        if (ctx.type === 'import') {
            return { suggestions: this._module_name_completions(position, ctx, monacoKind) };
        }
        // Default: identifier completions from scope + builtins
        return { suggestions: this._scope_completions(scopeMap, position, ctx, monacoKind) };
    }

    // ---- Identifier completions (scope + builtins) -------------------------

    _scope_completions(scopeMap, position, ctx, monacoKind) {
        const range   = word_range(position, ctx.prefix);
        const items   = [];
        const seen    = new Set();

        if (scopeMap) {
            const symbols = scopeMap.getSymbolsAtPosition(position.lineNumber, position.column);
            for (const sym of symbols) {
                if (!ctx.prefix || sym.name.startsWith(ctx.prefix)) {
                    if (!seen.has(sym.name)) {
                        seen.add(sym.name);
                        const sort = sym.scope_depth > 0 ? '0' : '1';
                        items.push(symbol_to_item(sym, range, monacoKind, sort));
                    }
                }
            }
        }

        // Builtins (lowest priority) — use rich stub item when available
        for (const name of this._builtinNames) {
            if (!seen.has(name) && (!ctx.prefix || name.startsWith(ctx.prefix))) {
                seen.add(name);
                const stub = this._builtins ? this._builtins.get(name) : null;
                items.push(stub
                    ? _builtin_to_item(stub, range, monacoKind)
                    : name_to_item(name, range, monacoKind)
                );
            }
        }

        return items;
    }

    // ---- Dot completions ---------------------------------------------------

    _dot_completions(scopeMap, position, ctx, monacoKind) {
        const range = word_range(position, ctx.prefix);
        const items = [];
        const seen  = new Set();
        let scope_matched = false;
        let obj_sym = null;

        // 1. ScopeMap lookup — user-defined classes and inferred instances.
        if (scopeMap) {
            obj_sym = scopeMap.getSymbol(
                ctx.objectName,
                position.lineNumber,
                position.column
            );
            // Fallback: the cursor may be past the end of all parsed scope ranges
            // (e.g. the user is typing on a new line that isn't in the last debounced
            // parse yet).  Search all frames innermost-first so we still find the symbol.
            if (!obj_sym) {
                const all = scopeMap.frames.slice().sort((a, b) => b.depth - a.depth);
                for (const frame of all) {
                    const sym = frame.getSymbol(ctx.objectName);
                    if (sym) { obj_sym = sym; break; }
                }
            }

            let class_name = null;
            if (obj_sym) {
                if (obj_sym.kind === 'class') {
                    class_name = obj_sym.name;
                } else if (obj_sym.inferred_class) {
                    class_name = obj_sym.inferred_class;
                }
            }

            if (class_name) {
                for (const frame of scopeMap.frames) {
                    if (frame.kind === 'class' && frame.name === class_name) {
                        scope_matched = true;
                        for (const [name, sym] of frame.symbols) {
                            if (!ctx.prefix || name.startsWith(ctx.prefix)) {
                                if (!seen.has(name)) {
                                    seen.add(name);
                                    items.push(symbol_to_item(sym, range, monacoKind, '0'));
                                }
                            }
                        }
                    }
                }
            }
        }

        // 1.5. Built-in type members — list, str, dict, number.
        //      Used when inferred_class names a built-in type, not a user class.
        if (!scope_matched && this._builtins && obj_sym && obj_sym.inferred_class) {
            const members = this._builtins.getTypeMembers(obj_sym.inferred_class);
            if (members) {
                scope_matched = true;
                for (const [name, member] of members) {
                    if (!ctx.prefix || name.startsWith(ctx.prefix)) {
                        if (!seen.has(name)) {
                            seen.add(name);
                            items.push(_dts_member_to_item(member, range, monacoKind));
                        }
                    }
                }
            }
        }

        // 2. DTS registry fallback — namespaces / interfaces / classes from .d.ts.
        //    Skipped when ScopeMap already matched a class (ScopeMap wins).
        if (!scope_matched && this._dts) {
            let ti = this._dts.getGlobal(ctx.objectName);
            // Follow type reference: `var console: Console` → look up `Console`
            if (ti && !ti.members && ti.return_type) {
                ti = this._dts.getGlobal(ti.return_type);
            }
            if (ti && ti.members) {
                for (const [name, member] of ti.members) {
                    if (!ctx.prefix || name.startsWith(ctx.prefix)) {
                        if (!seen.has(name)) {
                            seen.add(name);
                            items.push(_dts_member_to_item(member, range, monacoKind));
                        }
                    }
                }
            }
        }

        return items;
    }

    // ---- from X import completions -----------------------------------------

    _from_import_completions(position, ctx, monacoKind) {
        const range = word_range(position, ctx.prefix);
        const items = [];

        const src = this._virtualFiles[ctx.moduleName];
        if (!src) return items;

        let scopeMap;
        try {
            scopeMap = this._analyzer.analyze(src, {});
        } catch (_e) {
            return items;
        }

        // Return all module-level symbols
        const module_frame = scopeMap.frames.find(f => f.kind === 'module');
        if (!module_frame) return items;

        for (const [name, sym] of module_frame.symbols) {
            if (!ctx.prefix || name.startsWith(ctx.prefix)) {
                items.push(symbol_to_item(sym, range, monacoKind, '0'));
            }
        }
        return items;
    }

    // ---- import module name completions ------------------------------------

    _module_name_completions(position, ctx, monacoKind) {
        const range = word_range(position, ctx.prefix);
        const items = [];
        const seen  = new Set();

        for (const modname of Object.keys(this._virtualFiles)) {
            if (!ctx.prefix || modname.startsWith(ctx.prefix)) {
                if (!seen.has(modname)) {
                    seen.add(modname);
                    items.push({
                        label:      modname,
                        kind:       monacoKind.Module,
                        sortText:   '0_' + modname,
                        insertText: modname,
                        range,
                    });
                }
            }
        }
        return items;
    }
}
