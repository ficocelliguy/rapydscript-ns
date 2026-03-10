// diagnostics.js — RapydScript linter for Monaco
// Ported from tools/lint.js; browser-compatible ES module (no Node.js deps).
// Usage:
//   const d = new Diagnostics(compiler, extraBuiltins);
//   const markers = d.check(sourceCode);  // returns Monaco IMarkerData[]

const WARN = 1, ERROR = 2;

const MESSAGES = {
    'undef':          'Undefined symbol: "{name}"',
    'unused-import':  '"{name}" is imported but not used',
    'unused-local':   '"{name}" is defined but not used',
    'loop-shadowed':  'The loop variable "{name}" was previously used in this scope at line: {line}',
    'extra-semicolon':'This semi-colon is not needed',
    'eol-semicolon':  'Semi-colons at the end of the line are unnecessary',
    'func-in-branch': 'Named functions/classes inside a branch are not allowed in strict mode',
    'syntax-err':     'Syntax error: {name}',
    'import-err':     'Import error: {name}',
    'def-after-use':  'The symbol "{name}" is defined (at line {line}) after it is used',
    'dup-key':        'Duplicate key "{name}" in object literal',
    'dup-method':     'The method "{name}" was defined previously at line: {line}',
};

// Symbols always available in RapydScript (from tools/lint.js BUILTINS list).
export const BASE_BUILTINS = (
    'this self window document chr ord iterator_symbol print len range dir' +
    ' eval undefined arguments abs max min enumerate pow callable reversed sum' +
    ' getattr isFinite setattr hasattr parseInt parseFloat options_object' +
    ' isNaN JSON Math list set list_wrap ρσ_modules require bool int bin' +
    ' float iter Error EvalError set_wrap RangeError ReferenceError SyntaxError' +
    ' str TypeError URIError Exception AssertionError IndexError AttributeError KeyError' +
    ' ValueError ZeroDivisionError map hex filter zip dict dict_wrap UnicodeDecodeError HTMLCollection' +
    ' NodeList alert console Node Symbol NamedNodeMap ρσ_eslice ρσ_delslice Number' +
    ' Boolean encodeURIComponent decodeURIComponent setTimeout setInterval' +
    ' setImmediate clearTimeout clearInterval clearImmediate requestAnimationFrame' +
    ' id repr sorted __name__ equals get_module ρσ_str jstype divmod NaN'
).split(' ');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function has_prop(obj, name) {
    return Object.prototype.hasOwnProperty.call(obj, name);
}

function msg_from_node(ident, name, node, level, line) {
    name = name || (node.name ? (node.name.name || node.name) : '');
    const msg = MESSAGES[ident]
        .replace('{name}', name || '')
        .replace('{line}', line !== undefined ? line : '');
    return {
        start_line: node.start ? node.start.line : undefined,
        start_col:  node.start ? node.start.col  : undefined,
        end_line:   node.end   ? node.end.line   : undefined,
        end_col:    node.end   ? node.end.col    : undefined,
        ident,
        message: msg,
        level: level || ERROR,
        name,
        other_line: line,
    };
}

// ---------------------------------------------------------------------------
// Binding
// ---------------------------------------------------------------------------

function Binding(name, node, options) {
    options = options || {};
    this.node          = node;
    this.name          = name;
    this.is_import     = !!options.is_import;
    this.is_function   = !!options.is_function;
    this.is_func_arg   = !!options.is_func_arg;
    this.is_method     = !!options.is_method;
    this.is_loop       = false;
    this.used          = false;
}

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

function Scope(is_toplevel, parent_scope, is_class) {
    this.parent_scope          = parent_scope;
    this.is_toplevel           = !!is_toplevel;
    this.is_class              = !!is_class;
    this.bindings              = Object.create(null);
    this.children              = [];
    this.shadowed              = [];
    this.undefined_references  = Object.create(null);
    this.unused_bindings       = Object.create(null);
    this.nonlocals             = Object.create(null);
    this.defined_after_use     = Object.create(null);
    this.seen_method_names     = Object.create(null);
    this.methods               = Object.create(null);
}

Scope.prototype.add_binding = function(name, node, options) {
    const already_bound = has_prop(this.bindings, name);
    const b = new Binding(name, node, options);
    if (already_bound) {
        if (this.bindings[name].used) b.used = true;
        this.shadowed.push([name, this.bindings[name], b]);
    }
    this.bindings[name] = b;
    return b;
};

