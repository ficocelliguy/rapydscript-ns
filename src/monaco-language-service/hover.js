// hover.js — Hover provider for the RapydScript language service.
//
// Usage:
//   import { HoverEngine } from './hover.js';
//   const engine = new HoverEngine();
//   const hover  = engine.getHover(scopeMap, position, word);

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

/**
 * Build a one-line signature string for a symbol.
 * Examples:
 *   (function) add(x, y)
 *   (class) Dog
 *   (variable) my_var
 *   (import) math
 *
 * @param {import('./scope.js').SymbolInfo} sym
 * @returns {string}
 */
function build_signature(sym) {
    const kind_label = '(' + sym.kind + ') ';

    if ((sym.kind === 'function' || sym.kind === 'method') && sym.params) {
        const param_str = sym.params.map(function (p) {
            if (p.is_kwargs) return '**' + p.name;
            if (p.is_rest)   return '*'  + p.name;
            return p.name;
        }).join(', ');
        return kind_label + sym.name + '(' + param_str + ')';
    }

    return kind_label + sym.name;
}

/**
 * Build the full markdown hover string for a symbol.
 * Returns a fenced code block for the signature, plus the docstring if present.
 *
 * @param {import('./scope.js').SymbolInfo} sym
 * @returns {string}
 */
function build_hover_markdown(sym) {
    const sig = build_signature(sym);

    // Use a code block so Monaco renders it with syntax highlighting
    let md = '```\n' + sig + '\n```';

    if (sym.doc) {
        md += '\n\n' + sym.doc;
    }

    return md;
}

// ---------------------------------------------------------------------------
// HoverEngine
// ---------------------------------------------------------------------------

export class HoverEngine {

    /**
     * @param {import('./dts.js').DtsRegistry|null}      [dtsRegistry]
     * @param {import('./builtins.js').BuiltinsRegistry|null} [builtinsRegistry]
     */
    constructor(dtsRegistry, builtinsRegistry) {
        this._dts     = dtsRegistry      || null;
        this._builtins = builtinsRegistry || null;
    }

    /**
     * Return a Monaco IHover for the word under the cursor.
     * Priority: ScopeMap (user-defined) → DTS (.d.ts globals) → builtins.
     * Returns null if the word is not found in any source.
     *
     * @param {import('./scope.js').ScopeMap|null} scopeMap
     * @param {{lineNumber:number,column:number}} position  1-indexed Monaco position
     * @param {string|null} word  the identifier under the cursor (from model.getWordAtPosition)
     * @returns {{ contents: {value:string}[], range?: object }|null}
     */
    getHover(scopeMap, position, word) {
        if (!word) return null;

        // 1. ScopeMap lookup (user-defined symbols)
        if (scopeMap) {
            const sym = scopeMap.getSymbol(word, position.lineNumber, position.column);
            if (sym) {
                return { contents: [{ value: build_hover_markdown(sym) }] };
            }
        }

        // 2. DTS registry (.d.ts globals)
        if (this._dts) {
            const md = this._dts.getHoverMarkdown(word);
            if (md) return { contents: [{ value: md }] };
        }

        // 3. Built-in stubs
        if (this._builtins) {
            const md = this._builtins.getHoverMarkdown(word);
            if (md) return { contents: [{ value: md }] };
        }

        return null;
    }
}
