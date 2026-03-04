// analyzer.js — AST walker that builds a ScopeMap for a RapydScript source file.
//
// Usage:
//   import { SourceAnalyzer } from './analyzer.js';
//   const analyzer = new SourceAnalyzer(compiler);
//   const scopeMap = analyzer.analyze(sourceCode, { virtualFiles: {...} });

import { ScopeMap, ScopeFrame, SymbolInfo } from './scope.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert AST token position {line (1-indexed), col (0-indexed)} → {line, column} (both 1-indexed). */
function pos_from_token(tok) {
    if (!tok) return { line: 1, column: 1 };
    return { line: tok.line, column: tok.col + 1 };
}

/**
 * Extract the first docstring value from a scope node, if present.
 * The parser populates node.docstrings for AST_Scope nodes.
 */
function extract_doc(node) {
    if (node.docstrings && node.docstrings.length > 0) {
        const ds = node.docstrings[0];
        return ds.value !== undefined ? ds.value : null;
    }
    return null;
}

/**
 * Collect parameter descriptors from an AST_Lambda node.
 * Handles regular args, *args (starargs), and **kwargs.
 */
function extract_params(lambda_node) {
    const params = [];
    const argnames = lambda_node.argnames;
    if (!argnames) return params;

    argnames.forEach(arg => {
        if (arg && arg.name) params.push({ name: arg.name, is_rest: false, is_kwargs: false });
    });
    if (argnames.starargs && argnames.starargs.name) {
        params.push({ name: argnames.starargs.name, is_rest: true,  is_kwargs: false });
    }
    if (argnames.kwargs && argnames.kwargs.name) {
        params.push({ name: argnames.kwargs.name,  is_rest: false, is_kwargs: true  });
    }
    return params;
}

// ---------------------------------------------------------------------------
// ScopeBuilder — internal AST visitor
// Mirrors the structure of tools/lint.js's Linter but builds a ScopeMap
// instead of recording lint errors.
// ---------------------------------------------------------------------------

class ScopeBuilder {
    constructor(RS, map) {
        this._RS          = RS;
        this._map         = map;
        this._scopes      = [];   // stack of ScopeFrame
        this.current_node = null;
    }

    _current_scope() {
        return this._scopes.length ? this._scopes[this._scopes.length - 1] : null;
    }

    _push_scope(kind, name, node) {
        const parent = this._current_scope();
        const depth  = parent ? parent.depth + 1 : 0;

        const start_tok = node.start;
        const end_tok   = node.end;

        const frame = new ScopeFrame({
            kind,
            name,
            range: {
                start: start_tok ? { line: start_tok.line, column: start_tok.col + 1 } : { line: 1, column: 1 },
                end:   end_tok   ? { line: end_tok.line,   column: end_tok.col   + 1 } : { line: 999999, column: 999999 },
            },
            parent,
            depth,
        });

        this._map.addFrame(frame);
        this._scopes.push(frame);
        return frame;
    }

    _pop_scope() {
        return this._scopes.pop();
    }

    _add_symbol(opts) {
        const scope = this._current_scope();
        if (!scope || !opts.name) return null;
        const sym = new SymbolInfo({
            name:           opts.name,
            kind:           opts.kind,
            defined_at:     opts.defined_at || { line: 1, column: 1 },
            scope_depth:    scope.depth,
            doc:            opts.doc            || null,
            params:         opts.params         || null,
            inferred_class: opts.inferred_class || null,
        });
        scope.addSymbol(sym);
        return sym;
    }

    // ---- The visitor function called by node.walk() ----------------------