Scope.prototype.add_nonlocal = function(name) {
    this.nonlocals[name] = true;
};

Scope.prototype.register_use = function(name, node) {
    if (has_prop(this.bindings, name)) {
        this.bindings[name].used = true;
    } else {
        this.undefined_references[name] = node;
    }
};

Scope.prototype.for_descendants = function(func) {
    this.children.forEach(child => { func(child); child.for_descendants(func); });
};

Scope.prototype.finalize = function() {
    // Detect defined-after-use
    Object.keys(this.undefined_references).forEach(name => {
        if (has_prop(this.bindings, name) && !has_prop(this.nonlocals, name)) {
            const b = this.bindings[name];
            b.used = true;
            if (!has_prop(this.defined_after_use, name))
                this.defined_after_use[name] = [this.undefined_references[name], b];
            delete this.undefined_references[name];
        }
        if (has_prop(this.methods, name)) delete this.undefined_references[name];
    });

    // Detect unused bindings
    Object.keys(this.bindings).forEach(name => {
        const b = this.bindings[name];
        let found = false;
        this.for_descendants(scope => {
            if (has_prop(scope.undefined_references, name)) {
                found = true;
                delete scope.undefined_references[name];
            } else if (has_prop(scope.nonlocals, name) && has_prop(scope.bindings, name)) {
                found = true;
            }
        });
        if (!found && !b.used && !b.is_loop)
            this.unused_bindings[name] = b;
    });
};

Scope.prototype.messages = function() {
    const ans = [];

    Object.keys(this.undefined_references).forEach(name => {
        if (!(this.is_toplevel && has_prop(this.nonlocals, name))) {
            const node = this.undefined_references[name];
            ans.push(msg_from_node('undef', name, node));
        }
    });

    Object.keys(this.unused_bindings).forEach(name => {
        const b = this.unused_bindings[name];
        if (b.is_import) {
            ans.push(msg_from_node('unused-import', name, b.node));
        } else if (!this.is_toplevel && !this.is_class && !b.is_func_arg && !b.is_method && !has_prop(this.nonlocals, name)) {
            ans.push(msg_from_node('unused-local', name, b.node));
        }
    });

    this.shadowed.forEach(([name, first, second]) => {
        if (second.is_loop && !first.is_loop) {
            const line = first.node.start ? first.node.start.line : undefined;
            ans.push(msg_from_node('loop-shadowed', name, second.node, ERROR, line));
        }
    });

    Object.keys(this.defined_after_use).forEach(name => {
        const [use, binding] = this.defined_after_use[name];
        ans.push(msg_from_node('def-after-use', name, use, ERROR, binding.node.start.line));
    });

    return ans;
};

// ---------------------------------------------------------------------------
// Linter — mirrors the Linter in tools/lint.js
// ---------------------------------------------------------------------------

