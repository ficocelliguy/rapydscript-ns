/* vim:fileencoding=utf-8
 * 
 * Copyright (C) 2016 Kovid Goyal <kovid at kovidgoyal.net>
 *
 * Distributed under terms of the BSD license
 */
"use strict";  /*jshint node:true */

var has_prop = Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);
var PYTHON_MODE_FLAGS = ['dict_literals', 'overload_getitem', 'bound_methods', 'hash_literals', 'overload_operators', 'truthiness', 'jsx', 'type_enforcement'];

function escape_regex_id(id) {
    // Identifier chars in RapydScript are ASCII word chars — no metachar escape
    // needed in practice, but stay safe against future changes.
    return id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Walks the top-level of the AST to collect the exact names that were declared
// in the user's source (as opposed to baselib/runtime names that may share the
// output). Only these names will receive an `export` prefix — that way bundled
// baselib symbols like `function sum()` are never touched.
function collect_toplevel_user_names(compiler, toplevel) {
    var out = {func: [], async_func: [], class: [], let: []};
    if (!toplevel) return out;

    var body = toplevel.body || [];
    for (var i = 0; i < body.length; i++) {
        var stmt = body[i];
        if (!stmt) continue;
        if (compiler.AST_Function && stmt instanceof compiler.AST_Function) {
            if (stmt.name && stmt.name.name) {
                (stmt.is_async ? out.async_func : out.func).push(stmt.name.name);
            }
        } else if (compiler.AST_Class && stmt instanceof compiler.AST_Class) {
            if (stmt.name && stmt.name.name) out.class.push(stmt.name.name);
        }
    }

    // localvars are emitted as a single `let <name>, <name>, ...;` line at the
    // start of the user body; capture their names so we can target that line.
    var localvars = toplevel.localvars;
    if (localvars && localvars.length) {
        for (var j = 0; j < localvars.length; j++) {
            var v = localvars[j];
            var n = (v && typeof v === 'object' && v.name) || (typeof v === 'string' ? v : null);
            if (n) out.let.push(n);
        }
    }
    return out;
}

// Applies the requested export{,_all,_main} transformations to already-compiled
// JS output. `compiler` and `toplevel` let us scope the transform to exactly the
// user-defined top-level names, so bundled baselib symbols aren't touched.
function apply_export_transforms(code, opts, compiler, toplevel) {
    if (!opts.export_all && !opts.export_main) return code;

    var names = collect_toplevel_user_names(compiler, toplevel);
    var to_export;
    if (opts.export_all) {
        to_export = names;
    } else {
        // export_main: only the top-level `main` (sync or async).
        to_export = {func: [], async_func: [], class: [], let: []};
        if (names.func.indexOf('main') !== -1) to_export.func.push('main');
        if (names.async_func.indexOf('main') !== -1) to_export.async_func.push('main');
    }

    function name_group(list) { return list.map(escape_regex_id).join('|'); }

    if (to_export.func.length) {
        var re = new RegExp('^(function\\s+(?:' + name_group(to_export.func) + ')\\b)', 'gm');
        code = code.replace(re, 'export $1');
    }
    if (to_export.async_func.length) {
        var re_a = new RegExp('^(async\\s+function\\s+(?:' + name_group(to_export.async_func) + ')\\b)', 'gm');
        code = code.replace(re_a, 'export $1');
    }
    if (to_export.class.length) {
        // Classes emit as: `var Foo = function Foo() { ... };`
        var re_c = new RegExp('^(var\\s+(?:' + name_group(to_export.class) + ')\\s*=\\s*function\\s+\\w+)', 'gm');
        code = code.replace(re_c, 'export $1');
    }
    if (to_export.let.length) {
        // localvars all land on the same beautified line: `let A, B, C;`. Match
        // when the line's first identifier is one of ours — the line contains
        // only user vars, so prefixing the whole line with `export` is correct.
        var re_l = new RegExp('^(let\\s+(?:' + name_group(to_export.let) + ')\\b)', 'gm');
        code = code.replace(re_l, 'export $1');
    }
    return code;
}

function build_scoped_flags(flags_str) {
    var result = Object.create(null);
    if (!flags_str) return result;
    flags_str.split(',').forEach(function(flag) {
        flag = flag.trim();
        if (!flag) return;
        var val = true;
        if (flag.slice(0, 3) === 'no_') { val = false; flag = flag.slice(3); }
        result[flag] = val;
    });
    return result;
}

module.exports = function(compiler, baselib, runjs, name, vf_context) {
    var LINE_CONTINUATION_CHARS = ':\\';
    runjs = runjs || eval;
    runjs(print_ast(compiler.parse(''), true));
    runjs('var __name__ = "' + (name || '__embedded__') + '";');

    function print_ast(ast, keep_baselib, keep_docstrings, js_version, private_scope, write_name, pythonize_strings) {
        var output_options = {omit_baselib:!keep_baselib, write_name:!!write_name, private_scope:!!private_scope, beautify:true, js_version: (js_version || 6), keep_docstrings:keep_docstrings, pythonize_strings:!!pythonize_strings};
        if (keep_baselib) output_options.baselib_plain = baselib;
        var output = new compiler.OutputStream(output_options);
        ast.print(output);
        return output.get();
    }

    // --- Source map support ---

    function vlq_encode(value) {
        var BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        var vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;
        var result = '';
        do {
            var digit = vlq & 31;
            vlq >>>= 5;
            if (vlq > 0) digit |= 32;
            result += BASE64[digit];
        } while (vlq > 0);
        return result;
    }

    function build_source_map(raw_mappings, source_name, source_content) {
        if (!raw_mappings.length) {
            return JSON.stringify({version:3, sources:[source_name], sourcesContent:[source_content||null], names:[], mappings:''});
        }
        raw_mappings.sort(function(a, b) {
            return a.gen_line !== b.gen_line ? a.gen_line - b.gen_line : a.gen_col - b.gen_col;
        });
        // Deduplicate same generated position (keep first)
        var deduped = [];
        var prev_key = null;
        for (var i = 0; i < raw_mappings.length; i++) {
            var m = raw_mappings[i];
            var key = m.gen_line + ':' + m.gen_col;
            if (key !== prev_key) { deduped.push(m); prev_key = key; }
        }
        var max_gen_line = deduped[deduped.length - 1].gen_line;
        var by_line = Object.create(null);
        for (var i = 0; i < deduped.length; i++) {
            var m = deduped[i];
            if (!by_line[m.gen_line]) by_line[m.gen_line] = [];
            by_line[m.gen_line].push(m);
        }
        // prev_src_* track deltas across all generated lines (Source Map v3 spec)
        var prev_src_line_0 = 0;
        var prev_src_col = 0;
        var lines_out = [];
        for (var line = 1; line <= max_gen_line; line++) {
            var prev_gen_col = 0;
            var segs = [];
            var lm = by_line[line] || [];
            for (var j = 0; j < lm.length; j++) {
                var m = lm[j];
                var src_line_0 = m.src_line - 1;
                segs.push(
                    vlq_encode(m.gen_col - prev_gen_col) +
                    vlq_encode(0) +
                    vlq_encode(src_line_0 - prev_src_line_0) +
                    vlq_encode(m.src_col - prev_src_col)
                );
                prev_gen_col = m.gen_col;
                prev_src_line_0 = src_line_0;
                prev_src_col = m.src_col;
            }
            lines_out.push(segs.join(','));
        }
        return JSON.stringify({
            version: 3,
            sources: [source_name],
            sourcesContent: [source_content || null],
            names: [],
            mappings: lines_out.join(';'),
        });
    }

    function print_ast_with_sourcemap(ast, keep_baselib, keep_docstrings, js_version, private_scope, write_name, pythonize_strings, source_name, source_content) {
        var output_options = {omit_baselib:!keep_baselib, write_name:!!write_name, private_scope:!!private_scope, beautify:true, js_version:(js_version||6), keep_docstrings:keep_docstrings, pythonize_strings:!!pythonize_strings};
        if (keep_baselib) output_options.baselib_plain = baselib;
        var raw_mappings = [];
        var output = new compiler.OutputStream(output_options);
        output.push_node = function(node) {
            if (node && node.start && node.start.line) {
                raw_mappings.push({
                    gen_line: this.current_line,
                    gen_col: this.current_col,
                    src_line: node.start.line,
                    src_col: node.start.col,
                });
            }
            this._stack.push(node);
        };
        ast.print(output);
        return {
            code: output.get(),
            sourceMap: build_source_map(raw_mappings, source_name, source_content),
        };
    }

    return {
        'toplevel': null,

        'compile': function streaming_compile(code, opts) {
            opts = opts || {};
            var classes = (this.toplevel) ? this.toplevel.classes : undefined;
            var inherited_flags = (this.toplevel) ? this.toplevel.scoped_flags : undefined;
            var base_flags = Object.create(null);
            if (opts.legacy_rapydscript !== true) {
                PYTHON_MODE_FLAGS.forEach(function(f) { base_flags[f] = true; });
            }
            var scoped_flags = Object.assign(
                base_flags,
                opts.python_flags ? build_scoped_flags(opts.python_flags) : {},
                inherited_flags || {}
            );
            var vf = (opts.virtual_files && vf_context) ? opts.virtual_files : null;
            var parse_opts = {
                'filename': opts.filename || '<embedded>',
                'basedir': '__stdlib__',
                'classes': classes,
                'scoped_flags': scoped_flags,
                'discard_asserts': opts.discard_asserts,
            };
            if (vf) {
                vf_context.set(vf);
                parse_opts.import_dirs = ['__virtual__'];
            }
            try {
                this.toplevel = compiler.parse(code, parse_opts);
            } finally {
                if (vf) vf_context.clear();
            }
            if (opts.tree_shake && compiler.tree_shake &&
                    this.toplevel.imports && Object.keys(this.toplevel.imports).length) {
                compiler.tree_shake(this.toplevel, {
                    parse: compiler.parse,
                    import_dirs: [],
                    basedir: undefined,
                    libdir: undefined,
                });
            }
            var pythonize_strings = (opts.legacy_rapydscript !== true) ? true : !!opts.pythonize_strings;
            var ans = print_ast(this.toplevel, opts.keep_baselib, opts.keep_docstrings, opts.js_version, opts.private_scope, opts.write_name, pythonize_strings);
            ans = apply_export_transforms(ans, opts, compiler, this.toplevel);
            if (classes) {
                var exports = {};
                var self = this;
                this.toplevel.exports.forEach(function (name) { exports[name] = true; });
                Object.getOwnPropertyNames(classes).forEach(function (name) {
                    if (!has_prop(exports, name) && !has_prop(self.toplevel.classes, name))
                        self.toplevel.classes[name] = classes[name];
                });
            }
            scoped_flags = this.toplevel.scoped_flags;

            return ans;
        },

        'compile_with_sourcemap': function compile_with_sourcemap(code, opts) {
            opts = opts || {};
            var classes = (this.toplevel) ? this.toplevel.classes : undefined;
            var inherited_flags = (this.toplevel) ? this.toplevel.scoped_flags : undefined;
            var base_flags_sm = Object.create(null);
            if (opts.legacy_rapydscript !== true) {
                PYTHON_MODE_FLAGS.forEach(function(f) { base_flags_sm[f] = true; });
            }
            var scoped_flags = Object.assign(
                base_flags_sm,
                opts.python_flags ? build_scoped_flags(opts.python_flags) : {},
                inherited_flags || {}
            );
            var vf = (opts.virtual_files && vf_context) ? opts.virtual_files : null;
            var parse_opts = {
                'filename': opts.filename || '<embedded>',
                'basedir': '__stdlib__',
                'classes': classes,
                'scoped_flags': scoped_flags,
                'discard_asserts': opts.discard_asserts,
            };
            if (vf) {
                vf_context.set(vf);
                parse_opts.import_dirs = ['__virtual__'];
            }
            try {
                this.toplevel = compiler.parse(code, parse_opts);
            } finally {
                if (vf) vf_context.clear();
            }
            if (opts.tree_shake && compiler.tree_shake &&
                    this.toplevel.imports && Object.keys(this.toplevel.imports).length) {
                compiler.tree_shake(this.toplevel, {
                    parse: compiler.parse,
                    import_dirs: [],
                    basedir: undefined,
                    libdir: undefined,
                });
            }
            var pythonize_strings_sm = (opts.legacy_rapydscript !== true) ? true : !!opts.pythonize_strings;
            var result = print_ast_with_sourcemap(
                this.toplevel,
                opts.keep_baselib, opts.keep_docstrings, opts.js_version,
                opts.private_scope, opts.write_name,
                pythonize_strings_sm,
                opts.filename || '<input>',
                code
            );
            var compiled_code = apply_export_transforms(result.code, opts, compiler, this.toplevel);
            if (classes) {
                var exports_map = {};
                var self_ref = this;
                this.toplevel.exports.forEach(function(name) { exports_map[name] = true; });
                Object.getOwnPropertyNames(classes).forEach(function(name) {
                    if (!has_prop(exports_map, name) && !has_prop(self_ref.toplevel.classes, name))
                        self_ref.toplevel.classes[name] = classes[name];
                });
            }
            scoped_flags = this.toplevel.scoped_flags;
            return { code: compiled_code, sourceMap: result.sourceMap };
        },

    };
};