    _visit(node, cont) {
        this.current_node = node;
        const RS          = this._RS;
        const prev_depth  = this._scopes.length;

        // ------------------------------------------------------------------
        // 1. Scope-creating nodes — push a frame BEFORE recursing.
        //    Order matters: more specific classes first (AST_Method < AST_Lambda < AST_Scope).
        // ------------------------------------------------------------------

        if (node instanceof RS.AST_Lambda) {
            // Covers AST_Function and AST_Method.
            const is_method = node instanceof RS.AST_Method;
            const name      = node.name ? node.name.name : null;

            // Add the function/method symbol to the PARENT scope first.
            if (name) {
                const parent = this._current_scope();
                if (parent) {
                    const sym = new SymbolInfo({
                        name,
                        kind:        is_method ? 'method' : 'function',
                        defined_at:  pos_from_token(node.start),
                        scope_depth: parent.depth,
                        doc:         extract_doc(node),
                        params:      extract_params(node),
                    });
                    parent.addSymbol(sym);
                }
            }

            // Push a new scope for the function body.
            this._push_scope(is_method ? 'function' : 'function', name, node);

        } else if (node instanceof RS.AST_Class) {
            const name = node.name ? node.name.name : null;

            // Add class symbol to the parent scope.
            if (name) {
                const parent = this._current_scope();
                if (parent) {
                    parent.addSymbol(new SymbolInfo({
                        name,
                        kind:        'class',
                        defined_at:  pos_from_token(node.start),
                        scope_depth: parent.depth,
                        doc:         extract_doc(node),
                        params:      null,
                    }));
                }
            }

            // Push class scope.
            this._push_scope('class', name, node);

        } else if (node instanceof RS.AST_ListComprehension) {
            // AST_ListComprehension extends AST_ForIn, NOT AST_Scope.
            // We give it its own scope so its loop variable doesn't leak.
            this._push_scope('comprehension', null, node);

            // The loop variable (node.init) is visited by the walk, but we
            // add it now so it lands in the comprehension frame.
            if (node.init instanceof RS.AST_SymbolRef) {
                this._add_symbol({
                    name:       node.init.name,
                    kind:       'variable',
                    defined_at: pos_from_token(node.init.start),
                });
                node.init.scope_builder_visited = true;
            }

        } else if (node instanceof RS.AST_Scope) {
            // AST_Toplevel and any other raw scope nodes.
            const kind = node instanceof RS.AST_Toplevel ? 'module' : 'block';
            this._push_scope(kind, null, node);
        }

        // ------------------------------------------------------------------
        // 2. Symbol-producing nodes (order doesn't matter for these).
        // ------------------------------------------------------------------

        if (node instanceof RS.AST_SymbolFunarg) {
            // A regular function parameter; starargs/kwargs are also SymbolFunarg.
            this._add_symbol({
                name:       node.name,
                kind:       'parameter',
                defined_at: pos_from_token(node.start),
            });

        } else if (node instanceof RS.AST_ImportedVar) {
            // `from X import name` or `from X import name as alias`
            const name = (node.alias && node.alias.name) ? node.alias.name : node.name;
            if (name) {
                this._add_symbol({
                    name,
                    kind:       'import',
                    defined_at: pos_from_token(node.start),
                });
            }

        } else if (node instanceof RS.AST_Import && !node.argnames) {
            // `import X` or `import X as Y` (no from-clause)
            const name = (node.alias && node.alias.name)
                ? node.alias.name
                : (node.key ? node.key.split('.')[0] : null);
            if (name) {
                this._add_symbol({
                    name,
                    kind:       'import',
                    defined_at: pos_from_token(node.start),
                });
            }

        } else if (node instanceof RS.AST_VarDef) {
            // `var` declarations emitted by the compiler; name can be SymbolVar or SymbolNonlocal.
            if (node.name && !(node.name instanceof RS.AST_SymbolNonlocal)) {
                const name = typeof node.name.name === 'string' ? node.name.name : null;
                if (name) {
                    this._add_symbol({
                        name,
                        kind:       'variable',
                        defined_at: pos_from_token(node.start),
                    });
                }
            }

        } else if (node instanceof RS.AST_Assign && node.operator === '=') {
            // Simple assignment: add left-hand symbol if new to this scope.
            if (node.left instanceof RS.AST_SymbolRef) {
                const name  = node.left.name;
                const scope = this._current_scope();
                if (scope && !scope.getSymbol(name)) {
                    // Detect `x = ClassName(...)` to record the inferred type.
                    let inferred_class = null;
                    if (node.right instanceof RS.AST_BaseCall &&
                        node.right.expression instanceof RS.AST_SymbolRef) {
                        inferred_class = node.right.expression.name;
                    }
                    this._add_symbol({
                        name,
                        kind:           'variable',
                        defined_at:     pos_from_token(node.left.start),
                        inferred_class,
                    });
                }
            }

        } else if (
            node instanceof RS.AST_ForIn &&
            !(node instanceof RS.AST_ListComprehension) &&
            node.init instanceof RS.AST_SymbolRef &&
            !node.init.scope_builder_visited
        ) {
            // Regular `for x in ...` loop variable.
            this._add_symbol({
                name:       node.init.name,
                kind:       'variable',
                defined_at: pos_from_token(node.init.start),
            });
            node.init.scope_builder_visited = true;

        } else if (node instanceof RS.AST_Except && node.argname) {
            // `except SomeError as e`
            this._add_symbol({
                name:       node.argname.name,
                kind:       'variable',
                defined_at: pos_from_token(node.argname.start),
            });

        } else if (node instanceof RS.AST_WithClause && node.alias) {
            // `with ctx as alias`
            this._add_symbol({
                name:       node.alias.name,
                kind:       'variable',
                defined_at: pos_from_token(node.alias.start),
            });
        }

        // ------------------------------------------------------------------
        // 3. Recurse into child nodes.
        // ------------------------------------------------------------------

        if (cont) cont();

        // ------------------------------------------------------------------
        // 4. Pop the scope we pushed (if any).
        // ------------------------------------------------------------------

        if (this._scopes.length > prev_depth) {
            this._pop_scope();
        }
    }
}

// ---------------------------------------------------------------------------
// SourceAnalyzer — public API
// ---------------------------------------------------------------------------

export class SourceAnalyzer {
    /**
     * @param {object} compiler  - window.RapydScript (the compiled compiler bundle)
     */
    constructor(compiler) {
        this._RS = compiler;
    }

    /**
     * Parse `code` and walk the resulting AST to build a ScopeMap.
     * Returns an empty ScopeMap if parsing fails.
     *
     * @param {string} code
     * @param {object} [options]
     * @param {object} [options.virtualFiles]  - map of module-name → source
     * @returns {ScopeMap}
     */
    analyze(code, options) {
        options = options || {};
        const RS  = this._RS;
        const map = new ScopeMap();

        let toplevel;
        try {
            toplevel = RS.parse(code, {
                filename:    'editor.pyj',
                for_linting: true,
                ...(options.virtualFiles ? { virtual_files: options.virtualFiles } : {}),
            });
        } catch (_e) {
            // Syntax/import error — return the empty map; diagnostics.js handles errors.
            return map;
        }

        const builder = new ScopeBuilder(RS, map);
        toplevel.walk(builder);
        return map;
    }
}
