let ρσ_len, ρσ_NoneType, ρσ_js_builtin_names;
function ρσ_bool(val) {
    if (val === null || val === undefined) return false;
    var ρσ_bool_t = typeof val;
    if (ρσ_bool_t === "boolean") return val;
    if (ρσ_bool_t === "number") return val !== 0;
    if (ρσ_bool_t === "string") return val.length > 0;
    if (ρσ_bool_t === "function") return true;
    if (val.constructor && val.constructor.prototype === val) return true;
    if (typeof val.__bool__ === "function") return !!val.__bool__();
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val.__len__ === "function") return val.__len__() > 0;
    if ((typeof Set === "function" && val instanceof Set) || (typeof Map === "function" && val instanceof Map)) return val.size > 0;
    if (!val.constructor || val.constructor === Object) return Object.keys(val).length > 0;
    return true;
};
if (!ρσ_bool.__argnames__) Object.defineProperties(ρσ_bool, {
    __argnames__ : {value: ["val"]},
    __module__ : {value: "__main__"}
});

ρσ_bool.__name__ = "bool";
function ρσ_print() {
    var kwargs = arguments[arguments.length-1];
    if (kwargs === null || typeof kwargs !== "object" || kwargs [ρσ_kwargs_symbol] !== true) kwargs = {};
    var args = Array.prototype.slice.call(arguments, 0);
    if (kwargs !== null && typeof kwargs === "object" && kwargs [ρσ_kwargs_symbol] === true) args.pop();
    kwargs = ρσ_kwargs_to_dict(kwargs);
    var sep, parts, a;
    if (typeof console === "object") {
        sep = (kwargs.sep !== undefined) ? kwargs.sep : " ";
        parts = (function() {
            var ρσ_Iter = ρσ_Iterable(args), ρσ_Result = [], a;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                a = ρσ_Iter[ρσ_Index];
                ρσ_Result.push(ρσ_str(a));
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
        console.log(parts.join(sep));
    }
};
if (!ρσ_print.__handles_kwarg_interpolation__) Object.defineProperties(ρσ_print, {
    __handles_kwarg_interpolation__ : {value: true},
    __module__ : {value: "__main__"}
});

function ρσ_int(val, base) {
    var ans;
    if (typeof val === "number") {
        ans = val | 0;
    } else {
        ans = parseInt(val, base || 10);
    }
    if (isNaN(ans)) {
        throw new ValueError(ρσ_list_add(ρσ_list_add(ρσ_list_add("Invalid literal for int with base ", (base || 10)), ": "), val));
    }
    return ans;
};
if (!ρσ_int.__argnames__) Object.defineProperties(ρσ_int, {
    __argnames__ : {value: ["val", "base"]},
    __module__ : {value: "__main__"}
});

ρσ_int.__name__ = "int";
function ρσ_float(val) {
    var ans, s;
    if (typeof val === "number") {
        ans = val;
    } else {
        ans = parseFloat(val);
    }
    if (isNaN(ans)) {
        if (typeof val === "string") {
            s = val.trim().toLowerCase();
            if (s === "inf" || s === "+inf" || s === "infinity" || s === "+infinity") {
                return Infinity;
            }
            if (s === "-inf" || s === "-infinity") {
                return -Infinity;
            }
            if (s === "nan" || s === "+nan" || s === "-nan") {
                return NaN;
            }
        }
        throw new ValueError(ρσ_list_add("Could not convert string to float: ", arguments[0]));
    }
    return ans;
};
if (!ρσ_float.__argnames__) Object.defineProperties(ρσ_float, {
    __argnames__ : {value: ["val"]},
    __module__ : {value: "__main__"}
});

ρσ_float.__name__ = "float";
function ρσ_long(val, base) {
    var t, b;
    t = typeof val;
    if (t === "bigint") {
        return val;
    }
    if (t === "boolean") {
        return BigInt(val ? 1 : 0);
    }
    if (t === "number") {
        if (!Number.isInteger(val)) {
            throw new TypeError("long() can't convert non-integer float to long");
        }
        try { return BigInt(val); } catch(e) { throw new ValueError("long() argument out of range: " + val); };
    }
    if (t === "string") {
        b = (base !== null && base !== undefined) ? base : 10;
        var ρσ_ls = val.trim();
        try {
            if (b === 16) {
                if (ρσ_ls.slice(0, 2).toLowerCase() !== "0x") {
                    ρσ_ls = "0x" + ρσ_ls;
                }
                return BigInt(ρσ_ls);
            } else if (b === 2) {
                if (ρσ_ls.slice(0, 2).toLowerCase() !== "0b") {
                    ρσ_ls = "0b" + ρσ_ls;
                }
                return BigInt(ρσ_ls);
            } else if (b === 8) {
                if (ρσ_ls.slice(0, 2).toLowerCase() !== "0o") {
                    ρσ_ls = "0o" + ρσ_ls;
                }
                return BigInt(ρσ_ls);
            } else {
                return BigInt(ρσ_ls);
            }
        } catch (ρσ_Exception) {
            ρσ_last_exception = ρσ_Exception;
            {
                throw new ValueError(ρσ_list_add(ρσ_list_add(ρσ_list_add("Invalid literal for long() with base ", b), ": "), val));
            } 
        }
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("long() argument must be a string, a number, or a boolean, not '", t), "'"));
};
if (!ρσ_long.__argnames__) Object.defineProperties(ρσ_long, {
    __argnames__ : {value: ["val", "base"]},
    __module__ : {value: "__main__"}
});

ρσ_long.__name__ = "long";
function ρσ_arraylike_creator() {
    var names;
    names = "Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" ");
    if (typeof HTMLCollection === "function") {
        names = names.concat("HTMLCollection NodeList NamedNodeMap TouchList".split(" "));
    }
    return (function() {
        var ρσ_anonfunc = function (x) {
            if (Array.isArray(x) || typeof x === "string" || names.indexOf(Object.prototype.toString.call(x).slice(8, -1)) > -1) {
                return true;
            }
            return false;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["x"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
};
if (!ρσ_arraylike_creator.__module__) Object.defineProperties(ρσ_arraylike_creator, {
    __module__ : {value: "__main__"}
});

function options_object(f) {
    return (function() {
        var ρσ_anonfunc = function () {
            if (typeof arguments[arguments.length - 1] === "object") {
                arguments[ρσ_bound_index(arguments.length - 1, arguments)][ρσ_kwargs_symbol] = true;
            }
            return f.apply(this, arguments);
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
};
if (!options_object.__argnames__) Object.defineProperties(options_object, {
    __argnames__ : {value: ["f"]},
    __module__ : {value: "__main__"}
});

function ρσ_id(x) {
    return x.ρσ_object_id;
};
if (!ρσ_id.__argnames__) Object.defineProperties(ρσ_id, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_dir(item) {
    var arr;
    arr = ρσ_list_decorate([]);
    for (var i in item) {
        arr.push(i);
    }
    return arr;
};
if (!ρσ_dir.__argnames__) Object.defineProperties(ρσ_dir, {
    __argnames__ : {value: ["item"]},
    __module__ : {value: "__main__"}
});

function ρσ_ord(x) {
    var ans, second;
    ans = x.charCodeAt(0);
    if (55296 <= ans && ans <= 56319) {
        second = x.charCodeAt(1);
        if (56320 <= second && second <= 57343) {
            return ρσ_list_add(ρσ_list_add((ans - 55296) * 1024, second) - 56320, 65536);
        }
        throw new TypeError("string is missing the low surrogate char");
    }
    return ans;
};
if (!ρσ_ord.__argnames__) Object.defineProperties(ρσ_ord, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_chr(code) {
    if (code <= 65535) {
        return String.fromCharCode(code);
    }
    code -= 65536;
    return String.fromCharCode(ρσ_list_add(55296, (code >> 10)), ρσ_list_add(56320, (code & 1023)));
};
if (!ρσ_chr.__argnames__) Object.defineProperties(ρσ_chr, {
    __argnames__ : {value: ["code"]},
    __module__ : {value: "__main__"}
});

function ρσ_callable(x) {
    return typeof x === "function" || (x !== null && x !== undefined && typeof x.__call__ === "function");
};
if (!ρσ_callable.__argnames__) Object.defineProperties(ρσ_callable, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_callable_call(fn) {
    var args;
    args = Array.prototype.slice.call(arguments, 1);
    if (fn !== null && fn !== undefined && typeof fn.__call__ === "function") {
        return fn.__call__.apply(fn, args);
    }
    if (typeof fn === "function") {
        return fn.apply(undefined, args);
    }
    throw new TypeError("object is not callable");
};
if (!ρσ_callable_call.__argnames__) Object.defineProperties(ρσ_callable_call, {
    __argnames__ : {value: ["fn"]},
    __module__ : {value: "__main__"}
});

function ρσ_round(x, ndigits) {
    var factor;
    if (ndigits === undefined || ndigits === 0) {
        return Math.round(x);
    }
    factor = Math.pow(10, ndigits);
    return Math.round(x * factor) / factor;
};
if (!ρσ_round.__argnames__) Object.defineProperties(ρσ_round, {
    __argnames__ : {value: ["x", "ndigits"]},
    __module__ : {value: "__main__"}
});

function ρσ_bin(x) {
    var ans;
    if (typeof x !== "number" || x % 1 !== 0) {
        throw new TypeError("integer required");
    }
    ans = x.toString(2);
    if (ans[0] === "-") {
        ans = ρσ_list_add(ρσ_list_add("-", "0b"), ans.slice(1));
    } else {
        ans = ρσ_list_add("0b", ans);
    }
    return ans;
};
if (!ρσ_bin.__argnames__) Object.defineProperties(ρσ_bin, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_hex(x) {
    var ans;
    if (typeof x !== "number" || x % 1 !== 0) {
        throw new TypeError("integer required");
    }
    ans = x.toString(16);
    if (ans[0] === "-") {
        ans = ρσ_list_add(ρσ_list_add("-", "0x"), ans.slice(1));
    } else {
        ans = ρσ_list_add("0x", ans);
    }
    return ans;
};
if (!ρσ_hex.__argnames__) Object.defineProperties(ρσ_hex, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_enumerate(iterable, start) {
    var offset, ans, iterator;
    offset = (start === undefined) ? 0 : start;
    ans = (function(){
        var ρσ_d = {};
        ρσ_d["_i"] = offset - 1;
        return ρσ_d;
    }).call(this);
    ans[ρσ_iterator_symbol] = (function() {
        var ρσ_anonfunc = function () {
            return this;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    if (ρσ_arraylike(iterable)) {
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                var idx;
                this._i = ρσ_list_iadd(this._i, 1);
                idx = this._i - offset;
                if (idx < iterable.length) {
                    return (function(){
                        var ρσ_d = {};
                        ρσ_d["done"] = false;
                        ρσ_d["value"] = ρσ_list_decorate([ this._i, iterable[(typeof idx === "number" && idx < 0) ? iterable.length + idx : idx] ]);
                        return ρσ_d;
                    }).call(this);
                }
                return {'done':true};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    }
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        ans["_iterator"] = iterator;
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                var r;
                r = this._iterator.next();
                if (r.done) {
                    return {'done':true};
                }
                this._i = ρσ_list_iadd(this._i, 1);
                return (function(){
                    var ρσ_d = {};
                    ρσ_d["done"] = false;
                    ρσ_d["value"] = ρσ_list_decorate([ this._i, r.value ]);
                    return ρσ_d;
                }).call(this);
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    }
    return ρσ_enumerate(Object.keys(iterable), start);
};
if (!ρσ_enumerate.__argnames__) Object.defineProperties(ρσ_enumerate, {
    __argnames__ : {value: ["iterable", "start"]},
    __module__ : {value: "__main__"}
});

function ρσ_reversed(iterable) {
    var ans;
    if (ρσ_arraylike(iterable)) {
        ans = {"_i": iterable.length};
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i -= 1;
                if (this._i > -1) {
                    return {'done':false, 'value':iterable[this._i]};
                }
                return {'done':true};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    }
    throw new TypeError("reversed() can only be called on arrays or strings");
};
if (!ρσ_reversed.__argnames__) Object.defineProperties(ρσ_reversed, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

function ρσ_iter(iterable, sentinel) {
    var callable_, ans;
    if (arguments.length >= 2) {
        callable_ = iterable;
        ans = {"_callable":callable_,"_sentinel":sentinel,"_done":false};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                var val;
                if (this._done) {
                    return {'done':true};
                }
                val = ρσ_callable_call(this._callable);
                if (val === this._sentinel) {
                    this._done = true;
                    return {'done':true};
                }
                return {'done':false,'value':val};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    }
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        return (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
    }
    if (ρσ_arraylike(iterable)) {
        ans = {"_i":-1};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i < iterable.length) {
                    return {'done':false, 'value':iterable[this._i]};
                }
                return {'done':true};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    }
    return ρσ_iter(Object.keys(iterable));
};
if (!ρσ_iter.__argnames__) Object.defineProperties(ρσ_iter, {
    __argnames__ : {value: ["iterable", "sentinel"]},
    __module__ : {value: "__main__"}
});

function ρσ_range_next(step, length) {
    var ρσ_unpack;
    this._i = ρσ_list_iadd(this._i, step);
    this._idx = ρσ_list_iadd(this._idx, 1);
    if (this._idx >= length) {
        ρσ_unpack = [this.__i, -1];
        this._i = ρσ_unpack[0];
        this._idx = ρσ_unpack[1];
        return {'done':true};
    }
    return {'done':false, 'value':this._i};
};
if (!ρσ_range_next.__argnames__) Object.defineProperties(ρσ_range_next, {
    __argnames__ : {value: ["step", "length"]},
    __module__ : {value: "__main__"}
});

function ρσ_range(start, stop, step) {
    var length, ans;
    if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
    }
    step = arguments[2] || 1;
    length = Math.max(Math.ceil((stop - start) / step), 0);
    ans = {start:start, step:step, stop:stop};
    ans[ρσ_iterator_symbol] = (function() {
        var ρσ_anonfunc = function () {
            var it;
            it = {"_i": start - step, "_idx": -1};
            it.next = ρσ_range_next.bind(it, step, length);
            it[ρσ_iterator_symbol] = (function() {
                var ρσ_anonfunc = function () {
                    return this;
                };
                if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })();
            return it;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans.count = (function() {
        var ρσ_anonfunc = function (val) {
            if (!this._cached) {
                this._cached = list(this);
            }
            return this._cached.count(val);
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["val"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans.index = (function() {
        var ρσ_anonfunc = function (val) {
            if (!this._cached) {
                this._cached = list(this);
            }
            return this._cached.index(val);
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["val"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans.__len__ = (function() {
        var ρσ_anonfunc = function () {
            return length;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans.__repr__ = (function() {
        var ρσ_anonfunc = function () {
            return ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("range(", ρσ_str.format("{}", start)), ", "), ρσ_str.format("{}", stop)), ", "), ρσ_str.format("{}", step)), ")");
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans.__str__ = ans.toString = ans.__repr__;
    if (typeof Proxy === "function") {
        ans = new Proxy(ans, (function(){
            var ρσ_d = {};
            ρσ_d["get"] = (function() {
                var ρσ_anonfunc = function (obj, prop) {
                    var iprop;
                    if (typeof prop === "string") {
                        iprop = parseInt(prop);
                        if (!isNaN(iprop)) {
                            prop = iprop;
                        }
                    }
                    if (typeof prop === "number") {
                        if (!obj._cached) {
                            obj._cached = list(obj);
                        }
                        return (ρσ_expr_temp = obj._cached)[(typeof prop === "number" && prop < 0) ? ρσ_expr_temp.length + prop : prop];
                    }
                    return obj[(typeof prop === "number" && prop < 0) ? obj.length + prop : prop];
                };
                if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
                    __argnames__ : {value: ["obj", "prop"]},
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })();
            return ρσ_d;
        }).call(this));
    }
    return ans;
};
if (!ρσ_range.__argnames__) Object.defineProperties(ρσ_range, {
    __argnames__ : {value: ["start", "stop", "step"]},
    __module__ : {value: "__main__"}
});

function ρσ_getattr(obj, name, defval) {
    var ret;
    try {
        ret = obj[(typeof name === "number" && name < 0) ? obj.length + name : name];
    } catch (ρσ_Exception) {
        ρσ_last_exception = ρσ_Exception;
        if (ρσ_Exception instanceof TypeError) {
            if (defval === undefined) {
                throw new AttributeError(ρσ_list_add(ρσ_list_add("The attribute ", name), " is not present"));
            }
            return defval;
        } else {
            throw ρσ_Exception;
        }
    }
    if (ret === undefined && !(name in obj)) {
        if (defval === undefined) {
            throw new AttributeError(ρσ_list_add(ρσ_list_add("The attribute ", name), " is not present"));
        }
        ret = defval;
    }
    return ret;
};
if (!ρσ_getattr.__argnames__) Object.defineProperties(ρσ_getattr, {
    __argnames__ : {value: ["obj", "name", "defval"]},
    __module__ : {value: "__main__"}
});

function ρσ_setattr(obj, name, value) {
    obj[(typeof name === "number" && name < 0) ? obj.length + name : name] = value;
};
if (!ρσ_setattr.__argnames__) Object.defineProperties(ρσ_setattr, {
    __argnames__ : {value: ["obj", "name", "value"]},
    __module__ : {value: "__main__"}
});

function ρσ_hasattr(obj, name) {
    return name in obj;
};
if (!ρσ_hasattr.__argnames__) Object.defineProperties(ρσ_hasattr, {
    __argnames__ : {value: ["obj", "name"]},
    __module__ : {value: "__main__"}
});

ρσ_len = (function() {
    var ρσ_anonfunc = function () {
        function len(obj) {
            if (ρσ_arraylike(obj)) {
                return obj.length;
            }
            if (typeof obj.__len__ === "function") {
                return obj.__len__();
            }
            if (obj instanceof Set || obj instanceof Map) {
                return obj.size;
            }
            return Object.keys(obj).length;
        };
        if (!len.__argnames__) Object.defineProperties(len, {
            __argnames__ : {value: ["obj"]},
            __module__ : {value: "__main__"}
        });

        function len5(obj) {
            if (ρσ_arraylike(obj)) {
                return obj.length;
            }
            if (typeof obj.__len__ === "function") {
                return obj.__len__();
            }
            return Object.keys(obj).length;
        };
        if (!len5.__argnames__) Object.defineProperties(len5, {
            __argnames__ : {value: ["obj"]},
            __module__ : {value: "__main__"}
        });

        return (typeof Set === "function" && typeof Map === "function") ? len : len5;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})()();
function ρσ_get_module(name) {
    return ρσ_modules[(typeof name === "number" && name < 0) ? ρσ_modules.length + name : name];
};
if (!ρσ_get_module.__argnames__) Object.defineProperties(ρσ_get_module, {
    __argnames__ : {value: ["name"]},
    __module__ : {value: "__main__"}
});

function ρσ__import__(name, globals, locals, fromlist, level) {
    var lookup, module;
    if (typeof ρσ_modules === "undefined") {
        throw ImportError(ρσ_list_add(ρσ_list_add("No module named '", name), "'"));
    }
    if (fromlist !== undefined && fromlist !== null && fromlist.length) {
        lookup = name;
    } else {
        lookup = name.split(".")[0];
    }
    module = ρσ_modules[(typeof lookup === "number" && lookup < 0) ? ρσ_modules.length + lookup : lookup];
    if (module === undefined) {
        throw ModuleNotFoundError(ρσ_list_add(ρσ_list_add("No module named '", lookup), "'"));
    }
    return module;
};
if (!ρσ__import__.__argnames__) Object.defineProperties(ρσ__import__, {
    __argnames__ : {value: ["name", "globals", "locals", "fromlist", "level"]},
    __module__ : {value: "__main__"}
});

function ρσ_pow(x, y, z) {
    var ans;
    ans = Math.pow(x, y);
    if (z !== undefined) {
        ans %= z;
    }
    return ans;
};
if (!ρσ_pow.__argnames__) Object.defineProperties(ρσ_pow, {
    __argnames__ : {value: ["x", "y", "z"]},
    __module__ : {value: "__main__"}
});

ρσ_NoneType = {"__name__": "NoneType"};
ρσ_NoneType.toString = (function() {
    var ρσ_anonfunc = function () {
        return "<class 'NoneType'>";
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_js_builtin_names = {"Number": "float", "String": "str", "Boolean": "bool", "Array": "list", "Object": "object", "Function": "function", "RegExp": "RegExp", "Date": "datetime", "Map": "dict", "Set": "set", "Uint8Array": "bytes"};
function ρσ_type(x) {
    var c, n;
    if (x === null || x === undefined) {
        return ρσ_NoneType;
    }
    c = x.constructor;
    if (!c) {
        return ρσ_NoneType;
    }
    if (!Object.prototype.hasOwnProperty.call(c, "__ρσ_ts")) {
        n = c.__name__ || ρσ_js_builtin_names[ρσ_bound_index(c.name, ρσ_js_builtin_names)] || c.name || "object";
        c.toString = (function() {
            var ρσ_anonfunc = function () {
                return ρσ_list_add(ρσ_list_add("<class '", n), "'>");
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        c.__ρσ_ts = true;
    }
    return c;
};
if (!ρσ_type.__argnames__) Object.defineProperties(ρσ_type, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_issubclass(cls, base) {
    var b;
    if (Array.isArray(base)) {
        var ρσ_Iter0 = ρσ_Iterable(base);
        for (var ρσ_Index0 = 0; ρσ_Index0 < ρσ_Iter0.length; ρσ_Index0++) {
            b = ρσ_Iter0[ρσ_Index0];
            if (ρσ_issubclass(cls, b)) {
                return true;
            }
        }
        return false;
    }
    if (typeof cls !== "function") {
        throw new TypeError("issubclass() arg 1 must be a class");
    }
    if (typeof base !== "function") {
        throw new TypeError("issubclass() arg 2 must be a class");
    }
    if (cls === base) {
        return true;
    }
    var proto = cls.prototype; while (proto !== null && proto !== undefined) { if (proto === base.prototype) return true; proto = Object.getPrototypeOf(proto); };
    return false;
};
if (!ρσ_issubclass.__argnames__) Object.defineProperties(ρσ_issubclass, {
    __argnames__ : {value: ["cls", "base"]},
    __module__ : {value: "__main__"}
});

var ρσ_hash_id_counter = 0;
function ρσ_hash(obj) {
    var ρσ_t = typeof obj;
    if (obj === null || obj === undefined) return 0;
    if (ρσ_t === "boolean") return obj ? 1 : 0;
    if (ρσ_t === "number") { return (obj === Math.floor(obj)) ? (obj | 0) : ((obj * 2654435761) | 0); };
    if (ρσ_t === "string") {
        var ρσ_h = 5381;
        for (var ρσ_i = 0; ρσ_i < obj.length; ρσ_i++) {
            ρσ_h = (((ρσ_h << 5) + ρσ_h) ^ obj.charCodeAt(ρσ_i)) | 0;
        }
        return ρσ_h;
    };
    if (obj.__hash__ === null) throw new TypeError("unhashable type: \'" + (obj.constructor && obj.constructor.name ? obj.constructor.name : "object") + "\'");
    if (typeof obj.__hash__ === "function") return obj.__hash__();
    if (Array.isArray(obj)) throw new TypeError("unhashable type: \'list\'");
    if (typeof ρσ_set === "function" && obj instanceof ρσ_set) throw new TypeError("unhashable type: \'set\'");
    if (typeof Set === "function" && obj instanceof Set) throw new TypeError("unhashable type: \'set\'");
    if (typeof ρσ_dict === "function" && obj instanceof ρσ_dict) throw new TypeError("unhashable type: \'dict\'");
    if (typeof Map === "function" && obj instanceof Map) throw new TypeError("unhashable type: \'dict\'");
    if (!obj.constructor || obj.constructor === Object) throw new TypeError("unhashable type: \'dict\'");
    if (obj.ρσ_object_id === undefined) obj.ρσ_object_id = ++ρσ_hash_id_counter;
    return obj.ρσ_object_id;
};
if (!ρσ_hash.__argnames__) Object.defineProperties(ρσ_hash, {
    __argnames__ : {value: ["obj"]},
    __module__ : {value: "__main__"}
});

function ρσ_next(iterator, defval) {
    var r;
    if (iterator === null || iterator === undefined) {
        throw new TypeError("object is not an iterator");
    }
    if (typeof iterator.next === "function") {
        r = iterator.next();
        if (r.done) {
            if (arguments.length > 1) {
                return defval;
            }
            throw StopIteration();
        }
        return r.value;
    }
    if (typeof iterator.__next__ === "function") {
        try {
            return iterator.__next__();
        } catch (ρσ_Exception) {
            ρσ_last_exception = ρσ_Exception;
            if (ρσ_Exception instanceof StopIteration) {
                if (arguments.length > 1) {
                    return defval;
                }
                throw ρσ_Exception;
            } else {
                throw ρσ_Exception;
            }
        }
    }
    throw new TypeError("object is not an iterator");
};
if (!ρσ_next.__argnames__) Object.defineProperties(ρσ_next, {
    __argnames__ : {value: ["iterator", "defval"]},
    __module__ : {value: "__main__"}
});

function ρσ_divmod(x, y) {
    var d;
    if (y === 0) {
        throw new ZeroDivisionError("integer division or modulo by zero");
    }
    d = Math.floor(x / y);
    return [d, x - d * y];
};
if (!ρσ_divmod.__argnames__) Object.defineProperties(ρσ_divmod, {
    __argnames__ : {value: ["x", "y"]},
    __module__ : {value: "__main__"}
});

function ρσ_max() {
    var kwargs = arguments[arguments.length-1];
    if (kwargs === null || typeof kwargs !== "object" || kwargs [ρσ_kwargs_symbol] !== true) kwargs = {};
    var args = Array.prototype.slice.call(arguments, 0);
    if (kwargs !== null && typeof kwargs === "object" && kwargs [ρσ_kwargs_symbol] === true) args.pop();
    kwargs = ρσ_kwargs_to_dict(kwargs);
    var args, x;
    if (args.length === 0) {
        if (kwargs.defval !== undefined) {
            return kwargs.defval;
        }
        throw new TypeError("expected at least one argument");
    }
    if (args.length === 1) {
        args = args[0];
    }
    if (kwargs.key) {
        args = (function() {
            var ρσ_Iter = ρσ_Iterable(args), ρσ_Result = [], x;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                x = ρσ_Iter[ρσ_Index];
                ρσ_Result.push(kwargs.key(x));
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    }
    if (!Array.isArray(args)) {
        args = list(args);
    }
    if (args.length) {
        return this.apply(null, args);
    }
    if (kwargs.defval !== undefined) {
        return kwargs.defval;
    }
    throw new TypeError("expected at least one argument");
};
if (!ρσ_max.__handles_kwarg_interpolation__) Object.defineProperties(ρσ_max, {
    __handles_kwarg_interpolation__ : {value: true},
    __module__ : {value: "__main__"}
});

function ρσ_slice() {
    if (!(this instanceof ρσ_slice)) return new ρσ_slice(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ρσ_slice.prototype.__init__.apply(this, arguments);
}
ρσ_slice.prototype.__init__ = function __init__(start_or_stop, stop, step) {
    var self = this;
    if (arguments.length === 1) {
        self.start = null;
        self.stop = start_or_stop;
        self.step = null;
    } else if (arguments.length === 2) {
        self.start = start_or_stop;
        self.stop = stop;
        self.step = null;
    } else {
        self.start = start_or_stop;
        self.stop = stop;
        self.step = step;
    }
};
if (!ρσ_slice.prototype.__init__.__argnames__) Object.defineProperties(ρσ_slice.prototype.__init__, {
    __argnames__ : {value: ["start_or_stop", "stop", "step"]},
    __module__ : {value: "__main__"}
});
ρσ_slice.__argnames__ = ρσ_slice.prototype.__init__.__argnames__;
ρσ_slice.__handles_kwarg_interpolation__ = ρσ_slice.prototype.__init__.__handles_kwarg_interpolation__;
ρσ_slice.prototype.indices = function indices(length) {
    var self = this;
    var step, lower, upper, start, stop;
    step = (self.step === null) ? 1 : self.step;
    if (step === 0) {
        throw new ValueError("slice step cannot be zero");
    }
    if (step > 0) {
        lower = 0;
        upper = length;
        start = (self.start === null) ? lower : self.start;
        stop = (self.stop === null) ? upper : self.stop;
    } else {
        lower = -1;
        upper = length - 1;
        start = (self.start === null) ? upper : self.start;
        stop = (self.stop === null) ? lower : self.stop;
    }
    if (self.start !== null) {
        if (start < 0) {
            start = max(ρσ_list_add(start, length), lower);
        }
        if (start > upper) {
            start = upper;
        }
    }
    if (self.stop !== null) {
        if (stop < 0) {
            stop = max(ρσ_list_add(stop, length), lower);
        }
        if (stop > upper) {
            stop = upper;
        }
    }
    return [start, stop, step];
};
if (!ρσ_slice.prototype.indices.__argnames__) Object.defineProperties(ρσ_slice.prototype.indices, {
    __argnames__ : {value: ["length"]},
    __module__ : {value: "__main__"}
});
ρσ_slice.prototype.__repr__ = function __repr__() {
    var self = this;
    var s, stop, step;
    s = (self.start === null) ? "None" : new String(self.start);
    stop = (self.stop === null) ? "None" : new String(self.stop);
    step = (self.step === null) ? "None" : new String(self.step);
    return ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("slice(", s), ", "), stop), ", "), step), ")");
};
if (!ρσ_slice.prototype.__repr__.__module__) Object.defineProperties(ρσ_slice.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ρσ_slice.prototype.__str__ = function __str__() {
    var self = this;
    return self.__repr__();
};
if (!ρσ_slice.prototype.__str__.__module__) Object.defineProperties(ρσ_slice.prototype.__str__, {
    __module__ : {value: "__main__"}
});
ρσ_slice.prototype.__eq__ = function __eq__(other) {
    var self = this;
    if (!other instanceof ρσ_slice) {
        return false;
    }
    return self.start === other.start && self.stop === other.stop && self.step === other.step;
};
if (!ρσ_slice.prototype.__eq__.__argnames__) Object.defineProperties(ρσ_slice.prototype.__eq__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_slice.prototype.__hash__ = function __hash__() {
    var self = this;
    throw new TypeError("unhashable type: 'slice'");
};
if (!ρσ_slice.prototype.__hash__.__module__) Object.defineProperties(ρσ_slice.prototype.__hash__, {
    __module__ : {value: "__main__"}
});
ρσ_slice.prototype.__format__ = function __format__ () {
        if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ρσ_slice.prototype, "__bases__", {value: []});
ρσ_slice.__name__ = "ρσ_slice";
ρσ_slice.__qualname__ = "ρσ_slice";
ρσ_slice.__module__ = "__main__";
Object.defineProperty(ρσ_slice.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

function ρσ_object() {
    if (!(this instanceof ρσ_object)) return new ρσ_object(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ρσ_object.prototype.__init__.apply(this, arguments);
}
ρσ_object.prototype.__init__ = function __init__() {
    var self = this;
};
if (!ρσ_object.prototype.__init__.__module__) Object.defineProperties(ρσ_object.prototype.__init__, {
    __module__ : {value: "__main__"}
});
ρσ_object.__argnames__ = ρσ_object.prototype.__init__.__argnames__;
ρσ_object.__handles_kwarg_interpolation__ = ρσ_object.prototype.__init__.__handles_kwarg_interpolation__;
ρσ_object.prototype.__repr__ = function __repr__() {
    var self = this;
    if (this.ρσ_object_id === undefined) this.ρσ_object_id = ++ρσ_hash_id_counter;
    return ρσ_list_add(ρσ_list_add("<object object at 0x", this.ρσ_object_id.toString(16)), ">");
};
if (!ρσ_object.prototype.__repr__.__module__) Object.defineProperties(ρσ_object.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ρσ_object.prototype.__str__ = function __str__() {
    var self = this;
    return self.__repr__();
};
if (!ρσ_object.prototype.__str__.__module__) Object.defineProperties(ρσ_object.prototype.__str__, {
    __module__ : {value: "__main__"}
});
ρσ_object.prototype.__eq__ = function __eq__(other) {
    var self = this;
    return self === other;
};
if (!ρσ_object.prototype.__eq__.__argnames__) Object.defineProperties(ρσ_object.prototype.__eq__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_object.prototype.__hash__ = function __hash__() {
    var self = this;
    if (this.ρσ_object_id === undefined) this.ρσ_object_id = ++ρσ_hash_id_counter;
    return self.ρσ_object_id;
};
if (!ρσ_object.prototype.__hash__.__module__) Object.defineProperties(ρσ_object.prototype.__hash__, {
    __module__ : {value: "__main__"}
});
ρσ_object.prototype.__format__ = function __format__ () {
        if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ρσ_object.prototype, "__bases__", {value: []});
ρσ_object.__name__ = "ρσ_object";
ρσ_object.__qualname__ = "ρσ_object";
ρσ_object.__module__ = "__main__";
Object.defineProperty(ρσ_object.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

ρσ_object.__name__ = "object";
function ρσ_exec(code, globals, locals) {
    if (globals === undefined) {
        eval(code);
        return null;
    }
    
    function _ρσ_to_obj(d) {
        if (d == null) return {};
        if (typeof ρσ_dict === "function" && d instanceof ρσ_dict) {
            var _r = {}; d.jsmap.forEach(function(v, k) { _r[k] = v; }); return _r;
        }
        return Object.assign({}, d);
    }
    var _ctx = _ρσ_to_obj(globals);
    if (locals !== undefined) Object.assign(_ctx, _ρσ_to_obj(locals));
    var _rσ_refs = code.match(/ρσ_\w+/g) || [];
    _rσ_refs.forEach(function(name) {
        if (!Object.prototype.hasOwnProperty.call(_ctx, name)) {
            try { var _v = eval(name); if (_v !== undefined) _ctx[name] = _v; } catch(e) {}
        }
    });
    var _keys = Object.keys(_ctx);
    var _vals = _keys.map(function(k) { return _ctx[k]; });
    Function.apply(null, _keys.concat([code])).apply(null, _vals);
    ;
    return null;
};
if (!ρσ_exec.__argnames__) Object.defineProperties(ρσ_exec, {
    __argnames__ : {value: ["code", "globals", "locals"]},
    __module__ : {value: "__main__"}
});

ρσ_exec.__name__ = "exec";
function ρσ_eval(expr, globals, locals) {
    
    function _ρσ_to_obj(d) {
        if (d == null) return {};
        if (typeof ρσ_dict === "function" && d instanceof ρσ_dict) {
            var _r = {}; d.jsmap.forEach(function(v, k) { _r[k] = v; }); return _r;
        }
        return Object.assign({}, d);
    }
    var _ctx = (globals !== undefined) ? _ρσ_to_obj(globals) : {};
    if (locals !== undefined) Object.assign(_ctx, _ρσ_to_obj(locals));
    var _rσ_refs = expr.match(/ρσ_\w+/g) || [];
    _rσ_refs.forEach(function(name) {
        if (!Object.prototype.hasOwnProperty.call(_ctx, name)) {
            try { var _v = eval(name); if (_v !== undefined) _ctx[name] = _v; } catch(e) {}
        }
    });
    var _keys = Object.keys(_ctx);
    var _vals = _keys.map(function(k) { return _ctx[k]; });
    return Function.apply(null, _keys.concat(['return (' + expr + ')'])).apply(null, _vals);
    ;
};
if (!ρσ_eval.__argnames__) Object.defineProperties(ρσ_eval, {
    __argnames__ : {value: ["expr", "globals", "locals"]},
    __module__ : {value: "__main__"}
});

ρσ_eval.__name__ = "eval";
function ρσ_vars(obj) {
    
    var _d;
    if (typeof ρσ_dict === "function") {
        _d = new ρσ_dict();
        if (obj !== undefined && obj !== null) {
            Object.keys(obj).forEach(function(k) {
                if (k.charCodeAt(0) !== 0x03c1) { _d.jsmap.set(k, obj[k]); }
            });
        }
    } else {
        _d = Object.create(null);
        if (obj !== undefined && obj !== null) {
            Object.keys(obj).forEach(function(k) {
                if (k.charCodeAt(0) !== 0x03c1) { _d[k] = obj[k]; }
            });
        }
    }
    ;
    return _d;
};
if (!ρσ_vars.__argnames__) Object.defineProperties(ρσ_vars, {
    __argnames__ : {value: ["obj"]},
    __module__ : {value: "__main__"}
});

ρσ_vars.__name__ = "vars";
function ρσ_locals() {
    
    var _d;
    if (typeof ρσ_dict === "function") { _d = new ρσ_dict(); } else { _d = Object.create(null); }
    ;
    return _d;
};
if (!ρσ_locals.__module__) Object.defineProperties(ρσ_locals, {
    __module__ : {value: "__main__"}
});

ρσ_locals.__name__ = "locals";
function ρσ_globals() {
    
    var _g = (typeof globalThis !== "undefined") ? globalThis : (typeof window !== "undefined" ? window : (typeof global !== "undefined" ? global : {}));
    var _d;
    if (typeof ρσ_dict === "function") {
        _d = new ρσ_dict();
        Object.getOwnPropertyNames(_g).forEach(function(k) { _d.jsmap.set(k, _g[k]); });
    } else {
        _d = Object.create(null);
        Object.getOwnPropertyNames(_g).forEach(function(k) { _d[k] = _g[k]; });
    }
    ;
    return _d;
};
if (!ρσ_globals.__module__) Object.defineProperties(ρσ_globals, {
    __module__ : {value: "__main__"}
});

ρσ_globals.__name__ = "globals";
function ρσ_abs(x) {
    if (x !== null && typeof x.__abs__ === "function") {
        return x.__abs__();
    }
    return Math.abs(x);
};
if (!ρσ_abs.__argnames__) Object.defineProperties(ρσ_abs, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

ρσ_abs.__name__ = "abs";
function ρσ_complex() {
    if (!(this instanceof ρσ_complex)) return new ρσ_complex(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ρσ_complex.prototype.__init__.apply(this, arguments);
}
ρσ_complex.prototype.__init__ = function __init__(real, imag) {
    var self = this;
    var nargs, x, s, m_mixed, m_imag, m_real, ims;
    nargs = arguments.length;
    if (nargs === 0) {
        self.real = 0;
        self.imag = 0;
    } else if (nargs >= 2) {
        if (typeof real !== "number" && typeof real !== "boolean") {
            throw new TypeError(ρσ_list_add(ρσ_list_add("complex() first argument must be a number, not '", typeof real), "'"));
        }
        if (typeof imag !== "number" && typeof imag !== "boolean") {
            throw new TypeError(ρσ_list_add(ρσ_list_add("complex() second argument must be a number, not '", typeof imag), "'"));
        }
        self.real = +real;
        self.imag = +imag;
    } else {
        x = real;
        if (x instanceof ρσ_complex) {
            self.real = x.real;
            self.imag = x.imag;
        } else if (typeof x === "number" || typeof x === "boolean") {
            self.real = +x;
            self.imag = 0;
        } else if (typeof x === "string" || x instanceof String) {
            s = new String(x).trim();
            m_mixed = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)([+-](?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)?)[jJ]$/.exec(s);
            m_imag = /^([+-]?(?:(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)?)[jJ]$/.exec(s);
            m_real = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/.exec(s);
            if (m_mixed) {
                self.real = parseFloat(m_mixed[1]);
                ims = m_mixed[2];
                if (ims === "+") {
                    self.imag = 1;
                } else if (ims === "-") {
                    self.imag = -1;
                } else {
                    self.imag = parseFloat(ims);
                }
            } else if (m_imag) {
                self.real = 0;
                ims = m_imag[1];
                if (!ims || ims === "+") {
                    self.imag = 1;
                } else if (ims === "-") {
                    self.imag = -1;
                } else {
                    self.imag = parseFloat(ims);
                }
            } else if (m_real) {
                self.real = parseFloat(m_real[1]);
                self.imag = 0;
            } else {
                throw new ValueError("complex() arg is a malformed string");
            }
        } else {
            throw new TypeError("complex() argument must be a string or a number");
        }
    }
};
if (!ρσ_complex.prototype.__init__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__init__, {
    __argnames__ : {value: ["real", "imag"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.__argnames__ = ρσ_complex.prototype.__init__.__argnames__;
ρσ_complex.__handles_kwarg_interpolation__ = ρσ_complex.prototype.__init__.__handles_kwarg_interpolation__;
ρσ_complex.prototype.__add__ = function __add__(other) {
    var self = this;
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(ρσ_list_add(self.real, other.real), ρσ_list_add(self.imag, other.imag));
    }
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(ρσ_list_add(self.real, other), self.imag);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for +: 'complex' and '", typeof other), "'"));
};
if (!ρσ_complex.prototype.__add__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__add__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__radd__ = function __radd__(other) {
    var self = this;
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(ρσ_list_add(other, self.real), self.imag);
    }
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(ρσ_list_add(other.real, self.real), ρσ_list_add(other.imag, self.imag));
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for +: '", typeof other), "' and 'complex'"));
};
if (!ρσ_complex.prototype.__radd__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__radd__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__sub__ = function __sub__(other) {
    var self = this;
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(self.real - other.real, self.imag - other.imag);
    }
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(self.real - other, self.imag);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for -: 'complex' and '", typeof other), "'"));
};
if (!ρσ_complex.prototype.__sub__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__sub__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__rsub__ = function __rsub__(other) {
    var self = this;
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(other - self.real, -self.imag);
    }
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(other.real - self.real, other.imag - self.imag);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for -: '", typeof other), "' and 'complex'"));
};
if (!ρσ_complex.prototype.__rsub__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__rsub__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__mul__ = function __mul__(other) {
    var self = this;
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(self.real * other.real - self.imag * other.imag, ρσ_list_add(self.real * other.imag, self.imag * other.real));
    }
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(self.real * other, self.imag * other);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for *: 'complex' and '", typeof other), "'"));
};
if (!ρσ_complex.prototype.__mul__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__mul__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__rmul__ = function __rmul__(other) {
    var self = this;
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(other * self.real, other * self.imag);
    }
    if (other instanceof ρσ_complex) {
        return new ρσ_complex(other.real * self.real - other.imag * self.imag, ρσ_list_add(other.real * self.imag, other.imag * self.real));
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for *: '", typeof other), "' and 'complex'"));
};
if (!ρσ_complex.prototype.__rmul__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__rmul__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__truediv__ = function __truediv__(other) {
    var self = this;
    var denom;
    if (other instanceof ρσ_complex) {
        denom = ρσ_list_add(other.real * other.real, other.imag * other.imag);
        if (denom === 0) {
            throw new ZeroDivisionError("complex division by zero");
        }
        return new ρσ_complex((ρσ_list_add(self.real * other.real, self.imag * other.imag)) / denom, (self.imag * other.real - self.real * other.imag) / denom);
    }
    if (typeof other === "number" || typeof other === "boolean") {
        if (other === 0) {
            throw new ZeroDivisionError("complex division by zero");
        }
        return new ρσ_complex(self.real / other, self.imag / other);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for /: 'complex' and '", typeof other), "'"));
};
if (!ρσ_complex.prototype.__truediv__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__truediv__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__rtruediv__ = function __rtruediv__(other) {
    var self = this;
    var denom;
    denom = ρσ_list_add(self.real * self.real, self.imag * self.imag);
    if (denom === 0) {
        throw new ZeroDivisionError("complex division by zero");
    }
    if (typeof other === "number" || typeof other === "boolean") {
        return new ρσ_complex(other * self.real / denom, -other * self.imag / denom);
    }
    if (other instanceof ρσ_complex) {
        return new ρσ_complex((ρσ_list_add(other.real * self.real, other.imag * self.imag)) / denom, (other.imag * self.real - other.real * self.imag) / denom);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for /: '", typeof other), "' and 'complex'"));
};
if (!ρσ_complex.prototype.__rtruediv__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__rtruediv__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__pow__ = function __pow__(other) {
    var self = this;
    var r, theta, rn, log_r, c, d, re_prod, im_prod, exp_re;
    if (typeof other === "number" || typeof other === "boolean") {
        r = Math.sqrt(ρσ_list_add(self.real * self.real, self.imag * self.imag));
        if (r === 0) {
            return new ρσ_complex(0, 0);
        }
        theta = Math.atan2(self.imag, self.real);
        rn = Math.pow(r, other);
        return new ρσ_complex(rn * Math.cos(other * theta), rn * Math.sin(other * theta));
    }
    if (other instanceof ρσ_complex) {
        r = Math.sqrt(ρσ_list_add(self.real * self.real, self.imag * self.imag));
        if (r === 0) {
            return new ρσ_complex(0, 0);
        }
        theta = Math.atan2(self.imag, self.real);
        log_r = Math.log(r);
        c = other.real;
        d = other.imag;
        re_prod = c * log_r - d * theta;
        im_prod = ρσ_list_add(d * log_r, c * theta);
        exp_re = Math.exp(re_prod);
        return new ρσ_complex(exp_re * Math.cos(im_prod), exp_re * Math.sin(im_prod));
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for **: 'complex' and '", typeof other), "'"));
};
if (!ρσ_complex.prototype.__pow__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__pow__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__rpow__ = function __rpow__(other) {
    var self = this;
    var base;
    if (typeof other === "number" || typeof other === "boolean") {
        base = new ρσ_complex(other, 0);
        return base.__pow__(self);
    }
    if (other instanceof ρσ_complex) {
        return other.__pow__(self);
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for **: '", typeof other), "' and 'complex'"));
};
if (!ρσ_complex.prototype.__rpow__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__rpow__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__neg__ = function __neg__() {
    var self = this;
    return new ρσ_complex(-self.real, -self.imag);
};
if (!ρσ_complex.prototype.__neg__.__module__) Object.defineProperties(ρσ_complex.prototype.__neg__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__pos__ = function __pos__() {
    var self = this;
    return new ρσ_complex(self.real, self.imag);
};
if (!ρσ_complex.prototype.__pos__.__module__) Object.defineProperties(ρσ_complex.prototype.__pos__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__abs__ = function __abs__() {
    var self = this;
    return Math.sqrt(ρσ_list_add(self.real * self.real, self.imag * self.imag));
};
if (!ρσ_complex.prototype.__abs__.__module__) Object.defineProperties(ρσ_complex.prototype.__abs__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__bool__ = function __bool__() {
    var self = this;
    return self.real !== 0 || self.imag !== 0;
};
if (!ρσ_complex.prototype.__bool__.__module__) Object.defineProperties(ρσ_complex.prototype.__bool__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__eq__ = function __eq__(other) {
    var self = this;
    if (other instanceof ρσ_complex) {
        return self.real === other.real && self.imag === other.imag;
    }
    if (typeof other === "number" || typeof other === "boolean") {
        return self.imag === 0 && self.real === other;
    }
    return false;
};
if (!ρσ_complex.prototype.__eq__.__argnames__) Object.defineProperties(ρσ_complex.prototype.__eq__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__hash__ = function __hash__() {
    var self = this;
    if (self.imag === 0) {
        return self.real | 0;
    }
    return (self.real * 1000003 ^ self.imag) | 0;
};
if (!ρσ_complex.prototype.__hash__.__module__) Object.defineProperties(ρσ_complex.prototype.__hash__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.conjugate = function conjugate() {
    var self = this;
    return new ρσ_complex(self.real, -self.imag);
};
if (!ρσ_complex.prototype.conjugate.__module__) Object.defineProperties(ρσ_complex.prototype.conjugate, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__repr__ = function __repr__() {
    var self = this;
    var r, i, r_str, i_str;
    r = self.real;
    i = self.imag;
    if (r === 0 && i === 0) {
        return "0j";
    }
    r_str = new String(r);
    i_str = new String(i);
    if (r === 0) {
        return ρσ_list_add(i_str, "j");
    }
    if (i >= 0 || isNaN(i)) {
        return ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("(", r_str), "+"), i_str), "j)");
    }
    return ρσ_list_add(ρσ_list_add(ρσ_list_add("(", r_str), i_str), "j)");
};
if (!ρσ_complex.prototype.__repr__.__module__) Object.defineProperties(ρσ_complex.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__str__ = function __str__() {
    var self = this;
    return self.__repr__();
};
if (!ρσ_complex.prototype.__str__.__module__) Object.defineProperties(ρσ_complex.prototype.__str__, {
    __module__ : {value: "__main__"}
});
ρσ_complex.prototype.__format__ = function __format__ () {
        if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ρσ_complex.prototype, "__bases__", {value: []});
ρσ_complex.__name__ = "ρσ_complex";
ρσ_complex.__qualname__ = "ρσ_complex";
ρσ_complex.__module__ = "__main__";
Object.defineProperty(ρσ_complex.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

ρσ_complex.__name__ = "complex";
var abs = ρσ_abs, max = ρσ_max.bind(Math.max), min = ρσ_max.bind(Math.min), bool = ρσ_bool, type = ρσ_type;
var float = ρσ_float, int = ρσ_int, long = ρσ_long, complex = ρσ_complex, arraylike = ρσ_arraylike_creator(), ρσ_arraylike = arraylike;
var id = ρσ_id, get_module = ρσ_get_module, pow = ρσ_pow, divmod = ρσ_divmod, __import__ = ρσ__import__;
var dir = ρσ_dir, ord = ρσ_ord, chr = ρσ_chr, bin = ρσ_bin, hex = ρσ_hex, callable = ρσ_callable, round = ρσ_round;
var enumerate = ρσ_enumerate, iter = ρσ_iter, reversed = ρσ_reversed, len = ρσ_len;
var range = ρσ_range, getattr = ρσ_getattr, setattr = ρσ_setattr, hasattr = ρσ_hasattr, issubclass = ρσ_issubclass, hash = ρσ_hash, next = ρσ_next;
var exec = ρσ_exec;
var vars = ρσ_vars, locals = ρσ_locals, globals = ρσ_globals;
var ρσ_Ellipsis = Object.freeze({toString: function(){return "Ellipsis";}, __repr__: function(){return "Ellipsis";}});
var Ellipsis = ρσ_Ellipsis;
var slice = ρσ_slice;
var object = ρσ_object;
Number.prototype.is_integer = function() { return isFinite(+this) && (+this) % 1 === 0; };
Number.prototype.bit_length = function() { var n = Math.abs(Math.trunc(+this)); if (n === 0) return 0; return Math.floor(Math.log2(n)) + 1; };function ρσ_bytes_utf8_encode(s) {
    var out, c, i, c2, cp;
    if (typeof TextEncoder !== "undefined") {
        return Array.from(new TextEncoder().encode(s));
    }
    out = ρσ_list_decorate([]);
    for (var i = 0; i < s.length; i++) {
        c = s.charCodeAt(i);
        if (c < 128) {
            out.push(c);
        } else if (c < 2048) {
            out.push(192 | c >> 6);
            out.push(128 | c & 63);
        } else if (c >= 55296 && c <= 56319) {
            i = ρσ_list_iadd(i, 1);
            c2 = s.charCodeAt(i);
            cp = ρσ_list_add(ρσ_list_add(65536, (c - 55296 << 10)), (c2 - 56320));
            out.push(240 | cp >> 18);
            out.push(128 | cp >> 12 & 63);
            out.push(128 | cp >> 6 & 63);
            out.push(128 | cp & 63);
        } else {
            out.push(224 | c >> 12);
            out.push(128 | c >> 6 & 63);
            out.push(128 | c & 63);
        }
    }
    return out;
};
if (!ρσ_bytes_utf8_encode.__argnames__) Object.defineProperties(ρσ_bytes_utf8_encode, {
    __argnames__ : {value: ["s"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_utf8_decode(data) {
    var out, i, b, cp;
    if (typeof TextDecoder !== "undefined") {
        return new TextDecoder("utf-8").decode(new Uint8Array(data));
    }
    out = ρσ_list_decorate([]);
    i = 0;
    while (i < data.length) {
        b = data[(typeof i === "number" && i < 0) ? data.length + i : i];
        if (b < 128) {
            out.push(String.fromCharCode(b));
            i = ρσ_list_iadd(i, 1);
        } else if (b < 224) {
            cp = (b & 31) << 6 | data[ρσ_bound_index(ρσ_list_add(i, 1), data)] & 63;
            out.push(String.fromCharCode(cp));
            i = ρσ_list_iadd(i, 2);
        } else if (b < 240) {
            cp = (b & 15) << 12 | (data[ρσ_bound_index(ρσ_list_add(i, 1), data)] & 63) << 6 | data[ρσ_bound_index(ρσ_list_add(i, 2), data)] & 63;
            out.push(String.fromCharCode(cp));
            i = ρσ_list_iadd(i, 3);
        } else {
            cp = (b & 7) << 18 | (data[ρσ_bound_index(ρσ_list_add(i, 1), data)] & 63) << 12 | (data[ρσ_bound_index(ρσ_list_add(i, 2), data)] & 63) << 6 | data[ρσ_bound_index(ρσ_list_add(i, 3), data)] & 63;
            cp -= 65536;
            out.push(String.fromCharCode(ρσ_list_add(55296, (cp >> 10))));
            out.push(String.fromCharCode(ρσ_list_add(56320, (cp & 1023))));
            i = ρσ_list_iadd(i, 4);
        }
    }
    return out.join("");
};
if (!ρσ_bytes_utf8_decode.__argnames__) Object.defineProperties(ρσ_bytes_utf8_decode, {
    __argnames__ : {value: ["data"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_latin1_encode(s) {
    var out, c;
    out = ρσ_list_decorate([]);
    for (var i = 0; i < s.length; i++) {
        c = s.charCodeAt(i);
        if (c > 255) {
            throw UnicodeEncodeError("latin-1", s, i, ρσ_list_add(i, 1), "ordinal not in range(256)");
        }
        out.push(c);
    }
    return out;
};
if (!ρσ_bytes_latin1_encode.__argnames__) Object.defineProperties(ρσ_bytes_latin1_encode, {
    __argnames__ : {value: ["s"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_latin1_decode(data) {
    var chars;
    chars = ρσ_list_decorate([]);
    for (var i = 0; i < data.length; i++) {
        chars.push(String.fromCharCode(data[(typeof i === "number" && i < 0) ? data.length + i : i]));
    }
    return chars.join("");
};
if (!ρσ_bytes_latin1_decode.__argnames__) Object.defineProperties(ρσ_bytes_latin1_decode, {
    __argnames__ : {value: ["data"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_from_source(source, encoding, errors) {
    var data, n, enc, b, x, iterator, result;
    data = ρσ_list_decorate([]);
    if (arguments.length === 0 || source === null || source === undefined) {
    } else if (typeof source === "number") {
        n = source | 0;
        if (n < 0) {
            throw new ValueError("negative count");
        }
        for (var i = 0; i < n; i++) {
            data.push(0);
        }
    } else if (typeof source === "string") {
        enc = (encoding || "utf-8").toLowerCase().replace(/-|_/g, "");
        if (enc === "utf8") {
            data = ρσ_bytes_utf8_encode(source);
        } else if (enc === "latin1" || enc === "iso88591" || enc === "ascii") {
            data = ρσ_bytes_latin1_encode(source);
        } else {
            throw LookupError(ρσ_list_add("unknown encoding: ", (encoding || "utf-8")));
        }
    } else if (source instanceof ρσ_bytes || source instanceof ρσ_bytearray) {
        data = source._data.slice();
    } else if (source instanceof Uint8Array || source instanceof Int8Array) {
        for (var i = 0; i < source.length; i++) {
            data.push(source[(typeof i === "number" && i < 0) ? source.length + i : i] & 255);
        }
    } else if (ρσ_arraylike(source) || Array.isArray(source)) {
        var ρσ_Iter0 = ρσ_Iterable(source);
        for (var ρσ_Index0 = 0; ρσ_Index0 < ρσ_Iter0.length; ρσ_Index0++) {
            x = ρσ_Iter0[ρσ_Index0];
            b = x | 0;
            if (b < 0 || b > 255) {
                throw new ValueError("bytes must be in range(0, 256)");
            }
            data.push(b);
        }
    } else if (typeof source[ρσ_iterator_symbol] === "function") {
        iterator = source[ρσ_iterator_symbol]();
        result = iterator.next();
        while (!result.done) {
            b = result.value | 0;
            if (b < 0 || b > 255) {
                throw new ValueError("bytes must be in range(0, 256)");
            }
            data.push(b);
            result = iterator.next();
        }
    } else {
        throw new TypeError(ρσ_list_add(ρσ_list_add("cannot convert '", typeof source), "' object to bytes-like object"));
    }
    return data;
};
if (!ρσ_bytes_from_source.__argnames__) Object.defineProperties(ρσ_bytes_from_source, {
    __argnames__ : {value: ["source", "encoding", "errors"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_sync(obj) {
    var data, old_len, new_len;
    data = obj._data;
    old_len = obj.length | 0;
    new_len = data.length;
    for (var i = new_len; i < old_len; i++) {
        delete obj[i];
    }
    for (var i = 0; i < new_len; i++) {
        obj[(typeof i === "number" && i < 0) ? obj.length + i : i] = data[(typeof i === "number" && i < 0) ? data.length + i : i];
    }
    obj.length = new_len;
};
if (!ρσ_bytes_sync.__argnames__) Object.defineProperties(ρσ_bytes_sync, {
    __argnames__ : {value: ["obj"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes_find(haystack, needle, start) {
    var hl, nl, ok;
    hl = haystack.length;
    nl = needle.length;
    if (nl === 0) {
        return start;
    }
    for (var i = start; i <= hl - nl; i++) {
        ok = true;
        for (var j = 0; j < nl; j++) {
            if (haystack[ρσ_bound_index(ρσ_list_add(i, j), haystack)] !== needle[(typeof j === "number" && j < 0) ? needle.length + j : j]) {
                ok = false;
                break;
            }
        }
        if (ok) {
            return i;
        }
    }
    return -1;
};
if (!ρσ_bytes_find.__argnames__) Object.defineProperties(ρσ_bytes_find, {
    __argnames__ : {value: ["haystack", "needle", "start"]},
    __module__ : {value: "__main__"}
});

function ρσ_bytes() {
    if (!(this instanceof ρσ_bytes)) return new ρσ_bytes(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ρσ_bytes.prototype.__init__.apply(this, arguments);
}
ρσ_bytes.prototype.__init__ = function __init__(source, encoding, errors) {
    var self = this;
    self._data = ρσ_bytes_from_source.apply(null, arguments);
    ρσ_bytes_sync(self);
};
if (!ρσ_bytes.prototype.__init__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__init__, {
    __argnames__ : {value: ["source", "encoding", "errors"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.__argnames__ = ρσ_bytes.prototype.__init__.__argnames__;
ρσ_bytes.__handles_kwarg_interpolation__ = ρσ_bytes.prototype.__init__.__handles_kwarg_interpolation__;
ρσ_bytes.prototype.__len__ = function __len__() {
    var self = this;
    return self._data.length;
};
if (!ρσ_bytes.prototype.__len__.__module__) Object.defineProperties(ρσ_bytes.prototype.__len__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__getitem__ = function __getitem__(key) {
    var self = this;
    var indices, start, stop, step, result, n;
    if (key instanceof ρσ_slice) {
        indices = key.indices(self._data.length);
        start = indices[0];
        stop = indices[1];
        step = indices[2];
        result = ρσ_list_decorate([]);
        if (step > 0) {
            for (var i = start; i < stop; i += step) {
                result.push((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
            }
        } else {
            for (var i = start; i > stop; i += step) {
                result.push((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
            }
        }
        return new ρσ_bytes(result);
    }
    n = key | 0;
    if (n < 0) {
        n = ρσ_list_iadd(n, self._data.length);
    }
    if (n < 0 || n >= self._data.length) {
        throw new IndexError("index out of range");
    }
    return (ρσ_expr_temp = self._data)[(typeof n === "number" && n < 0) ? ρσ_expr_temp.length + n : n];
};
if (!ρσ_bytes.prototype.__getitem__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__getitem__, {
    __argnames__ : {value: ["key"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__contains__ = function __contains__(item) {
    var self = this;
    var b;
    if (item instanceof ρσ_bytes || item instanceof ρσ_bytearray) {
        return ρσ_bytes_find(self._data, item._data, 0) >= 0;
    }
    b = item | 0;
    for (var i = 0; i < this._data.length; i++) {
        if ((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === b) {
            return true;
        }
    }
    return false;
};
if (!ρσ_bytes.prototype.__contains__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__contains__, {
    __argnames__ : {value: ["item"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__add__ = function __add__(other) {
    var self = this;
    if (!((other instanceof ρσ_bytes || other instanceof ρσ_bytearray))) {
        throw new TypeError("can't concat bytes-like objects of different types");
    }
    return new ρσ_bytes(self._data.concat(other._data));
};
if (!ρσ_bytes.prototype.__add__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__add__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__mul__ = function __mul__(n) {
    var self = this;
    var result;
    result = ρσ_list_decorate([]);
    for (var k = 0; k < n; k++) {
        for (var j = 0; j < this._data.length; j++) {
            result.push((ρσ_expr_temp = self._data)[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j]);
        }
    }
    return new ρσ_bytes(result);
};
if (!ρσ_bytes.prototype.__mul__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__mul__, {
    __argnames__ : {value: ["n"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__rmul__ = function __rmul__(n) {
    var self = this;
    return self.__mul__(n);
};
if (!ρσ_bytes.prototype.__rmul__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__rmul__, {
    __argnames__ : {value: ["n"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__eq__ = function __eq__(other) {
    var self = this;
    if (!((other instanceof ρσ_bytes || other instanceof ρσ_bytearray))) {
        return false;
    }
    if (self._data.length !== other._data.length) {
        return false;
    }
    for (var i = 0; i < this._data.length; i++) {
        if ((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] !== (ρσ_expr_temp = other._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]) {
            return false;
        }
    }
    return true;
};
if (!ρσ_bytes.prototype.__eq__.__argnames__) Object.defineProperties(ρσ_bytes.prototype.__eq__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__iter__ = function __iter__() {
    var self = this;
    return iter(self._data);
};
if (!ρσ_bytes.prototype.__iter__.__module__) Object.defineProperties(ρσ_bytes.prototype.__iter__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype[ρσ_iterator_symbol] = ρσ_bytes.prototype.__iter__;
ρσ_bytes.prototype.__bool__ = function __bool__() {
    var self = this;
    return self._data.length > 0;
};
if (!ρσ_bytes.prototype.__bool__.__module__) Object.defineProperties(ρσ_bytes.prototype.__bool__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__repr__ = function __repr__() {
    var self = this;
    var parts, b, h;
    parts = ρσ_list_decorate([ "b'" ]);
    for (var i = 0; i < this._data.length; i++) {
        b = (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        if (b === 9) {
            parts.push("\\t");
        } else if (b === 10) {
            parts.push("\\n");
        } else if (b === 13) {
            parts.push("\\r");
        } else if (b === 39) {
            parts.push("\\'");
        } else if (b === 92) {
            parts.push("\\\\");
        } else if (b >= 32 && b < 127) {
            parts.push(String.fromCharCode(b));
        } else {
            h = b.toString(16);
            parts.push(ρσ_list_add(ρσ_list_add("\\x", ((h.length < 2) ? "0" : "")), h));
        }
    }
    parts.push("'");
    return parts.join("");
};
if (!ρσ_bytes.prototype.__repr__.__module__) Object.defineProperties(ρσ_bytes.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__str__ = function __str__() {
    var self = this;
    return self.__repr__();
};
if (!ρσ_bytes.prototype.__str__.__module__) Object.defineProperties(ρσ_bytes.prototype.__str__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__hash__ = function __hash__() {
    var self = this;
    var h;
    h = 5381;
    for (var i = 0; i < this._data.length; i++) {
        h = ρσ_list_add((h << 5), h) ^ (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        h = h | 0;
    }
    return h;
};
if (!ρσ_bytes.prototype.__hash__.__module__) Object.defineProperties(ρσ_bytes.prototype.__hash__, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.hex = function hex(sep, bytes_per_sep) {
    var self = this;
    var parts, h, n, grouped, i;
    parts = ρσ_list_decorate([]);
    for (var i = 0; i < this._data.length; i++) {
        h = (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i].toString(16);
        parts.push(ρσ_list_add(((h.length < 2) ? "0" : ""), h));
    }
    if (sep !== undefined && sep !== null && parts.length > 0) {
        n = (bytes_per_sep === undefined || bytes_per_sep === null) ? 1 : bytes_per_sep | 0;
        if (n < 0) {
            n = -n;
            grouped = ρσ_list_decorate([]);
            i = parts.length;
            while (i > 0) {
                grouped.unshift(parts.slice(max(0, i - n), i).join(""));
                i -= n;
            }
            return grouped.join(sep);
        } else {
            grouped = ρσ_list_decorate([]);
            for (var i = 0; i < parts.length; i += n) {
                grouped.push(parts.slice(i, ρσ_list_add(i, n)).join(""));
            }
            return grouped.join(sep);
        }
    }
    return parts.join("");
};
if (!ρσ_bytes.prototype.hex.__argnames__) Object.defineProperties(ρσ_bytes.prototype.hex, {
    __argnames__ : {value: ["sep", "bytes_per_sep"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.decode = function decode(encoding, errors) {
    var self = this;
    var enc;
    enc = (encoding || "utf-8").toLowerCase().replace(/-|_/g, "");
    if (enc === "utf8") {
        return ρσ_bytes_utf8_decode(self._data);
    } else if (enc === "latin1" || enc === "iso88591" || enc === "ascii") {
        return ρσ_bytes_latin1_decode(self._data);
    } else {
        throw LookupError(ρσ_list_add("unknown encoding: ", (encoding || "utf-8")));
    }
};
if (!ρσ_bytes.prototype.decode.__argnames__) Object.defineProperties(ρσ_bytes.prototype.decode, {
    __argnames__ : {value: ["encoding", "errors"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.fromhex = function fromhex(s) {
    var data, val;
    s = s.replace(/ /g, "");
    if (s.length % 2 !== 0) {
        throw new ValueError("non-hexadecimal number found in fromhex() arg");
    }
    data = ρσ_list_decorate([]);
    for (var i = 0; i < s.length; i += 2) {
        val = parseInt(s.slice(i, ρσ_list_add(i, 2)), 16);
        if (isNaN(val)) {
            throw new ValueError(ρσ_list_add("non-hexadecimal number found in fromhex() arg at position ", str(i)));
        }
        data.push(val);
    }
    return new ρσ_bytes(data);
};
if (!ρσ_bytes.fromhex.__argnames__) Object.defineProperties(ρσ_bytes.fromhex, {
    __argnames__ : {value: ["s"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.count = function count(sub, start, end) {
    var self = this;
    var needle, s, e, n, pos, found;
    needle = (typeof sub === "number") ? ρσ_list_decorate([ sub | 0 ]) : sub._data;
    s = (start === undefined) ? 0 : start | 0;
    e = (end === undefined) ? self._data.length : end | 0;
    n = 0;
    pos = s;
    while (pos <= e - needle.length) {
        found = ρσ_bytes_find(self._data, needle, pos);
        if (found < 0 || ρσ_list_add(found, needle.length) > e) {
            break;
        }
        n = ρσ_list_iadd(n, 1);
        pos = ρσ_list_add(found, max(1, needle.length));
    }
    return n;
};
if (!ρσ_bytes.prototype.count.__argnames__) Object.defineProperties(ρσ_bytes.prototype.count, {
    __argnames__ : {value: ["sub", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.find = function find(sub, start, end) {
    var self = this;
    var needle, s, e, pos;
    needle = (typeof sub === "number") ? ρσ_list_decorate([ sub | 0 ]) : sub._data;
    s = (start === undefined) ? 0 : start | 0;
    e = (end === undefined) ? self._data.length : end | 0;
    pos = ρσ_bytes_find(self._data, needle, s);
    if (pos >= 0 && ρσ_list_add(pos, needle.length) <= e) {
        return pos;
    }
    return -1;
};
if (!ρσ_bytes.prototype.find.__argnames__) Object.defineProperties(ρσ_bytes.prototype.find, {
    __argnames__ : {value: ["sub", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.index = function index(sub, start, end) {
    var self = this;
    var pos;
    pos = self.find(sub, start, end);
    if (pos < 0) {
        throw new ValueError("subsequence not found");
    }
    return pos;
};
if (!ρσ_bytes.prototype.index.__argnames__) Object.defineProperties(ρσ_bytes.prototype.index, {
    __argnames__ : {value: ["sub", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.rfind = function rfind(sub, start, end) {
    var self = this;
    var needle, s, e, last, pos, found;
    needle = (typeof sub === "number") ? ρσ_list_decorate([ sub | 0 ]) : sub._data;
    s = (start === undefined) ? 0 : start | 0;
    e = (end === undefined) ? self._data.length : end | 0;
    last = -1;
    pos = s;
    while (pos <= e - needle.length) {
        found = ρσ_bytes_find(self._data, needle, pos);
        if (found < 0 || ρσ_list_add(found, needle.length) > e) {
            break;
        }
        last = found;
        pos = ρσ_list_add(found, max(1, needle.length));
    }
    return last;
};
if (!ρσ_bytes.prototype.rfind.__argnames__) Object.defineProperties(ρσ_bytes.prototype.rfind, {
    __argnames__ : {value: ["sub", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.rindex = function rindex(sub, start, end) {
    var self = this;
    var pos;
    pos = self.rfind(sub, start, end);
    if (pos < 0) {
        throw new ValueError("subsequence not found");
    }
    return pos;
};
if (!ρσ_bytes.prototype.rindex.__argnames__) Object.defineProperties(ρσ_bytes.prototype.rindex, {
    __argnames__ : {value: ["sub", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.startswith = function startswith(prefix, start, end) {
    var self = this;
    var s, e, pdata;
    s = (start === undefined) ? 0 : start | 0;
    e = (end === undefined) ? self._data.length : end | 0;
    pdata = (typeof prefix === "number") ? ρσ_list_decorate([ prefix | 0 ]) : prefix._data;
    if (pdata.length > e - s) {
        return false;
    }
    for (var i = 0; i < pdata.length; i++) {
        if ((ρσ_expr_temp = self._data)[ρσ_bound_index(ρσ_list_add(s, i), ρσ_expr_temp)] !== pdata[(typeof i === "number" && i < 0) ? pdata.length + i : i]) {
            return false;
        }
    }
    return true;
};
if (!ρσ_bytes.prototype.startswith.__argnames__) Object.defineProperties(ρσ_bytes.prototype.startswith, {
    __argnames__ : {value: ["prefix", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.endswith = function endswith(suffix, start, end) {
    var self = this;
    var s, e, sdata, offset;
    s = (start === undefined) ? 0 : start | 0;
    e = (end === undefined) ? self._data.length : end | 0;
    sdata = (typeof suffix === "number") ? ρσ_list_decorate([ suffix | 0 ]) : suffix._data;
    if (sdata.length > e - s) {
        return false;
    }
    offset = e - sdata.length;
    for (var i = 0; i < sdata.length; i++) {
        if ((ρσ_expr_temp = self._data)[ρσ_bound_index(ρσ_list_add(offset, i), ρσ_expr_temp)] !== sdata[(typeof i === "number" && i < 0) ? sdata.length + i : i]) {
            return false;
        }
    }
    return true;
};
if (!ρσ_bytes.prototype.endswith.__argnames__) Object.defineProperties(ρσ_bytes.prototype.endswith, {
    __argnames__ : {value: ["suffix", "start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.join = function join(iterable) {
    var self = this;
    var parts, item, result;
    parts = ρσ_list_decorate([]);
    var ρσ_Iter1 = ρσ_Iterable(iterable);
    for (var ρσ_Index1 = 0; ρσ_Index1 < ρσ_Iter1.length; ρσ_Index1++) {
        item = ρσ_Iter1[ρσ_Index1];
        if (!((item instanceof ρσ_bytes || item instanceof ρσ_bytearray))) {
            throw new TypeError("sequence item must be a bytes-like object");
        }
        parts.push(item._data);
    }
    result = ρσ_list_decorate([]);
    for (var i = 0; i < parts.length; i++) {
        if (i > 0) {
            for (var j = 0; j < this._data.length; j++) {
                result.push((ρσ_expr_temp = self._data)[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j]);
            }
        }
        for (var j = 0; j < parts[i].length; j++) {
            result.push((ρσ_expr_temp = parts[(typeof i === "number" && i < 0) ? parts.length + i : i])[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j]);
        }
    }
    return new ρσ_bytes(result);
};
if (!ρσ_bytes.prototype.join.__argnames__) Object.defineProperties(ρσ_bytes.prototype.join, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.split = function split(sep, maxsplit) {
    var self = this;
    var result, i, n, j, needle, pos, splits, found;
    if (maxsplit === undefined) {
        maxsplit = -1;
    }
    if (sep === null || sep === undefined || typeof sep === "string") {
        result = ρσ_list_decorate([]);
        i = 0;
        n = self._data.length;
        while (i < n) {
            while (i < n && (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] <= 32) {
                i = ρσ_list_iadd(i, 1);
            }
            if (i >= n) {
                break;
            }
            j = i;
            while (j < n && (ρσ_expr_temp = self._data)[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j] > 32) {
                j = ρσ_list_iadd(j, 1);
            }
            result.push(new ρσ_bytes(self._data.slice(i, j)));
            i = j;
            if (maxsplit >= 0 && result.length >= maxsplit) {
                while (i < n && (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] <= 32) {
                    i = ρσ_list_iadd(i, 1);
                }
                if (i < n) {
                    result.push(new ρσ_bytes(self._data.slice(i)));
                }
                break;
            }
        }
        return result;
    }
    needle = sep._data;
    result = ρσ_list_decorate([]);
    pos = 0;
    splits = 0;
    while (true) {
        found = ρσ_bytes_find(self._data, needle, pos);
        if (found < 0 || maxsplit >= 0 && splits >= maxsplit) {
            result.push(new ρσ_bytes(self._data.slice(pos)));
            break;
        }
        result.push(new ρσ_bytes(self._data.slice(pos, found)));
        pos = ρσ_list_add(found, needle.length);
        splits = ρσ_list_iadd(splits, 1);
    }
    return result;
};
if (!ρσ_bytes.prototype.split.__argnames__) Object.defineProperties(ρσ_bytes.prototype.split, {
    __argnames__ : {value: ["sep", "maxsplit"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.replace = function replace(old, replacement, count) {
    var self = this;
    var odata, ndata, result, pos, n, limit, found;
    odata = old._data;
    ndata = replacement._data;
    result = ρσ_list_decorate([]);
    pos = 0;
    n = 0;
    limit = (count !== undefined && count !== null) ? count : -1;
    while (pos <= self._data.length) {
        found = ρσ_bytes_find(self._data, odata, pos);
        if (found < 0 || limit >= 0 && n >= limit) {
            for (var i = pos; i < this._data.length; i++) {
                result.push((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
            }
            break;
        }
        for (var i = pos; i < found; i++) {
            result.push((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
        }
        for (var i = 0; i < ndata.length; i++) {
            result.push(ndata[(typeof i === "number" && i < 0) ? ndata.length + i : i]);
        }
        pos = ρσ_list_add(found, odata.length);
        n = ρσ_list_iadd(n, 1);
        if (odata.length === 0) {
            if (pos < self._data.length) {
                result.push((ρσ_expr_temp = self._data)[(typeof pos === "number" && pos < 0) ? ρσ_expr_temp.length + pos : pos]);
                pos = ρσ_list_iadd(pos, 1);
            } else {
                break;
            }
        }
    }
    return new ρσ_bytes(result);
};
if (!ρσ_bytes.prototype.replace.__argnames__) Object.defineProperties(ρσ_bytes.prototype.replace, {
    __argnames__ : {value: ["old", "replacement", "count"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.strip = function strip(chars) {
    var self = this;
    return self.lstrip(chars).rstrip(chars);
};
if (!ρσ_bytes.prototype.strip.__argnames__) Object.defineProperties(ρσ_bytes.prototype.strip, {
    __argnames__ : {value: ["chars"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.lstrip = function lstrip(chars) {
    var self = this;
    var is_ws, cdata, i, b;
    is_ws = chars === null || chars === undefined;
    cdata = (is_ws) ? ρσ_list_decorate([]) : chars._data;
    i = 0;
    while (i < self._data.length) {
        b = (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        if (is_ws) {
            if (b > 32) {
                break;
            }
        } else {
            if (cdata.indexOf(b) < 0) {
                break;
            }
        }
        i = ρσ_list_iadd(i, 1);
    }
    return new ρσ_bytes(self._data.slice(i));
};
if (!ρσ_bytes.prototype.lstrip.__argnames__) Object.defineProperties(ρσ_bytes.prototype.lstrip, {
    __argnames__ : {value: ["chars"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.rstrip = function rstrip(chars) {
    var self = this;
    var is_ws, cdata, i, b;
    is_ws = chars === null || chars === undefined;
    cdata = (is_ws) ? ρσ_list_decorate([]) : chars._data;
    i = self._data.length - 1;
    while (i >= 0) {
        b = (ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        if (is_ws) {
            if (b > 32) {
                break;
            }
        } else {
            if (cdata.indexOf(b) < 0) {
                break;
            }
        }
        i -= 1;
    }
    return new ρσ_bytes(self._data.slice(0, ρσ_list_add(i, 1)));
};
if (!ρσ_bytes.prototype.rstrip.__argnames__) Object.defineProperties(ρσ_bytes.prototype.rstrip, {
    __argnames__ : {value: ["chars"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.upper = function upper() {
    var self = this;
    var data, b;
    data = self._data.slice();
    for (var i = 0; i < data.length; i++) {
        b = data[(typeof i === "number" && i < 0) ? data.length + i : i];
        if (b >= 97 && b <= 122) {
            data[(typeof i === "number" && i < 0) ? data.length + i : i] = b - 32;
        }
    }
    return new ρσ_bytes(data);
};
if (!ρσ_bytes.prototype.upper.__module__) Object.defineProperties(ρσ_bytes.prototype.upper, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.lower = function lower() {
    var self = this;
    var data, b;
    data = self._data.slice();
    for (var i = 0; i < data.length; i++) {
        b = data[(typeof i === "number" && i < 0) ? data.length + i : i];
        if (b >= 65 && b <= 90) {
            data[(typeof i === "number" && i < 0) ? data.length + i : i] = ρσ_list_add(b, 32);
        }
    }
    return new ρσ_bytes(data);
};
if (!ρσ_bytes.prototype.lower.__module__) Object.defineProperties(ρσ_bytes.prototype.lower, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.copy = function copy() {
    var self = this;
    return new ρσ_bytes(self._data.slice());
};
if (!ρσ_bytes.prototype.copy.__module__) Object.defineProperties(ρσ_bytes.prototype.copy, {
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.slice = function slice(start, end) {
    var self = this;
    return new ρσ_bytes(self._data.slice(start, end));
};
if (!ρσ_bytes.prototype.slice.__argnames__) Object.defineProperties(ρσ_bytes.prototype.slice, {
    __argnames__ : {value: ["start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.filter = function filter(fn) {
    var self = this;
    return new ρσ_bytes(self._data.filter(fn));
};
if (!ρσ_bytes.prototype.filter.__argnames__) Object.defineProperties(ρσ_bytes.prototype.filter, {
    __argnames__ : {value: ["fn"]},
    __module__ : {value: "__main__"}
});
ρσ_bytes.prototype.__format__ = function __format__ () {
        if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ρσ_bytes.prototype, "__bases__", {value: []});
ρσ_bytes.__name__ = "ρσ_bytes";
ρσ_bytes.__qualname__ = "ρσ_bytes";
ρσ_bytes.__module__ = "__main__";
Object.defineProperty(ρσ_bytes.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});


ρσ_bytes.__name__ = "bytes";
function ρσ_bytearray() {
    if (!(this instanceof ρσ_bytearray)) return new ρσ_bytearray(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ρσ_bytearray.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ρσ_bytearray, ρσ_bytes);
ρσ_bytearray.prototype.__init__ = function __init__(source, encoding, errors) {
    var self = this;
    self._data = ρσ_bytes_from_source.apply(null, arguments);
    ρσ_bytes_sync(self);
};
if (!ρσ_bytearray.prototype.__init__.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.__init__, {
    __argnames__ : {value: ["source", "encoding", "errors"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.__argnames__ = ρσ_bytearray.prototype.__init__.__argnames__;
ρσ_bytearray.__handles_kwarg_interpolation__ = ρσ_bytearray.prototype.__init__.__handles_kwarg_interpolation__;
ρσ_bytearray.prototype.__setitem__ = function __setitem__(key, val) {
    var self = this;
    var indices, start, stop, step, src, positions, n, b;
    if (key instanceof ρσ_slice) {
        indices = key.indices(self._data.length);
        start = indices[0];
        stop = indices[1];
        step = indices[2];
        if (val instanceof ρσ_bytes || val instanceof ρσ_bytearray) {
            src = val._data;
        } else {
            src = ρσ_bytes_from_source(val);
        }
        if (step === 1) {
            self._data.splice.apply(self._data, ρσ_list_decorate([ start, stop - start ]).concat(src));
        } else {
            positions = ρσ_list_decorate([]);
            if (step > 0) {
                for (var i = start; i < stop; i += step) {
                    positions.push(i);
                }
            } else {
                for (var i = start; i > stop; i += step) {
                    positions.push(i);
                }
            }
            if (src.length !== positions.length) {
                throw new ValueError(ρσ_list_add(ρσ_list_add(ρσ_list_add("attempt to assign bytes of size ", str(src.length)), " to extended slice of size "), str(positions.length)));
            }
            for (var i = 0; i < positions.length; i++) {
                (ρσ_expr_temp = self._data)[ρσ_bound_index(positions[(typeof i === "number" && i < 0) ? positions.length + i : i], ρσ_expr_temp)] = src[(typeof i === "number" && i < 0) ? src.length + i : i];
            }
        }
        ρσ_bytes_sync(self);
    } else {
        n = key | 0;
        if (n < 0) {
            n = ρσ_list_iadd(n, self._data.length);
        }
        if (n < 0 || n >= self._data.length) {
            throw new IndexError("index out of range");
        }
        b = val | 0;
        if (b < 0 || b > 255) {
            throw new ValueError("byte must be in range(0, 256)");
        }
        (ρσ_expr_temp = self._data)[(typeof n === "number" && n < 0) ? ρσ_expr_temp.length + n : n] = b;
        self[(typeof n === "number" && n < 0) ? self.length + n : n] = b;
    }
};
if (!ρσ_bytearray.prototype.__setitem__.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.__setitem__, {
    __argnames__ : {value: ["key", "val"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.__add__ = function __add__(other) {
    var self = this;
    if (!((other instanceof ρσ_bytes || other instanceof ρσ_bytearray))) {
        throw new TypeError("can't concat bytes-like objects of different types");
    }
    return new ρσ_bytearray(self._data.concat(other._data));
};
if (!ρσ_bytearray.prototype.__add__.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.__add__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.__iadd__ = function __iadd__(other) {
    var self = this;
    if (!((other instanceof ρσ_bytes || other instanceof ρσ_bytearray))) {
        throw new TypeError("can't concat bytes-like objects of different types");
    }
    for (var i = 0; i < other._data.length; i++) {
        self._data.push((ρσ_expr_temp = other._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
    }
    ρσ_bytes_sync(self);
    return self;
};
if (!ρσ_bytearray.prototype.__iadd__.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.__iadd__, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.__mul__ = function __mul__(n) {
    var self = this;
    var result;
    result = ρσ_list_decorate([]);
    for (var k = 0; k < n; k++) {
        for (var j = 0; j < this._data.length; j++) {
            result.push((ρσ_expr_temp = self._data)[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j]);
        }
    }
    return new ρσ_bytearray(result);
};
if (!ρσ_bytearray.prototype.__mul__.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.__mul__, {
    __argnames__ : {value: ["n"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.__repr__ = function __repr__() {
    var self = this;
    var b;
    b = ρσ_bytes.prototype.__repr__.call(self);
    return ρσ_list_add(ρσ_list_add("bytearray(", b), ")");
};
if (!ρσ_bytearray.prototype.__repr__.__module__) Object.defineProperties(ρσ_bytearray.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.append = function append(item) {
    var self = this;
    var b, idx;
    b = item | 0;
    if (b < 0 || b > 255) {
        throw new ValueError("byte must be in range(0, 256)");
    }
    idx = self._data.length;
    self._data.push(b);
    self[(typeof idx === "number" && idx < 0) ? self.length + idx : idx] = b;
    self.length = self._data.length;
};
if (!ρσ_bytearray.prototype.append.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.append, {
    __argnames__ : {value: ["item"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.extend = function extend(iterable) {
    var self = this;
    var b, x;
    if (iterable instanceof ρσ_bytes || iterable instanceof ρσ_bytearray) {
        for (var i = 0; i < iterable._data.length; i++) {
            self._data.push((ρσ_expr_temp = iterable._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i]);
        }
    } else {
        var ρσ_Iter2 = ρσ_Iterable(iterable);
        for (var ρσ_Index2 = 0; ρσ_Index2 < ρσ_Iter2.length; ρσ_Index2++) {
            x = ρσ_Iter2[ρσ_Index2];
            b = x | 0;
            if (b < 0 || b > 255) {
                throw new ValueError("byte must be in range(0, 256)");
            }
            self._data.push(b);
        }
    }
    ρσ_bytes_sync(self);
};
if (!ρσ_bytearray.prototype.extend.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.extend, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.insert = function insert(idx, item) {
    var self = this;
    var n, b;
    n = idx | 0;
    if (n < 0) {
        n = max(0, ρσ_list_add(self._data.length, n));
    }
    b = item | 0;
    if (b < 0 || b > 255) {
        throw new ValueError("byte must be in range(0, 256)");
    }
    self._data.splice(n, 0, b);
    ρσ_bytes_sync(self);
};
if (!ρσ_bytearray.prototype.insert.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.insert, {
    __argnames__ : {value: ["idx", "item"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.pop = function pop(idx) {
    var self = this;
    var n, val;
    n = (idx === undefined) ? self._data.length - 1 : idx | 0;
    if (n < 0) {
        n = ρσ_list_iadd(n, self._data.length);
    }
    if (n < 0 || n >= self._data.length) {
        throw new IndexError("pop index out of range");
    }
    val = self._data.splice(n, 1)[0];
    ρσ_bytes_sync(self);
    return val;
};
if (!ρσ_bytearray.prototype.pop.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.pop, {
    __argnames__ : {value: ["idx"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.remove = function remove(item) {
    var self = this;
    var b;
    b = item | 0;
    for (var i = 0; i < this._data.length; i++) {
        if ((ρσ_expr_temp = self._data)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === b) {
            self._data.splice(i, 1);
            ρσ_bytes_sync(self);
            return;
        }
    }
    throw new ValueError(ρσ_list_add(str(item), " is not in bytearray"));
};
if (!ρσ_bytearray.prototype.remove.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.remove, {
    __argnames__ : {value: ["item"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.reverse = function reverse() {
    var self = this;
    self._data.reverse();
    ρσ_bytes_sync(self);
};
if (!ρσ_bytearray.prototype.reverse.__module__) Object.defineProperties(ρσ_bytearray.prototype.reverse, {
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.clear = function clear() {
    var self = this;
    self._data.length = 0;
    ρσ_bytes_sync(self);
};
if (!ρσ_bytearray.prototype.clear.__module__) Object.defineProperties(ρσ_bytearray.prototype.clear, {
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.copy = function copy() {
    var self = this;
    return new ρσ_bytearray(self._data.slice());
};
if (!ρσ_bytearray.prototype.copy.__module__) Object.defineProperties(ρσ_bytearray.prototype.copy, {
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.slice = function slice(start, end) {
    var self = this;
    return new ρσ_bytearray(self._data.slice(start, end));
};
if (!ρσ_bytearray.prototype.slice.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.slice, {
    __argnames__ : {value: ["start", "end"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.filter = function filter(fn) {
    var self = this;
    return new ρσ_bytearray(self._data.filter(fn));
};
if (!ρσ_bytearray.prototype.filter.__argnames__) Object.defineProperties(ρσ_bytearray.prototype.filter, {
    __argnames__ : {value: ["fn"]},
    __module__ : {value: "__main__"}
});
ρσ_bytearray.prototype.__str__ = function __str__ () {
    if(ρσ_bytes.prototype.__str__) return ρσ_bytes.prototype.__str__.call(this);
return this.__repr__();
};
ρσ_bytearray.prototype.__format__ = function __format__ () {
    if(ρσ_bytes.prototype.__format__) return ρσ_bytes.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ρσ_bytearray.prototype, "__bases__", {value: [ρσ_bytes]});
ρσ_bytearray.__name__ = "ρσ_bytearray";
ρσ_bytearray.__qualname__ = "ρσ_bytearray";
ρσ_bytearray.__module__ = "__main__";
Object.defineProperty(ρσ_bytearray.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});
if (typeof ρσ_bytes.__init_subclass__ === "function") ρσ_bytes.__init_subclass__.call(ρσ_bytearray);

ρσ_bytearray.__name__ = "bytearray";
var bytes = ρσ_bytes, bytearray = ρσ_bytearray;function ρσ_equals(a, b) {
    var ρσ_unpack, akeys, bkeys, key;
    if (a === b) {
        return true;
    }
    if (a && typeof a.__eq__ === "function") {
        return a.__eq__(b);
    }
    if (b && typeof b.__eq__ === "function") {
        return b.__eq__(a);
    }
    if (ρσ_arraylike(a) && ρσ_arraylike(b)) {
        if ((a.length !== b.length && (typeof a.length !== "object" || ρσ_not_equals(a.length, b.length)))) {
            return false;
        }
        for (var i=0; i < a.length; i++) {
            if (!(((a[(typeof i === "number" && i < 0) ? a.length + i : i] === b[(typeof i === "number" && i < 0) ? b.length + i : i] || typeof a[(typeof i === "number" && i < 0) ? a.length + i : i] === "object" && ρσ_equals(a[(typeof i === "number" && i < 0) ? a.length + i : i], b[(typeof i === "number" && i < 0) ? b.length + i : i]))))) {
                return false;
            }
        }
        return true;
    }
    if (typeof a === "object" && typeof b === "object" && a !== null && b !== null && (a.constructor === Object && b.constructor === Object || Object.getPrototypeOf(a) === null && Object.getPrototypeOf(b) === null)) {
        ρσ_unpack = [Object.keys(a), Object.keys(b)];
        akeys = ρσ_unpack[0];
        bkeys = ρσ_unpack[1];
        if (akeys.length !== bkeys.length) {
            return false;
        }
        for (var j=0; j < akeys.length; j++) {
            key = akeys[(typeof j === "number" && j < 0) ? akeys.length + j : j];
            if (!(((a[(typeof key === "number" && key < 0) ? a.length + key : key] === b[(typeof key === "number" && key < 0) ? b.length + key : key] || typeof a[(typeof key === "number" && key < 0) ? a.length + key : key] === "object" && ρσ_equals(a[(typeof key === "number" && key < 0) ? a.length + key : key], b[(typeof key === "number" && key < 0) ? b.length + key : key]))))) {
                return false;
            }
        }
        return true;
    }
    return false;
};
if (!ρσ_equals.__argnames__) Object.defineProperties(ρσ_equals, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_not_equals(a, b) {
    if (a === b) {
        return false;
    }
    if (a && typeof a.__ne__ === "function") {
        return a.__ne__(b);
    }
    if (b && typeof b.__ne__ === "function") {
        return b.__ne__(a);
    }
    return !ρσ_equals(a, b);
};
if (!ρσ_not_equals.__argnames__) Object.defineProperties(ρσ_not_equals, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

var equals = ρσ_equals;
function ρσ_list_extend(iterable) {
    var start, iterator, result;
    if (Array.isArray(iterable) || typeof iterable === "string") {
        start = this.length;
        this.length = ρσ_list_iadd(this.length, iterable.length);
        for (var i = 0; i < iterable.length; i++) {
            (ρσ_expr_temp = this)[ρσ_bound_index(ρσ_list_add(start, i), ρσ_expr_temp)] = iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i];
        }
    } else {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        result = iterator.next();
        while (!result.done) {
            this.push(result.value);
            result = iterator.next();
        }
    }
};
if (!ρσ_list_extend.__argnames__) Object.defineProperties(ρσ_list_extend, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_index(val, start, stop) {
    start = start || 0;
    if (start < 0) {
        start = ρσ_list_add(this.length, start);
    }
    if (start < 0) {
        throw new ValueError(ρσ_list_add(val, " is not in list"));
    }
    if (stop === undefined) {
        stop = this.length;
    }
    if (stop < 0) {
        stop = ρσ_list_add(this.length, stop);
    }
    for (var i = start; i < stop; i++) {
        if (((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === val || typeof (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === "object" && ρσ_equals((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i], val))) {
            return i;
        }
    }
    throw new ValueError(ρσ_list_add(val, " is not in list"));
};
if (!ρσ_list_index.__argnames__) Object.defineProperties(ρσ_list_index, {
    __argnames__ : {value: ["val", "start", "stop"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_pop(index) {
    var ans;
    if (this.length === 0) {
        throw new IndexError("list is empty");
    }
    if (index === undefined) {
        index = -1;
    }
    ans = this.splice(index, 1);
    if (!ans.length) {
        throw new IndexError("pop index out of range");
    }
    return ans[0];
};
if (!ρσ_list_pop.__argnames__) Object.defineProperties(ρσ_list_pop, {
    __argnames__ : {value: ["index"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_remove(value) {
    for (var i = 0; i < this.length; i++) {
        if (((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === value || typeof (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === "object" && ρσ_equals((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i], value))) {
            this.splice(i, 1);
            return;
        }
    }
    throw new ValueError(ρσ_list_add(value, " not in list"));
};
if (!ρσ_list_remove.__argnames__) Object.defineProperties(ρσ_list_remove, {
    __argnames__ : {value: ["value"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_to_string() {
    return ρσ_list_add(ρσ_list_add("[", this.join(", ")), "]");
};
if (!ρσ_list_to_string.__module__) Object.defineProperties(ρσ_list_to_string, {
    __module__ : {value: "__main__"}
});

function ρσ_list_insert(index, val) {
    if (index < 0) {
        index = ρσ_list_iadd(index, this.length);
    }
    index = min(this.length, max(index, 0));
    if (index === 0) {
        this.unshift(val);
        return;
    }
    for (var i = this.length; i > index; i--) {
        (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] = (ρσ_expr_temp = this)[ρσ_bound_index(i - 1, ρσ_expr_temp)];
    }
    (ρσ_expr_temp = this)[(typeof index === "number" && index < 0) ? ρσ_expr_temp.length + index : index] = val;
};
if (!ρσ_list_insert.__argnames__) Object.defineProperties(ρσ_list_insert, {
    __argnames__ : {value: ["index", "val"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_copy() {
    return ρσ_list_constructor(this);
};
if (!ρσ_list_copy.__module__) Object.defineProperties(ρσ_list_copy, {
    __module__ : {value: "__main__"}
});

function ρσ_list_clear() {
    this.length = 0;
};
if (!ρσ_list_clear.__module__) Object.defineProperties(ρσ_list_clear, {
    __module__ : {value: "__main__"}
});

function ρσ_list_as_array() {
    return Array.prototype.slice.call(this);
};
if (!ρσ_list_as_array.__module__) Object.defineProperties(ρσ_list_as_array, {
    __module__ : {value: "__main__"}
});

function ρσ_list_count(value) {
    return this.reduce((function() {
        var ρσ_anonfunc = function (n, val) {
            return ρσ_list_add(n, (val === value));
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["n", "val"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })(), 0);
};
if (!ρσ_list_count.__argnames__) Object.defineProperties(ρσ_list_count, {
    __argnames__ : {value: ["value"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_sort_key(value) {
    var t;
    t = typeof value;
    if (t === "string" || t === "number") {
        return value;
    }
    return value.toString();
};
if (!ρσ_list_sort_key.__argnames__) Object.defineProperties(ρσ_list_sort_key, {
    __argnames__ : {value: ["value"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_sort_cmp(a, b, ap, bp) {
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return ap - bp;
};
if (!ρσ_list_sort_cmp.__argnames__) Object.defineProperties(ρσ_list_sort_cmp, {
    __argnames__ : {value: ["a", "b", "ap", "bp"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_sort() {
    var key = (arguments[0] === undefined || ( 0 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true)) ? ρσ_list_sort.__defaults__.key : arguments[0];
    var reverse = (arguments[1] === undefined || ( 1 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true)) ? ρσ_list_sort.__defaults__.reverse : arguments[1];
    var ρσ_kwargs_obj = arguments[arguments.length-1];
    if (ρσ_kwargs_obj === null || typeof ρσ_kwargs_obj !== "object" || ρσ_kwargs_obj [ρσ_kwargs_symbol] !== true) ρσ_kwargs_obj = {};
    if (Object.prototype.hasOwnProperty.call(ρσ_kwargs_obj, "key")){
        key = ρσ_kwargs_obj.key;
    }
    if (Object.prototype.hasOwnProperty.call(ρσ_kwargs_obj, "reverse")){
        reverse = ρσ_kwargs_obj.reverse;
    }
    var mult, keymap, posmap, k;
    key = key || ρσ_list_sort_key;
    mult = (reverse) ? -1 : 1;
    keymap = dict();
    posmap = dict();
    for (var i=0; i < this.length; i++) {
        k = (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        keymap.set(k, key(k));
        posmap.set(k, i);
    }
    Array.prototype.sort.call(this, (function() {
        var ρσ_anonfunc = function (a, b) {
            return mult * ρσ_list_sort_cmp(keymap.get(a), keymap.get(b), posmap.get(a), posmap.get(b));
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["a", "b"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })());
};
if (!ρσ_list_sort.__defaults__) Object.defineProperties(ρσ_list_sort, {
    __defaults__ : {value: {key:null, reverse:false}},
    __handles_kwarg_interpolation__ : {value: true},
    __argnames__ : {value: ["key", "reverse"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_concat() {
    var ans;
    ans = Array.prototype.concat.apply(this, arguments);
    ρσ_list_decorate(ans);
    return ans;
};
if (!ρσ_list_concat.__module__) Object.defineProperties(ρσ_list_concat, {
    __module__ : {value: "__main__"}
});

function ρσ_list_slice() {
    var ans;
    ans = Array.prototype.slice.apply(this, arguments);
    ρσ_list_decorate(ans);
    return ans;
};
if (!ρσ_list_slice.__module__) Object.defineProperties(ρσ_list_slice, {
    __module__ : {value: "__main__"}
});

function ρσ_list_iterator(value) {
    var self;
    self = this;
    return (function(){
        var ρσ_d = {};
        ρσ_d["_i"] = -1;
        ρσ_d["_list"] = self;
        ρσ_d["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i >= this._list.length) {
                    return (function(){
                        var ρσ_d = {};
                        ρσ_d["done"] = true;
                        return ρσ_d;
                    }).call(this);
                }
                return (function(){
                    var ρσ_d = {};
                    ρσ_d["done"] = false;
                    ρσ_d["value"] = (ρσ_expr_temp = this._list)[ρσ_bound_index(this._i, ρσ_expr_temp)];
                    return ρσ_d;
                }).call(this);
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
};
if (!ρσ_list_iterator.__argnames__) Object.defineProperties(ρσ_list_iterator, {
    __argnames__ : {value: ["value"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_len() {
    return this.length;
};
if (!ρσ_list_len.__module__) Object.defineProperties(ρσ_list_len, {
    __module__ : {value: "__main__"}
});

function ρσ_list_contains(val) {
    for (var i = 0; i < this.length; i++) {
        if (((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === val || typeof (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === "object" && ρσ_equals((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i], val))) {
            return true;
        }
    }
    return false;
};
if (!ρσ_list_contains.__argnames__) Object.defineProperties(ρσ_list_contains, {
    __argnames__ : {value: ["val"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_eq(other) {
    if (!ρσ_arraylike(other)) {
        return false;
    }
    if ((this.length !== other.length && (typeof this.length !== "object" || ρσ_not_equals(this.length, other.length)))) {
        return false;
    }
    for (var i = 0; i < this.length; i++) {
        if (!((((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === other[(typeof i === "number" && i < 0) ? other.length + i : i] || typeof (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] === "object" && ρσ_equals((ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i], other[(typeof i === "number" && i < 0) ? other.length + i : i]))))) {
            return false;
        }
    }
    return true;
};
if (!ρσ_list_eq.__argnames__) Object.defineProperties(ρσ_list_eq, {
    __argnames__ : {value: ["other"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_decorate(ans) {
    ans.append = Array.prototype.push;
    ans.toString = ρσ_list_to_string;
    ans.inspect = ρσ_list_to_string;
    ans.extend = ρσ_list_extend;
    ans.index = ρσ_list_index;
    ans.jspop = Array.prototype.pop;
    ans.pop = ρσ_list_pop;
    ans.pypop = ρσ_list_pop;
    ans.remove = ρσ_list_remove;
    ans.insert = ρσ_list_insert;
    ans.copy = ρσ_list_copy;
    ans.clear = ρσ_list_clear;
    ans.count = ρσ_list_count;
    ans.concat = ρσ_list_concat;
    ans.jssort = Array.prototype.sort;
    ans.sort = ρσ_list_sort;
    ans.pysort = ρσ_list_sort;
    ans.slice = ρσ_list_slice;
    ans.as_array = ρσ_list_as_array;
    ans.__len__ = ρσ_list_len;
    ans.__contains__ = ρσ_list_contains;
    ans.__eq__ = ρσ_list_eq;
    ans.constructor = ρσ_list_constructor;
    if (typeof ans[ρσ_iterator_symbol] !== "function") {
        ans[ρσ_iterator_symbol] = ρσ_list_iterator;
    }
    return ans;
};
if (!ρσ_list_decorate.__argnames__) Object.defineProperties(ρσ_list_decorate, {
    __argnames__ : {value: ["ans"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_constructor(iterable) {
    var ans, iterator, result;
    if (iterable === undefined) {
        ans = [];
    } else if (ρσ_arraylike(iterable)) {
        ans = new Array(iterable.length);
        for (var i = 0; i < iterable.length; i++) {
            ans[(typeof i === "number" && i < 0) ? ans.length + i : i] = iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i];
        }
    } else if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        ans = ρσ_list_decorate([]);
        result = iterator.next();
        while (!result.done) {
            ans.push(result.value);
            result = iterator.next();
        }
    } else if (typeof iterable === "number") {
        ans = new Array(iterable);
    } else {
        ans = Object.keys(iterable);
    }
    return ρσ_list_decorate(ans);
};
if (!ρσ_list_constructor.__argnames__) Object.defineProperties(ρσ_list_constructor, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

ρσ_list_constructor.__name__ = "list";
var list = ρσ_list_constructor, list_wrap = ρσ_list_decorate;
function sorted() {
    var iterable = ( 0 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true) ? undefined : arguments[0];
    var key = (arguments[1] === undefined || ( 1 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true)) ? sorted.__defaults__.key : arguments[1];
    var reverse = (arguments[2] === undefined || ( 2 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true)) ? sorted.__defaults__.reverse : arguments[2];
    var ρσ_kwargs_obj = arguments[arguments.length-1];
    if (ρσ_kwargs_obj === null || typeof ρσ_kwargs_obj !== "object" || ρσ_kwargs_obj [ρσ_kwargs_symbol] !== true) ρσ_kwargs_obj = {};
    if (Object.prototype.hasOwnProperty.call(ρσ_kwargs_obj, "key")){
        key = ρσ_kwargs_obj.key;
    }
    if (Object.prototype.hasOwnProperty.call(ρσ_kwargs_obj, "reverse")){
        reverse = ρσ_kwargs_obj.reverse;
    }
    var ans;
    ans = ρσ_list_constructor(iterable);
    ans.sort(key, reverse);
    return ans;
};
if (!sorted.__defaults__) Object.defineProperties(sorted, {
    __defaults__ : {value: {key:null, reverse:false}},
    __handles_kwarg_interpolation__ : {value: true},
    __argnames__ : {value: ["iterable", "key", "reverse"]},
    __module__ : {value: "__main__"}
});

function ρσ_tuple_constructor(iterable) {
    var iterator, ans, result;
    if (iterable === undefined) {
        return [];
    }
    if (ρσ_arraylike(iterable)) {
        return Array.prototype.slice.call(iterable);
    }
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        ans = ρσ_list_decorate([]);
        result = iterator.next();
        while (!result.done) {
            ans.push(result.value);
            result = iterator.next();
        }
        return ans;
    }
    return Object.keys(iterable);
};
if (!ρσ_tuple_constructor.__argnames__) Object.defineProperties(ρσ_tuple_constructor, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

ρσ_tuple_constructor.__name__ = "tuple";
var tuple = ρσ_tuple_constructor;
var ρσ_global_object_id = 0, ρσ_set_implementation;
function ρσ_set_keyfor(x) {
    var t, ans;
    t = typeof x;
    if (t === "string" || t === "number" || t === "boolean") {
        return ρσ_list_add(ρσ_list_add("_", t[0]), x);
    }
    if (x === null) {
        return "__!@#$0";
    }
    ans = x.ρσ_hash_key_prop;
    if (ans === undefined) {
        ans = "_!@#$" + (++ρσ_global_object_id);
        Object.defineProperty(x, "ρσ_hash_key_prop", (function(){
            var ρσ_d = {};
            ρσ_d["value"] = ans;
            return ρσ_d;
        }).call(this));
    }
    return ans;
};
if (!ρσ_set_keyfor.__argnames__) Object.defineProperties(ρσ_set_keyfor, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_set_polyfill() {
    this._store = {};
    this.size = 0;
};
if (!ρσ_set_polyfill.__module__) Object.defineProperties(ρσ_set_polyfill, {
    __module__ : {value: "__main__"}
});

ρσ_set_polyfill.prototype.add = (function() {
    var ρσ_anonfunc = function (x) {
        var key;
        key = ρσ_set_keyfor(x);
        if (!Object.prototype.hasOwnProperty.call(this._store, key)) {
            this.size = ρσ_list_iadd(this.size, 1);
            (ρσ_expr_temp = this._store)[(typeof key === "number" && key < 0) ? ρσ_expr_temp.length + key : key] = x;
        }
        return this;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set_polyfill.prototype.clear = (function() {
    var ρσ_anonfunc = function (x) {
        this._store = {};
        this.size = 0;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set_polyfill.prototype.delete = (function() {
    var ρσ_anonfunc = function (x) {
        var key;
        key = ρσ_set_keyfor(x);
        if (Object.prototype.hasOwnProperty.call(this._store, key)) {
            this.size -= 1;
            delete this._store[key];
            return true;
        }
        return false;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set_polyfill.prototype.has = (function() {
    var ρσ_anonfunc = function (x) {
        return Object.prototype.hasOwnProperty.call(this._store, ρσ_set_keyfor(x));
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set_polyfill.prototype.values = (function() {
    var ρσ_anonfunc = function (x) {
        var ans;
        ans = {'_keys': Object.keys(this._store), '_i':-1, '_s':this._store};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i >= this._keys.length) {
                    return {'done': true};
                }
                return {'done':false, 'value':this._s[this._keys[this._i]]};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
if (typeof Set !== "function" || typeof Set.prototype.delete !== "function") {
    ρσ_set_implementation = ρσ_set_polyfill;
} else {
    ρσ_set_implementation = Set;
}
function ρσ_set(iterable) {
    var ans, s, iterator, result, keys;
    if (this instanceof ρσ_set) {
        this.jsset = new ρσ_set_implementation;
        ans = this;
        if (iterable === undefined) {
            return ans;
        }
        s = ans.jsset;
        if (ρσ_arraylike(iterable)) {
            for (var i = 0; i < iterable.length; i++) {
                s.add(iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i]);
            }
        } else if (typeof iterable[ρσ_iterator_symbol] === "function") {
            iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
            result = iterator.next();
            while (!result.done) {
                s.add(result.value);
                result = iterator.next();
            }
        } else {
            keys = Object.keys(iterable);
            for (var j=0; j < keys.length; j++) {
                s.add(keys[(typeof j === "number" && j < 0) ? keys.length + j : j]);
            }
        }
        return ans;
    } else {
        return new ρσ_set(iterable);
    }
};
if (!ρσ_set.__argnames__) Object.defineProperties(ρσ_set, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

ρσ_set.prototype.__name__ = "set";
Object.defineProperties(ρσ_set.prototype, (function(){
    var ρσ_d = {};
    ρσ_d["length"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsset.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    ρσ_d["size"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsset.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    return ρσ_d;
}).call(this));
ρσ_set.prototype.__len__ = (function() {
    var ρσ_anonfunc = function () {
        return this.jsset.size;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.has = ρσ_set.prototype.__contains__ = (function() {
    var ρσ_anonfunc = function (x) {
        return this.jsset.has(x);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.add = (function() {
    var ρσ_anonfunc = function (x) {
        this.jsset.add(x);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.clear = (function() {
    var ρσ_anonfunc = function () {
        this.jsset.clear();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.copy = (function() {
    var ρσ_anonfunc = function () {
        return ρσ_set(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.discard = (function() {
    var ρσ_anonfunc = function (x) {
        this.jsset.delete(x);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype[ρσ_iterator_symbol] = (function() {
    var ρσ_anonfunc = function () {
        return this.jsset.values();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.difference = (function() {
    var ρσ_anonfunc = function () {
        var ans, s, iterator, r, x, has;
        ans = new ρσ_set;
        s = ans.jsset;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            has = false;
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    has = true;
                    break;
                }
            }
            if (!has) {
                s.add(x);
            }
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.difference_update = (function() {
    var ρσ_anonfunc = function () {
        var s, remove, iterator, r, x;
        s = this.jsset;
        remove = [];
        iterator = s.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    remove.push(x);
                    break;
                }
            }
            r = iterator.next();
        }
        for (var j = 0; j < remove.length; j++) {
            s.delete(remove[(typeof j === "number" && j < 0) ? remove.length + j : j]);
        }
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.intersection = (function() {
    var ρσ_anonfunc = function () {
        var ans, s, iterator, r, x, has;
        ans = new ρσ_set;
        s = ans.jsset;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            has = true;
            for (var i = 0; i < arguments.length; i++) {
                if (!arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    has = false;
                    break;
                }
            }
            if (has) {
                s.add(x);
            }
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.intersection_update = (function() {
    var ρσ_anonfunc = function () {
        var s, remove, iterator, r, x;
        s = this.jsset;
        remove = [];
        iterator = s.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            for (var i = 0; i < arguments.length; i++) {
                if (!arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    remove.push(x);
                    break;
                }
            }
            r = iterator.next();
        }
        for (var j = 0; j < remove.length; j++) {
            s.delete(remove[(typeof j === "number" && j < 0) ? remove.length + j : j]);
        }
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.isdisjoint = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r, x;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (other.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.issubset = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r, x;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (!other.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.issuperset = (function() {
    var ρσ_anonfunc = function (other) {
        var s, iterator, r, x;
        s = this.jsset;
        iterator = other.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (!s.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.pop = (function() {
    var ρσ_anonfunc = function () {
        var iterator, r;
        iterator = this.jsset.values();
        r = iterator.next();
        if (r.done) {
            throw new KeyError("pop from an empty set");
        }
        this.jsset.delete(r.value);
        return r.value;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.remove = (function() {
    var ρσ_anonfunc = function (x) {
        if (!this.jsset.delete(x)) {
            throw new KeyError(x.toString());
        }
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.symmetric_difference = (function() {
    var ρσ_anonfunc = function (other) {
        return this.union(other).difference(this.intersection(other));
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.symmetric_difference_update = (function() {
    var ρσ_anonfunc = function (other) {
        var common;
        common = this.intersection(other);
        this.update(other);
        this.difference_update(common);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.union = (function() {
    var ρσ_anonfunc = function () {
        var ans;
        ans = ρσ_set(this);
        ans.update.apply(ans, arguments);
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.update = (function() {
    var ρσ_anonfunc = function () {
        var s, iterator, r;
        s = this.jsset;
        for (var i=0; i < arguments.length; i++) {
            iterator = arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i][ρσ_iterator_symbol]();
            r = iterator.next();
            while (!r.done) {
                s.add(r.value);
                r = iterator.next();
            }
        }
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.toString = ρσ_set.prototype.__repr__ = ρσ_set.prototype.__str__ = ρσ_set.prototype.inspect = (function() {
    var ρσ_anonfunc = function () {
        return ρσ_list_add(ρσ_list_add("{", list(this).join(", ")), "}");
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_set.prototype.__eq__ = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r;
        if (!other || !other.jsset) {
            return false;
        }
        if (other.size !== this.size) {
            return false;
        }
        if (other.size === 0) {
            return true;
        }
        iterator = other[ρσ_iterator_symbol]();
        r = iterator.next();
        while (!r.done) {
            if (!this.has(r.value)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
function ρσ_set_wrap(x) {
    var ans;
    ans = new ρσ_set;
    ans.jsset = x;
    return ans;
};
if (!ρσ_set_wrap.__argnames__) Object.defineProperties(ρσ_set_wrap, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

ρσ_set.__name__ = "set";
var set = ρσ_set, set_wrap = ρσ_set_wrap;
function ρσ_frozenset(iterable) {
    var ans, s, iterator, result, keys;
    if (this instanceof ρσ_frozenset) {
        this.jsset = new ρσ_set_implementation;
        ans = this;
        if (iterable === undefined) {
            return ans;
        }
        s = ans.jsset;
        if (ρσ_arraylike(iterable)) {
            for (var i = 0; i < iterable.length; i++) {
                s.add(iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i]);
            }
        } else if (typeof iterable[ρσ_iterator_symbol] === "function") {
            iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
            result = iterator.next();
            while (!result.done) {
                s.add(result.value);
                result = iterator.next();
            }
        } else {
            keys = Object.keys(iterable);
            for (var j=0; j < keys.length; j++) {
                s.add(keys[(typeof j === "number" && j < 0) ? keys.length + j : j]);
            }
        }
        return ans;
    } else {
        return new ρσ_frozenset(iterable);
    }
};
if (!ρσ_frozenset.__argnames__) Object.defineProperties(ρσ_frozenset, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

ρσ_frozenset.prototype.__name__ = "frozenset";
Object.defineProperties(ρσ_frozenset.prototype, (function(){
    var ρσ_d = {};
    ρσ_d["length"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsset.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    ρσ_d["size"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsset.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    return ρσ_d;
}).call(this));
ρσ_frozenset.prototype.__len__ = (function() {
    var ρσ_anonfunc = function () {
        return this.jsset.size;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.has = ρσ_frozenset.prototype.__contains__ = (function() {
    var ρσ_anonfunc = function (x) {
        return this.jsset.has(x);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.copy = (function() {
    var ρσ_anonfunc = function () {
        return ρσ_frozenset(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype[ρσ_iterator_symbol] = (function() {
    var ρσ_anonfunc = function () {
        return this.jsset.values();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.difference = (function() {
    var ρσ_anonfunc = function () {
        var ans, s, iterator, r, x, has;
        ans = new ρσ_frozenset;
        s = ans.jsset;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            has = false;
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    has = true;
                    break;
                }
            }
            if (!has) {
                s.add(x);
            }
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.intersection = (function() {
    var ρσ_anonfunc = function () {
        var ans, s, iterator, r, x, has;
        ans = new ρσ_frozenset;
        s = ans.jsset;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            has = true;
            for (var i = 0; i < arguments.length; i++) {
                if (!arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i].has(x)) {
                    has = false;
                    break;
                }
            }
            if (has) {
                s.add(x);
            }
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.isdisjoint = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r, x;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (other.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.issubset = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r, x;
        iterator = this.jsset.values();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (!other.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.issuperset = (function() {
    var ρσ_anonfunc = function (other) {
        var s, iterator, r, x;
        s = this.jsset;
        iterator = other[ρσ_iterator_symbol]();
        r = iterator.next();
        while (!r.done) {
            x = r.value;
            if (!s.has(x)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.symmetric_difference = (function() {
    var ρσ_anonfunc = function (other) {
        return this.union(other).difference(this.intersection(other));
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.union = (function() {
    var ρσ_anonfunc = function () {
        var ans, s, iterator, r;
        ans = ρσ_frozenset(this);
        s = ans.jsset;
        for (var i=0; i < arguments.length; i++) {
            iterator = arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i][ρσ_iterator_symbol]();
            r = iterator.next();
            while (!r.done) {
                s.add(r.value);
                r = iterator.next();
            }
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.toString = ρσ_frozenset.prototype.__repr__ = ρσ_frozenset.prototype.__str__ = ρσ_frozenset.prototype.inspect = (function() {
    var ρσ_anonfunc = function () {
        return ρσ_list_add(ρσ_list_add("frozenset({", list(this).join(", ")), "})");
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_frozenset.prototype.__eq__ = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r;
        if (!other || !other.jsset) {
            return false;
        }
        if (other.size !== this.size) {
            return false;
        }
        if (other.size === 0) {
            return true;
        }
        iterator = other[ρσ_iterator_symbol]();
        r = iterator.next();
        while (!r.done) {
            if (!this.has(r.value)) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
var frozenset = ρσ_frozenset;
var ρσ_dict_implementation;
function ρσ_dict_polyfill() {
    this._store = {};
    this.size = 0;
};
if (!ρσ_dict_polyfill.__module__) Object.defineProperties(ρσ_dict_polyfill, {
    __module__ : {value: "__main__"}
});

ρσ_dict_polyfill.prototype.set = (function() {
    var ρσ_anonfunc = function (x, value) {
        var key;
        key = ρσ_set_keyfor(x);
        if (!Object.prototype.hasOwnProperty.call(this._store, key)) {
            this.size = ρσ_list_iadd(this.size, 1);
        }
        (ρσ_expr_temp = this._store)[(typeof key === "number" && key < 0) ? ρσ_expr_temp.length + key : key] = [x, value];
        return this;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x", "value"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.clear = (function() {
    var ρσ_anonfunc = function (x) {
        this._store = {};
        this.size = 0;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.delete = (function() {
    var ρσ_anonfunc = function (x) {
        var key;
        key = ρσ_set_keyfor(x);
        if (Object.prototype.hasOwnProperty.call(this._store, key)) {
            this.size -= 1;
            delete this._store[key];
            return true;
        }
        return false;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.has = (function() {
    var ρσ_anonfunc = function (x) {
        return Object.prototype.hasOwnProperty.call(this._store, ρσ_set_keyfor(x));
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.get = (function() {
    var ρσ_anonfunc = function (x) {
        try {
            return (ρσ_expr_temp = this._store)[ρσ_bound_index(ρσ_set_keyfor(x), ρσ_expr_temp)][1];
        } catch (ρσ_Exception) {
            ρσ_last_exception = ρσ_Exception;
            if (ρσ_Exception instanceof TypeError) {
                return undefined;
            } else {
                throw ρσ_Exception;
            }
        }
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.values = (function() {
    var ρσ_anonfunc = function (x) {
        var ans;
        ans = {'_keys': Object.keys(this._store), '_i':-1, '_s':this._store};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i >= this._keys.length) {
                    return {'done': true};
                }
                return {'done':false, 'value':this._s[this._keys[this._i]][1]};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.keys = (function() {
    var ρσ_anonfunc = function (x) {
        var ans;
        ans = {'_keys': Object.keys(this._store), '_i':-1, '_s':this._store};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i >= this._keys.length) {
                    return {'done': true};
                }
                return {'done':false, 'value':this._s[this._keys[this._i]][0]};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.entries = (function() {
    var ρσ_anonfunc = function (x) {
        var ans;
        ans = {'_keys': Object.keys(this._store), '_i':-1, '_s':this._store};
        ans[ρσ_iterator_symbol] = (function() {
            var ρσ_anonfunc = function () {
                return this;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        ans["next"] = (function() {
            var ρσ_anonfunc = function () {
                this._i = ρσ_list_iadd(this._i, 1);
                if (this._i >= this._keys.length) {
                    return {'done': true};
                }
                return {'done':false, 'value':this._s[this._keys[this._i]]};
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict_polyfill.prototype.forEach = (function() {
    var ρσ_anonfunc = function (callback) {
        var keys, entry;
        keys = Object.keys(this._store);
        for (var ρσ_fi = 0; ρσ_fi < keys.length; ρσ_fi++) {
            entry = (ρσ_expr_temp = this._store)[ρσ_bound_index(keys[ρσ_bound_index(ρσ_fi, keys)], ρσ_expr_temp)];
            callback(entry[1], entry[0], this);
        }
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["callback"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
if (typeof Map !== "function" || typeof Map.prototype.delete !== "function") {
    ρσ_dict_implementation = ρσ_dict_polyfill;
} else {
    ρσ_dict_implementation = Map;
}
function ρσ_dict() {
    var iterable = ( 0 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true) ? undefined : arguments[0];
    var kw = arguments[arguments.length-1];
    if (kw === null || typeof kw !== "object" || kw [ρσ_kwargs_symbol] !== true) kw = {};
    kw = ρσ_kwargs_to_dict(kw);
    if (this instanceof ρσ_dict) {
        this.jsmap = new ρσ_dict_implementation;
        if (iterable !== undefined) {
            this.update(iterable);
        }
        this.update(kw);
        return this;
    } else {
        return ρσ_interpolate_kwargs_constructor.call(Object.create(ρσ_dict.prototype), false, ρσ_dict, [iterable].concat([ρσ_desugar_kwargs(kw)]));
    }
};
if (!ρσ_dict.__handles_kwarg_interpolation__) Object.defineProperties(ρσ_dict, {
    __handles_kwarg_interpolation__ : {value: true},
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

ρσ_dict.prototype.__name__ = "dict";
Object.defineProperties(ρσ_dict.prototype, (function(){
    var ρσ_d = {};
    ρσ_d["length"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsmap.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    ρσ_d["size"] = (function(){
        var ρσ_d = {};
        ρσ_d["get"] = (function() {
            var ρσ_anonfunc = function () {
                return this.jsmap.size;
            };
            if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })();
        return ρσ_d;
    }).call(this);
    return ρσ_d;
}).call(this));
ρσ_dict.prototype.__len__ = (function() {
    var ρσ_anonfunc = function () {
        return this.jsmap.size;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.has = ρσ_dict.prototype.__contains__ = (function() {
    var ρσ_anonfunc = function (x) {
        return this.jsmap.has(x);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["x"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.set = ρσ_dict.prototype.__setitem__ = (function() {
    var ρσ_anonfunc = function (key, value) {
        this.jsmap.set(key, value);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key", "value"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.__delitem__ = (function() {
    var ρσ_anonfunc = function (key) {
        this.jsmap.delete(key);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.clear = (function() {
    var ρσ_anonfunc = function () {
        this.jsmap.clear();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.copy = (function() {
    var ρσ_anonfunc = function () {
        return ρσ_dict(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.keys = (function() {
    var ρσ_anonfunc = function () {
        return this.jsmap.keys();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.values = (function() {
    var ρσ_anonfunc = function () {
        return this.jsmap.values();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.items = ρσ_dict.prototype.entries = (function() {
    var ρσ_anonfunc = function () {
        return this.jsmap.entries();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype[ρσ_iterator_symbol] = (function() {
    var ρσ_anonfunc = function () {
        return this.jsmap.keys();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.__getitem__ = (function() {
    var ρσ_anonfunc = function (key) {
        var ans;
        ans = this.jsmap.get(key);
        if (ans === undefined && !this.jsmap.has(key)) {
            throw new KeyError(ρσ_list_add(key, ""));
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.get = (function() {
    var ρσ_anonfunc = function (key, defval) {
        var ans;
        ans = this.jsmap.get(key);
        if (ans === undefined && !this.jsmap.has(key)) {
            return (defval === undefined) ? null : defval;
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key", "defval"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.set_default = ρσ_dict.prototype.setdefault = (function() {
    var ρσ_anonfunc = function (key, defval) {
        var j;
        j = this.jsmap;
        if (!j.has(key)) {
            j.set(key, defval);
            return defval;
        }
        return j.get(key);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key", "defval"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.fromkeys = ρσ_dict.prototype.fromkeys = (function() {
    var ρσ_anonfunc = function () {
        var iterable = ( 0 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true) ? undefined : arguments[0];
        var value = (arguments[1] === undefined || ( 1 === arguments.length-1 && arguments[arguments.length-1] !== null && typeof arguments[arguments.length-1] === "object" && arguments[arguments.length-1] [ρσ_kwargs_symbol] === true)) ? ρσ_anonfunc.__defaults__.value : arguments[1];
        var ρσ_kwargs_obj = arguments[arguments.length-1];
        if (ρσ_kwargs_obj === null || typeof ρσ_kwargs_obj !== "object" || ρσ_kwargs_obj [ρσ_kwargs_symbol] !== true) ρσ_kwargs_obj = {};
        if (Object.prototype.hasOwnProperty.call(ρσ_kwargs_obj, "value")){
            value = ρσ_kwargs_obj.value;
        }
        var ans, iterator, r;
        ans = ρσ_dict();
        iterator = iter(iterable);
        r = iterator.next();
        while (!r.done) {
            ans.set(r.value, value);
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__defaults__) Object.defineProperties(ρσ_anonfunc, {
        __defaults__ : {value: {value:null}},
        __handles_kwarg_interpolation__ : {value: true},
        __argnames__ : {value: ["iterable", "value"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.pop = (function() {
    var ρσ_anonfunc = function (key, defval) {
        var ans;
        ans = this.jsmap.get(key);
        if (ans === undefined && !this.jsmap.has(key)) {
            if (defval === undefined) {
                throw new KeyError(key);
            }
            return defval;
        }
        this.jsmap.delete(key);
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["key", "defval"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.popitem = (function() {
    var ρσ_anonfunc = function () {
        var last, e, r;
        last = null;
        e = this.jsmap.entries();
        while (true) {
            r = e.next();
            if (r.done) {
                if (last === null) {
                    throw new KeyError("dict is empty");
                }
                this.jsmap.delete(last.value[0]);
                return last.value;
            }
            last = r;
        }
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.update = (function() {
    var ρσ_anonfunc = function () {
        var m, iterable, iterator, result, pairs, keys;
        if (arguments.length === 0) {
            return;
        }
        m = this.jsmap;
        iterable = arguments[0];
        if (Array.isArray(iterable)) {
            for (var i = 0; i < iterable.length; i++) {
                m.set(iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i][0], iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i][1]);
            }
        } else if (iterable instanceof ρσ_dict) {
            iterator = iterable.items();
            result = iterator.next();
            while (!result.done) {
                m.set(result.value[0], result.value[1]);
                result = iterator.next();
            }
        } else if (typeof Map === "function" && iterable instanceof Map) {
            iterator = iterable.entries();
            result = iterator.next();
            while (!result.done) {
                m.set(result.value[0], result.value[1]);
                result = iterator.next();
            }
        } else if (typeof iterable.items === "function" && !Array.isArray(iterable)) {
            pairs = iterable.items();
            for (var k2 = 0; k2 < pairs.length; k2++) {
                m.set(pairs[(typeof k2 === "number" && k2 < 0) ? pairs.length + k2 : k2][0], pairs[(typeof k2 === "number" && k2 < 0) ? pairs.length + k2 : k2][1]);
            }
        } else if (typeof iterable[ρσ_iterator_symbol] === "function") {
            iterator = iterable[ρσ_iterator_symbol]();
            result = iterator.next();
            while (!result.done) {
                m.set(result.value[0], result.value[1]);
                result = iterator.next();
            }
        } else {
            keys = Object.keys(iterable);
            for (var j=0; j < keys.length; j++) {
                if (keys[(typeof j === "number" && j < 0) ? keys.length + j : j] !== ρσ_iterator_symbol) {
                    m.set(keys[(typeof j === "number" && j < 0) ? keys.length + j : j], iterable[ρσ_bound_index(keys[(typeof j === "number" && j < 0) ? keys.length + j : j], iterable)]);
                }
            }
        }
        if (arguments.length > 1) {
            ρσ_dict.prototype.update.call(this, arguments[1]);
        }
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.toString = ρσ_dict.prototype.inspect = ρσ_dict.prototype.__str__ = ρσ_dict.prototype.__repr__ = (function() {
    var ρσ_anonfunc = function () {
        var entries, iterator, r;
        entries = [];
        iterator = this.jsmap.entries();
        r = iterator.next();
        while (!r.done) {
            entries.push(ρσ_list_add(ρσ_list_add(ρσ_repr(r.value[0]), ": "), ρσ_repr(r.value[1])));
            r = iterator.next();
        }
        return ρσ_list_add(ρσ_list_add("{", entries.join(", ")), "}");
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.__eq__ = (function() {
    var ρσ_anonfunc = function (other) {
        var iterator, r, x;
        if (!(other instanceof this.constructor)) {
            return false;
        }
        if (other.size !== this.size) {
            return false;
        }
        if (other.size === 0) {
            return true;
        }
        iterator = other.items();
        r = iterator.next();
        while (!r.done) {
            x = this.jsmap.get(r.value[0]);
            if (x === undefined && !this.jsmap.has(r.value[0]) || x !== r.value[1]) {
                return false;
            }
            r = iterator.next();
        }
        return true;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.__or__ = (function() {
    var ρσ_anonfunc = function (other) {
        var result;
        result = ρσ_dict(this);
        result.update(other);
        return result;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.__ior__ = (function() {
    var ρσ_anonfunc = function (other) {
        this.update(other);
        return this;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.as_object = (function() {
    var ρσ_anonfunc = function (other) {
        var ans, iterator, r;
        ans = {};
        iterator = this.jsmap.entries();
        r = iterator.next();
        while (!r.done) {
            ans[ρσ_bound_index(r.value[0], ans)] = r.value[1];
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["other"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_dict.prototype.toJSON = (function() {
    var ρσ_anonfunc = function () {
        var ans, iterator, r;
        ans = {};
        iterator = this.jsmap.entries();
        r = iterator.next();
        while (!r.done) {
            ans[ρσ_bound_index(r.value[0], ans)] = r.value[1];
            r = iterator.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
function ρσ_dict_wrap(x) {
    var ans;
    ans = new ρσ_dict;
    ans.jsmap = x;
    return ans;
};
if (!ρσ_dict_wrap.__argnames__) Object.defineProperties(ρσ_dict_wrap, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

ρσ_dict.__name__ = "dict";
var dict = ρσ_dict, dict_wrap = ρσ_dict_wrap;

function ρσ_kwargs_to_dict(kw) {
    // Augment the plain kwargs object with non-enumerable Python dict methods so
    // that kw.items(), kw.keys(), kw.values() work in user code, while plain
    // property access (kw.propname) and Object.keys(kw) are unaffected.
    //
    // items/keys/values return dual-mode arrays: they support both Array indexing
    // (for ρσ_dict.prototype.update which does pairs[i]) and iterator protocol
    // (for `for k, v in kw.items():` which calls .next()).
    function _make_seq(arr) {
        arr._ρσ_i = 0;
        arr.next = function() {
            return this._ρσ_i < this.length
                ? {done: false, value: this[this._ρσ_i++]}
                : {done: true, value: undefined};
        };
        arr[ρσ_iterator_symbol] = function() { this._ρσ_i = 0; return this; };
        return arr;
    }
    function _def(name, fn) {
        if (!Object.prototype.hasOwnProperty.call(kw, name)) {
            Object.defineProperty(kw, name, {value: fn, configurable: true, writable: true, enumerable: false});
        }
    }
    _def("items", function() {
        var ks = Object.keys(kw), arr = [], i;
        for (i = 0; i < ks.length; i++) arr.push([ks[i], kw[ks[i]]]);
        return _make_seq(arr);
    });
    _def("entries", kw.items);
    _def("keys", function() {
        return _make_seq(Object.keys(kw).slice());
    });
    _def("values", function() {
        var ks = Object.keys(kw), arr = [], i;
        for (i = 0; i < ks.length; i++) arr.push(kw[ks[i]]);
        return _make_seq(arr);
    });
    _def("get", function(k, d) {
        return Object.prototype.hasOwnProperty.call(kw, k) ? kw[k] : (d !== undefined ? d : null);
    });
    _def("__contains__", function(k) { return Object.prototype.hasOwnProperty.call(kw, k); });
    _def("has", function(k) { return Object.prototype.hasOwnProperty.call(kw, k); });
    _def("__len__", function() { return Object.keys(kw).length; });
    kw[ρσ_iterator_symbol] = function() {
        var ks = Object.keys(kw), i = 0;
        return {next: function() {
            return i < ks.length ? {done: false, value: ks[i++]} : {done: true, value: undefined};
        }};
    };
    return kw;
}
;
var ρσ_json_parse = function(text, reviver) {
    function dict_reviver(key, value) {
        if (value !== null && typeof value === "object" && !Array.isArray(value) && !(value instanceof ρσ_dict)) {
            value = ρσ_dict(value);
        }
        return reviver ? reviver.call(this, key, value) : value;
    }
    return JSON.parse(text, dict_reviver);
};;// }}}
var NameError = ReferenceError;
var _ρσ_NativeError = Error;
function Exception() {
    if (!(this instanceof Exception)) return new Exception(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    Exception.prototype.__init__.apply(this, arguments);
}
ρσ_extends(Exception, Error);
Exception.prototype.__init__ = function __init__(message) {
    var self = this;
    self.message = message;
    self.stack = _ρσ_NativeError().stack;
    self.name = self.constructor.name;
};
if (!Exception.prototype.__init__.__argnames__) Object.defineProperties(Exception.prototype.__init__, {
    __argnames__ : {value: ["message"]},
    __module__ : {value: "__main__"}
});
Exception.__argnames__ = Exception.prototype.__init__.__argnames__;
Exception.__handles_kwarg_interpolation__ = Exception.prototype.__init__.__handles_kwarg_interpolation__;
Exception.prototype.__repr__ = function __repr__() {
    var self = this;
    return ρσ_list_add(ρσ_list_add(self.name, ": "), self.message);
};
if (!Exception.prototype.__repr__.__module__) Object.defineProperties(Exception.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
Exception.prototype.__str__ = function __str__ () {
    if(Error.prototype.__str__) return Error.prototype.__str__.call(this);
return this.__repr__();
};
Exception.prototype.__format__ = function __format__ () {
    if(Error.prototype.__format__) return Error.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(Exception.prototype, "__bases__", {value: [Error]});
Exception.__name__ = "Exception";
Exception.__qualname__ = "Exception";
Exception.__module__ = "__main__";
Object.defineProperty(Exception.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});
if (typeof Error.__init_subclass__ === "function") Error.__init_subclass__.call(Exception);

function AttributeError() {
    if (!(this instanceof AttributeError)) return new AttributeError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    AttributeError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(AttributeError, Exception);
AttributeError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
AttributeError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
AttributeError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
AttributeError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(AttributeError.prototype, "__bases__", {value: [Exception]});
AttributeError.__name__ = "AttributeError";
AttributeError.__qualname__ = "AttributeError";
AttributeError.__module__ = "__main__";
Object.defineProperty(AttributeError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(AttributeError);

function LookupError() {
    if (!(this instanceof LookupError)) return new LookupError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    LookupError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(LookupError, Exception);
LookupError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
LookupError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
LookupError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
LookupError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(LookupError.prototype, "__bases__", {value: [Exception]});
LookupError.__name__ = "LookupError";
LookupError.__qualname__ = "LookupError";
LookupError.__module__ = "__main__";
Object.defineProperty(LookupError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(LookupError);

function IndexError() {
    if (!(this instanceof IndexError)) return new IndexError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    IndexError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(IndexError, LookupError);
IndexError.prototype.__init__ = function __init__ () {
    LookupError.prototype.__init__ && LookupError.prototype.__init__.apply(this, arguments);
};
IndexError.prototype.__repr__ = function __repr__ () {
    if(LookupError.prototype.__repr__) return LookupError.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
IndexError.prototype.__str__ = function __str__ () {
    if(LookupError.prototype.__str__) return LookupError.prototype.__str__.call(this);
return this.__repr__();
};
IndexError.prototype.__format__ = function __format__ () {
    if(LookupError.prototype.__format__) return LookupError.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(IndexError.prototype, "__bases__", {value: [LookupError]});
IndexError.__name__ = "IndexError";
IndexError.__qualname__ = "IndexError";
IndexError.__module__ = "__main__";
Object.defineProperty(IndexError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof LookupError.__init_subclass__ === "function") LookupError.__init_subclass__.call(IndexError);

function KeyError() {
    if (!(this instanceof KeyError)) return new KeyError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    KeyError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(KeyError, LookupError);
KeyError.prototype.__init__ = function __init__ () {
    LookupError.prototype.__init__ && LookupError.prototype.__init__.apply(this, arguments);
};
KeyError.prototype.__repr__ = function __repr__ () {
    if(LookupError.prototype.__repr__) return LookupError.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
KeyError.prototype.__str__ = function __str__ () {
    if(LookupError.prototype.__str__) return LookupError.prototype.__str__.call(this);
return this.__repr__();
};
KeyError.prototype.__format__ = function __format__ () {
    if(LookupError.prototype.__format__) return LookupError.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(KeyError.prototype, "__bases__", {value: [LookupError]});
KeyError.__name__ = "KeyError";
KeyError.__qualname__ = "KeyError";
KeyError.__module__ = "__main__";
Object.defineProperty(KeyError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof LookupError.__init_subclass__ === "function") LookupError.__init_subclass__.call(KeyError);

function ValueError() {
    if (!(this instanceof ValueError)) return new ValueError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ValueError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ValueError, Exception);
ValueError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
ValueError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
ValueError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
ValueError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ValueError.prototype, "__bases__", {value: [Exception]});
ValueError.__name__ = "ValueError";
ValueError.__qualname__ = "ValueError";
ValueError.__module__ = "__main__";
Object.defineProperty(ValueError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(ValueError);

function UnicodeDecodeError() {
    if (!(this instanceof UnicodeDecodeError)) return new UnicodeDecodeError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    UnicodeDecodeError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(UnicodeDecodeError, Exception);
UnicodeDecodeError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
UnicodeDecodeError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
UnicodeDecodeError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
UnicodeDecodeError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(UnicodeDecodeError.prototype, "__bases__", {value: [Exception]});
UnicodeDecodeError.__name__ = "UnicodeDecodeError";
UnicodeDecodeError.__qualname__ = "UnicodeDecodeError";
UnicodeDecodeError.__module__ = "__main__";
Object.defineProperty(UnicodeDecodeError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(UnicodeDecodeError);

function AssertionError() {
    if (!(this instanceof AssertionError)) return new AssertionError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    AssertionError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(AssertionError, Exception);
AssertionError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
AssertionError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
AssertionError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
AssertionError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(AssertionError.prototype, "__bases__", {value: [Exception]});
AssertionError.__name__ = "AssertionError";
AssertionError.__qualname__ = "AssertionError";
AssertionError.__module__ = "__main__";
Object.defineProperty(AssertionError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(AssertionError);

function ZeroDivisionError() {
    if (!(this instanceof ZeroDivisionError)) return new ZeroDivisionError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ZeroDivisionError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ZeroDivisionError, Exception);
ZeroDivisionError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
ZeroDivisionError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
ZeroDivisionError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
ZeroDivisionError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ZeroDivisionError.prototype, "__bases__", {value: [Exception]});
ZeroDivisionError.__name__ = "ZeroDivisionError";
ZeroDivisionError.__qualname__ = "ZeroDivisionError";
ZeroDivisionError.__module__ = "__main__";
Object.defineProperty(ZeroDivisionError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(ZeroDivisionError);

function StopIteration() {
    if (!(this instanceof StopIteration)) return new StopIteration(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    StopIteration.prototype.__init__.apply(this, arguments);
}
ρσ_extends(StopIteration, Exception);
StopIteration.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
StopIteration.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
StopIteration.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
StopIteration.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(StopIteration.prototype, "__bases__", {value: [Exception]});
StopIteration.__name__ = "StopIteration";
StopIteration.__qualname__ = "StopIteration";
StopIteration.__module__ = "__main__";
Object.defineProperty(StopIteration.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(StopIteration);

function ImportError() {
    if (!(this instanceof ImportError)) return new ImportError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ImportError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ImportError, Exception);
ImportError.prototype.__init__ = function __init__ () {
    Exception.prototype.__init__ && Exception.prototype.__init__.apply(this, arguments);
};
ImportError.prototype.__repr__ = function __repr__ () {
    if(Exception.prototype.__repr__) return Exception.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
ImportError.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
ImportError.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ImportError.prototype, "__bases__", {value: [Exception]});
ImportError.__name__ = "ImportError";
ImportError.__qualname__ = "ImportError";
ImportError.__module__ = "__main__";
Object.defineProperty(ImportError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(ImportError);

function ModuleNotFoundError() {
    if (!(this instanceof ModuleNotFoundError)) return new ModuleNotFoundError(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ModuleNotFoundError.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ModuleNotFoundError, ImportError);
ModuleNotFoundError.prototype.__init__ = function __init__ () {
    ImportError.prototype.__init__ && ImportError.prototype.__init__.apply(this, arguments);
};
ModuleNotFoundError.prototype.__repr__ = function __repr__ () {
    if(ImportError.prototype.__repr__) return ImportError.prototype.__repr__.call(this);
    return "<" + __name__ + "." + this.constructor.name + " #" + this.ρσ_object_id + ">";
};
ModuleNotFoundError.prototype.__str__ = function __str__ () {
    if(ImportError.prototype.__str__) return ImportError.prototype.__str__.call(this);
return this.__repr__();
};
ModuleNotFoundError.prototype.__format__ = function __format__ () {
    if(ImportError.prototype.__format__) return ImportError.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ModuleNotFoundError.prototype, "__bases__", {value: [ImportError]});
ModuleNotFoundError.__name__ = "ModuleNotFoundError";
ModuleNotFoundError.__qualname__ = "ModuleNotFoundError";
ModuleNotFoundError.__module__ = "__main__";
Object.defineProperty(ModuleNotFoundError.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});

if (typeof ImportError.__init_subclass__ === "function") ImportError.__init_subclass__.call(ModuleNotFoundError);

function _is_exc_class(obj) {
    return typeof obj === "function" && (obj === Error || obj.prototype && ρσ_instanceof(obj.prototype, Error));
};
if (!_is_exc_class.__argnames__) Object.defineProperties(_is_exc_class, {
    __argnames__ : {value: ["obj"]},
    __module__ : {value: "__main__"}
});

function ExceptionGroup() {
    if (!(this instanceof ExceptionGroup)) return new ExceptionGroup(...arguments);
    if (this.ρσ_object_id === undefined) Object.defineProperty(this, "ρσ_object_id", {"value":++ρσ_object_counter});
    ExceptionGroup.prototype.__init__.apply(this, arguments);
}
ρσ_extends(ExceptionGroup, Exception);
ExceptionGroup.prototype.__init__ = function __init__(message, exceptions) {
    var self = this;
    Exception.prototype.__init__.call(self, message);
    self.exceptions = (exceptions) ? exceptions : ρσ_list_decorate([]);
};
if (!ExceptionGroup.prototype.__init__.__argnames__) Object.defineProperties(ExceptionGroup.prototype.__init__, {
    __argnames__ : {value: ["message", "exceptions"]},
    __module__ : {value: "__main__"}
});
ExceptionGroup.__argnames__ = ExceptionGroup.prototype.__init__.__argnames__;
ExceptionGroup.__handles_kwarg_interpolation__ = ExceptionGroup.prototype.__init__.__handles_kwarg_interpolation__;
ExceptionGroup.prototype.subgroup = function subgroup(condition) {
    var self = this;
    var matched, e;
    if (_is_exc_class(condition)) {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (ρσ_instanceof(e, condition)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    } else if (callable(condition)) {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (condition(e)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    } else {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (ρσ_instanceof(e, condition)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    }
    return (matched) ? new ExceptionGroup(self.message, matched) : null;
};
if (!ExceptionGroup.prototype.subgroup.__argnames__) Object.defineProperties(ExceptionGroup.prototype.subgroup, {
    __argnames__ : {value: ["condition"]},
    __module__ : {value: "__main__"}
});
ExceptionGroup.prototype.split = function split(condition) {
    var self = this;
    var matched, e, rest;
    if (_is_exc_class(condition)) {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (ρσ_instanceof(e, condition)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
        rest = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (!(ρσ_instanceof(e, condition))) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    } else if (callable(condition)) {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (condition(e)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
        rest = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (!condition(e)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    } else {
        matched = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (ρσ_instanceof(e, condition)) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
        rest = (function() {
            var ρσ_Iter = ρσ_Iterable(self.exceptions), ρσ_Result = [], e;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                e = ρσ_Iter[ρσ_Index];
                if (!(ρσ_instanceof(e, condition))) {
                    ρσ_Result.push(e);
                }
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
    }
    return ρσ_list_decorate([ (matched) ? new ExceptionGroup(self.message, matched) : null, (rest) ? new ExceptionGroup(self.message, rest) : null ]);
};
if (!ExceptionGroup.prototype.split.__argnames__) Object.defineProperties(ExceptionGroup.prototype.split, {
    __argnames__ : {value: ["condition"]},
    __module__ : {value: "__main__"}
});
ExceptionGroup.prototype.__repr__ = function __repr__() {
    var self = this;
    return ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("ExceptionGroup(", repr(self.message)), ", "), repr(self.exceptions)), ")");
};
if (!ExceptionGroup.prototype.__repr__.__module__) Object.defineProperties(ExceptionGroup.prototype.__repr__, {
    __module__ : {value: "__main__"}
});
ExceptionGroup.prototype.__str__ = function __str__ () {
    if(Exception.prototype.__str__) return Exception.prototype.__str__.call(this);
return this.__repr__();
};
ExceptionGroup.prototype.__format__ = function __format__ () {
    if(Exception.prototype.__format__) return Exception.prototype.__format__.call(this, arguments[0]);
    if (!arguments[0]) return this.__str__();
    throw new TypeError("unsupported format specification");
};
Object.defineProperty(ExceptionGroup.prototype, "__bases__", {value: [Exception]});
ExceptionGroup.__name__ = "ExceptionGroup";
ExceptionGroup.__qualname__ = "ExceptionGroup";
ExceptionGroup.__module__ = "__main__";
Object.defineProperty(ExceptionGroup.prototype, "__class__", {get: function() { return this.constructor; }, configurable: true});
if (typeof Exception.__init_subclass__ === "function") Exception.__init_subclass__.call(ExceptionGroup);
let ρσ_exists, ρσ_attr_proxy_handler;
function ρσ_eslice(arr, step, start, end) {
    var is_string;
    if (typeof arr === "string" || arr instanceof String) {
        is_string = true;
        arr = arr.split("");
    }
    if (step < 0) {
        step = -step;
        arr = arr.slice().reverse();
        if (typeof start !== "undefined") {
            start = arr.length - start - 1;
        }
        if (typeof end !== "undefined") {
            end = arr.length - end - 1;
        }
    }
    if (typeof start === "undefined") {
        start = 0;
    }
    if (typeof end === "undefined") {
        end = arr.length;
    }
    arr = arr.slice(start, end).filter((function() {
        var ρσ_anonfunc = function (e, i) {
            return i % step === 0;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["e", "i"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })());
    if (is_string) {
        arr = arr.join("");
    }
    return arr;
};
if (!ρσ_eslice.__argnames__) Object.defineProperties(ρσ_eslice, {
    __argnames__ : {value: ["arr", "step", "start", "end"]},
    __module__ : {value: "__main__"}
});

function ρσ_delslice(arr, step, start, end) {
    var is_string, ρσ_unpack, indices;
    if (typeof arr === "string" || arr instanceof String) {
        is_string = true;
        arr = arr.split("");
    }
    if (step < 0) {
        if (typeof start === "undefined") {
            start = arr.length;
        }
        if (typeof end === "undefined") {
            end = 0;
        }
        ρσ_unpack = [end, start, -step];
        start = ρσ_unpack[0];
        end = ρσ_unpack[1];
        step = ρσ_unpack[2];
    }
    if (typeof start === "undefined") {
        start = 0;
    }
    if (typeof end === "undefined") {
        end = arr.length;
    }
    if (step === 1) {
        arr.splice(start, end - start);
    } else {
        if (end > start) {
            indices = [];
            for (var i = start; i < end; i += step) {
                indices.push(i);
            }
            for (var i = indices.length - 1; i >= 0; i--) {
                arr.splice(indices[(typeof i === "number" && i < 0) ? indices.length + i : i], 1);
            }
        }
    }
    if (is_string) {
        arr = arr.join("");
    }
    return arr;
};
if (!ρσ_delslice.__argnames__) Object.defineProperties(ρσ_delslice, {
    __argnames__ : {value: ["arr", "step", "start", "end"]},
    __module__ : {value: "__main__"}
});

function ρσ_flatten(arr) {
    var ans, value;
    ans = ρσ_list_decorate([]);
    for (var i=0; i < arr.length; i++) {
        value = arr[(typeof i === "number" && i < 0) ? arr.length + i : i];
        if (Array.isArray(value)) {
            ans = ans.concat(ρσ_flatten(value));
        } else {
            ans.push(value);
        }
    }
    return ans;
};
if (!ρσ_flatten.__argnames__) Object.defineProperties(ρσ_flatten, {
    __argnames__ : {value: ["arr"]},
    __module__ : {value: "__main__"}
});

function ρσ_unpack_asarray(num, iterable) {
    var ans, iterator, result;
    if (ρσ_arraylike(iterable)) {
        return iterable;
    }
    ans = [];
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        result = iterator.next();
        while (!result.done && ans.length < num) {
            ans.push(result.value);
            result = iterator.next();
        }
    }
    return ans;
};
if (!ρσ_unpack_asarray.__argnames__) Object.defineProperties(ρσ_unpack_asarray, {
    __argnames__ : {value: ["num", "iterable"]},
    __module__ : {value: "__main__"}
});

function ρσ_unpack_starred_asarray(iterable) {
    var ans, iterator, result;
    if (typeof iterable === "string" || iterable instanceof String) {
        return iterable.split("");
    }
    if (ρσ_arraylike(iterable)) {
        return iterable;
    }
    ans = [];
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        result = iterator.next();
        while (!result.done) {
            ans.push(result.value);
            result = iterator.next();
        }
    }
    return ans;
};
if (!ρσ_unpack_starred_asarray.__argnames__) Object.defineProperties(ρσ_unpack_starred_asarray, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

function ρσ_extends(child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
    Object.setPrototypeOf(child, parent);
};
if (!ρσ_extends.__argnames__) Object.defineProperties(ρσ_extends, {
    __argnames__ : {value: ["child", "parent"]},
    __module__ : {value: "__main__"}
});

function ρσ_object_new(cls) {
    return Object.create(cls.prototype);
};
if (!ρσ_object_new.__argnames__) Object.defineProperties(ρσ_object_new, {
    __argnames__ : {value: ["cls"]},
    __module__ : {value: "__main__"}
});

function ρσ_new(parent, cls) {
    if (parent && typeof parent.__new__ === "function") {
        return parent.__new__.apply(parent, Array.prototype.slice.call(arguments, 1));
    }
    return Object.create(cls.prototype);
};
if (!ρσ_new.__argnames__) Object.defineProperties(ρσ_new, {
    __argnames__ : {value: ["parent", "cls"]},
    __module__ : {value: "__main__"}
});

function ρσ_in(val, arr) {
    if (typeof arr === "string") {
        return arr.indexOf(val) !== -1;
    }
    if (typeof arr.__contains__ === "function") {
        return arr.__contains__(val);
    }
    if (typeof Map === "function" && (arr instanceof Map || arr instanceof Set)) {
        return arr.has(val);
    }
    if (ρσ_arraylike(arr)) {
        return ρσ_list_contains.call(arr, val);
    }
    return Object.prototype.hasOwnProperty.call(arr, val);
};
if (!ρσ_in.__argnames__) Object.defineProperties(ρσ_in, {
    __argnames__ : {value: ["val", "arr"]},
    __module__ : {value: "__main__"}
});

function ρσ_Iterable(iterable) {
    var iterator, ans, result;
    if (ρσ_arraylike(iterable)) {
        return iterable;
    }
    if (typeof iterable[ρσ_iterator_symbol] === "function") {
        iterator = (typeof Map === "function" && iterable instanceof Map) ? iterable.keys() : iterable[ρσ_iterator_symbol]();
        ans = ρσ_list_decorate([]);
        result = iterator.next();
        while (!result.done) {
            ans.push(result.value);
            result = iterator.next();
        }
        return ans;
    }
    return Object.keys(iterable);
};
if (!ρσ_Iterable.__argnames__) Object.defineProperties(ρσ_Iterable, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

function ρσ_desugar_kwargs() {
    var ans, arg, keys;
    ans = Object.create(null);
    ans[ρσ_kwargs_symbol] = true;
    for (var i = 0; i < arguments.length; i++) {
        arg = arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i];
        if (arg && arg.jsmap && typeof arg.jsmap.forEach === "function") {
            arg.jsmap.forEach(function(v, k) { ans[k] = v; });
        } else if (typeof Object.assign === "function") {
            Object.assign(ans, arg);
        } else {
            keys = Object.keys(arg);
            for (var j = 0; j < keys.length; j++) {
                ans[ρσ_bound_index(keys[(typeof j === "number" && j < 0) ? keys.length + j : j], ans)] = arg[ρσ_bound_index(keys[(typeof j === "number" && j < 0) ? keys.length + j : j], arg)];
            }
        }
    }
    return ans;
};
if (!ρσ_desugar_kwargs.__module__) Object.defineProperties(ρσ_desugar_kwargs, {
    __module__ : {value: "__main__"}
});

function ρσ_interpolate_kwargs(f, supplied_args) {
    var has_prop, kwobj, args, prop;
    if (!f.__argnames__) {
        return f.apply(this, supplied_args);
    }
    has_prop = Object.prototype.hasOwnProperty;
    kwobj = supplied_args.pop();
    if (f.__handles_kwarg_interpolation__) {
        args = new Array(ρσ_list_add(Math.max(supplied_args.length, f.__argnames__.length), 1));
        args[args.length-1] = kwobj;
        for (var i = 0; i < args.length - 1; i++) {
            if (i < f.__argnames__.length) {
                prop = (ρσ_expr_temp = f.__argnames__)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
                if (has_prop.call(kwobj, prop)) {
                    args[(typeof i === "number" && i < 0) ? args.length + i : i] = kwobj[(typeof prop === "number" && prop < 0) ? kwobj.length + prop : prop];
                    delete kwobj[prop];
                } else if (i < supplied_args.length) {
                    args[(typeof i === "number" && i < 0) ? args.length + i : i] = supplied_args[(typeof i === "number" && i < 0) ? supplied_args.length + i : i];
                }
            } else {
                args[(typeof i === "number" && i < 0) ? args.length + i : i] = supplied_args[(typeof i === "number" && i < 0) ? supplied_args.length + i : i];
            }
        }
        return f.apply(this, args);
    }
    for (var i = 0; i < f.__argnames__.length; i++) {
        prop = (ρσ_expr_temp = f.__argnames__)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
        if (has_prop.call(kwobj, prop)) {
            supplied_args[(typeof i === "number" && i < 0) ? supplied_args.length + i : i] = kwobj[(typeof prop === "number" && prop < 0) ? kwobj.length + prop : prop];
        }
    }
    return f.apply(this, supplied_args);
};
if (!ρσ_interpolate_kwargs.__argnames__) Object.defineProperties(ρσ_interpolate_kwargs, {
    __argnames__ : {value: ["f", "supplied_args"]},
    __module__ : {value: "__main__"}
});

function ρσ_interpolate_kwargs_constructor(apply, f, supplied_args) {
    if (apply) {
        f.apply(this, supplied_args);
    } else {
        ρσ_interpolate_kwargs.call(this, f, supplied_args);
    }
    return this;
};
if (!ρσ_interpolate_kwargs_constructor.__argnames__) Object.defineProperties(ρσ_interpolate_kwargs_constructor, {
    __argnames__ : {value: ["apply", "f", "supplied_args"]},
    __module__ : {value: "__main__"}
});

function ρσ_getitem(obj, key) {
    if (typeof obj === "function" && obj.__class_getitem__) {
        return obj.__class_getitem__(key);
    }
    if (obj.__getitem__) {
        return obj.__getitem__(key);
    }
    if (typeof ρσ_slice !== "undefined" && key instanceof ρσ_slice) {
        return ρσ_eslice(obj, (key.step  !== null && key.step  !== undefined) ? key.step  : 1, (key.start !== null && key.start !== undefined) ? key.start : undefined, (key.stop  !== null && key.stop  !== undefined) ? key.stop  : undefined);
    }
    if (typeof key === "number" && key < 0) {
        key = ρσ_list_iadd(key, obj.length);
    }
    return obj[(typeof key === "number" && key < 0) ? obj.length + key : key];
};
if (!ρσ_getitem.__argnames__) Object.defineProperties(ρσ_getitem, {
    __argnames__ : {value: ["obj", "key"]},
    __module__ : {value: "__main__"}
});

function ρσ_setitem(obj, key, val) {
    if (obj.__setitem__) {
        obj.__setitem__(key, val);
    } else if (typeof ρσ_slice !== "undefined" && key instanceof ρσ_slice) {
        ρσ_splice(obj, val, (key.start !== null && key.start !== undefined) ? key.start : 0, (key.stop  !== null && key.stop  !== undefined) ? key.stop  : obj.length);
    } else {
        if (typeof key === "number" && key < 0) {
            key = ρσ_list_iadd(key, obj.length);
        }
        obj[(typeof key === "number" && key < 0) ? obj.length + key : key] = val;
    }
    return val;
};
if (!ρσ_setitem.__argnames__) Object.defineProperties(ρσ_setitem, {
    __argnames__ : {value: ["obj", "key", "val"]},
    __module__ : {value: "__main__"}
});

function ρσ_delitem(obj, key) {
    if (obj.__delitem__) {
        obj.__delitem__(key);
    } else if (typeof ρσ_slice !== "undefined" && key instanceof ρσ_slice) {
        ρσ_delslice(obj, (key.step  !== null && key.step  !== undefined) ? key.step  : 1, (key.start !== null && key.start !== undefined) ? key.start : undefined, (key.stop  !== null && key.stop  !== undefined) ? key.stop  : undefined);
    } else if (typeof obj.splice === "function") {
        obj.splice(key, 1);
    } else {
        if (typeof key === "number" && key < 0) {
            key = ρσ_list_iadd(key, obj.length);
        }
        delete obj[key];
    }
};
if (!ρσ_delitem.__argnames__) Object.defineProperties(ρσ_delitem, {
    __argnames__ : {value: ["obj", "key"]},
    __module__ : {value: "__main__"}
});

function ρσ_bound_index(idx, arr) {
    if (typeof idx === "number" && idx < 0) {
        idx = ρσ_list_iadd(idx, arr.length);
    }
    return idx;
};
if (!ρσ_bound_index.__argnames__) Object.defineProperties(ρσ_bound_index, {
    __argnames__ : {value: ["idx", "arr"]},
    __module__ : {value: "__main__"}
});

function ρσ_splice(arr, val, start, end) {
    start = start || 0;
    if (start < 0) {
        start = ρσ_list_iadd(start, arr.length);
    }
    if (end === undefined) {
        end = arr.length;
    }
    if (end < 0) {
        end = ρσ_list_iadd(end, arr.length);
    }
    Array.prototype.splice.apply(arr, [start, end - start].concat(val));
};
if (!ρσ_splice.__argnames__) Object.defineProperties(ρσ_splice, {
    __argnames__ : {value: ["arr", "val", "start", "end"]},
    __module__ : {value: "__main__"}
});

ρσ_exists = (function(){
    var ρσ_d = {};
    ρσ_d["n"] = (function() {
        var ρσ_anonfunc = function (expr) {
            return expr !== undefined && expr !== null;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["expr"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["d"] = (function() {
        var ρσ_anonfunc = function (expr) {
            if (expr === undefined || expr === null) {
                return Object.create(null);
            }
            return expr;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["expr"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["c"] = (function() {
        var ρσ_anonfunc = function (expr) {
            if (typeof expr === "function") {
                return expr;
            }
            return (function() {
                var ρσ_anonfunc = function () {
                    return undefined;
                };
                if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })();
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["expr"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["g"] = (function() {
        var ρσ_anonfunc = function (expr) {
            if (expr === undefined || expr === null || typeof expr.__getitem__ !== "function") {
                return (function(){
                    var ρσ_d = {};
                    ρσ_d["__getitem__"] = (function() {
                        var ρσ_anonfunc = function () {
                            return undefined;
                        };
                        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                            __module__ : {value: "__main__"}
                        });
                        return ρσ_anonfunc;
                    })();
                    return ρσ_d;
                }).call(this);
            }
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["expr"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["e"] = (function() {
        var ρσ_anonfunc = function (expr, alt) {
            return (expr === undefined || expr === null) ? alt : expr;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["expr", "alt"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    return ρσ_d;
}).call(this);
(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : global)["ρσ_exists"] = ρσ_exists;
function ρσ_mixin() {
    var seen, resolved_props, p, target, props, name;
    seen = Object.create(null);
    seen.__argnames__ = seen.__handles_kwarg_interpolation__ = seen.__init__ = seen.__annotations__ = seen.__doc__ = seen.__bind_methods__ = seen.__bases__ = seen.constructor = seen.__class__ = true;
    resolved_props = {};
    p = target = arguments[0].prototype;
    while (p && p !== Object.prototype) {
        props = Object.getOwnPropertyNames(p);
        for (var i = 0; i < props.length; i++) {
            seen[ρσ_bound_index(props[(typeof i === "number" && i < 0) ? props.length + i : i], seen)] = true;
        }
        p = Object.getPrototypeOf(p);
    }
    for (var c = 1; c < arguments.length; c++) {
        p = arguments[(typeof c === "number" && c < 0) ? arguments.length + c : c].prototype;
        while (p && p !== Object.prototype) {
            props = Object.getOwnPropertyNames(p);
            for (var i = 0; i < props.length; i++) {
                name = props[(typeof i === "number" && i < 0) ? props.length + i : i];
                if (seen[(typeof name === "number" && name < 0) ? seen.length + name : name]) {
                    continue;
                }
                seen[(typeof name === "number" && name < 0) ? seen.length + name : name] = true;
                resolved_props[(typeof name === "number" && name < 0) ? resolved_props.length + name : name] = Object.getOwnPropertyDescriptor(p, name);
            }
            p = Object.getPrototypeOf(p);
        }
    }
    Object.defineProperties(target, resolved_props);
};
if (!ρσ_mixin.__module__) Object.defineProperties(ρσ_mixin, {
    __module__ : {value: "__main__"}
});

function ρσ_arith_type_name(v) {
    var t;
    if (v === null || v === undefined) {
        return "NoneType";
    }
    t = typeof v;
    if (t === "boolean") {
        return "bool";
    }
    if (t === "bigint") {
        return "long";
    }
    if (t === "number") {
        return (Number.isInteger(v)) ? "int" : "float";
    }
    if (t === "string" || v instanceof String) {
        return "str";
    }
    if (Array.isArray(v)) {
        return "list";
    }
    if (v.constructor && v.constructor.__name__) {
        return v.constructor.__name__;
    }
    return t;
};
if (!ρσ_arith_type_name.__argnames__) Object.defineProperties(ρσ_arith_type_name, {
    __argnames__ : {value: ["v"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_add(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__add__ === "function") {
        return a.__add__(b);
    }
    if (b !== null && typeof b.__radd__ === "function") {
        return b.__radd__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_list_constructor(a.concat(b));
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a + b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a + b;
    }
    if ((ta === "string" || a instanceof String) && (tb === "string" || b instanceof String)) {
        return a + b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for +: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_add.__argnames__) Object.defineProperties(ρσ_op_add, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_sub(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__sub__ === "function") {
        return a.__sub__(b);
    }
    if (b !== null && typeof b.__rsub__ === "function") {
        return b.__rsub__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a - b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a - b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for -: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_sub.__argnames__) Object.defineProperties(ρσ_op_sub, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_mul(a, b) {
    var ta, tb, result;
    if (a !== null && typeof a.__mul__ === "function") {
        return a.__mul__(b);
    }
    if (b !== null && typeof b.__rmul__ === "function") {
        return b.__rmul__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "string" || a instanceof String) && (tb === "number" || tb === "boolean")) {
        return a.repeat(b);
    }
    if ((tb === "string" || b instanceof String) && (ta === "number" || ta === "boolean")) {
        return b.repeat(a);
    }
    if (Array.isArray(a) && (tb === "number" || tb === "boolean")) {
        result = [];
        for (var ρσ_mi = 0; ρσ_mi < b; ρσ_mi++) {
            result = result.concat(a);
        }
        return ρσ_list_constructor(result);
    }
    if (Array.isArray(b) && (ta === "number" || ta === "boolean")) {
        result = [];
        for (var ρσ_mi = 0; ρσ_mi < a; ρσ_mi++) {
            result = result.concat(b);
        }
        return ρσ_list_constructor(result);
    }
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a * b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a * b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for *: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_mul.__argnames__) Object.defineProperties(ρσ_op_mul, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_truediv(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__truediv__ === "function") {
        return a.__truediv__(b);
    }
    if (b !== null && typeof b.__rtruediv__ === "function") {
        return b.__rtruediv__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a / b;
    }
    if (ta === "bigint" && tb === "bigint") {
        throw new TypeError("unsupported operand type(s) for /: 'long' and 'long' — use // for integer division of long values");
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for /: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_truediv.__argnames__) Object.defineProperties(ρσ_op_truediv, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_floordiv(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__floordiv__ === "function") {
        return a.__floordiv__(b);
    }
    if (b !== null && typeof b.__rfloordiv__ === "function") {
        return b.__rfloordiv__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return Math.floor(a / b);
    }
    if (ta === "bigint" && tb === "bigint") {
        var ρσ_bq = a / b, ρσ_br = a % b; if (ρσ_br !== 0n && (ρσ_br < 0n) !== (b < 0n)) { return ρσ_bq - 1n; } return ρσ_bq;;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for //: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_floordiv.__argnames__) Object.defineProperties(ρσ_op_floordiv, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_mod(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__mod__ === "function") {
        return a.__mod__(b);
    }
    if (b !== null && typeof b.__rmod__ === "function") {
        return b.__rmod__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a % b;
    }
    if (ta === "bigint" && tb === "bigint") {
        var ρσ_mr = a % b; if (ρσ_mr !== 0n && (ρσ_mr < 0n) !== (b < 0n)) { return ρσ_mr + b; } return ρσ_mr;;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for %: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_mod.__argnames__) Object.defineProperties(ρσ_op_mod, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_pow(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__pow__ === "function") {
        return a.__pow__(b);
    }
    if (b !== null && typeof b.__rpow__ === "function") {
        return b.__rpow__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return Math.pow(a, b);
    }
    if (ta === "bigint" && tb === "bigint") {
        if (b < 0n) {
            throw new ValueError("negative exponent not supported for long values");
        }
        return a ** b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for **: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_pow.__argnames__) Object.defineProperties(ρσ_op_pow, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_and(a, b) {
    if (a !== null && typeof a.__and__ === "function") {
        return a.__and__(b);
    }
    if (b !== null && typeof b.__rand__ === "function") {
        return b.__rand__(a);
    }
    if (typeof a === "bigint" !== (typeof b === "bigint")) {
        throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for &: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
    }
    return a & b;
};
if (!ρσ_op_and.__argnames__) Object.defineProperties(ρσ_op_and, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_or(a, b) {
    if (a !== null && typeof a.__or__ === "function") {
        return a.__or__(b);
    }
    if (b !== null && typeof b.__ror__ === "function") {
        return b.__ror__(a);
    }
    if (typeof a === "bigint" !== (typeof b === "bigint")) {
        throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for |: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
    }
    return a | b;
};
if (!ρσ_op_or.__argnames__) Object.defineProperties(ρσ_op_or, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_xor(a, b) {
    if (a !== null && typeof a.__xor__ === "function") {
        return a.__xor__(b);
    }
    if (b !== null && typeof b.__rxor__ === "function") {
        return b.__rxor__(a);
    }
    if (typeof a === "bigint" !== (typeof b === "bigint")) {
        throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for ^: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
    }
    return a ^ b;
};
if (!ρσ_op_xor.__argnames__) Object.defineProperties(ρσ_op_xor, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_lshift(a, b) {
    if (a !== null && typeof a.__lshift__ === "function") {
        return a.__lshift__(b);
    }
    if (b !== null && typeof b.__rlshift__ === "function") {
        return b.__rlshift__(a);
    }
    if (typeof a === "bigint" !== (typeof b === "bigint")) {
        throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for <<: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
    }
    return a << b;
};
if (!ρσ_op_lshift.__argnames__) Object.defineProperties(ρσ_op_lshift, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_rshift(a, b) {
    if (a !== null && typeof a.__rshift__ === "function") {
        return a.__rshift__(b);
    }
    if (b !== null && typeof b.__rrshift__ === "function") {
        return b.__rrshift__(a);
    }
    if (typeof a === "bigint" !== (typeof b === "bigint")) {
        throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("unsupported operand type(s) for >>: '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
    }
    return a >> b;
};
if (!ρσ_op_rshift.__argnames__) Object.defineProperties(ρσ_op_rshift, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_lt(a, b) {
    var n, ea, eb, ta, tb;
    if (a !== null && typeof a.__lt__ === "function") {
        return a.__lt__(b);
    }
    if (b !== null && typeof b.__gt__ === "function") {
        return b.__gt__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        n = Math.min(a.length, b.length);
        for (var ρσ_ci = 0; ρσ_ci < n; ρσ_ci++) {
            ea = a[ρσ_ci];
            eb = b[ρσ_ci];
            if (ρσ_op_lt(ea, eb)) {
                return true;
            }
            if (ρσ_op_lt(eb, ea)) {
                return false;
            }
        }
        return a.length < b.length;
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a < b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a < b;
    }
    if ((ta === "string" || a instanceof String) && (tb === "string" || b instanceof String)) {
        return a < b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("'<' not supported between instances of '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_lt.__argnames__) Object.defineProperties(ρσ_op_lt, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_le(a, b) {
    var n, ea, eb, ta, tb;
    if (a !== null && typeof a.__le__ === "function") {
        return a.__le__(b);
    }
    if (b !== null && typeof b.__ge__ === "function") {
        return b.__ge__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        n = Math.min(a.length, b.length);
        for (var ρσ_ci = 0; ρσ_ci < n; ρσ_ci++) {
            ea = a[ρσ_ci];
            eb = b[ρσ_ci];
            if (ρσ_op_lt(ea, eb)) {
                return true;
            }
            if (ρσ_op_lt(eb, ea)) {
                return false;
            }
        }
        return a.length <= b.length;
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a <= b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a <= b;
    }
    if ((ta === "string" || a instanceof String) && (tb === "string" || b instanceof String)) {
        return a <= b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("'<=' not supported between instances of '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_le.__argnames__) Object.defineProperties(ρσ_op_le, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_gt(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__gt__ === "function") {
        return a.__gt__(b);
    }
    if (b !== null && typeof b.__lt__ === "function") {
        return b.__lt__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_op_lt(b, a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a > b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a > b;
    }
    if ((ta === "string" || a instanceof String) && (tb === "string" || b instanceof String)) {
        return a > b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("'>' not supported between instances of '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_gt.__argnames__) Object.defineProperties(ρσ_op_gt, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ge(a, b) {
    var ta, tb;
    if (a !== null && typeof a.__ge__ === "function") {
        return a.__ge__(b);
    }
    if (b !== null && typeof b.__le__ === "function") {
        return b.__le__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_op_le(b, a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "number" || ta === "boolean") && (tb === "number" || tb === "boolean")) {
        return a >= b;
    }
    if (ta === "bigint" && tb === "bigint") {
        return a >= b;
    }
    if ((ta === "string" || a instanceof String) && (tb === "string" || b instanceof String)) {
        return a >= b;
    }
    throw new TypeError(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("'>=' not supported between instances of '", ρσ_arith_type_name(a)), "' and '"), ρσ_arith_type_name(b)), "'"));
};
if (!ρσ_op_ge.__argnames__) Object.defineProperties(ρσ_op_ge, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_add(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_list_constructor(a.concat(b));
    }
    if (a !== null && a !== undefined && typeof a.__add__ === "function") {
        return a.__add__(b);
    }
    if (b !== null && b !== undefined && typeof b.__radd__ === "function") {
        return b.__radd__(a);
    }
    return a + b;
};
if (!ρσ_list_add.__argnames__) Object.defineProperties(ρσ_list_add, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_list_iadd(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        Array.prototype.push.apply(a, b);
        return a;
    }
    if (a !== null && a !== undefined && typeof a.__iadd__ === "function") {
        return a.__iadd__(b);
    }
    if (a !== null && a !== undefined && typeof a.__add__ === "function") {
        return a.__add__(b);
    }
    return a + b;
};
if (!ρσ_list_iadd.__argnames__) Object.defineProperties(ρσ_list_iadd, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_neg(a) {
    if (a !== null && typeof a.__neg__ === "function") {
        return a.__neg__();
    }
    return -a;
};
if (!ρσ_op_neg.__argnames__) Object.defineProperties(ρσ_op_neg, {
    __argnames__ : {value: ["a"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_pos(a) {
    if (a !== null && typeof a.__pos__ === "function") {
        return a.__pos__();
    }
    return +a;
};
if (!ρσ_op_pos.__argnames__) Object.defineProperties(ρσ_op_pos, {
    __argnames__ : {value: ["a"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_invert(a) {
    if (a !== null && typeof a.__invert__ === "function") {
        return a.__invert__();
    }
    return ~a;
};
if (!ρσ_op_invert.__argnames__) Object.defineProperties(ρσ_op_invert, {
    __argnames__ : {value: ["a"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_iadd(a, b) {
    if (a !== null && typeof a.__iadd__ === "function") {
        return a.__iadd__(b);
    }
    return ρσ_op_add(a, b);
};
if (!ρσ_op_iadd.__argnames__) Object.defineProperties(ρσ_op_iadd, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_isub(a, b) {
    if (a !== null && typeof a.__isub__ === "function") {
        return a.__isub__(b);
    }
    return ρσ_op_sub(a, b);
};
if (!ρσ_op_isub.__argnames__) Object.defineProperties(ρσ_op_isub, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_imul(a, b) {
    if (a !== null && typeof a.__imul__ === "function") {
        return a.__imul__(b);
    }
    return ρσ_op_mul(a, b);
};
if (!ρσ_op_imul.__argnames__) Object.defineProperties(ρσ_op_imul, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_itruediv(a, b) {
    if (a !== null && typeof a.__itruediv__ === "function") {
        return a.__itruediv__(b);
    }
    return ρσ_op_truediv(a, b);
};
if (!ρσ_op_itruediv.__argnames__) Object.defineProperties(ρσ_op_itruediv, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ifloordiv(a, b) {
    if (a !== null && typeof a.__ifloordiv__ === "function") {
        return a.__ifloordiv__(b);
    }
    return ρσ_op_floordiv(a, b);
};
if (!ρσ_op_ifloordiv.__argnames__) Object.defineProperties(ρσ_op_ifloordiv, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_imod(a, b) {
    if (a !== null && typeof a.__imod__ === "function") {
        return a.__imod__(b);
    }
    return ρσ_op_mod(a, b);
};
if (!ρσ_op_imod.__argnames__) Object.defineProperties(ρσ_op_imod, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ipow(a, b) {
    if (a !== null && typeof a.__ipow__ === "function") {
        return a.__ipow__(b);
    }
    return ρσ_op_pow(a, b);
};
if (!ρσ_op_ipow.__argnames__) Object.defineProperties(ρσ_op_ipow, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_iand(a, b) {
    if (a !== null && typeof a.__iand__ === "function") {
        return a.__iand__(b);
    }
    return ρσ_op_and(a, b);
};
if (!ρσ_op_iand.__argnames__) Object.defineProperties(ρσ_op_iand, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ior(a, b) {
    if (a !== null && typeof a.__ior__ === "function") {
        return a.__ior__(b);
    }
    return ρσ_op_or(a, b);
};
if (!ρσ_op_ior.__argnames__) Object.defineProperties(ρσ_op_ior, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ixor(a, b) {
    if (a !== null && typeof a.__ixor__ === "function") {
        return a.__ixor__(b);
    }
    return ρσ_op_xor(a, b);
};
if (!ρσ_op_ixor.__argnames__) Object.defineProperties(ρσ_op_ixor, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ilshift(a, b) {
    if (a !== null && typeof a.__ilshift__ === "function") {
        return a.__ilshift__(b);
    }
    return ρσ_op_lshift(a, b);
};
if (!ρσ_op_ilshift.__argnames__) Object.defineProperties(ρσ_op_ilshift, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_irshift(a, b) {
    if (a !== null && typeof a.__irshift__ === "function") {
        return a.__irshift__(b);
    }
    return ρσ_op_rshift(a, b);
};
if (!ρσ_op_irshift.__argnames__) Object.defineProperties(ρσ_op_irshift, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_add_ns(a, b) {
    if (a !== null && typeof a.__add__ === "function") {
        return a.__add__(b);
    }
    if (b !== null && typeof b.__radd__ === "function") {
        return b.__radd__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_list_constructor(a.concat(b));
    }
    return a + b;
};
if (!ρσ_op_add_ns.__argnames__) Object.defineProperties(ρσ_op_add_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_sub_ns(a, b) {
    if (a !== null && typeof a.__sub__ === "function") {
        return a.__sub__(b);
    }
    if (b !== null && typeof b.__rsub__ === "function") {
        return b.__rsub__(a);
    }
    return a - b;
};
if (!ρσ_op_sub_ns.__argnames__) Object.defineProperties(ρσ_op_sub_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_mul_ns(a, b) {
    var ta, tb, result;
    if (a !== null && typeof a.__mul__ === "function") {
        return a.__mul__(b);
    }
    if (b !== null && typeof b.__rmul__ === "function") {
        return b.__rmul__(a);
    }
    ta = typeof a;
    tb = typeof b;
    if ((ta === "string" || a instanceof String) && (tb === "number" || tb === "boolean")) {
        return a.repeat(b);
    }
    if ((tb === "string" || b instanceof String) && (ta === "number" || ta === "boolean")) {
        return b.repeat(a);
    }
    if (Array.isArray(a) && (tb === "number" || tb === "boolean")) {
        result = [];
        for (var ρσ_mi = 0; ρσ_mi < b; ρσ_mi++) {
            result = result.concat(a);
        }
        return ρσ_list_constructor(result);
    }
    if (Array.isArray(b) && (ta === "number" || ta === "boolean")) {
        result = [];
        for (var ρσ_mi = 0; ρσ_mi < a; ρσ_mi++) {
            result = result.concat(b);
        }
        return ρσ_list_constructor(result);
    }
    return a * b;
};
if (!ρσ_op_mul_ns.__argnames__) Object.defineProperties(ρσ_op_mul_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_truediv_ns(a, b) {
    if (a !== null && typeof a.__truediv__ === "function") {
        return a.__truediv__(b);
    }
    if (b !== null && typeof b.__rtruediv__ === "function") {
        return b.__rtruediv__(a);
    }
    return a / b;
};
if (!ρσ_op_truediv_ns.__argnames__) Object.defineProperties(ρσ_op_truediv_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_floordiv_ns(a, b) {
    if (a !== null && typeof a.__floordiv__ === "function") {
        return a.__floordiv__(b);
    }
    if (b !== null && typeof b.__rfloordiv__ === "function") {
        return b.__rfloordiv__(a);
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        var ρσ_bq = a / b, ρσ_br = a % b; if (ρσ_br !== 0n && (ρσ_br < 0n) !== (b < 0n)) { return ρσ_bq - 1n; } return ρσ_bq;;
    }
    return Math.floor(a / b);
};
if (!ρσ_op_floordiv_ns.__argnames__) Object.defineProperties(ρσ_op_floordiv_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_mod_ns(a, b) {
    if (a !== null && typeof a.__mod__ === "function") {
        return a.__mod__(b);
    }
    if (b !== null && typeof b.__rmod__ === "function") {
        return b.__rmod__(a);
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        var ρσ_mr = a % b; if (ρσ_mr !== 0n && (ρσ_mr < 0n) !== (b < 0n)) { return ρσ_mr + b; } return ρσ_mr;;
    }
    return a % b;
};
if (!ρσ_op_mod_ns.__argnames__) Object.defineProperties(ρσ_op_mod_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_pow_ns(a, b) {
    if (a !== null && typeof a.__pow__ === "function") {
        return a.__pow__(b);
    }
    if (b !== null && typeof b.__rpow__ === "function") {
        return b.__rpow__(a);
    }
    if (typeof a === "bigint" && typeof b === "bigint") {
        return a ** b;
    }
    return Math.pow(a, b);
};
if (!ρσ_op_pow_ns.__argnames__) Object.defineProperties(ρσ_op_pow_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_lt_ns(a, b) {
    var n, ea, eb;
    if (a !== null && typeof a.__lt__ === "function") {
        return a.__lt__(b);
    }
    if (b !== null && typeof b.__gt__ === "function") {
        return b.__gt__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        n = Math.min(a.length, b.length);
        for (var ρσ_ci = 0; ρσ_ci < n; ρσ_ci++) {
            ea = a[ρσ_ci];
            eb = b[ρσ_ci];
            if (ρσ_op_lt_ns(ea, eb)) {
                return true;
            }
            if (ρσ_op_lt_ns(eb, ea)) {
                return false;
            }
        }
        return a.length < b.length;
    }
    return a < b;
};
if (!ρσ_op_lt_ns.__argnames__) Object.defineProperties(ρσ_op_lt_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_le_ns(a, b) {
    var n, ea, eb;
    if (a !== null && typeof a.__le__ === "function") {
        return a.__le__(b);
    }
    if (b !== null && typeof b.__ge__ === "function") {
        return b.__ge__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        n = Math.min(a.length, b.length);
        for (var ρσ_ci = 0; ρσ_ci < n; ρσ_ci++) {
            ea = a[ρσ_ci];
            eb = b[ρσ_ci];
            if (ρσ_op_lt_ns(ea, eb)) {
                return true;
            }
            if (ρσ_op_lt_ns(eb, ea)) {
                return false;
            }
        }
        return a.length <= b.length;
    }
    return a <= b;
};
if (!ρσ_op_le_ns.__argnames__) Object.defineProperties(ρσ_op_le_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_gt_ns(a, b) {
    if (a !== null && typeof a.__gt__ === "function") {
        return a.__gt__(b);
    }
    if (b !== null && typeof b.__lt__ === "function") {
        return b.__lt__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_op_lt_ns(b, a);
    }
    return a > b;
};
if (!ρσ_op_gt_ns.__argnames__) Object.defineProperties(ρσ_op_gt_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ge_ns(a, b) {
    if (a !== null && typeof a.__ge__ === "function") {
        return a.__ge__(b);
    }
    if (b !== null && typeof b.__le__ === "function") {
        return b.__le__(a);
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        return ρσ_op_le_ns(b, a);
    }
    return a >= b;
};
if (!ρσ_op_ge_ns.__argnames__) Object.defineProperties(ρσ_op_ge_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_iadd_ns(a, b) {
    if (a !== null && typeof a.__iadd__ === "function") {
        return a.__iadd__(b);
    }
    return ρσ_op_add_ns(a, b);
};
if (!ρσ_op_iadd_ns.__argnames__) Object.defineProperties(ρσ_op_iadd_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_isub_ns(a, b) {
    if (a !== null && typeof a.__isub__ === "function") {
        return a.__isub__(b);
    }
    return ρσ_op_sub_ns(a, b);
};
if (!ρσ_op_isub_ns.__argnames__) Object.defineProperties(ρσ_op_isub_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_imul_ns(a, b) {
    if (a !== null && typeof a.__imul__ === "function") {
        return a.__imul__(b);
    }
    return ρσ_op_mul_ns(a, b);
};
if (!ρσ_op_imul_ns.__argnames__) Object.defineProperties(ρσ_op_imul_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_itruediv_ns(a, b) {
    if (a !== null && typeof a.__itruediv__ === "function") {
        return a.__itruediv__(b);
    }
    return ρσ_op_truediv_ns(a, b);
};
if (!ρσ_op_itruediv_ns.__argnames__) Object.defineProperties(ρσ_op_itruediv_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ifloordiv_ns(a, b) {
    if (a !== null && typeof a.__ifloordiv__ === "function") {
        return a.__ifloordiv__(b);
    }
    return ρσ_op_floordiv_ns(a, b);
};
if (!ρσ_op_ifloordiv_ns.__argnames__) Object.defineProperties(ρσ_op_ifloordiv_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_imod_ns(a, b) {
    if (a !== null && typeof a.__imod__ === "function") {
        return a.__imod__(b);
    }
    return ρσ_op_mod_ns(a, b);
};
if (!ρσ_op_imod_ns.__argnames__) Object.defineProperties(ρσ_op_imod_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_op_ipow_ns(a, b) {
    if (a !== null && typeof a.__ipow__ === "function") {
        return a.__ipow__(b);
    }
    return ρσ_op_pow_ns(a, b);
};
if (!ρσ_op_ipow_ns.__argnames__) Object.defineProperties(ρσ_op_ipow_ns, {
    __argnames__ : {value: ["a", "b"]},
    __module__ : {value: "__main__"}
});

function ρσ_instanceof() {
    var obj, bases, q, cls, p;
    obj = arguments[0];
    bases = "";
    if (obj && obj.constructor && obj.constructor.prototype) {
        bases = obj.constructor.prototype.__bases__ || "";
    }
    for (var i = 1; i < arguments.length; i++) {
        q = arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i];
        if (obj instanceof q) {
            return true;
        }
        if ((q === Array || q === ρσ_list_constructor) && Array.isArray(obj)) {
            return true;
        }
        if (q === ρσ_str && (typeof obj === "string" || obj instanceof String)) {
            return true;
        }
        if (q === ρσ_int && typeof obj === "number" && Number.isInteger(obj)) {
            return true;
        }
        if (q === ρσ_float && typeof obj === "number" && !Number.isInteger(obj)) {
            return true;
        }
        if (q === ρσ_long && typeof obj === "bigint") {
            return true;
        }
        if (bases.length > 1) {
            for (var c = 1; c < bases.length; c++) {
                cls = bases[(typeof c === "number" && c < 0) ? bases.length + c : c];
                while (cls) {
                    if (q === cls) {
                        return true;
                    }
                    p = Object.getPrototypeOf(cls.prototype);
                    if (!p) {
                        break;
                    }
                    cls = p.constructor;
                }
            }
        }
    }
    return false;
};
if (!ρσ_instanceof.__module__) Object.defineProperties(ρσ_instanceof, {
    __module__ : {value: "__main__"}
});

var ρσ_JS_Proxy = typeof Proxy === "function" ? Proxy : null;
var ρσ_proxy_target_symbol = typeof Symbol === "function" ? Symbol("ρσ_proxy_target") : "__ρσ_proxy_target__";
ρσ_attr_proxy_handler = (function(){
    var ρσ_d = {};
    ρσ_d["get"] = (function() {
        var ρσ_anonfunc = function (target, prop, receiver) {
            var val;
            if (prop === ρσ_proxy_target_symbol) {
                return target;
            }
            if (typeof prop === "symbol") {
                return Reflect.get(target, prop, receiver);
            }
            if (typeof target.__getattribute__ === "function" && prop !== "__getattribute__") {
                try {
                    return target.__getattribute__.call(receiver, prop);
                } catch (ρσ_Exception) {
                    ρσ_last_exception = ρσ_Exception;
                    if (ρσ_Exception instanceof AttributeError) {
                        if (typeof target.__getattr__ === "function") {
                            return target.__getattr__.call(receiver, prop);
                        }
                        throw ρσ_Exception;
                    } else {
                        throw ρσ_Exception;
                    }
                }
            }
            val = Reflect.get(target, prop, receiver);
            if (val === undefined && typeof target.__getattr__ === "function" && !(prop in target)) {
                return target.__getattr__.call(receiver, prop);
            }
            return val;
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["target", "prop", "receiver"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["set"] = (function() {
        var ρσ_anonfunc = function (target, prop, value, receiver) {
            if (typeof target.__setattr__ === "function") {
                target.__setattr__.call(receiver, prop, value);
                return true;
            }
            return Reflect.set(target, prop, value, target);
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["target", "prop", "value", "receiver"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ρσ_d["deleteProperty"] = (function() {
        var ρσ_anonfunc = function (target, prop) {
            if (typeof target.__delattr__ === "function") {
                target.__delattr__.call(target, prop);
                return true;
            }
            return Reflect.deleteProperty(target, prop);
        };
        if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
            __argnames__ : {value: ["target", "prop"]},
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    return ρσ_d;
}).call(this);
(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : global)["ρσ_attr_proxy_handler"] = ρσ_attr_proxy_handler;
function ρσ_object_setattr(obj, name, value) {
    var target;
    target = obj[ρσ_proxy_target_symbol];
    if (target === undefined) {
        target = obj;
    }
    target[name] = value;
};
if (!ρσ_object_setattr.__argnames__) Object.defineProperties(ρσ_object_setattr, {
    __argnames__ : {value: ["obj", "name", "value"]},
    __module__ : {value: "__main__"}
});

function ρσ_object_getattr(obj, name) {
    var target;
    target = obj[ρσ_proxy_target_symbol];
    if (target === undefined) {
        target = obj;
    }
    return target[(typeof name === "number" && name < 0) ? target.length + name : name];
};
if (!ρσ_object_getattr.__argnames__) Object.defineProperties(ρσ_object_getattr, {
    __argnames__ : {value: ["obj", "name"]},
    __module__ : {value: "__main__"}
});

function ρσ_object_delattr(obj, name) {
    var target;
    target = obj[ρσ_proxy_target_symbol];
    if (target === undefined) {
        target = obj;
    }
    delete target[name];
};
if (!ρσ_object_delattr.__argnames__) Object.defineProperties(ρσ_object_delattr, {
    __argnames__ : {value: ["obj", "name"]},
    __module__ : {value: "__main__"}
});
function sum(iterable, start) {
    var ans, iterator, r;
    if (Array.isArray(iterable)) {
        return iterable.reduce((function() {
            var ρσ_anonfunc = function (prev, cur) {
                return ρσ_list_add(prev, cur);
            };
            if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
                __argnames__ : {value: ["prev", "cur"]},
                __module__ : {value: "__main__"}
            });
            return ρσ_anonfunc;
        })(), start || 0);
    }
    ans = start || 0;
    iterator = iter(iterable);
    r = iterator.next();
    while (!r.done) {
        ans = ρσ_list_iadd(ans, r.value);
        r = iterator.next();
    }
    return ans;
};
if (!sum.__argnames__) Object.defineProperties(sum, {
    __argnames__ : {value: ["iterable", "start"]},
    __module__ : {value: "__main__"}
});

function map() {
    var iterators, func, args, ans;
    iterators = new Array(arguments.length - 1);
    func = arguments[0];
    args = new Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
        iterators[ρσ_bound_index(i - 1, iterators)] = iter(arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i]);
    }
    ans = {'_func':func, '_iterators':iterators, '_args':args};
    ans[ρσ_iterator_symbol] = (function() {
        var ρσ_anonfunc = function () {
            return this;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans["next"] = (function() {
        var ρσ_anonfunc = function () {
            var r;
            for (var i = 0; i < this._iterators.length; i++) {
                r = (ρσ_expr_temp = this._iterators)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i].next();
                if (r.done) {
                    return {'done':true};
                }
                (ρσ_expr_temp = this._args)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i] = r.value;
            }
            return {'done':false, 'value':this._func.apply(undefined, this._args)};
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    return ans;
};
if (!map.__module__) Object.defineProperties(map, {
    __module__ : {value: "__main__"}
});

function filter(func_or_none, iterable) {
    var func, ans;
    func = (func_or_none === null) ? ρσ_bool : func_or_none;
    ans = {'_func':func, '_iterator':ρσ_iter(iterable)};
    ans[ρσ_iterator_symbol] = (function() {
        var ρσ_anonfunc = function () {
            return this;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans["next"] = (function() {
        var ρσ_anonfunc = function () {
            var r;
            r = this._iterator.next();
            while (!r.done) {
                if (this._func(r.value)) {
                    return r;
                }
                r = this._iterator.next();
            }
            return {'done':true};
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    return ans;
};
if (!filter.__argnames__) Object.defineProperties(filter, {
    __argnames__ : {value: ["func_or_none", "iterable"]},
    __module__ : {value: "__main__"}
});

function zip() {
    var n, strict, iterators, ans;
    n = arguments.length;
    strict = false;
    if (n > 0 && typeof arguments[n - 1] === "object" && arguments[n - 1] !== null && arguments[ρσ_bound_index(n - 1, arguments)][ρσ_kwargs_symbol] === true) {
        strict = arguments[ρσ_bound_index(n - 1, arguments)]["strict"] || false;
        n -= 1;
    }
    iterators = new Array(n);
    for (var i = 0; i < n; i++) {
        iterators[(typeof i === "number" && i < 0) ? iterators.length + i : i] = iter(arguments[(typeof i === "number" && i < 0) ? arguments.length + i : i]);
    }
    ans = {'_iterators':iterators, '_strict':strict};
    ans[ρσ_iterator_symbol] = (function() {
        var ρσ_anonfunc = function () {
            return this;
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    ans["next"] = (function() {
        var ρσ_anonfunc = function () {
            var args, r;
            if (!this._iterators.length) {
                return {'done':true};
            }
            args = new Array(this._iterators.length);
            for (var i = 0; i < this._iterators.length; i++) {
                r = (ρσ_expr_temp = this._iterators)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i].next();
                if (r.done) {
                    if (this._strict) {
                        for (var j = i + 1; j < this._iterators.length; j++) {
                            if (!(ρσ_expr_temp = this._iterators)[(typeof j === "number" && j < 0) ? ρσ_expr_temp.length + j : j].next().done) {
                                throw new ValueError("zip() has arguments with different lengths");
                            }
                        }
                        if (i > 0) {
                            throw new ValueError("zip() has arguments with different lengths");
                        }
                    }
                    return {'done':true};
                }
                args[(typeof i === "number" && i < 0) ? args.length + i : i] = r.value;
            }
            return {'done':false, 'value':args};
        };
        if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
            __module__ : {value: "__main__"}
        });
        return ρσ_anonfunc;
    })();
    return ans;
};
if (!zip.__module__) Object.defineProperties(zip, {
    __module__ : {value: "__main__"}
});

function any(iterable) {
    var iterator, r;
    if (Array.isArray(iterable) || typeof iterable === "string") {
        for (var i = 0; i < iterable.length; i++) {
            if (iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i]) {
                return true;
            }
        }
        return false;
    }
    iterator = iter(iterable);
    r = iterator.next();
    while (!r.done) {
        if (r.value) {
            return true;
        }
        r = iterator.next();
    }
    return false;
};
if (!any.__argnames__) Object.defineProperties(any, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});

function all(iterable) {
    var iterator, r;
    if (Array.isArray(iterable) || typeof iterable === "string") {
        for (var i = 0; i < iterable.length; i++) {
            if (!iterable[(typeof i === "number" && i < 0) ? iterable.length + i : i]) {
                return false;
            }
        }
        return true;
    }
    iterator = iter(iterable);
    r = iterator.next();
    while (!r.done) {
        if (!r.value) {
            return false;
        }
        r = iterator.next();
    }
    return true;
};
if (!all.__argnames__) Object.defineProperties(all, {
    __argnames__ : {value: ["iterable"]},
    __module__ : {value: "__main__"}
});
let decimal_sep, define_str_func, ρσ_orig_split, ρσ_orig_replace;
decimal_sep = 1.1.toLocaleString()[1];
function ρσ_repr_js_builtin(x, as_array) {
    var ans, b, keys, key;
    ans = [];
    b = "{}";
    if (as_array) {
        b = "[]";
        for (var i = 0; i < x.length; i++) {
            ans.push(ρσ_repr(x[(typeof i === "number" && i < 0) ? x.length + i : i]));
        }
    } else {
        keys = Object.keys(x);
        for (var k = 0; k < keys.length; k++) {
            key = keys[(typeof k === "number" && k < 0) ? keys.length + k : k];
            ans.push(ρσ_list_add(ρσ_list_add(JSON.stringify(key), ":"), ρσ_repr(x[(typeof key === "number" && key < 0) ? x.length + key : key])));
        }
    }
    return ρσ_list_add(ρσ_list_add(b[0], ans.join(", ")), b[1]);
};
if (!ρσ_repr_js_builtin.__argnames__) Object.defineProperties(ρσ_repr_js_builtin, {
    __argnames__ : {value: ["x", "as_array"]},
    __module__ : {value: "__main__"}
});

function ρσ_html_element_to_string(elem) {
    var attrs, val, attr, ans;
    attrs = [];
    var ρσ_Iter0 = ρσ_Iterable(elem.attributes);
    for (var ρσ_Index0 = 0; ρσ_Index0 < ρσ_Iter0.length; ρσ_Index0++) {
        attr = ρσ_Iter0[ρσ_Index0];
        if (attr.specified) {
            val = attr.value;
            if (val.length > 10) {
                val = ρσ_list_add(val.slice(0, 15), "...");
            }
            val = JSON.stringify(val);
            attrs.push(ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("", ρσ_str.format("{}", attr.name)), "="), ρσ_str.format("{}", val)), ""));
        }
    }
    attrs = (attrs.length) ? ρσ_list_add(" ", attrs.join(" ")) : "";
    ans = ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("<", ρσ_str.format("{}", elem.tagName)), ""), ρσ_str.format("{}", attrs)), ">");
    return ans;
};
if (!ρσ_html_element_to_string.__argnames__) Object.defineProperties(ρσ_html_element_to_string, {
    __argnames__ : {value: ["elem"]},
    __module__ : {value: "__main__"}
});

function ρσ_repr(x) {
    var ans, name;
    if (x === null) {
        return "None";
    }
    if (x === undefined) {
        return "undefined";
    }
    ans = x;
    if (typeof x.__repr__ === "function") {
        ans = x.__repr__();
    } else if (x === true || x === false) {
        ans = (x) ? "True" : "False";
    } else if (Array.isArray(x)) {
        ans = ρσ_repr_js_builtin(x, true);
    } else if (typeof x === "function") {
        ans = x.toString();
    } else if (typeof x === "object" && !x.toString) {
        ans = ρσ_repr_js_builtin(x);
    } else {
        name = Object.prototype.toString.call(x).slice(8, -1);
        if (ρσ_not_equals("Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".indexOf(name), -1)) {
            return ρσ_list_add(ρσ_list_add(ρσ_list_add(name, "(["), x.map((function() {
                var ρσ_anonfunc = function (i) {
                    return str.format("0x{:02x}", i);
                };
                if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
                    __argnames__ : {value: ["i"]},
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })()).join(", ")), "])");
        }
        if (typeof HTMLElement !== "undefined" && x instanceof HTMLElement) {
            ans = ρσ_html_element_to_string(x);
        } else {
            ans = (typeof x.toString === "function") ? x.toString() : x;
        }
        if (ans === "[object Object]") {
            return ρσ_repr_js_builtin(x);
        }
        try {
            ans = JSON.stringify(x);
        } catch (ρσ_Exception) {
            ρσ_last_exception = ρσ_Exception;
            {
            } 
        }
    }
    return ρσ_list_add(ans, "");
};
if (!ρσ_repr.__argnames__) Object.defineProperties(ρσ_repr, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

function ρσ_str(x) {
    var ans, name;
    if (x === null) {
        return "None";
    }
    if (x === undefined) {
        return "undefined";
    }
    if (typeof x === "bigint") {
        return String(x);
    }
    ans = x;
    if (typeof x.__str__ === "function") {
        ans = x.__str__();
    } else if (typeof x.__repr__ === "function") {
        ans = x.__repr__();
    } else if (x === true || x === false) {
        ans = (x) ? "True" : "False";
    } else if (Array.isArray(x)) {
        ans = ρσ_repr_js_builtin(x, true);
    } else if (typeof x.toString === "function") {
        name = Object.prototype.toString.call(x).slice(8, -1);
        if (ρσ_not_equals("Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".indexOf(name), -1)) {
            return ρσ_list_add(ρσ_list_add(ρσ_list_add(name, "(["), x.map((function() {
                var ρσ_anonfunc = function (i) {
                    return str.format("0x{:02x}", i);
                };
                if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
                    __argnames__ : {value: ["i"]},
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })()).join(", ")), "])");
        }
        if (typeof HTMLElement !== "undefined" && x instanceof HTMLElement) {
            ans = ρσ_html_element_to_string(x);
        } else {
            ans = x.toString();
        }
        if (ans === "[object Object]") {
            ans = ρσ_repr_js_builtin(x);
        }
    } else if (typeof x === "object" && !x.toString) {
        ans = ρσ_repr_js_builtin(x);
    }
    return ρσ_list_add(ans, "");
};
if (!ρσ_str.__argnames__) Object.defineProperties(ρσ_str, {
    __argnames__ : {value: ["x"]},
    __module__ : {value: "__main__"}
});

define_str_func = (function() {
    var ρσ_anonfunc = function (name, func) {
        var f;
        (ρσ_expr_temp = ρσ_str.prototype)[(typeof name === "number" && name < 0) ? ρσ_expr_temp.length + name : name] = func;
        ρσ_str[(typeof name === "number" && name < 0) ? ρσ_str.length + name : name] = f = func.call.bind(func);
        if (func.__argnames__) {
            Object.defineProperty(f, "__argnames__", (function(){
                var ρσ_d = {};
                ρσ_d["value"] = ['string'].concat(func.__argnames__);
                return ρσ_d;
            }).call(this));
        }
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["name", "func"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_orig_split = String.prototype.split.call.bind(String.prototype.split);
ρσ_orig_replace = String.prototype.replace.call.bind(String.prototype.replace);
define_str_func("format", (function() {
    var ρσ_anonfunc = function () {
        var template, args, kwargs, explicit, implicit, idx, split, ans, pos, in_brace, markup, ch;
        template = this;
        if (template === undefined) {
            throw new TypeError("Template is required");
        }
        args = Array.prototype.slice.call(arguments);
        kwargs = {};
        if (args[args.length-1] && args[args.length-1][ρσ_kwargs_symbol] !== undefined) {
            kwargs = args[args.length-1];
            args = args.slice(0, -1);
        }
        explicit = implicit = false;
        idx = 0;
        split = ρσ_orig_split;
        if (ρσ_str.format._template_resolve_pat === undefined) {
            ρσ_str.format._template_resolve_pat = /[.\[]/;
        }
        function resolve(arg, object) {
            var ρσ_unpack, first, key, rest, ans;
            if (!arg) {
                return object;
            }
            ρσ_unpack = [arg[0], arg.slice(1)];
            first = ρσ_unpack[0];
            arg = ρσ_unpack[1];
            key = split(arg, ρσ_str.format._template_resolve_pat, 1)[0];
            rest = arg.slice(key.length);
            ans = (first === "[") ? object[ρσ_bound_index(key.slice(0, -1), object)] : getattr(object, key);
            if (ans === undefined) {
                throw new KeyError((first === "[") ? key.slice(0, -1) : key);
            }
            return resolve(rest, ans);
        };
        if (!resolve.__argnames__) Object.defineProperties(resolve, {
            __argnames__ : {value: ["arg", "object"]},
            __module__ : {value: "__main__"}
        });

        function resolve_format_spec(format_spec) {
            if (ρσ_str.format._template_resolve_fs_pat === undefined) {
                ρσ_str.format._template_resolve_fs_pat = /[{]([a-zA-Z0-9_]+)[}]/g;
            }
            return format_spec.replace(ρσ_str.format._template_resolve_fs_pat, (function() {
                var ρσ_anonfunc = function (match, key) {
                    if (!Object.prototype.hasOwnProperty.call(kwargs, key)) {
                        return "";
                    }
                    return ρσ_list_add("", kwargs[(typeof key === "number" && key < 0) ? kwargs.length + key : key]);
                };
                if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
                    __argnames__ : {value: ["match", "key"]},
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })());
        };
        if (!resolve_format_spec.__argnames__) Object.defineProperties(resolve_format_spec, {
            __argnames__ : {value: ["format_spec"]},
            __module__ : {value: "__main__"}
        });

        function set_comma(ans, comma) {
            var sep;
            if (comma !== ",") {
                sep = 1234;
                sep = sep.toLocaleString(undefined, {useGrouping: true})[1];
                ans = str.replace(ans, sep, comma);
            }
            return ans;
        };
        if (!set_comma.__argnames__) Object.defineProperties(set_comma, {
            __argnames__ : {value: ["ans", "comma"]},
            __module__ : {value: "__main__"}
        });

        function safe_comma(value, comma) {
            try {
                return set_comma(value.toLocaleString(undefined, {useGrouping: true}), comma);
            } catch (ρσ_Exception) {
                ρσ_last_exception = ρσ_Exception;
                {
                    return value.toString(10);
                } 
            }
        };
        if (!safe_comma.__argnames__) Object.defineProperties(safe_comma, {
            __argnames__ : {value: ["value", "comma"]},
            __module__ : {value: "__main__"}
        });

        function safe_fixed(value, precision, comma) {
            if (!comma) {
                return value.toFixed(precision);
            }
            try {
                return set_comma(value.toLocaleString(undefined, {useGrouping: true, minimumFractionDigits: precision, maximumFractionDigits: precision}), comma);
            } catch (ρσ_Exception) {
                ρσ_last_exception = ρσ_Exception;
                {
                    return value.toFixed(precision);
                } 
            }
        };
        if (!safe_fixed.__argnames__) Object.defineProperties(safe_fixed, {
            __argnames__ : {value: ["value", "precision", "comma"]},
            __module__ : {value: "__main__"}
        });

        function apply_formatting(value, format_spec) {
            var ρσ_unpack, fill, align, sign, fhash, zeropad, width, comma, precision, ftype, is_numeric, is_int, lftype, code, prec, exp, nval, is_positive, left, right;
            if (format_spec.indexOf("{") !== -1) {
                format_spec = resolve_format_spec(format_spec);
            }
            if (ρσ_str.format._template_format_pat === undefined) {
                ρσ_str.format._template_format_pat = /([^{}](?=[<>=^]))?([<>=^])?([-+\x20])?(\#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?/;
            }
            try {
                ρσ_unpack = format_spec.match(ρσ_str.format._template_format_pat).slice(1);
ρσ_unpack = ρσ_unpack_asarray(9, ρσ_unpack);
                fill = ρσ_unpack[0];
                align = ρσ_unpack[1];
                sign = ρσ_unpack[2];
                fhash = ρσ_unpack[3];
                zeropad = ρσ_unpack[4];
                width = ρσ_unpack[5];
                comma = ρσ_unpack[6];
                precision = ρσ_unpack[7];
                ftype = ρσ_unpack[8];
            } catch (ρσ_Exception) {
                ρσ_last_exception = ρσ_Exception;
                if (ρσ_Exception instanceof TypeError) {
                    return value;
                } else {
                    throw ρσ_Exception;
                }
            }
            if (zeropad) {
                fill = fill || "0";
                align = align || "=";
            } else {
                fill = fill || " ";
                align = align || ">";
            }
            is_numeric = Number(value) === value;
            is_int = is_numeric && value % 1 === 0;
            precision = parseInt(precision, 10);
            lftype = (ftype || "").toLowerCase();
            if (ftype === "n") {
                is_numeric = true;
                if (is_int) {
                    if (comma) {
                        throw new ValueError("Cannot specify ',' with 'n'");
                    }
                    value = parseInt(value, 10).toLocaleString();
                } else {
                    value = parseFloat(value).toLocaleString();
                }
            } else if (['b', 'c', 'd', 'o', 'x'].indexOf(lftype) !== -1) {
                value = parseInt(value, 10);
                is_numeric = true;
                if (!isNaN(value)) {
                    if (ftype === "b") {
                        value = (value >>> 0).toString(2);
                        if (fhash) {
                            value = ρσ_list_add("0b", value);
                        }
                    } else if (ftype === "c") {
                        if (value > 65535) {
                            code = value - 65536;
                            value = String.fromCharCode(ρσ_list_add(55296, (code >> 10)), ρσ_list_add(56320, (code & 1023)));
                        } else {
                            value = String.fromCharCode(value);
                        }
                    } else if (ftype === "d") {
                        if (comma) {
                            value = safe_comma(value, comma);
                        } else {
                            value = value.toString(10);
                        }
                    } else if (ftype === "o") {
                        value = value.toString(8);
                        if (fhash) {
                            value = ρσ_list_add("0o", value);
                        }
                    } else if (lftype === "x") {
                        value = value.toString(16);
                        value = (ftype === "x") ? value.toLowerCase() : value.toUpperCase();
                        if (fhash) {
                            value = ρσ_list_add("0x", value);
                        }
                    }
                }
            } else if (['e','f','g','%'].indexOf(lftype) !== -1) {
                is_numeric = true;
                value = parseFloat(value);
                prec = (isNaN(precision)) ? 6 : precision;
                if (lftype === "e") {
                    value = value.toExponential(prec);
                    value = (ftype === "E") ? value.toUpperCase() : value.toLowerCase();
                } else if (lftype === "f") {
                    value = safe_fixed(value, prec, comma);
                    value = (ftype === "F") ? value.toUpperCase() : value.toLowerCase();
                } else if (lftype === "%") {
                    value *= 100;
                    value = ρσ_list_add(safe_fixed(value, prec, comma), "%");
                } else if (lftype === "g") {
                    prec = max(1, prec);
                    exp = parseInt(split(value.toExponential(prec - 1).toLowerCase(), "e")[1], 10);
                    if (-4 <= exp && exp < prec) {
                        value = safe_fixed(value, prec - 1 - exp, comma);
                    } else {
                        value = value.toExponential(prec - 1);
                    }
                    value = value.replace(/0+$/g, "");
                    if (value[value.length-1] === decimal_sep) {
                        value = value.slice(0, -1);
                    }
                    if (ftype === "G") {
                        value = value.toUpperCase();
                    }
                }
            } else {
                if (comma) {
                    value = parseInt(value, 10);
                    if (isNaN(value)) {
                        throw new ValueError("Must use numbers with , or _");
                    }
                    value = safe_comma(value, comma);
                }
                value = ρσ_list_iadd(value, "");
                if (!isNaN(precision)) {
                    value = value.slice(0, precision);
                }
            }
            value = ρσ_list_iadd(value, "");
            if (is_numeric && sign) {
                nval = Number(value);
                is_positive = !isNaN(nval) && nval >= 0;
                if (is_positive && (sign === " " || sign === "+")) {
                    value = ρσ_list_add(sign, value);
                }
            }
            function repeat(char, num) {
                return (new Array(num+1)).join(char);
            };
            if (!repeat.__argnames__) Object.defineProperties(repeat, {
                __argnames__ : {value: ["char", "num"]},
                __module__ : {value: "__main__"}
            });

            if (is_numeric && width && width[0] === "0") {
                width = width.slice(1);
                ρσ_unpack = ["0", "="];
                fill = ρσ_unpack[0];
                align = ρσ_unpack[1];
            }
            width = parseInt(width || "-1", 10);
            if (isNaN(width)) {
                throw new ValueError(ρσ_list_add("Invalid width specification: ", width));
            }
            if (fill && value.length < width) {
                if (align === "<") {
                    value = ρσ_list_add(value, repeat(fill, width - value.length));
                } else if (align === ">") {
                    value = ρσ_list_add(repeat(fill, width - value.length), value);
                } else if (align === "^") {
                    left = Math.floor((width - value.length) / 2);
                    right = width - left - value.length;
                    value = ρσ_list_add(ρσ_list_add(repeat(fill, left), value), repeat(fill, right));
                } else if (align === "=") {
                    if (ρσ_in(value[0], "+- ")) {
                        value = ρσ_list_add(ρσ_list_add(value[0], repeat(fill, width - value.length)), value.slice(1));
                    } else {
                        value = ρσ_list_add(repeat(fill, width - value.length), value);
                    }
                } else {
                    throw new ValueError(ρσ_list_add("Unrecognized alignment: ", align));
                }
            }
            return value;
        };
        if (!apply_formatting.__argnames__) Object.defineProperties(apply_formatting, {
            __argnames__ : {value: ["value", "format_spec"]},
            __module__ : {value: "__main__"}
        });

        function parse_markup(markup) {
            var key, transformer, format_spec, pos, state, ch;
            key = transformer = format_spec = "";
            pos = 0;
            state = 0;
            while (pos < markup.length) {
                ch = markup[(typeof pos === "number" && pos < 0) ? markup.length + pos : pos];
                if (state === 0) {
                    if (ch === "!") {
                        state = 1;
                    } else if (ch === ":") {
                        state = 2;
                    } else {
                        key = ρσ_list_iadd(key, ch);
                    }
                } else if (state === 1) {
                    if (ch === ":") {
                        state = 2;
                    } else {
                        transformer = ρσ_list_iadd(transformer, ch);
                    }
                } else {
                    format_spec = ρσ_list_iadd(format_spec, ch);
                }
                pos = ρσ_list_iadd(pos, 1);
            }
            return [key, transformer, format_spec];
        };
        if (!parse_markup.__argnames__) Object.defineProperties(parse_markup, {
            __argnames__ : {value: ["markup"]},
            __module__ : {value: "__main__"}
        });

        function render_markup(markup) {
            var ρσ_unpack, key, transformer, format_spec, ends_with_equal, lkey, nvalue, object, ans;
            ρσ_unpack = parse_markup(markup);
ρσ_unpack = ρσ_unpack_asarray(3, ρσ_unpack);
            key = ρσ_unpack[0];
            transformer = ρσ_unpack[1];
            format_spec = ρσ_unpack[2];
            if (transformer && ['a', 'r', 's'].indexOf(transformer) === -1) {
                throw new ValueError(ρσ_list_add("Unknown conversion specifier: ", transformer));
            }
            ends_with_equal = key.endsWith("=");
            if (ends_with_equal) {
                key = key.slice(0, -1);
            }
            lkey = key.length && split(key, /[.\[]/, 1)[0];
            if (lkey) {
                explicit = true;
                if (implicit) {
                    throw new ValueError("cannot switch from automatic field numbering to manual field specification");
                }
                nvalue = parseInt(lkey);
                object = (isNaN(nvalue)) ? kwargs[(typeof lkey === "number" && lkey < 0) ? kwargs.length + lkey : lkey] : args[(typeof nvalue === "number" && nvalue < 0) ? args.length + nvalue : nvalue];
                if (object === undefined) {
                    if (isNaN(nvalue)) {
                        throw new KeyError(lkey);
                    }
                    throw new IndexError(lkey);
                }
                object = resolve(key.slice(lkey.length), object);
            } else {
                implicit = true;
                if (explicit) {
                    throw new ValueError("cannot switch from manual field specification to automatic field numbering");
                }
                if (idx >= args.length) {
                    throw new IndexError(ρσ_list_add("Not enough arguments to match template: ", template));
                }
                object = args[(typeof idx === "number" && idx < 0) ? args.length + idx : idx];
                idx = ρσ_list_iadd(idx, 1);
            }
            if (typeof object === "function") {
                object = object();
            }
            if (transformer === "r") {
                object = ρσ_repr(object);
            } else if (transformer === "s") {
                object = ρσ_str(object);
            } else if (transformer === "a") {
                object = ρσ_repr(object);
            }
            if (!transformer && object !== null && object !== undefined && typeof object.__format__ === "function") {
                ans = object.__format__(format_spec || "");
            } else {
                ans = ρσ_list_add("", object);
                if (format_spec) {
                    ans = apply_formatting(ans, format_spec);
                }
            }
            if (ends_with_equal) {
                ans = ρσ_list_add(ρσ_list_add(ρσ_list_add(ρσ_list_add("", ρσ_str.format("{}", key)), "="), ρσ_str.format("{}", ans)), "");
            }
            return ans;
        };
        if (!render_markup.__argnames__) Object.defineProperties(render_markup, {
            __argnames__ : {value: ["markup"]},
            __module__ : {value: "__main__"}
        });

        ans = "";
        pos = 0;
        in_brace = 0;
        markup = "";
        while (pos < template.length) {
            ch = template[(typeof pos === "number" && pos < 0) ? template.length + pos : pos];
            if (in_brace) {
                if (ch === "{") {
                    in_brace = ρσ_list_iadd(in_brace, 1);
                    markup = ρσ_list_iadd(markup, "{");
                } else if (ch === "}") {
                    in_brace -= 1;
                    if (in_brace > 0) {
                        markup = ρσ_list_iadd(markup, "}");
                    } else {
                        ans = ρσ_list_iadd(ans, render_markup(markup));
                    }
                } else {
                    markup = ρσ_list_iadd(markup, ch);
                }
            } else {
                if (ch === "{") {
                    if (template[ρσ_bound_index(ρσ_list_add(pos, 1), template)] === "{") {
                        pos = ρσ_list_iadd(pos, 1);
                        ans = ρσ_list_iadd(ans, "{");
                    } else {
                        in_brace = 1;
                        markup = "";
                    }
                } else {
                    ans = ρσ_list_iadd(ans, ch);
                    if (ch === "}" && template[ρσ_bound_index(ρσ_list_add(pos, 1), template)] === "}") {
                        pos = ρσ_list_iadd(pos, 1);
                    }
                }
            }
            pos = ρσ_list_iadd(pos, 1);
        }
        if (in_brace) {
            throw new ValueError("expected '}' before end of string");
        }
        return ans;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("capitalize", (function() {
    var ρσ_anonfunc = function () {
        var string;
        string = this;
        if (string) {
            string = ρσ_list_add(string[0].toUpperCase(), string.slice(1).toLowerCase());
        }
        return string;
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("center", (function() {
    var ρσ_anonfunc = function (width, fill) {
        var left, right;
        left = Math.floor((width - this.length) / 2);
        right = width - left - this.length;
        fill = fill || " ";
        return ρσ_list_add(ρσ_list_add(new Array(left+1).join(fill), this), new Array(right+1).join(fill));
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["width", "fill"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("count", (function() {
    var ρσ_anonfunc = function (needle, start, end) {
        var string, ρσ_unpack, pos, step, ans;
        string = this;
        start = start || 0;
        end = end || string.length;
        if (start < 0 || end < 0) {
            string = string.slice(start, end);
            ρσ_unpack = [0, string.length];
            start = ρσ_unpack[0];
            end = ρσ_unpack[1];
        }
        pos = start;
        step = needle.length;
        if (!step) {
            return 0;
        }
        ans = 0;
        while (pos !== -1) {
            pos = string.indexOf(needle, pos);
            if (pos !== -1) {
                ans = ρσ_list_iadd(ans, 1);
                pos = ρσ_list_iadd(pos, step);
            }
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["needle", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("endswith", (function() {
    var ρσ_anonfunc = function (suffixes, start, end) {
        var string, q;
        string = this;
        start = start || 0;
        if (typeof suffixes === "string") {
            suffixes = [suffixes];
        }
        if (end !== undefined) {
            string = string.slice(0, end);
        }
        for (var i = 0; i < suffixes.length; i++) {
            q = suffixes[(typeof i === "number" && i < 0) ? suffixes.length + i : i];
            if (string.indexOf(q, Math.max(start, string.length - q.length)) !== -1) {
                return true;
            }
        }
        return false;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["suffixes", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("startswith", (function() {
    var ρσ_anonfunc = function (prefixes, start, end) {
        var prefix;
        start = start || 0;
        if (typeof prefixes === "string") {
            prefixes = [prefixes];
        }
        for (var i = 0; i < prefixes.length; i++) {
            prefix = prefixes[(typeof i === "number" && i < 0) ? prefixes.length + i : i];
            end = (end === undefined) ? this.length : end;
            if (end - start >= prefix.length && prefix === this.slice(start, ρσ_list_add(start, prefix.length))) {
                return true;
            }
        }
        return false;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["prefixes", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("find", (function() {
    var ρσ_anonfunc = function (needle, start, end) {
        var ans;
        while (start < 0) {
            start = ρσ_list_iadd(start, this.length);
        }
        ans = this.indexOf(needle, start);
        if (end !== undefined && ans !== -1) {
            while (end < 0) {
                end = ρσ_list_iadd(end, this.length);
            }
            if (ans >= end - needle.length) {
                return -1;
            }
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["needle", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("rfind", (function() {
    var ρσ_anonfunc = function (needle, start, end) {
        var ans;
        while (end < 0) {
            end = ρσ_list_iadd(end, this.length);
        }
        ans = this.lastIndexOf(needle, end - 1);
        if (start !== undefined && ans !== -1) {
            while (start < 0) {
                start = ρσ_list_iadd(start, this.length);
            }
            if (ans < start) {
                return -1;
            }
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["needle", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("index", (function() {
    var ρσ_anonfunc = function (needle, start, end) {
        var ans;
        ans = ρσ_str.prototype.find.apply(this, arguments);
        if (ans === -1) {
            throw new ValueError("substring not found");
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["needle", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("rindex", (function() {
    var ρσ_anonfunc = function (needle, start, end) {
        var ans;
        ans = ρσ_str.prototype.rfind.apply(this, arguments);
        if (ans === -1) {
            throw new ValueError("substring not found");
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["needle", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("islower", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && this.toLowerCase() === this.toString();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isupper", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && this.toUpperCase() === this.toString();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isspace", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && /^\s+$/.test(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isalpha", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && /^[a-zA-Z]+$/.test(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isdigit", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && /^\d+$/.test(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isalnum", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && /^[a-zA-Z0-9]+$/.test(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("isidentifier", (function() {
    var ρσ_anonfunc = function () {
        return this.length > 0 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(this);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("casefold", (function() {
    var ρσ_anonfunc = function () {
        return this.toLowerCase();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("removeprefix", (function() {
    var ρσ_anonfunc = function (prefix) {
        var s;
        s = this.toString();
        if (s.startsWith(prefix)) {
            return s.slice(prefix.length);
        }
        return s;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["prefix"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("removesuffix", (function() {
    var ρσ_anonfunc = function (suffix) {
        var s;
        s = this.toString();
        if (suffix.length && s.endsWith(suffix)) {
            return s.slice(0, s.length - suffix.length);
        }
        return s;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["suffix"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("join", (function() {
    var ρσ_anonfunc = function (iterable) {
        var ans, r;
        if (Array.isArray(iterable)) {
            return iterable.join(this);
        }
        ans = "";
        r = iterable.next();
        while (!r.done) {
            if (ans) {
                ans = ρσ_list_iadd(ans, this);
            }
            ans = ρσ_list_iadd(ans, r.value);
            r = iterable.next();
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["iterable"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("ljust", (function() {
    var ρσ_anonfunc = function (width, fill) {
        var string;
        string = this;
        if (width > string.length) {
            fill = fill || " ";
            string = ρσ_list_iadd(string, new Array(width - string.length + 1).join(fill));
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["width", "fill"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("rjust", (function() {
    var ρσ_anonfunc = function (width, fill) {
        var string;
        string = this;
        if (width > string.length) {
            fill = fill || " ";
            string = ρσ_list_add(new Array(width - string.length + 1).join(fill), string);
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["width", "fill"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("lower", (function() {
    var ρσ_anonfunc = function () {
        return this.toLowerCase();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("upper", (function() {
    var ρσ_anonfunc = function () {
        return this.toUpperCase();
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("title", (function() {
    var ρσ_anonfunc = function () {
        var words, title_cased_words, word;
        words = this.split(" ");
        title_cased_words = (function() {
            var ρσ_Iter = ρσ_Iterable(words), ρσ_Result = [], word;
            for (var ρσ_Index = 0; ρσ_Index < ρσ_Iter.length; ρσ_Index++) {
                word = ρσ_Iter[ρσ_Index];
                ρσ_Result.push((word) ? ρσ_list_add(word[0].upper(), word.slice(1).lower()) : "");
            }
            ρσ_Result = ρσ_list_constructor(ρσ_Result);
            return ρσ_Result;
        })();
        return " ".join(title_cased_words);
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("lstrip", (function() {
    var ρσ_anonfunc = function (chars) {
        var string, pos;
        string = this;
        pos = 0;
        chars = chars || ρσ_str.whitespace;
        while (chars.indexOf(string[(typeof pos === "number" && pos < 0) ? string.length + pos : pos]) !== -1) {
            pos = ρσ_list_iadd(pos, 1);
        }
        if (pos) {
            string = string.slice(pos);
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["chars"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("rstrip", (function() {
    var ρσ_anonfunc = function (chars) {
        var string, pos;
        string = this;
        pos = string.length - 1;
        chars = chars || ρσ_str.whitespace;
        while (chars.indexOf(string[(typeof pos === "number" && pos < 0) ? string.length + pos : pos]) !== -1) {
            pos -= 1;
        }
        if (pos < string.length - 1) {
            string = string.slice(0, ρσ_list_add(pos, 1));
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["chars"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("strip", (function() {
    var ρσ_anonfunc = function (chars) {
        return ρσ_str.prototype.lstrip.call(ρσ_str.prototype.rstrip.call(this, chars), chars);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["chars"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("partition", (function() {
    var ρσ_anonfunc = function (sep) {
        var idx;
        idx = this.indexOf(sep);
        if (idx === -1) {
            return [this, "", ""];
        }
        return [this.slice(0, idx), sep, this.slice(ρσ_list_add(idx, sep.length))];
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["sep"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("rpartition", (function() {
    var ρσ_anonfunc = function (sep) {
        var idx;
        idx = this.lastIndexOf(sep);
        if (idx === -1) {
            return ["", "", this];
        }
        return [this.slice(0, idx), sep, this.slice(ρσ_list_add(idx, sep.length))];
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["sep"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("replace", (function() {
    var ρσ_anonfunc = function (old, repl, count) {
        var string, pos, idx;
        string = this;
        if (old instanceof RegExp) {
            return ρσ_orig_replace(string, old, repl);
        }
        if (count === 0) {
            return string;
        }
        count = (count > 0) ? count : Number.MAX_VALUE;
        pos = 0;
        while (count > 0) {
            count -= 1;
            idx = string.indexOf(old, pos);
            if (idx === -1) {
                break;
            }
            pos = ρσ_list_add(idx, repl.length);
            string = ρσ_list_add(ρσ_list_add(string.slice(0, idx), repl), string.slice(ρσ_list_add(idx, old.length)));
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["old", "repl", "count"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("split", (function() {
    var ρσ_anonfunc = function (sep, maxsplit) {
        var split, ans, extra, parts;
        if (maxsplit === 0) {
            return ρσ_list_decorate([ this ]);
        }
        split = ρσ_orig_split;
        if (sep === undefined || sep === null) {
            if (maxsplit > 0) {
                ans = split(this, /(\s+)/);
                extra = "";
                parts = [];
                for (var i = 0; i < ans.length; i++) {
                    if (parts.length >= ρσ_list_add(maxsplit, 1)) {
                        extra = ρσ_list_iadd(extra, ans[(typeof i === "number" && i < 0) ? ans.length + i : i]);
                    } else if (i % 2 === 0) {
                        parts.push(ans[(typeof i === "number" && i < 0) ? ans.length + i : i]);
                    }
                }
                parts[parts.length-1] = ρσ_list_iadd(parts[parts.length-1], extra);
                ans = parts;
            } else {
                ans = split(this, /\s+/);
            }
        } else {
            if (sep === "") {
                throw new ValueError("empty separator");
            }
            ans = split(this, sep);
            if (maxsplit > 0 && ans.length > maxsplit) {
                extra = ans.slice(maxsplit).join(sep);
                ans = ans.slice(0, maxsplit);
                ans.push(extra);
            }
        }
        return ρσ_list_decorate(ans);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["sep", "maxsplit"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
String.prototype.split = (function() {
    var ρσ_anonfunc = function (sep, limit) {
        if (sep === undefined) {
            return ρσ_str.prototype.split.call(this);
        }
        return ρσ_orig_split(this, sep, limit);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["sep", "limit"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
define_str_func("rsplit", (function() {
    var ρσ_anonfunc = function (sep, maxsplit) {
        var split, ans, is_space, pos, current, spc, ch, end, idx;
        if (!maxsplit) {
            return ρσ_str.prototype.split.call(this, sep);
        }
        split = ρσ_orig_split;
        if (sep === undefined || sep === null) {
            if (maxsplit > 0) {
                ans = [];
                is_space = /\s/;
                pos = this.length - 1;
                current = "";
                while (pos > -1 && maxsplit > 0) {
                    spc = false;
                    ch = (ρσ_expr_temp = this)[(typeof pos === "number" && pos < 0) ? ρσ_expr_temp.length + pos : pos];
                    while (pos > -1 && is_space.test(ch)) {
                        spc = true;
                        ch = this[--pos];
                    }
                    if (spc) {
                        if (current) {
                            ans.push(current);
                            maxsplit -= 1;
                        }
                        current = ch;
                    } else {
                        current = ρσ_list_iadd(current, ch);
                    }
                    pos -= 1;
                }
                ans.push(ρσ_list_add(this.slice(0, ρσ_list_add(pos, 1)), current));
                ans.reverse();
            } else {
                ans = split(this, /\s+/);
            }
        } else {
            if (sep === "") {
                throw new ValueError("empty separator");
            }
            ans = [];
            pos = end = this.length;
            while (pos > -1 && maxsplit > 0) {
                maxsplit -= 1;
                idx = this.lastIndexOf(sep, pos);
                if (idx === -1) {
                    break;
                }
                ans.push(this.slice(ρσ_list_add(idx, sep.length), end));
                pos = idx - 1;
                end = idx;
            }
            ans.push(this.slice(0, end));
            ans.reverse();
        }
        return ρσ_list_decorate(ans);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["sep", "maxsplit"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("splitlines", (function() {
    var ρσ_anonfunc = function (keepends) {
        var split, parts, ans;
        split = ρσ_orig_split;
        if (keepends) {
            parts = split(this, /((?:\r?\n)|\r)/);
            ans = [];
            for (var i = 0; i < parts.length; i++) {
                if (i % 2 === 0) {
                    ans.push(parts[(typeof i === "number" && i < 0) ? parts.length + i : i]);
                } else {
                    ans[ans.length-1] = ρσ_list_iadd(ans[ans.length-1], parts[(typeof i === "number" && i < 0) ? parts.length + i : i]);
                }
            }
        } else {
            ans = split(this, /(?:\r?\n)|\r/);
        }
        return ρσ_list_decorate(ans);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["keepends"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("swapcase", (function() {
    var ρσ_anonfunc = function () {
        var ans, a, b;
        ans = new Array(this.length);
        for (var i = 0; i < ans.length; i++) {
            a = (ρσ_expr_temp = this)[(typeof i === "number" && i < 0) ? ρσ_expr_temp.length + i : i];
            b = a.toLowerCase();
            if (a === b) {
                b = a.toUpperCase();
            }
            ans[(typeof i === "number" && i < 0) ? ans.length + i : i] = b;
        }
        return ans.join("");
    };
    if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("zfill", (function() {
    var ρσ_anonfunc = function (width) {
        var string;
        string = this;
        if (width > string.length) {
            string = ρσ_list_add(new Array(width - string.length + 1).join("0"), string);
        }
        return string;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["width"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
define_str_func("expandtabs", (function() {
    var ρσ_anonfunc = function (tabsize) {
        var string, ans, col, ch, spaces;
        if (tabsize === undefined) {
            tabsize = 8;
        }
        string = this;
        ans = "";
        col = 0;
        for (var i = 0; i < string.length; i++) {
            ch = string[(typeof i === "number" && i < 0) ? string.length + i : i];
            if (ch === "\t") {
                if (tabsize > 0) {
                    spaces = tabsize - col % tabsize;
                    ans = ρσ_list_iadd(ans, new Array(spaces + 1).join(" "));
                    col = ρσ_list_iadd(col, spaces);
                }
            } else if (ch === "\n" || ch === "\r") {
                ans = ρσ_list_iadd(ans, ch);
                col = 0;
            } else {
                ans = ρσ_list_iadd(ans, ch);
                col = ρσ_list_iadd(col, 1);
            }
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["tabsize"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})());
ρσ_str.uchrs = (function() {
    var ρσ_anonfunc = function (string, with_positions) {
        return (function(){
            var ρσ_d = {};
            ρσ_d["_string"] = string;
            ρσ_d["_pos"] = 0;
            ρσ_d[ρσ_iterator_symbol] = (function() {
                var ρσ_anonfunc = function () {
                    return this;
                };
                if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })();
            ρσ_d["next"] = (function() {
                var ρσ_anonfunc = function () {
                    var length, pos, value, ans, extra;
                    length = this._string.length;
                    if (this._pos >= length) {
                        return (function(){
                            var ρσ_d = {};
                            ρσ_d["done"] = true;
                            return ρσ_d;
                        }).call(this);
                    }
                    pos = this._pos;
                    value = this._string.charCodeAt(this._pos++);
                    ans = "\ufffd";
                    if (55296 <= value && value <= 56319) {
                        if (this._pos < length) {
                            extra = this._string.charCodeAt(this._pos++);
                            if ((extra & 56320) === 56320) {
                                ans = String.fromCharCode(value, extra);
                            }
                        }
                    } else if ((value & 56320) !== 56320) {
                        ans = String.fromCharCode(value);
                    }
                    if (with_positions) {
                        return (function(){
                            var ρσ_d = {};
                            ρσ_d["done"] = false;
                            ρσ_d["value"] = ρσ_list_decorate([ pos, ans ]);
                            return ρσ_d;
                        }).call(this);
                    } else {
                        return (function(){
                            var ρσ_d = {};
                            ρσ_d["done"] = false;
                            ρσ_d["value"] = ans;
                            return ρσ_d;
                        }).call(this);
                    }
                };
                if (!ρσ_anonfunc.__module__) Object.defineProperties(ρσ_anonfunc, {
                    __module__ : {value: "__main__"}
                });
                return ρσ_anonfunc;
            })();
            return ρσ_d;
        }).call(this);
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["string", "with_positions"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_str.uslice = (function() {
    var ρσ_anonfunc = function (string, start, end) {
        var items, iterator, r;
        items = [];
        iterator = ρσ_str.uchrs(string);
        r = iterator.next();
        while (!r.done) {
            items.push(r.value);
            r = iterator.next();
        }
        return items.slice(start || 0, (end === undefined) ? items.length : end).join("");
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["string", "start", "end"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_str.ulen = (function() {
    var ρσ_anonfunc = function (string) {
        var iterator, r, ans;
        iterator = ρσ_str.uchrs(string);
        r = iterator.next();
        ans = 0;
        while (!r.done) {
            r = iterator.next();
            ans = ρσ_list_iadd(ans, 1);
        }
        return ans;
    };
    if (!ρσ_anonfunc.__argnames__) Object.defineProperties(ρσ_anonfunc, {
        __argnames__ : {value: ["string"]},
        __module__ : {value: "__main__"}
    });
    return ρσ_anonfunc;
})();
ρσ_str.ascii_lowercase = "abcdefghijklmnopqrstuvwxyz";
ρσ_str.ascii_uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
ρσ_str.ascii_letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
ρσ_str.digits = "0123456789";
ρσ_str.punctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
ρσ_str.printable = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ \t\n\r\u000b\f";
ρσ_str.whitespace = " \t\n\r\u000b\f";
define_str_func = undefined;
function ρσ_format(value, spec) {
    if (value !== null && value !== undefined && typeof value.__format__ === "function") {
        return value.__format__((spec !== undefined) ? spec : "");
    }
    if (spec === undefined || spec === "") {
        return ρσ_str(value);
    }
    return str.format(ρσ_list_add(ρσ_list_add("{:", spec), "}"), value);
};
if (!ρσ_format.__argnames__) Object.defineProperties(ρσ_format, {
    __argnames__ : {value: ["value", "spec"]},
    __module__ : {value: "__main__"}
});

ρσ_str.__name__ = "str";
var str = ρσ_str, repr = ρσ_repr, format = ρσ_format;