function Linter(RS, toplevel, code, builtins) {
    this.RS             = RS;
    this.scopes         = [];
    this.walked_scopes  = [];
    this.current_node   = null;
    this.branches       = [];
    this.messages       = [];
    this.builtins       = builtins;

    this.add_binding = function(name, binding_node) {
        const scope = this.scopes[this.scopes.length - 1];
        const node  = this.current_node;
        const opts  = {
            is_import:   (node instanceof RS.AST_Import || node instanceof RS.AST_ImportedVar),
            is_function: (node instanceof RS.AST_Lambda),
            is_method:   (node instanceof RS.AST_Method),
            is_func_arg: (node instanceof RS.AST_SymbolFunarg),
        };
        return scope.add_binding(name, binding_node || node, opts);
    };

    this.add_nonlocal = function(name) {
        this.scopes[this.scopes.length - 1].add_nonlocal(name);
    };

    this.register_use = function(name) {
        this.scopes[this.scopes.length - 1].register_use(name, this.current_node);
    };

    this.handle_import = function() {
        const node = this.current_node;
        if (!node.argnames) {
            const name = node.alias ? node.alias.name : node.key.split('.', 1)[0];
            this.add_binding(name, node.alias || node);
        }
    };

    this.handle_imported_var = function() {
        const node = this.current_node;
        const name = node.alias ? node.alias.name : node.name;
        this.add_binding(name);
    };

    this.handle_lambda = function() {
        const node  = this.current_node;
        const name  = node.name ? node.name.name : undefined;
        const scope = this.scopes[this.scopes.length - 1];
        if (this.branches.length && name)
            this.messages.push(msg_from_node('func-in-branch', name, node));
        if (name) {
            if (node instanceof RS.AST_Method) {
                scope.methods[name] = true;
                if (has_prop(scope.seen_method_names, name)) {
                    if (!node.is_setter)
                        this.messages.push(msg_from_node('dup-method', name, node, WARN, scope.seen_method_names[name]));
                } else {
                    scope.seen_method_names[name] = node.start.line;
                }
            } else {
                this.add_binding(name);
            }
        }
    };

    this.handle_assign = function() {
        const node = this.current_node;
        const handle_destructured = (flat) => {
            flat.forEach(cnode => {
                if (cnode instanceof RS.AST_SymbolRef) {
                    this.current_node = cnode;
                    cnode.lint_visited = true;
                    this.add_binding(cnode.name);
                    this.current_node = node;
                }
            });
        };
        if (node.left instanceof RS.AST_SymbolRef) {
            node.left.lint_visited = node.operator === '=';
            if (node.operator === '=') {
                this.current_node = node.left;
                this.add_binding(node.left.name);
                this.current_node = node;
            }
        } else if (node.left instanceof RS.AST_Array) {
            handle_destructured(node.left.flatten());
        } else if (node.left instanceof RS.AST_Seq && node.left.car instanceof RS.AST_SymbolRef) {
            handle_destructured(node.left.to_array());
        }
    };

    this.handle_named_expr = function() {
        const node = this.current_node;
        // Walrus operator: name := value — treat the name as a new binding.
        if (node.name instanceof RS.AST_SymbolRef) {
            node.name.lint_visited = true;
            this.current_node = node.name;
            this.add_binding(node.name.name);
            this.current_node = node;
        }
    };

    this.handle_vardef = function() {
        const node = this.current_node;
        if (node.name instanceof RS.AST_SymbolNonlocal) {
            this.add_nonlocal(node.name.name);
        } else {
            this.add_binding(node.name.name, node.name);
        }
    };

    this.handle_symbol_ref = function() {
        this.register_use(this.current_node.name);
    };

    this.handle_decorator = function() {
        const node = this.current_node.expression;
        if (node instanceof RS.AST_SymbolRef &&
            RS.compile_time_decorators.indexOf(node.name) !== -1)
            node.lint_visited = true;
    };

    this.handle_scope = function() {
        const node   = this.current_node;
        const parent = this.scopes.length ? this.scopes[this.scopes.length - 1] : null;
        const nscope = new Scope(
            node instanceof RS.AST_Toplevel,
            parent,
            node instanceof RS.AST_Class
        );
        if (parent) parent.children.push(nscope);
        this.scopes.push(nscope);
    };

    this.handle_symbol_funarg = function() {
        this.add_binding(this.current_node.name);
    };

    this.handle_comprehension = function() {
        this.handle_scope();
        this.handle_for_in();
    };

    this.handle_for_in = function() {
        const node = this.current_node;
        if (node.init instanceof RS.AST_SymbolRef) {
            this.add_binding(node.init.name).is_loop = true;
            node.init.lint_visited = true;
        } else if (node.init instanceof RS.AST_Array) {
            node.init.elements.forEach(cnode => {
                if (cnode instanceof RS.AST_Seq) cnode = cnode.to_array();
                if (cnode instanceof RS.AST_SymbolRef) cnode = [cnode];
                if (Array.isArray(cnode)) {
                    cnode.forEach(elem => {
                        if (elem instanceof RS.AST_SymbolRef) {
                            this.current_node = elem;
                            elem.lint_visited = true;
                            this.add_binding(elem.name).is_loop = true;
                            this.current_node = node;
                        }
                    });
                }
            });
        }
    };

    this.handle_for_js = function() {
        const js         = this.current_node.condition.value;
        const statements = js.split(';');
        let   decl       = statements[0].trim();
        if (decl.startsWith('var ')) decl = decl.slice(4);
        decl.split(',').forEach(part => {
            const m = /^[a-zA-Z0-9_]+/.exec(part.trimLeft());
            if (m) this.add_binding(m[0]);
        });
    };

    this.handle_except = function() {
        const node = this.current_node;
        if (node.argname) this.add_binding(node.argname.name, node.argname);
    };

    this.handle_empty_statement = function() {
        if (this.current_node.stype === ';')
            this.messages.push(msg_from_node('extra-semicolon', ';', this.current_node, WARN));
    };

    this.handle_class = function() {
        const node = this.current_node;
        if (node.name) {
            node.name.lint_visited = true;
            this.add_binding(node.name.name, node.name);
        }
    };

    this.handle_object_literal = function() {
        const node = this.current_node;
        const seen = Object.create(null);
        (node.properties || []).forEach(prop => {
            if (prop.key instanceof RS.AST_Constant) {
                const val = prop.key.value;
                if (has_prop(seen, val))
                    this.messages.push(msg_from_node('dup-key', val, prop));
                seen[val] = true;
            }
        });
    };

    this.handle_call = function() {
        const node = this.current_node;
        if (node.args.kwargs)
            node.args.kwargs.forEach(kw => { kw[0].lint_visited = true; });
    };

    this.handle_with_clause = function() {
        const node = this.current_node;
        if (node.alias) this.add_binding(node.alias.name);
    };

    // The visitor function called by toplevel.walk()
    this._visit = function(node, cont) {
        if (node.lint_visited) return;
        this.current_node = node;

        const scope_count  = this.scopes.length;
        const branch_count = this.branches.length;

        if (node instanceof RS.AST_If   || node instanceof RS.AST_Try  ||
            node instanceof RS.AST_Catch || node instanceof RS.AST_Except ||
            node instanceof RS.AST_Else) {
            this.branches.push(1);
        }

        if      (node instanceof RS.AST_Lambda)         this.handle_lambda();
        else if (node instanceof RS.AST_Import)          this.handle_import();
        else if (node instanceof RS.AST_ImportedVar)     this.handle_imported_var();
        else if (node instanceof RS.AST_Class)           this.handle_class();
        else if (node instanceof RS.AST_BaseCall)        this.handle_call();
        else if (node instanceof RS.AST_Assign)          this.handle_assign();
        else if (node instanceof RS.AST_NamedExpr)       this.handle_named_expr();
        else if (node instanceof RS.AST_VarDef)          this.handle_vardef();
        else if (node instanceof RS.AST_SymbolRef)       this.handle_symbol_ref();
        else if (node instanceof RS.AST_Decorator)       this.handle_decorator();
        else if (node instanceof RS.AST_SymbolFunarg)    this.handle_symbol_funarg();
        else if (node instanceof RS.AST_ListComprehension) this.handle_comprehension();
        else if (node instanceof RS.AST_ForIn)           this.handle_for_in();
        else if (node instanceof RS.AST_ForJS)           this.handle_for_js();
        else if (node instanceof RS.AST_Except)          this.handle_except();
        else if (node instanceof RS.AST_EmptyStatement)  this.handle_empty_statement();
        else if (node instanceof RS.AST_WithClause)      this.handle_with_clause();
        else if (node instanceof RS.AST_Object)          this.handle_object_literal();

        if (node instanceof RS.AST_Scope) this.handle_scope();

        if (cont !== undefined) cont();

        if (this.scopes.length > scope_count) {
            this.scopes[this.scopes.length - 1].finalize();
            this.walked_scopes.push(this.scopes.pop());
        }
        if (this.branches.length > branch_count) this.branches.pop();
    };

    // Collect all messages, apply noqa filters
    this.resolve = function(noqa) {
        noqa = noqa || {};
        let messages = this.messages.slice();

        // eol-semicolon: scan source lines
        code.split('\n').forEach((line, idx) => {
            const trimmed = line.trimRight();
            if (trimmed[trimmed.length - 1] === ';') {
                const ident = 'eol-semicolon';
                messages.push({
                    ident, message: MESSAGES[ident], level: WARN, name: ';',
                    start_line: idx + 1, start_col: trimmed.lastIndexOf(';'),
                });
            }
        });

        // Collect scope messages
        this.walked_scopes.forEach(scope => {
            messages = messages.concat(scope.messages());
        });

        // Filter: builtins, noqa
        messages = messages.filter(msg => {
            if (has_prop(noqa, msg.ident)) return false;
            if (msg.ident === 'undef' && has_prop(this.builtins, msg.name)) return false;
            return true;
        });

        messages.sort((a, b) => {
            const dl = (a.start_line || 0) - (b.start_line || 0);
            return dl !== 0 ? dl : (a.start_col || 0) - (b.start_col || 0);
        });

        return messages;
    };
}

