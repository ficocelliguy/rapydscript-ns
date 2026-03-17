// signature.js — Signature help provider for the RapydScript language service.
//
// Usage:
//   import { SignatureHelpEngine, detect_call_context } from './signature.js';
//   const engine = new SignatureHelpEngine();
//   const help   = engine.getSignatureHelp(scopeMap, position, linePrefix);

// ---------------------------------------------------------------------------
// Context detection
// ---------------------------------------------------------------------------

/**
 * Walk backwards through linePrefix to find the nearest unclosed `(`.
 * Returns the callee name and which argument position the cursor is in,
 * or null if the cursor is not inside a call.
 *
 * @param {string} linePrefix  text from column 1 up to (but not including) the cursor
 * @returns {{ callee: string, activeParameter: number }|null}
 */
export function detect_call_context(linePrefix) {
    let depth = 0;
    let paren_pos = -1;

    // Scan backwards to find the outermost unclosed '('
    for (let i = linePrefix.length - 1; i >= 0; i--) {
        const ch = linePrefix[i];
        if (ch === ')') {
            depth++;
        } else if (ch === '(') {
            if (depth === 0) {
                paren_pos = i;
                break;
            }
            depth--;
        }
    }

    if (paren_pos < 0) return null;  // not inside a call

    // Extract the callee: identifier immediately before the '('
    const before_paren = linePrefix.slice(0, paren_pos).trimEnd();
    const callee_match = before_paren.match(/(\w+)$/);
    if (!callee_match) return null;

    // Count commas at depth 0 between the '(' and the cursor
    let active_param = 0;
    let inner_depth  = 0;
    for (let j = paren_pos + 1; j < linePrefix.length; j++) {
        const ch = linePrefix[j];
        if (ch === '(' || ch === '[') {
            inner_depth++;
        } else if (ch === ')' || ch === ']') {
            inner_depth--;
        } else if (ch === ',' && inner_depth === 0) {
            active_param++;
        }
    }

    return { callee: callee_match[1], activeParameter: active_param };
}

// ---------------------------------------------------------------------------
// SignatureHelpEngine
// ---------------------------------------------------------------------------

export class SignatureHelpEngine {

    /**
     * @param {import('./builtins.js').BuiltinsRegistry|null} [builtinsRegistry]
     *   Optional built-in stubs; used as fallback when the callee is not in ScopeMap.
     */
    constructor(builtinsRegistry) {
        this._builtins = builtinsRegistry || null;
    }

    /**
     * Return a Monaco ISignatureHelpResult for the cursor position, or null
     * if the cursor is not inside a known function call.
     *
     * Priority: ScopeMap (user-defined) → built-in stubs.
     *
     * @param {import('./scope.js').ScopeMap|null} scopeMap
     * @param {{lineNumber:number,column:number}} position  1-indexed Monaco position
     * @param {string} linePrefix  text on the current line up to the cursor
     * @returns {{ value: object, dispose: function }|null}
     */
    getSignatureHelp(scopeMap, position, linePrefix) {
        const ctx = detect_call_context(linePrefix);
        if (!ctx) return null;

        // 1. User-defined function from ScopeMap
        if (scopeMap) {
            const sym = scopeMap.getSymbol(ctx.callee, position.lineNumber, position.column);
            if (sym && sym.params && sym.params.length > 0) {
                const param_labels = sym.params.map(function (p) {
                    if (p.is_separator) return p.name;  // '/' or '*'
                    if (p.is_kwargs) return '**' + p.name;
                    if (p.is_rest)   return '*'  + p.name;
                    return p.name;
                });

                let active = ctx.activeParameter;
                if (active > param_labels.length - 1) active = param_labels.length - 1;

                return {
                    value: {
                        signatures: [{
                            label:         ctx.callee + '(' + param_labels.join(', ') + ')',
                            documentation: sym.doc || undefined,
                            parameters:    param_labels.map(function (l) { return { label: l }; }),
                        }],
                        activeSignature: 0,
                        activeParameter: active,
                    },
                    dispose: function () {},
                };
            }
        }

        // 2. Built-in stubs
        if (this._builtins) {
            const info = this._builtins.getSignatureInfo(ctx.callee);
            if (info) {
                let active = ctx.activeParameter;
                if (active > info.params.length - 1) active = info.params.length - 1;

                return {
                    value: {
                        signatures: [{
                            label:         info.label,
                            documentation: info.doc || undefined,
                            parameters:    info.params,
                        }],
                        activeSignature: 0,
                        activeParameter: active,
                    },
                    dispose: function () {},
                };
            }
        }

        return null;
    }
}
