/* vim:fileencoding=utf-8
 * 
 * Copyright (C) 2015 Kovid Goyal <kovid at kovidgoyal.net>
 *
 * Distributed under terms of the BSD license
 */
"use strict";  /*jshint node:true */

// Thin wrapper around (release|dev)/compiler.js to setup some global facilities and
// export the compiler's symbols safely.

var path = require("path");
var fs = require("fs");
var crypto = require('crypto');
var vm = require("vm");
var UglifyJS = require("uglify-js");

function sha1sum(data) { 
    var h = crypto.createHash('sha1');
    h.update(data);
    return h.digest('hex');
}

function path_exists(path) {
    try {
        fs.statSync(path);
        return true;
    } catch(e) {
        if (e.code != 'ENOENT') throw e;
    }
}

function uglify(code) {
    var ans = UglifyJS.minify(code);
    if (ans.error) throw ans.error;
    return ans.code;
}


var _current_virtual_files = null;

function virtual_readfile(name, encoding) {
    if (_current_virtual_files && name.indexOf('__virtual__/') === 0) {
        var rel = name.slice('__virtual__/'.length);
        if (rel.slice(-11) === '.pyj-cached') rel = rel.slice(0, -11);
        else if (rel.slice(-4) === '.pyj') rel = rel.slice(0, -4);
        if (rel.slice(-9) === '/__init__') rel = rel.slice(0, -9);
        if (Object.prototype.hasOwnProperty.call(_current_virtual_files, rel)) {
            return _current_virtual_files[rel];
        }
    }
    return fs.readFileSync(name, encoding);
}

function virtual_writefile(name, content) {
    // Silently discard cache writes for virtual files; __virtual__ is not a real
    // directory, and the compiled `except Error` guard fails across vm contexts.
    if (name.indexOf('__virtual__/') === 0) return;
    return fs.writeFileSync(name, content);
}

function create_compiler() {
    var compiler_exports = {};
    var compiler_context = vm.createContext({
        console       : console,
        readfile      : virtual_readfile,
        writefile     : virtual_writefile,
        sha1sum       : sha1sum,
        require       : require,
        exports       : compiler_exports,
    });

    var base = path.dirname(path.dirname(module.filename));
    var compiler_dir = path.join(base, 'dev');
    if (!path_exists(path.join(compiler_dir, 'compiler.js'))) compiler_dir = path.join(base, 'release');
    var compiler_file = path.join(compiler_dir, 'compiler.js');
    var compilerjs = fs.readFileSync(compiler_file, 'utf-8');
    vm.runInContext(compilerjs, compiler_context, path.relative(base, compiler_file));
    return compiler_exports;
}

exports.create_compiler = create_compiler;
exports.set_virtual_files = function(vf) { _current_virtual_files = vf; };
exports.clear_virtual_files = function() { _current_virtual_files = null; };