// ---------------------------------------------------------------------------
// Convert lint message → Monaco IMarkerData
// markerSeverity should be { Error, Warning, Info, Hint } numeric values
// ---------------------------------------------------------------------------

function to_marker(msg, markerSeverity) {
    const sline = msg.start_line || 1;
    const scol  = (msg.start_col  !== undefined ? msg.start_col  : 0);
    const eline = msg.end_line   || sline;
    const ecol  = (msg.end_col   !== undefined ? msg.end_col   : scol);

    return {
        severity:        msg.level === WARN ? markerSeverity.Warning : markerSeverity.Error,
        message:         msg.message,
        source:          'rapydscript',
        startLineNumber: sline,
        startColumn:     scol + 1,           // lint uses 0-indexed cols
        endLineNumber:   eline,
        endColumn:       ecol + 2,           // exclusive end, 1-indexed
    };
}

// ---------------------------------------------------------------------------
// Public class
// ---------------------------------------------------------------------------

export class Diagnostics {
    /**
     * @param {object} compiler  - window.RapydScript (the compiled compiler)
     * @param {object} [extraBuiltins] - additional symbol names to treat as defined
     */
    constructor(compiler, extraBuiltins) {
        this._RS = compiler;

        // Build the builtins lookup table
        this._builtins = Object.create(null);
        BASE_BUILTINS.forEach(s => { this._builtins[s] = true; });

        // Add NATIVE_CLASSES from the compiler (Array, Promise, Map, etc.)
        if (compiler.NATIVE_CLASSES) {
            Object.keys(compiler.NATIVE_CLASSES).forEach(name => {
                this._builtins[name] = true;
            });
        }

        // Caller-supplied extra builtins (e.g. from d.ts globals)
        if (extraBuiltins) {
            Object.keys(extraBuiltins).forEach(name => {
                this._builtins[name] = true;
            });
        }
    }

