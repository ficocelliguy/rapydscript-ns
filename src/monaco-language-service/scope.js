// scope.js — ScopeMap data structures for the RapydScript language service.
//
// Position convention throughout this file:
//   line   — 1-indexed  (matches Monaco's lineNumber)
//   column — 1-indexed  (matches Monaco's column)
// AST tokens use 1-indexed lines and 0-indexed cols; the analyzer converts
// before storing so callers always work with fully 1-indexed numbers.

// ---------------------------------------------------------------------------
// SymbolInfo
// ---------------------------------------------------------------------------

export class SymbolInfo {
    /**
     * @param {object} opts
     * @param {string}  opts.name
     * @param {string}  opts.kind  'function'|'method'|'class'|'variable'|'parameter'|'import'
     * @param {{line:number,column:number}} opts.defined_at  1-indexed line and column
     * @param {number}  opts.scope_depth
     * @param {string|null} [opts.doc]
     * @param {Array|null}  [opts.params]  [{name, is_rest, is_kwargs}] for functions/methods
     */
    constructor(opts) {
        this.name        = opts.name;
        this.kind        = opts.kind;
        this.defined_at  = opts.defined_at;   // {line, column} both 1-indexed
        this.scope_depth = opts.scope_depth;
        this.doc            = opts.doc   || null;
        this.params         = opts.params || null;
        this.inferred_class = opts.inferred_class || null;  // 'ClassName' when x = ClassName(...)
        this.type           = null;              // Phase 6: TypeInfo
    }
}

// ---------------------------------------------------------------------------
// ScopeFrame
// ---------------------------------------------------------------------------

export class ScopeFrame {
    /**
     * @param {object} opts
     * @param {string}  opts.kind  'module'|'function'|'class'|'comprehension'|'block'
     * @param {string|null} opts.name
     * @param {{start:{line,column}, end:{line,column}}} opts.range  1-indexed
     * @param {ScopeFrame|null} opts.parent
     * @param {number} opts.depth
     */
    constructor(opts) {
        this.kind    = opts.kind;
        this.name    = opts.name || null;
        this.range   = opts.range;
        this.parent  = opts.parent || null;
        this.depth   = opts.depth;
        this.symbols = new Map();  // name → SymbolInfo
    }

    /** Add or overwrite a symbol in this frame. */
    addSymbol(sym) {
        this.symbols.set(sym.name, sym);
    }

    /** Return a symbol by exact name, or null. */
    getSymbol(name) {
        return this.symbols.get(name) || null;
    }
}

// ---------------------------------------------------------------------------
// Range helpers (all positions 1-indexed)
// ---------------------------------------------------------------------------

function range_contains(range, line, column) {
    const { start, end } = range;
    const after_start = (line > start.line) || (line === start.line && column >= start.column);
    const before_end  = (line < end.line)   || (line === end.line   && column <= end.column);
    return after_start && before_end;
}

// ---------------------------------------------------------------------------
// ScopeMap
// ---------------------------------------------------------------------------

export class ScopeMap {
    constructor() {
        /** All frames in document order (outer to inner). @type {ScopeFrame[]} */
        this.frames = [];
    }

    /** @internal Called by ScopeBuilder as frames are created. */
    addFrame(frame) {
        this.frames.push(frame);
    }

    /**
     * Return all ScopeFrames whose range contains (line, column), innermost first.
     * Both line and column are 1-indexed (Monaco format).
     * @param {number} line
     * @param {number} column
     * @returns {ScopeFrame[]}
     */
    getScopesAtPosition(line, column) {
        return this.frames
            .filter(f => range_contains(f.range, line, column))
            .sort((a, b) => b.depth - a.depth);
    }

    /**
     * Return every symbol visible at (line, column).
     * When two scopes define the same name, the innermost one wins.
     * Both line and column are 1-indexed (Monaco format).
     * @param {number} line
     * @param {number} column
     * @returns {SymbolInfo[]}
     */
    getSymbolsAtPosition(line, column) {
        const scopes = this.getScopesAtPosition(line, column);
        const seen   = new Set();
        const result = [];
        for (const scope of scopes) {
            for (const [name, sym] of scope.symbols) {
                if (!seen.has(name)) {
                    seen.add(name);
                    result.push(sym);
                }
            }
        }
        return result;
    }

    /**
     * Look up a single symbol by name that is visible at (line, column).
     * Returns the innermost definition, or null if not found.
     * Both line and column are 1-indexed (Monaco format).
     * @param {string} name
     * @param {number} line
     * @param {number} column
     * @returns {SymbolInfo|null}
     */
    getSymbol(name, line, column) {
        const scopes = this.getScopesAtPosition(line, column);
        for (const scope of scopes) {
            const sym = scope.getSymbol(name);
            if (sym) return sym;
        }
        return null;
    }

    /**
     * Return all symbols across every scope in the document.
     * @returns {SymbolInfo[]}
     */
    getAllSymbols() {
        const result = [];
        for (const frame of this.frames) {
            for (const sym of frame.symbols.values()) {
                result.push(sym);
            }
        }
        return result;
    }
}