    /**
     * Add additional global names (called by DtsRegistry when d.ts files are loaded).
     * @param {string[]} names
     */
    addGlobals(names) {
        names.forEach(n => { this._builtins[n] = true; });
    }

    /**
     * Run the linter on a source string and return Monaco marker objects.
     *
     * @param {string} code - RapydScript source
     * @param {object} [options]
     * @param {object} [options.virtualFiles]  - map of module name → source
     * @param {object} [options.noqa]          - map of ident → true to suppress
     * @param {object} [options.markerSeverity] - monaco.MarkerSeverity enum
     * @returns {Array} Monaco IMarkerData[]
     */
    check(code, options) {
        options = options || {};
        const RS             = this._RS;
        const markerSeverity = options.markerSeverity || { Error: 8, Warning: 4 };
        const noqa           = options.noqa || {};

        let toplevel, messages;

        // --- Parse ---
        try {
            toplevel = RS.parse(code, {
                filename:      'editor.pyj',
                for_linting:   true,
                // virtual files let the parser resolve imports without disk access
                ...(options.virtualFiles ? { virtual_files: options.virtualFiles } : {}),
            });
        } catch (e) {
            if (e instanceof RS.SyntaxError || e instanceof RS.ImportError) {
                const ident = (e instanceof RS.SyntaxError) ? 'syntax-err' : 'import-err';
                const line  = e.line || 1;
                const col   = e.col  || 0;
                return [{
                    severity:        markerSeverity.Error,
                    message:         e.message,
                    source:          'rapydscript',
                    startLineNumber: line,
                    startColumn:     col + 1,
                    endLineNumber:   line,
                    endColumn:       col + 2,
                }];
            }
            throw e;
        }

        // --- Lint ---
        const linter = new Linter(RS, toplevel, code, this._builtins);
        toplevel.walk(linter);
        messages = linter.resolve(noqa);

        return messages.map(m => to_marker(m, markerSeverity));
    }
}
