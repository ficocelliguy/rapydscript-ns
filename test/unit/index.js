/*
 * test/unit/index.js
 *
 * Snapshot-style unit tests: compile RapydScript → JS, verify emitted code
 * patterns, run the JS, and assert expected values via embedded `assrt` calls.
 *
 * Usage:
 *   node test/unit/index.js              # run all tests
 *   node test/unit/index.js <test-name>  # run a single test by name
 */
"use strict";

var path    = require("path");
var fs      = require("fs");
var vm      = require("vm");
var assert  = require("assert");
var utils   = require("../../tools/utils");
var colored = utils.safe_colored;

// ── Compiler setup ───────────────────────────────────────────────────────────

var BASE_PATH = path.resolve(__dirname, "../..");
var LIB_PATH  = path.join(BASE_PATH, "src", "lib");

var compiler_dir = path.join(BASE_PATH, "dev");
if (!utils.path_exists(path.join(compiler_dir, "compiler.js"))) {
    compiler_dir = path.join(BASE_PATH, "release");
}

var compiler_module = require("../../tools/compiler");
var RapydScript = compiler_module.create_compiler();
var baselib     = fs.readFileSync(
    path.join(compiler_dir, "baselib-plain-pretty.js"), "utf-8"
);

// ── assert.deepEqual patch ───────────────────────────────────────────────────
// RapydScript arrays carry extra properties; compare them as plain arrays,
// same as tools/test.js does.

var _deepEqual = assert.deepEqual;
assert.deepEqual = function (a, b, message) {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a === b) return;
        if (a.length !== b.length)
            throw new assert.AssertionError({
                actual: a, expected: b,
                operator: "deepEqual",
                stackStartFunction: assert.deepEqual,
            });
        for (var i = 0; i < a.length; i++) assert.deepEqual(a[i], b[i], message);
    } else if (a !== undefined && a !== null && typeof a.__eq__ === "function") {
        if (!a.__eq__(b))
            throw new assert.AssertionError({
                actual: a, expected: b,
                operator: "deepEqual",
                stackStartFunction: assert.deepEqual,
            });
    } else {
        return _deepEqual(a, b, message);
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function compile(src) {
    var ast = RapydScript.parse(src, {
        filename : "<unit-test>",
        toplevel : null,
        basedir  : BASE_PATH,
        libdir   : LIB_PATH,
    });
    var output = new RapydScript.OutputStream({
        baselib_plain : baselib,
        beautify      : true,
        js_version    : 6,
        private_scope : false,
    });
    ast.print(output);
    var js = output.toString();
    return js;
}

function compile_with_flags(src, flags_obj) {
    var ast = RapydScript.parse(src, {
        filename : "<unit-test>",
        toplevel : null,
        basedir  : BASE_PATH,
        libdir   : LIB_PATH,
        scoped_flags: flags_obj || {},
    });
    var output = new RapydScript.OutputStream({
        baselib_plain : baselib,
        beautify      : true,
        js_version    : 6,
        private_scope : false,
    });
    ast.print(output);
    return output.toString();
}

function compile_virtual(src, virtual_files) {
    compiler_module.set_virtual_files(virtual_files);
    try {
        var ast = RapydScript.parse(src, {
            filename    : "<unit-test>",
            toplevel    : null,
            basedir     : BASE_PATH,
            libdir      : LIB_PATH,
            import_dirs : ['__virtual__'],
        });
        var output = new RapydScript.OutputStream({
            baselib_plain : baselib,
            beautify      : true,
            js_version    : 6,
            private_scope : false,
        });
        ast.print(output);
        return output.toString();
    } finally {
        compiler_module.clear_virtual_files();
    }
}

function run_js(js) {
    return vm.runInNewContext(js, {
        __name__           : "<unit-test>",
        console            : console,
        assrt              : assert,
        // ρσ_last_exception must be in the global scope for try/except to work
        ρσ_last_exception  : undefined,
    }, {filename: "<unit-test>"});
}

// Verify every pattern in `checks` appears in `js`.
// Each entry may be a plain string (substring match) or a RegExp.
function check_js_patterns(test_name, js, checks) {
    (checks || []).forEach(function (pat) {
        var ok = (pat instanceof RegExp) ? pat.test(js) : js.indexOf(pat) !== -1;
        if (!ok) {
            var desc = (pat instanceof RegExp) ? String(pat) : JSON.stringify(pat);
            throw new Error(
                "compiled JS missing expected pattern " + desc +
                "\n  in test: " + test_name
            );
        }
    });
}

// ── Test definitions ─────────────────────────────────────────────────────────
//
// Each test object:
//   name        {string}  – unique identifier (used for filtering)
//   description {string}  – what this test exercises
//   src         {string}  – RapydScript source; embed assertions with `assrt`
//   js_checks   {Array}   – (optional) strings/RegExps to find in compiled JS
//
// The RapydScript source may use `assrt.equal`, `assrt.deepEqual`, `assrt.ok`,
// and `assrt.throws`.  A failing assertion or thrown exception fails the test.

var TESTS = [

    // ── Operators ─────────────────────────────────────────────────────────

    {
        name: "floor_division",
        description: "// operator compiles to Math.floor(x / y)",
        src: [
            "# globals: assrt",
            "assrt.equal(7 // 2, 3)",
            "assrt.equal(-7 // 2, -4)",
            "assrt.equal(10 // 3, 3)",
        ].join("\n"),
        js_checks: ["Math.floor(7 / 2)", "Math.floor(-7 / 2)"],
    },

    {
        name: "exponentiation",
        description: "** operator compiles to Math.pow(x, y)",
        src: [
            "# globals: assrt",
            "assrt.equal(2 ** 10, 1024)",
            "assrt.equal(3 ** 3, 27)",
            "assrt.equal(10 ** 0, 1)",
        ].join("\n"),
        js_checks: ["Math.pow(2, 10)", "Math.pow(3, 3)", "Math.pow(10, 0)"],
    },

    // ── List concatenation ────────────────────────────────────────────────

    {
        name: "list_concatenation_literals",
        description: "list + list returns a new concatenated list (literal operands)",
        src: [
            "# globals: assrt",
            "result = [1, 2] + [3, 4]",
            "assrt.deepEqual(result, [1, 2, 3, 4])",
            "assrt.equal(result.length, 4)",
            "# originals not mutated",
            "a = [1, 2]",
            "b = [3, 4]",
            "c = a + b",
            "assrt.deepEqual(c, [1, 2, 3, 4])",
            "assrt.deepEqual(a, [1, 2])",
            "assrt.deepEqual(b, [3, 4])",
        ].join("\n"),
        js_checks: ["ρσ_list_add("],
    },

    {
        name: "list_concatenation_variables",
        description: "list + list works with variable references",
        src: [
            "# globals: assrt",
            "a = [10, 20]",
            "b = [30]",
            "assrt.deepEqual(a + b, [10, 20, 30])",
            "assrt.deepEqual([] + [1], [1])",
            "assrt.deepEqual([1] + [], [1])",
            "assrt.deepEqual([] + [], [])",
        ].join("\n"),
    },

    {
        name: "list_iadd_extends_in_place",
        description: "list += list extends the list in-place (same object)",
        src: [
            "# globals: assrt",
            "a = [1, 2]",
            "ref = a",
            "a += [3, 4]",
            "assrt.deepEqual(a, [1, 2, 3, 4])",
            "# ref still points to same object, now extended",
            "assrt.deepEqual(ref, [1, 2, 3, 4])",
            "assrt.ok(a is ref)",
        ].join("\n"),
        js_checks: ["ρσ_list_iadd("],
    },

    {
        name: "list_concat_does_not_break_number_add",
        description: "numbers still add correctly after list-concat helpers are introduced",
        src: [
            "# globals: assrt",
            "assrt.equal(1 + 2, 3)",
            "assrt.equal(3 + 4, 7)",
            "assrt.equal(0 + 0, 0)",
            "x = 10",
            "x += 5",
            "assrt.equal(x, 15)",
        ].join("\n"),
    },

    {
        name: "list_concat_does_not_break_string_concat",
        description: "string concatenation still works correctly",
        src: [
            "# globals: assrt",
            "assrt.equal('hello' + ' world', 'hello world')",
            "assrt.equal('a' + 'b' + 'c', 'abc')",
            "s = 'foo'",
            "s += 'bar'",
            "assrt.equal(s, 'foobar')",
        ].join("\n"),
    },

    {
        name: "not_operator",
        description: '"not" compiles to "!"',
        src: [
            "# globals: assrt",
            "assrt.equal(not True, False)",
            "assrt.equal(not False, True)",
            "assrt.equal(not (1 is 2), True)",
        ].join("\n"),
        js_checks: ["!true", "!false"],
    },

    {
        name: "is_and_is_not",
        description: '"is" compiles to "==="; "is not" compiles to "!=="',
        src: [
            "# globals: assrt",
            "assrt.equal(1 is 1, True)",
            "assrt.equal(1 is not 2, True)",
            'assrt.equal("a" is not "b", True)',
            "assrt.equal(None is None, True)",
        ].join("\n"),
        js_checks: ["1 === 1", "1 !== 2", '"a" !== "b"', "null === null"],
    },

    {
        name: "and_or_operators",
        description: '"and" / "or" compile to "&&" / "||"',
        src: [
            "# globals: assrt",
            "assrt.equal(True and False, False)",
            "assrt.equal(False or True, True)",
            "assrt.equal(True and True, True)",
            "assrt.equal(False or False, False)",
        ].join("\n"),
        js_checks: ["true && false", "false || true"],
    },

    {
        name: "ternary_expression",
        description: '"x if cond else y" compiles to "(cond) ? x : y"',
        src: [
            "# globals: assrt",
            "assrt.equal(1 if True else 2, 1)",
            'assrt.equal("yes" if 5 > 3 else "no", "yes")',
            "assrt.equal(0 if False else 99, 99)",
        ].join("\n"),
        js_checks: ["? 1 : 2", '? "yes" : "no"'],
    },

    {
        name: "chained_comparison",
        description: "Chained comparisons (a < b < c) lower to && in JS",
        src: [
            "# globals: assrt",
            "x = 5",
            "assrt.equal(1 < x < 10, True)",
            "assrt.equal(0 < x < 4, False)",
            "assrt.equal(5 <= x <= 5, True)",
        ].join("\n"),
        // Chained comparisons always produce at least one &&
        js_checks: ["&&"],
    },

    // ── Strings ───────────────────────────────────────────────────────────

    {
        name: "f_string",
        description: "f-strings compile to concatenation via ρσ_str.format",
        src: [
            '# globals: assrt',
            'name = "World"',
            'assrt.equal(f"Hello {name}", "Hello World")',
            'n = 42',
            'assrt.equal(f"n={n}", "n=42")',
            'assrt.equal(f"{1 + 1} is two", "2 is two")',
        ].join("\n"),
        js_checks: ["ρσ_str.format"],
    },

    {
        name: "string_methods",
        description: "str.upper/lower/strip/split work via the str global; native JS methods also available",
        src: [
            '# globals: assrt',
            // str.* form (ρσ_str methods)
            'assrt.equal(str.upper("hello"), "HELLO")',
            'assrt.equal(str.lower("WORLD"), "world")',
            'assrt.equal(str.strip("  hi  "), "hi")',
            // native JS String methods still work
            'parts = "a,b,c".split(",")',
            'assrt.equal(parts[0], "a")',
            'assrt.equal(parts.length, 3)',
            'assrt.equal("hello world".indexOf("world"), 6)',
        ].join("\n"),
        js_checks: [],
    },

    // ── Collections ───────────────────────────────────────────────────────

    {
        name: "list_comprehension",
        description: "List comprehensions with filter compile to a ρσ_Result push loop",
        src: [
            "# globals: assrt",
            "evens = [x for x in range(10) if x % 2 is 0]",
            "assrt.deepEqual(evens, [0, 2, 4, 6, 8])",
            "squares = [x**2 for x in [1, 2, 3]]",
            "assrt.deepEqual(squares, [1, 4, 9])",
        ].join("\n"),
        js_checks: ["ρσ_Result.push"],
    },

    {
        name: "dict_comprehension",
        description: "Dict comprehensions build objects via a ρσ_Result accumulator",
        src: [
            "# globals: assrt",
            "doubled = {k: k*2 for k in [1, 2, 3]}",
            "assrt.equal(doubled[1], 2)",
            "assrt.equal(doubled[2], 4)",
            "assrt.equal(doubled[3], 6)",
        ].join("\n"),
        js_checks: ["ρσ_Result", "ρσ_Index"],
    },

    // ── Control flow ──────────────────────────────────────────────────────

    {
        name: "range_for_loop",
        description: "range() for-loops compile to C-style indexed for loops",
        src: [
            "# globals: assrt",
            "total = 0",
            "for i in range(5):",
            "    total += i",
            "assrt.equal(total, 10)",
            "items = []",
            "for j in range(2, 8, 2):",
            "    items.push(j)",
            "assrt.deepEqual(items, [2, 4, 6])",
        ].join("\n"),
        js_checks: [
            // range(5) → for (var ρσ_IndexN = 0; ρσ_IndexN < 5; ρσ_IndexN++)
            /for \(var ρσ_Index\d+ = 0; ρσ_Index\d+ < 5; ρσ_Index\d+\+\+\)/,
        ],
    },

    {
        name: "while_loop",
        description: "while loops compile to JS while statements",
        src: [
            "# globals: assrt",
            "n = 1",
            "while n < 32:",
            "    n *= 2",
            "assrt.equal(n, 32)",
        ].join("\n"),
        js_checks: ["while (n < 32)"],
    },

    {
        name: "try_except",
        description: "try/except compiles to try/catch with an instanceof type guard",
        src: [
            "# globals: assrt, ρσ_last_exception",
            "caught = False",
            "msg = ''",
            "try:",
            '    raise ValueError("oops")',
            "except ValueError as e:",
            "    caught = True",
            "    msg = str(e)",
            "assrt.equal(caught, True)",
            'assrt.ok(msg.indexOf("oops") >= 0)',
        ].join("\n"),
        js_checks: ["catch (ρσ_Exception)", "instanceof ValueError"],
    },

    // ── Functions ─────────────────────────────────────────────────────────

    {
        name: "default_arguments",
        description: "Default argument values are applied when args are omitted",
        src: [
            "# globals: assrt",
            'def greet(name, greeting="Hello"):',
            '    return greeting + ", " + name',
            'assrt.equal(greet("World"), "Hello, World")',
            'assrt.equal(greet("Alice", "Hi"), "Hi, Alice")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "variadic_star_args",
        description: "*args functions are tagged __handles_kwarg_interpolation__",
        src: [
            "# globals: assrt",
            "def add(*args):",
            "    total = 0",
            "    for n in args:",
            "        total += n",
            "    return total",
            "assrt.equal(add(1, 2, 3), 6)",
            "assrt.equal(add(10, 20), 30)",
            "assrt.equal(add(), 0)",
        ].join("\n"),
        js_checks: ["__handles_kwarg_interpolation__"],
    },

    {
        name: "anonymous_function",
        description: "Anonymous def expressions compile to JS function expressions",
        src: [
            "# globals: assrt",
            "double = def(x): return x * 2;",
            "assrt.equal(double(3), 6)",
            "assrt.equal(double(7), 14)",
            "apply_fn = def(f, val): return f(val);",
            "assrt.equal(apply_fn(double, 5), 10)",
        ].join("\n"),
        js_checks: [/function\s*\(x\)\s*\{/],
    },

    {
        name: "nonlocal_closure",
        description: '"nonlocal" lets an inner function mutate an outer variable',
        src: [
            "# globals: assrt",
            "counter = 0",
            "def increment():",
            "    nonlocal counter",
            "    counter += 1",
            "increment()",
            "increment()",
            "increment()",
            "assrt.equal(counter, 3)",
        ].join("\n"),
        // nonlocal → the outer variable is accessed/modified directly via ρσ_list_iadd
        js_checks: ["ρσ_list_iadd(counter,"],
    },

    // ── Classes ───────────────────────────────────────────────────────────

    {
        name: "class_with_methods",
        description: "Classes compile to prototype objects; isinstance works",
        src: [
            "# globals: assrt",
            "class Greeter:",
            "    def __init__(self, name):",
            "        self.name = name",
            "    def greet(self):",
            '        return "Hello, " + self.name',
            'g = Greeter("Alice")',
            'assrt.equal(g.greet(), "Hello, Alice")',
            "assrt.ok(isinstance(g, Greeter))",
        ].join("\n"),
        js_checks: ["Greeter.prototype", "__init__"],
    },

    {
        name: "class_inheritance",
        description: "Subclasses use __extends__; isinstance sees the whole chain",
        src: [
            "# globals: assrt",
            "class Animal:",
            "    def __init__(self, name):",
            "        self.name = name",
            "    def speak(self):",
            '        return self.name + " speaks"',
            "class Dog(Animal):",
            "    def speak(self):",
            '        return self.name + " barks"',
            'a = Animal("Cat")',
            'd = Dog("Rex")',
            'assrt.equal(a.speak(), "Cat speaks")',
            'assrt.equal(d.speak(), "Rex barks")',
            "assrt.ok(isinstance(d, Dog))",
            "assrt.ok(isinstance(d, Animal))",
            "assrt.ok(not isinstance(a, Dog))",
        ].join("\n"),
        js_checks: ["ρσ_extends"],
    },

    {
        name: "class_dunder_properties",
        description: "Classes get __name__, __qualname__, __module__; instances get __class__",
        src: [
            "# globals: assrt",
            "class Animal:",
            "    def __init__(self, name):",
            "        self.name = name",
            "assrt.equal(Animal.__name__, 'Animal')",
            "assrt.equal(Animal.__qualname__, 'Animal')",
            "assrt.equal(jstype(Animal.__module__), 'string')",
            "a = Animal('Rex')",
            "assrt.ok(a.__class__ is Animal)",
            "assrt.equal(type(a).__name__, 'Animal')",
            "class Dog(Animal):",
            "    pass",
            "d = Dog('Buddy')",
            "assrt.equal(Dog.__name__, 'Dog')",
            "assrt.ok(d.__class__ is Dog)",
            "assrt.equal(type(d).__name__, 'Dog')",
        ].join("\n"),
        js_checks: [
            "Animal.__name__ = \"Animal\"",
            "Animal.__qualname__ = \"Animal\"",
            "Animal.__module__ =",
            'Object.defineProperty(Animal.prototype, "__class__"',
        ],
    },

    {
        name: "classmethod",
        description: "@classmethod decorator: cls is the class; factory pattern; instance delegation",
        src: [
            "# globals: assrt",
            "class Shape:",
            "    def __init__(self, kind, size):",
            "        self.kind = kind",
            "        self.size = size",
            "    @classmethod",
            "    def circle(cls, size):",
            "        return cls('circle', size)",
            "    @classmethod",
            "    def square(cls, size):",
            "        return cls('square', size)",
            "s1 = Shape.circle(10)",
            "assrt.equal(s1.kind, 'circle')",
            "assrt.equal(s1.size, 10)",
            "assrt.ok(isinstance(s1, Shape))",
            "s2 = Shape.square(5)",
            "assrt.equal(s2.kind, 'square')",
            "assrt.equal(s2.size, 5)",
            "# Call classmethod on an instance (delegates to class)",
            "s3 = s1.circle(7)",
            "assrt.equal(s3.kind, 'circle')",
            "assrt.equal(s3.size, 7)",
        ].join("\n"),
        js_checks: [
            // classmethod defined on the class itself
            "Shape.circle = function",
            // prototype delegation exists
            "Shape.prototype.circle",
            // cls is `this` in body
            "var cls = this",
        ],
    },

    {
        name: "classmethod_classvar_access",
        description: "@classmethod: cls.classvar accesses class variable without .prototype; subclass inherits classmethod",
        src: [
            "# globals: assrt",
            "class Counter:",
            "    count = 0",
            "    @classmethod",
            "    def increment(cls):",
            "        cls.count += 1",
            "    @classmethod",
            "    def get_count(cls):",
            "        return cls.count",
            "    @classmethod",
            "    def reset(cls):",
            "        cls.count = 0",
            "Counter.increment()",
            "Counter.increment()",
            "Counter.increment()",
            "assrt.equal(Counter.get_count(), 3)",
            "Counter.reset()",
            "assrt.equal(Counter.get_count(), 0)",
            "# Subclass inherits classmethod; cls is the subclass",
            "class SpecialCounter(Counter):",
            "    count = 0",
            "SpecialCounter.increment()",
            "SpecialCounter.increment()",
            "assrt.equal(SpecialCounter.get_count(), 2)",
            "assrt.equal(Counter.get_count(), 0)",
        ].join("\n"),
        js_checks: [
            // cls.count should compile to cls.prototype.count
            "cls.prototype.count",
        ],
    },

    {
        name: "classmethod_subclass_factory",
        description: "@classmethod factory on subclass: cls is subclass, type(instance).__name__ is correct",
        src: [
            "# globals: assrt",
            "class Animal:",
            "    count = 0",
            "    def __init__(self, name):",
            "        Animal.count += 1",
            "        self.name = name",
            "    @classmethod",
            "    def get_count(cls):",
            "        return cls.count",
            "    @classmethod",
            "    def create(cls, name):",
            "        return cls(name)",
            "dog = Animal.create('Rex')",
            "cat = Animal.create('Whiskers')",
            "assrt.equal(Animal.get_count(), 2)",
            "assrt.equal(dog.get_count(), 2)",
            "class Dog(Animal):",
            "    def speak(self):",
            "        return 'Woof'",
            "puppy = Dog.create('Buddy')",
            "assrt.equal(type(puppy).__name__, 'Dog')",
            "assrt.ok(isinstance(puppy, Dog))",
            "assrt.ok(isinstance(puppy, Animal))",
            "assrt.equal(Animal.get_count(), 3)",
        ].join("\n"),
    },

    // ── __new__ constructor hook ───────────────────────────────────────────

    {
        name: "new_basic",
        description: "__new__ is called before __init__; returns an instance of the class",
        src: [
            "# globals: assrt",
            "order = []",
            "class Foo:",
            "    def __new__(cls):",
            "        order.append('new')",
            "        return super().__new__(cls)",
            "    def __init__(self):",
            "        order.append('init')",
            "        self.x = 42",
            "f = Foo()",
            "assrt.deepEqual(order, ['new', 'init'])",
            "assrt.equal(f.x, 42)",
            "assrt.ok(isinstance(f, Foo))",
        ].join("\n"),
        js_checks: [
            "Foo.__new__(Foo, ...arguments)",
            "ρσ_instance instanceof Foo",
        ],
    },

    {
        name: "new_singleton",
        description: "__new__ can implement the singleton pattern",
        src: [
            "# globals: assrt",
            "class Singleton:",
            "    _instance = None",
            "    def __new__(cls):",
            "        if cls._instance is None:",
            "            cls._instance = super().__new__(cls)",
            "        return cls._instance",
            "    def __init__(self):",
            "        pass",
            "a = Singleton()",
            "b = Singleton()",
            "assrt.ok(a is b)",
            "assrt.ok(isinstance(a, Singleton))",
        ].join("\n"),
    },

    {
        name: "new_returns_other_type",
        description: "__new__ returning a non-class instance skips __init__",
        src: [
            "# globals: assrt",
            "init_called = [False]",
            "class MyInt:",
            "    def __new__(cls, val):",
            "        return val * 2",
            "    def __init__(self, val):",
            "        init_called[0] = True",
            "result = MyInt(21)",
            "assrt.equal(result, 42)",
            "assrt.equal(init_called[0], False)",
        ].join("\n"),
    },

    {
        name: "new_with_args",
        description: "__new__ receives the same args as __init__",
        src: [
            "# globals: assrt",
            "class Point:",
            "    def __new__(cls, x, y):",
            "        instance = super().__new__(cls)",
            "        instance._raw_x = x",
            "        return instance",
            "    def __init__(self, x, y):",
            "        self.x = x",
            "        self.y = y",
            "p = Point(3, 4)",
            "assrt.equal(p.x, 3)",
            "assrt.equal(p.y, 4)",
            "assrt.equal(p._raw_x, 3)",
            "assrt.ok(isinstance(p, Point))",
        ].join("\n"),
    },

    {
        name: "new_subclass_inherits",
        description: "__new__ in parent class with subclass override",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def __new__(cls):",
            "        instance = super().__new__(cls)",
            "        instance.created_by = 'Base.__new__'",
            "        return instance",
            "    def __init__(self):",
            "        pass",
            "class Child(Base):",
            "    def __new__(cls):",
            "        instance = super().__new__(cls)",
            "        instance.child_attr = 'set'",
            "        return instance",
            "    def __init__(self):",
            "        pass",
            "b = Base()",
            "assrt.equal(b.created_by, 'Base.__new__')",
            "c = Child()",
            "assrt.equal(c.created_by, 'Base.__new__')",
            "assrt.equal(c.child_attr, 'set')",
            "assrt.ok(isinstance(c, Child))",
            "assrt.ok(isinstance(c, Base))",
        ].join("\n"),
    },

    // ── Verbatim JS ───────────────────────────────────────────────────────

    {
        name: "verbatim_js",
        description: 'v"..." expressions are emitted as-is in the JS output',
        src: [
            "# globals: assrt",
            'result = v"typeof undefined"',
            'assrt.equal(result, "undefined")',
            "arr = [1, 2, 3]",
            'len = v"arr.length"',
            "assrt.equal(len, 3)",
            'assrt.equal(v"Math.max(4, 7)", 7)',
        ].join("\n"),
        js_checks: ["typeof undefined", "arr.length", "Math.max(4, 7)"],
    },

    // ── Example scripts ─────────────────────────────────────────────

    {
        name: "fibonacci",
        description: "Fibonacci function with recursion and memoization",
        src: `# globals: assrt
def memoize(f):
    memo = {}
    return def(x):
        if x not in memo: memo[x] = f(x)
        return memo[x]

@memoize
def fib(n):
    if n == 0: return 0
    elif n == 1: return 1
    else: return fib(n-1) + fib(n-2)

assrt.equal(fib(0), 0)
assrt.equal(fib(1), 1)
assrt.equal(fib(10), 55)
assrt.equal(fib(15), 610)
`,
        // Full exact expected JS for the user-code section, stored in a fixture
        // file to preserve trailing whitespace on the blank line between the two
        // function definitions (line with 8 spaces that a template literal would drop).
        js_checks: [fs.readFileSync(path.join(__dirname, "fixtures", "fibonacci_expected.js"), "utf-8").replace(/\r\n/g, "\n")],
    },

    // ── Virtual file system ───────────────────────────────────────────────

    {
        name: "virtual_fs_import",
        description: "from mymodule import square works when mymodule is a virtual file",
        src: [
            "# globals: assrt",
            "from mymodule import square",
            "assrt.equal(square(4), 16)",
            "assrt.equal(square(7), 49)",
        ].join("\n"),
        virtual_files: {
            mymodule: [
                "def square(n):",
                "    return n * n",
            ].join("\n"),
        },
        js_checks: ["function square(n)"],
    },

    {
        name: "virtual_fs_multi_import",
        description: "imports from two different virtual modules both work",
        src: [
            "# globals: assrt",
            "from shapes import Circle",
            "from mathutils import double",
            "c = Circle(5)",
            "assrt.equal(c.area(), 78)",
            "assrt.equal(double(6), 12)",
        ].join("\n"),
        virtual_files: {
            shapes: [
                "class Circle:",
                "    def __init__(self, r):",
                "        self.r = r",
                "    def area(self):",
                "        return int(3.14159 * self.r * self.r)",
            ].join("\n"),
            mathutils: [
                "def double(x):",
                "    return x * 2",
            ].join("\n"),
        },
        js_checks: ["Circle.prototype", "function double(x)"],
    },

    // ── __import__() ─────────────────────────────────────────────────────

    {
        name: "__import__-basic",
        description: "__import__(name) returns the module object for an already-imported module",
        src: [
            "# globals: assrt",
            "from mymodule import square",
            "m = __import__('mymodule')",
            "assrt.equal(m.square(4), 16)",
            "assrt.equal(m.square(7), 49)",
        ].join("\n"),
        virtual_files: {
            mymodule: [
                "def square(n):",
                "    return n * n",
            ].join("\n"),
        },
        js_checks: ["__import__"],
    },

    {
        name: "__import__-via-import-stmt",
        description: "__import__(name) also works when module was loaded via 'import x'",
        src: [
            "# globals: assrt",
            "import myutils",
            "m = __import__('myutils')",
            "assrt.equal(m.add(3, 4), 7)",
        ].join("\n"),
        virtual_files: {
            myutils: [
                "def add(a, b):",
                "    return a + b",
            ].join("\n"),
        },
    },

    {
        name: "__import__-dotted-no-fromlist",
        description: "__import__('pkg.sub') without fromlist returns the top-level package",
        src: [
            "# globals: assrt",
            "from pkg.utils import helper",
            "top = __import__('pkg.utils')",
            "assrt.equal(top.name, 'pkg')",
        ].join("\n"),
        virtual_files: {
            "pkg": "name = 'pkg'",     // pkg/__init__.pyj content; key is "pkg"
            "pkg/utils": [
                "def helper():",
                "    return 99",
            ].join("\n"),
        },
    },

    {
        name: "__import__-dotted-with-fromlist",
        description: "__import__('pkg.sub', fromlist=['fn']) returns the submodule",
        src: [
            "# globals: assrt",
            "from pkg.utils import helper",
            "sub = __import__('pkg.utils', None, None, ['helper'])",
            "assrt.equal(sub.helper(), 99)",
        ].join("\n"),
        virtual_files: {
            "pkg": "",                  // pkg/__init__.pyj; key is "pkg"
            "pkg/utils": [
                "def helper():",
                "    return 99",
            ].join("\n"),
        },
    },

    {
        name: "__import__-error-on-missing",
        description: "__import__ raises ModuleNotFoundError for a module not in ρσ_modules",
        src: [
            "# globals: assrt",
            "from mymod import fn",
            "caught = False",
            "try:",
            "    __import__('does_not_exist')",
            "except ModuleNotFoundError as e:",
            "    caught = True",
            "    assrt.equal(e.message, \"No module named 'does_not_exist'\")",
            "assrt.ok(caught)",
        ].join("\n"),
        virtual_files: {
            mymod: [
                "def fn():",
                "    return 1",
            ].join("\n"),
        },
    },

    // ── Walrus operator (:=) ──────────────────────────────────────────────

    {
        name: "walrus_basic",
        description: "name := expr compiles to (name = expr) and returns the value",
        src: [
            "# globals: assrt",
            "x = (y := 42)",
            "assrt.equal(y, 42)",
            "assrt.equal(x, 42)",
        ].join("\n"),
        js_checks: ["(y = 42)"],
    },

    {
        name: "walrus_in_if",
        description: "walrus in if condition assigns and tests the value",
        src: [
            "# globals: assrt",
            "data = [1, 2, 3]",
            "if (n := len(data)) > 0:",
            "    assrt.equal(n, 3)",
            "else:",
            "    assrt.fail('should not reach')",
        ].join("\n"),
        js_checks: ["(n ="],
    },

    {
        name: "walrus_in_while",
        description: "walrus in while loop condition accumulates values",
        src: [
            "# globals: assrt",
            "items = [10, 20, 30]",
            "idx = 0",
            "total = 0",
            "while (idx := idx + 1) <= 3:",
            "    total += items[idx - 1]",
            "assrt.equal(total, 60)",
        ].join("\n"),
        js_checks: ["(idx ="],
    },

    {
        name: "walrus_in_list_comprehension",
        description: "walrus in list comprehension assigns in the enclosing scope",
        src: [
            "# globals: assrt",
            "def get_last_even(nums):",
            "    evens = [y for x in nums if (y := x) % 2 == 0]",
            "    return evens",
            "result = get_last_even([1, 2, 3, 4, 5, 6])",
            "assrt.equal(result.length, 3)",
            "assrt.equal(result[0], 2)",
            "assrt.equal(result[2], 6)",
        ].join("\n"),
        js_checks: ["(y ="],
    },

    {
        name: "walrus_value_returned",
        description: "walrus expression evaluates to the assigned value",
        src: [
            "# globals: assrt",
            "def double(x):",
            "    return x * 2",
            "result = (z := double(7))",
            "assrt.equal(z, 14)",
            "assrt.equal(result, 14)",
        ].join("\n"),
        js_checks: ["(z ="],
    },

    // ── match/case (structural pattern matching) ──────────────────────────

    {
        name: "match_literal_patterns",
        description: "match/case with literal patterns compiles to do-while with === checks",
        src: [
            "# globals: assrt",
            "def describe(x):",
            "    result = 'unknown'",
            "    match x:",
            "        case 1:",
            "            result = 'one'",
            "        case 2:",
            "            result = 'two'",
            "        case 'hello':",
            "            result = 'greeting'",
            "        case True:",
            "            result = 'true-val'",
            "        case None:",
            "            result = 'none-val'",
            "    return result",
            "assrt.equal(describe(1), 'one')",
            "assrt.equal(describe(2), 'two')",
            "assrt.equal(describe('hello'), 'greeting')",
            "assrt.equal(describe(True), 'true-val')",
            "assrt.equal(describe(None), 'none-val')",
            "assrt.equal(describe(99), 'unknown')",
        ].join("\n"),
        js_checks: ["=== 1", "=== 2", "=== \"hello\"", "=== true", "=== null", "do {"],
    },

    {
        name: "match_wildcard",
        description: "case _: always matches and provides a default",
        src: [
            "# globals: assrt",
            "def categorize(x):",
            "    match x:",
            "        case 0:",
            "            return 'zero'",
            "        case _:",
            "            return 'nonzero'",
            "assrt.equal(categorize(0), 'zero')",
            "assrt.equal(categorize(5), 'nonzero')",
            "assrt.equal(categorize(-1), 'nonzero')",
        ].join("\n"),
        js_checks: ["=== 0", "true"],
    },

    {
        name: "match_capture",
        description: "case x: captures and binds the matched value",
        src: [
            "# globals: assrt",
            "def double_it(val):",
            "    match val:",
            "        case 0:",
            "            return 0",
            "        case n:",
            "            return n * 2",
            "assrt.equal(double_it(0), 0)",
            "assrt.equal(double_it(5), 10)",
            "assrt.equal(double_it(-3), -6)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "match_or_patterns",
        description: "case a | b: matches if any pattern matches",
        src: [
            "# globals: assrt",
            "def weekend(day):",
            "    match day:",
            "        case 'Saturday' | 'Sunday':",
            "            return True",
            "        case _:",
            "            return False",
            "assrt.equal(weekend('Saturday'), True)",
            "assrt.equal(weekend('Sunday'), True)",
            "assrt.equal(weekend('Monday'), False)",
            "assrt.equal(weekend('Friday'), False)",
        ].join("\n"),
        js_checks: ["||"],
    },

    {
        name: "match_guard",
        description: "case pattern if guard: only matches when guard is True",
        src: [
            "# globals: assrt",
            "def sign(x):",
            "    match x:",
            "        case n if n > 0:",
            "            return 'positive'",
            "        case n if n < 0:",
            "            return 'negative'",
            "        case _:",
            "            return 'zero'",
            "assrt.equal(sign(5), 'positive')",
            "assrt.equal(sign(-3), 'negative')",
            "assrt.equal(sign(0), 'zero')",
        ].join("\n"),
        js_checks: ["if ("],
    },

    {
        name: "match_sequence",
        description: "case [a, b]: matches a 2-element array and binds elements",
        src: [
            "# globals: assrt",
            "def first_two(lst):",
            "    match lst:",
            "        case []:",
            "            return 'empty'",
            "        case [x]:",
            "            return 'one:' + str(x)",
            "        case [x, y]:",
            "            return 'two:' + str(x) + ',' + str(y)",
            "        case _:",
            "            return 'many'",
            "assrt.equal(first_two([]), 'empty')",
            "assrt.equal(first_two([1]), 'one:1')",
            "assrt.equal(first_two([1, 2]), 'two:1,2')",
            "assrt.equal(first_two([1, 2, 3]), 'many')",
        ].join("\n"),
        js_checks: ["Array.isArray"],
    },

    {
        name: "match_star_sequence",
        description: "case [head, *tail]: captures the rest of a sequence",
        src: [
            "# globals: assrt",
            "def parse_list(lst):",
            "    match lst:",
            "        case []:",
            "            return 'empty'",
            "        case [first, *rest]:",
            "            return str(first) + '+' + str(rest.length)",
            "assrt.equal(parse_list([]), 'empty')",
            "assrt.equal(parse_list([1]), '1+0')",
            "assrt.equal(parse_list([1, 2, 3]), '1+2')",
        ].join("\n"),
        js_checks: ["Array.isArray", ".slice("],
    },

    {
        name: "match_mapping",
        description: "case {'key': value}: matches dict-like objects",
        src: [
            "# globals: assrt",
            "def get_name(obj):",
            "    match obj:",
            "        case {'name': n, 'age': a}:",
            "            return n + ' is ' + str(a)",
            "        case {'name': n}:",
            "            return n",
            "        case _:",
            "            return 'unknown'",
            "assrt.equal(get_name({'name': 'Alice', 'age': 30}), 'Alice is 30')",
            "assrt.equal(get_name({'name': 'Bob'}), 'Bob')",
            "assrt.equal(get_name({}), 'unknown')",
        ].join("\n"),
        js_checks: ["typeof", "in "],
    },

    {
        name: "match_class_pattern",
        description: "case ClassName(kw=pat): matches class instances by keyword attributes",
        src: [
            "# globals: assrt",
            "class Point:",
            "    def __init__(self, x, y):",
            "        self.x = x",
            "        self.y = y",
            "def describe_point(p):",
            "    match p:",
            "        case Point(x=0, y=0):",
            "            return 'origin'",
            "        case Point(x=0, y=py):",
            "            return 'y-axis:' + str(py)",
            "        case Point(x=px, y=0):",
            "            return 'x-axis:' + str(px)",
            "        case Point(x=px, y=py):",
            "            return str(px) + ',' + str(py)",
            "assrt.equal(describe_point(Point(0, 0)), 'origin')",
            "assrt.equal(describe_point(Point(0, 5)), 'y-axis:5')",
            "assrt.equal(describe_point(Point(3, 0)), 'x-axis:3')",
            "assrt.equal(describe_point(Point(3, 4)), '3,4')",
        ].join("\n"),
        js_checks: ["instanceof Point"],
    },

    {
        name: "match_as_pattern",
        description: "case pattern as name: binds the whole match to name",
        src: [
            "# globals: assrt",
            "def inspect(val):",
            "    match val:",
            "        case [x, y] as pair:",
            "            return str(pair.length) + ':' + str(x)",
            "        case v as other:",
            "            return 'other:' + str(other)",
            "assrt.equal(inspect([1, 2]), '2:1')",
            "assrt.equal(inspect(42), 'other:42')",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "match_negative_literal",
        description: "Negative number literals work in patterns",
        src: [
            "# globals: assrt",
            "def sign(x):",
            "    match x:",
            "        case -1:",
            "            return 'neg one'",
            "        case 0:",
            "            return 'zero'",
            "        case 1:",
            "            return 'one'",
            "        case _:",
            "            return 'other'",
            "assrt.equal(sign(-1), 'neg one')",
            "assrt.equal(sign(0), 'zero')",
            "assrt.equal(sign(1), 'one')",
            "assrt.equal(sign(2), 'other')",
        ].join("\n"),
        js_checks: ["=== -1"],
    },

    {
        name: "match_guard_fallthrough",
        description: "When a guard fails, the next case is tried",
        src: [
            "# globals: assrt",
            "def categorize(x):",
            "    match x:",
            "        case n if n > 100:",
            "            return 'big'",
            "        case n if n > 10:",
            "            return 'medium'",
            "        case n if n > 0:",
            "            return 'small'",
            "        case _:",
            "            return 'nonpositive'",
            "assrt.equal(categorize(200), 'big')",
            "assrt.equal(categorize(50), 'medium')",
            "assrt.equal(categorize(5), 'small')",
            "assrt.equal(categorize(0), 'nonpositive')",
            "assrt.equal(categorize(-1), 'nonpositive')",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "match_nested_sequence",
        description: "Nested sequence patterns match nested arrays",
        src: [
            "# globals: assrt",
            "def matrix_type(m):",
            "    match m:",
            "        case [[a, b], [c, d]]:",
            "            return '2x2:' + str(a+d)",
            "        case _:",
            "            return 'other'",
            "assrt.equal(matrix_type([[1, 2], [3, 4]]), '2x2:5')",
            "assrt.equal(matrix_type([[1, 2, 3]]), 'other')",
        ].join("\n"),
        js_checks: ["Array.isArray"],
    },

    {
        name: "match_is_soft_keyword",
        description: "'match' can still be used as a variable name",
        src: [
            "# globals: assrt",
            "match = 42",
            "assrt.equal(match, 42)",
            "match += 1",
            "assrt.equal(match, 43)",
        ].join("\n"),
        js_checks: [],
    },

    // ── Lambda ────────────────────────────────────────────────────────────

    {
        name: "lambda_basic",
        description: "lambda compiles to an anonymous JS function expression",
        src: [
            "# globals: assrt",
            "double = lambda x: x * 2",
            "assrt.equal(double(5), 10)",
            "add = lambda a, b: a + b",
            "assrt.equal(add(3, 4), 7)",
        ].join("\n"),
        js_checks: ["function"],
    },

    {
        name: "lambda_no_args",
        description: "lambda with no arguments works",
        src: [
            "# globals: assrt",
            "forty_two = lambda: 42",
            "assrt.equal(forty_two(), 42)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_inline",
        description: "lambda used inline in a function call",
        src: [
            "# globals: assrt",
            "def apply(fn, x):",
            "    return fn(x)",
            "assrt.equal(apply(lambda x: x * x, 5), 25)",
            "nums = [3, 1, 2]",
            "nums.sort()",
            "assrt.deepEqual(nums, [1, 2, 3])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_ternary_body",
        description: "lambda body can be a ternary (if/else) expression",
        src: [
            "# globals: assrt",
            "abs_val = lambda x: x if x >= 0 else -x",
            "assrt.equal(abs_val(5), 5)",
            "assrt.equal(abs_val(-3), 3)",
            "clamp = lambda x, lo, hi: lo if x < lo else (hi if x > hi else x)",
            "assrt.equal(clamp(5, 0, 10), 5)",
            "assrt.equal(clamp(-1, 0, 10), 0)",
            "assrt.equal(clamp(15, 0, 10), 10)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_default_args",
        description: "lambda supports default argument values",
        src: [
            "# globals: assrt",
            "greet = lambda name='world': 'hello ' + name",
            "assrt.equal(greet(), 'hello world')",
            "assrt.equal(greet('alice'), 'hello alice')",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_closure",
        description: "lambda captures variables from enclosing scope",
        src: [
            "# globals: assrt",
            "def make_adder(n):",
            "    return lambda x: x + n",
            "add5 = make_adder(5)",
            "assrt.equal(add5(3), 8)",
            "assrt.equal(add5(10), 15)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_in_list",
        description: "lambda can be stored in a list and called",
        src: [
            "# globals: assrt",
            "ops = [lambda x: x + 1, lambda x: x * 2, lambda x: x - 3]",
            "assrt.equal(ops[0](5), 6)",
            "assrt.equal(ops[1](5), 10)",
            "assrt.equal(ops[2](5), 2)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_nested",
        description: "nested lambdas work (lambda returning lambda)",
        src: [
            "# globals: assrt",
            "mult = lambda x: lambda y: x * y",
            "triple = mult(3)",
            "assrt.equal(triple(4), 12)",
            "assrt.equal(mult(5)(6), 30)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "lambda_star_args",
        description: "lambda supports *args",
        src: [
            "# globals: assrt",
            "total = lambda *args: sum(args)",
            "assrt.equal(total(1, 2, 3), 6)",
            "assrt.equal(total(10, 20), 30)",
        ].join("\n"),
        js_checks: [],
    },

    // ── Variable type annotations ──────────────────────────────────────────

    {
        name: "var_annotation_with_value",
        description: "variable type annotations with assignment compile and run correctly",
        src: [
            "# globals: assrt",
            "x: int = 42",
            "assrt.equal(x, 42)",
            "y: str = 'hello'",
            "assrt.equal(y, 'hello')",
            "z: float = 3.14",
            "assrt.equal(z, 3.14)",
        ].join("\n"),
        js_checks: ["x = 42", "y = \"hello\"", "z = 3.14"],
    },

    {
        name: "var_annotation_only",
        description: "annotation-only (no value) compiles and runs without error",
        src: [
            "# globals: assrt",
            "x: int",
            "assrt.ok(True)",
        ].join("\n"),
        // annotation-only produces no assignment
        js_checks: [],
    },

    {
        name: "var_annotation_complex_type",
        description: "variable annotations with complex type expressions work correctly",
        src: [
            "# globals: assrt",
            "xs: list = [1, 2, 3]",
            "assrt.deepEqual(xs, [1, 2, 3])",
            "d: dict = {'a': 1}",
            "assrt.equal(d['a'], 1)",
            "n: int = 2 + 3",
            "assrt.equal(n, 5)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "var_annotation_in_function",
        description: "variable annotations inside functions work correctly",
        src: [
            "# globals: assrt",
            "def f():",
            "    x: int = 10",
            "    y: str = 'hi'",
            "    return x",
            "assrt.equal(f(), 10)",
        ].join("\n"),
        js_checks: ["x = 10"],
    },

    {
        name: "var_annotation_in_class",
        description: "variable annotations as class attributes work correctly",
        src: [
            "# globals: assrt",
            "class Counter:",
            "    count: int = 0",
            "    def increment(self):",
            "        self.count += 1",
            "c = Counter()",
            "c.increment()",
            "assrt.equal(c.count, 1)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "var_annotation_expr_rhs",
        description: "annotation with complex RHS expression evaluates correctly",
        src: [
            "# globals: assrt",
            "def compute():",
            "    result: int = 0",
            "    for i in range(5):",
            "        result += i",
            "    return result",
            "assrt.equal(compute(), 10)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "var_annotation_multiple",
        description: "multiple annotated assignments in sequence all execute",
        src: [
            "# globals: assrt",
            "a: int = 1",
            "b: int = 2",
            "c: int = a + b",
            "assrt.equal(c, 3)",
        ].join("\n"),
        js_checks: ["a = 1", "b = 2"],
    },

    // ── super() ───────────────────────────────────────────────────────────

    {
        name: "super_init",
        description: "super().__init__() calls parent constructor",
        src: [
            "# globals: assrt",
            "class Animal:",
            "    def __init__(self, name):",
            "        self.name = name",
            "class Dog(Animal):",
            "    def __init__(self, name, breed):",
            "        super().__init__(name)",
            "        self.breed = breed",
            "d = Dog('Rex', 'Labrador')",
            "assrt.equal(d.name, 'Rex')",
            "assrt.equal(d.breed, 'Labrador')",
        ].join("\n"),
        js_checks: [/Animal\.prototype\.__init__\.call\(this/],
    },

    {
        name: "super_method",
        description: "super().method() calls parent method",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def greet(self):",
            "        return 'Hello'",
            "class Child(Base):",
            "    def greet(self):",
            "        return super().greet() + ' World'",
            "c = Child()",
            "assrt.equal(c.greet(), 'Hello World')",
        ].join("\n"),
        js_checks: [/Base\.prototype\.greet\.call\(this/],
    },

    {
        name: "super_with_args",
        description: "super().method() passes arguments to parent",
        src: [
            "# globals: assrt",
            "class Adder:",
            "    def add(self, a, b):",
            "        return a + b",
            "class LoggingAdder(Adder):",
            "    def add(self, a, b):",
            "        return super().add(a, b)",
            "la = LoggingAdder()",
            "assrt.equal(la.add(3, 4), 7)",
        ].join("\n"),
        js_checks: [/Adder\.prototype\.add\.call\(this/],
    },

    {
        name: "super_two_arg_form",
        description: "super(ClassName, self).method() two-argument form works",
        src: [
            "# globals: assrt",
            "class A:",
            "    def val(self):",
            "        return 'A'",
            "class B(A):",
            "    def val(self):",
            "        return super(B, self).val() + 'B'",
            "b = B()",
            "assrt.equal(b.val(), 'AB')",
        ].join("\n"),
        js_checks: [/A\.prototype\.val\.call\(this/],
    },

    {
        name: "super_multi_level",
        description: "super() works across multiple levels of inheritance",
        src: [
            "# globals: assrt",
            "class A:",
            "    def name(self):",
            "        return 'A'",
            "class B(A):",
            "    def name(self):",
            "        return super().name() + 'B'",
            "class C(B):",
            "    def name(self):",
            "        return super().name() + 'C'",
            "assrt.equal(C().name(), 'ABC')",
        ].join("\n"),
    },

    {
        name: "super_in_nested_method",
        description: "super() resolves correctly inside nested function in method",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def make_greeting(self, name):",
            "        return 'Hi ' + name",
            "class Child(Base):",
            "    def make_greeting(self, name):",
            "        result = super().make_greeting(name)",
            "        return result + '!'",
            "assrt.equal(Child().make_greeting('world'), 'Hi world!')",
        ].join("\n"),
    },

    // ── any() ─────────────────────────────────────────────────────────────

    {
        name: "any_true_on_truthy_element",
        description: "any() returns True when at least one element is truthy",
        src: [
            "# globals: assrt",
            "assrt.equal(any([False, 0, '', 1]), True)",
            "assrt.equal(any([1, 2, 3]), True)",
            "assrt.equal(any(['hello']), True)",
        ].join("\n"),
    },

    {
        name: "any_false_on_all_falsy",
        description: "any() returns False when all elements are falsy",
        src: [
            "# globals: assrt",
            "assrt.equal(any([False, 0, '', None]), False)",
            "assrt.equal(any([0, 0, 0]), False)",
        ].join("\n"),
    },

    {
        name: "any_empty_iterable",
        description: "any() returns False for an empty iterable",
        src: [
            "# globals: assrt",
            "assrt.equal(any([]), False)",
            "assrt.equal(any(iter([])), False)",
        ].join("\n"),
    },

    {
        name: "any_with_iterator",
        description: "any() works with an iterator (not just arrays)",
        src: [
            "# globals: assrt",
            "assrt.equal(any(iter([0, 0, 3])), True)",
            "assrt.equal(any(iter([0, 0, 0])), False)",
            "assrt.equal(any(iter([True])), True)",
        ].join("\n"),
    },

    {
        name: "any_with_range",
        description: "any() works with range()",
        src: [
            "# globals: assrt",
            "assrt.equal(any(range(3)), True)",
            "assrt.equal(any(range(0)), False)",
        ].join("\n"),
    },

    {
        name: "any_compiles_to_function_call",
        description: "any(x) compiles to a function call to any",
        src: [
            "# globals: assrt",
            "result = any([True, False])",
            "assrt.equal(result, True)",
        ].join("\n"),
        js_checks: ["any("],
    },

    // ── all() ─────────────────────────────────────────────────────────────

    {
        name: "all_true_on_all_truthy",
        description: "all() returns True when every element is truthy",
        src: [
            "# globals: assrt",
            "assrt.equal(all([1, 2, 3]), True)",
            "assrt.equal(all(['a', 'b']), True)",
            "assrt.equal(all([True, True]), True)",
        ].join("\n"),
    },

    {
        name: "all_false_on_any_falsy",
        description: "all() returns False when any element is falsy",
        src: [
            "# globals: assrt",
            "assrt.equal(all([1, 0, 3]), False)",
            "assrt.equal(all([True, False, True]), False)",
            "assrt.equal(all([1, None]), False)",
        ].join("\n"),
    },

    {
        name: "all_empty_iterable",
        description: "all() returns True for an empty iterable",
        src: [
            "# globals: assrt",
            "assrt.equal(all([]), True)",
            "assrt.equal(all(iter([])), True)",
        ].join("\n"),
    },

    {
        name: "all_with_iterator",
        description: "all() works with an iterator (not just arrays)",
        src: [
            "# globals: assrt",
            "assrt.equal(all(iter([1, 2, 3])), True)",
            "assrt.equal(all(iter([1, 0, 3])), False)",
        ].join("\n"),
    },

    {
        name: "all_with_range",
        description: "all() works with range()",
        src: [
            "# globals: assrt",
            "assrt.equal(all(range(1, 4)), True)",
            "assrt.equal(all(range(0, 3)), False)",
        ].join("\n"),
    },

    {
        name: "all_compiles_to_function_call",
        description: "all(x) compiles to a function call to all",
        src: [
            "# globals: assrt",
            "result = all([True, True])",
            "assrt.equal(result, True)",
        ].join("\n"),
        js_checks: ["all("],
    },

    {
        name: "any_all_combined",
        description: "any() and all() can be composed and used together",
        src: [
            "# globals: assrt",
            "nums = [2, 4, 6, 8]",
            "assrt.equal(all([x > 0 for x in nums]), True)",
            "assrt.equal(any([x > 5 for x in nums]), True)",
            "assrt.equal(all([x > 5 for x in nums]), False)",
            "assrt.equal(any([x > 10 for x in nums]), False)",
        ].join("\n"),
    },

    // ── print() ───────────────────────────────────────────────────────────

    {
        name: "print_compiles_to_console_log",
        description: "print(x) compiles directly to console.log(x)",
        src: [
            "# globals: assrt",
            "print('hello')",
            "print(1, 2, 3)",
        ].join("\n"),
        js_checks: ["console.log(\"hello\")", "console.log(1, 2, 3)"],
    },

    {
        name: "print_outputs_to_console",
        description: "print() captures output via console.log",
        src: [
            "# globals: assrt, captured",
            "captured = []",
            "def mock_log(*args):",
            "    captured.push(args.join(' '))",
            "orig = console.log",
            "console.log = mock_log",
            "print('hello')",
            "print('a', 'b', 'c')",
            "console.log = orig",
            "assrt.equal(captured[0], 'hello')",
            "assrt.equal(captured[1], 'a b c')",
        ].join("\n"),
    },

    {
        name: "print_sep_kwarg",
        description: "print(a, b, sep=x) joins args with sep",
        src: [
            "# globals: assrt, captured",
            "captured = []",
            "def mock_log(*args):",
            "    captured.push(args.join(' '))",
            "orig = console.log",
            "console.log = mock_log",
            "print('x', 'y', 'z', sep='-')",
            "console.log = orig",
            "assrt.equal(captured[0], 'x-y-z')",
        ].join("\n"),
        js_checks: ["ρσ_print"],
    },

    {
        name: "print_does_not_clobber_window_print",
        description: "print() transpilation does not overwrite window.print",
        src: [
            "# globals: assrt",
            "print('test')",
        ].join("\n"),
        // The compiled JS must NOT contain 'var print = ' (which would overwrite window.print)
        js_checks: [/console\.log\("test"\)/],
    },

    {
        name: "window_print_preserved",
        description: "window.print() compiles as window.print() for browser print dialog",
        src: [
            "# globals: assrt",
            "state = {'called': False}",
            "def on_print():",
            "    state['called'] = True",
            "window_mock = {'print': on_print}",
            "window_mock.print()",
            "assrt.equal(state['called'], True)",
        ].join("\n"),
        js_checks: ["window_mock.print()"],
    },

    // ── functools ─────────────────────────────────────────────────────────

    {
        name: "functools_reduce",
        description: "functools.reduce applies a function cumulatively over an iterable",
        src: [
            "# globals: assrt",
            "from functools import reduce",
            "assrt.equal(reduce(lambda a, b: a + b, [1, 2, 3, 4]), 10)",
            "assrt.equal(reduce(lambda a, b: a * b, [1, 2, 3, 4]), 24)",
            "assrt.equal(reduce(lambda a, b: a + b, [1, 2, 3], 10), 16)",
            "assrt.equal(reduce(lambda a, b: a + b, [], 0), 0)",
            "assrt.equal(reduce(lambda a, b: a + b, [42]), 42)",
            "assrt.throws(def():",
            "    reduce(lambda a, b: a + b, [])",
            ", /empty/)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_partial",
        description: "functools.partial creates a partial application of a function",
        src: [
            "# globals: assrt",
            "from functools import partial",
            "def add(a, b): return a + b",
            "add5 = partial(add, 5)",
            "assrt.equal(add5(3), 8)",
            "assrt.equal(add5(10), 15)",
            "def power(base, exp): return base ** exp",
            "square = partial(power, exp=2)",
            "assrt.equal(square(4), 16)",
            "assrt.equal(square(5), 25)",
            "assrt.equal(partial(add, 1, 2)(), 3)",
            "p = partial(add, 5)",
            "assrt.equal(p.func, add)",
            "assrt.deepEqual(p.args, [5])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_wraps",
        description: "functools.wraps copies __name__ and __doc__ to wrapper",
        src: [
            "# globals: assrt",
            "from functools import wraps",
            "def my_decorator(f):",
            "    @wraps(f)",
            "    def wrapper(*args):",
            "        return f(*args)",
            "    return wrapper",
            "@my_decorator",
            "def add(a, b):",
            "    return a + b",
            "assrt.equal(add.__name__, 'add')",
            "assrt.equal(add.__wrapped__.name, 'add')",
            "assrt.equal(add(2, 3), 5)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_lru_cache",
        description: "functools.lru_cache memoizes function results",
        src: [
            "# globals: assrt",
            "from functools import lru_cache",
            "call_count = 0",
            "@lru_cache(maxsize=4)",
            "def fib(n):",
            "    nonlocal call_count",
            "    call_count += 1",
            "    if n < 2: return n",
            "    return fib(n - 1) + fib(n - 2)",
            "assrt.equal(fib(5), 5)",
            "assrt.equal(fib(6), 8)",
            "first_count = call_count",
            "fib(5)",
            "assrt.equal(call_count, first_count)",
            "info = fib.cache_info()",
            "assrt.ok(info['hits'] > 0)",
            "assrt.ok(info['maxsize'] is 4)",
            "fib.cache_clear()",
            "call_count = 0",
            "fib(3)",
            "assrt.ok(call_count > 0)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_lru_cache_no_parens",
        description: "@lru_cache without parens uses default maxsize=128",
        src: [
            "# globals: assrt",
            "from functools import lru_cache",
            "call_count = 0",
            "@lru_cache",
            "def double(n):",
            "    nonlocal call_count",
            "    call_count += 1",
            "    return n * 2",
            "assrt.equal(double(5), 10)",
            "assrt.equal(double(5), 10)",
            "assrt.equal(call_count, 1)",
            "assrt.equal(double.cache_info()['maxsize'], 128)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_cache",
        description: "functools.cache is an unbounded memoizing decorator",
        src: [
            "# globals: assrt",
            "from functools import cache",
            "call_count = 0",
            "@cache",
            "def expensive(n):",
            "    nonlocal call_count",
            "    call_count += 1",
            "    return n * n",
            "assrt.equal(expensive(3), 9)",
            "assrt.equal(expensive(3), 9)",
            "assrt.equal(call_count, 1)",
            "assrt.ok(expensive.cache_info()['maxsize'] is None)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_total_ordering",
        description: "functools.total_ordering fills in missing comparison methods",
        src: [
            "# globals: assrt",
            "from functools import total_ordering",
            "@total_ordering",
            "class Version:",
            "    def __init__(self, n):",
            "        self.n = n",
            "    def __eq__(self, other):",
            "        return self.n == other.n",
            "    def __lt__(self, other):",
            "        return self.n < other.n",
            "v1 = Version(1)",
            "v2 = Version(2)",
            "v3 = Version(1)",
            "assrt.equal(v1.__lt__(v2), True)",
            "assrt.equal(v2.__gt__(v1), True)",
            "assrt.equal(v1.__le__(v3), True)",
            "assrt.equal(v2.__ge__(v1), True)",
            "assrt.equal(v1.__eq__(v3), True)",
            "assrt.equal(v1.__gt__(v2), False)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "functools_cmp_to_key",
        description: "functools.cmp_to_key converts a comparison function to a key class",
        src: [
            "# globals: assrt",
            "from functools import cmp_to_key",
            "def cmp_len(a, b): return len(a) - len(b)",
            "Key = cmp_to_key(cmp_len)",
            "k1 = Key('hi')",
            "k2 = Key('hello')",
            "k3 = Key('hi')",
            "assrt.equal(k1.__lt__(k2), True)",
            "assrt.equal(k2.__gt__(k1), True)",
            "assrt.equal(k1.__eq__(k3), True)",
            "assrt.equal(k1.__le__(k3), True)",
            "assrt.equal(k2.__ge__(k1), True)",
            "assrt.equal(k1.__gt__(k2), False)",
        ].join("\n"),
        js_checks: [],
    },

    // ── collections ───────────────────────────────────────────────────────

    {
        name: "collections_namedtuple_basic",
        description: "namedtuple creates a class with named field access and numeric index access",
        src: [
            "# globals: assrt",
            "from collections import namedtuple",
            "Point = namedtuple('Point', ['x', 'y'])",
            "p = Point(3, 4)",
            "assrt.equal(p.x, 3)",
            "assrt.equal(p.y, 4)",
            "assrt.equal(p[0], 3)",
            "assrt.equal(p[1], 4)",
            "assrt.equal(p[-1], 4)",
            "assrt.equal(p.length, 2)",
            "assrt.deepEqual(list(p), [3, 4])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_namedtuple_string_fields",
        description: "namedtuple accepts a space-separated or comma-separated field string",
        src: [
            "# globals: assrt",
            "from collections import namedtuple",
            "Point = namedtuple('Point', 'x y')",
            "p = Point(1, 2)",
            "assrt.equal(p.x, 1)",
            "assrt.equal(p.y, 2)",
            "Color = namedtuple('Color', 'r, g, b')",
            "c = Color(255, 128, 0)",
            "assrt.equal(c.r, 255)",
            "assrt.equal(c.g, 128)",
            "assrt.equal(c.b, 0)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_namedtuple_methods",
        description: "namedtuple _asdict, _replace, _make, _fields work correctly",
        src: [
            "# globals: assrt",
            "from collections import namedtuple",
            "Point = namedtuple('Point', ['x', 'y'])",
            "p = Point(3, 4)",
            "d = p._asdict()",
            "assrt.equal(d['x'], 3)",
            "assrt.equal(d['y'], 4)",
            "p2 = p._replace(x=10)",
            "assrt.equal(p2.x, 10)",
            "assrt.equal(p2.y, 4)",
            "assrt.equal(p.x, 3)",
            "p3 = Point._make([7, 8])",
            "assrt.equal(p3.x, 7)",
            "assrt.equal(p3.y, 8)",
            "assrt.deepEqual(Point._fields, ['x', 'y'])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_namedtuple_repr_eq",
        description: "namedtuple __repr__ and __eq__ work correctly",
        src: [
            "# globals: assrt",
            "from collections import namedtuple",
            "Point = namedtuple('Point', ['x', 'y'])",
            "p1 = Point(1, 2)",
            "p2 = Point(1, 2)",
            "p3 = Point(1, 3)",
            "assrt.equal(p1.__repr__(), 'Point(x=1, y=2)')",
            "assrt.equal(p1.__eq__(p2), True)",
            "assrt.equal(p1.__eq__(p3), False)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_namedtuple_wrong_args",
        description: "namedtuple raises TypeError on wrong number of arguments",
        src: [
            "# globals: assrt",
            "from collections import namedtuple",
            "Point = namedtuple('Point', ['x', 'y'])",
            "assrt.throws(def():",
            "    Point(1)",
            ", /TypeError/)",
            "assrt.throws(def():",
            "    Point(1, 2, 3)",
            ", /TypeError/)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_deque_basic",
        description: "deque append, appendleft, pop, popleft work correctly",
        src: [
            "# globals: assrt",
            "from collections import deque",
            "d = deque([1, 2, 3])",
            "assrt.equal(len(d), 3)",
            "d.append(4)",
            "assrt.equal(len(d), 4)",
            "assrt.equal(d.pop(), 4)",
            "d.appendleft(0)",
            "assrt.equal(d.popleft(), 0)",
            "assrt.equal(len(d), 3)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_deque_maxlen",
        description: "deque with maxlen discards items from opposite end",
        src: [
            "# globals: assrt",
            "from collections import deque",
            "d = deque([1, 2, 3], maxlen=3)",
            "assrt.equal(d.maxlen, 3)",
            "d.append(4)",
            "assrt.equal(len(d), 3)",
            "assrt.equal(list(d)[0], 2)",
            "d.appendleft(0)",
            "assrt.equal(len(d), 3)",
            "assrt.equal(list(d)[2], 3)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_deque_rotate",
        description: "deque rotate and reverse work correctly",
        src: [
            "# globals: assrt",
            "from collections import deque",
            "d = deque([1, 2, 3, 4, 5])",
            "d.rotate(2)",
            "assrt.deepEqual(list(d), [4, 5, 1, 2, 3])",
            "d.rotate(-1)",
            "assrt.deepEqual(list(d), [5, 1, 2, 3, 4])",
            "d.reverse()",
            "assrt.deepEqual(list(d), [4, 3, 2, 1, 5])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_deque_contains_iter",
        description: "deque __contains__, __iter__, count, remove work",
        src: [
            "# globals: assrt",
            "from collections import deque",
            "d = deque([1, 2, 3, 2, 1])",
            "assrt.equal(2 in d, True)",
            "assrt.equal(5 in d, False)",
            "assrt.equal(d.count(2), 2)",
            "assrt.equal(d.count(1), 2)",
            "d.remove(2)",
            "assrt.equal(d.count(2), 1)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_counter_basic",
        description: "Counter counts items from a string or list",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import Counter",
            "c = Counter('aabbcc')",
            "assrt.equal(c['a'], 2)",
            "assrt.equal(c['b'], 2)",
            "assrt.equal(c['c'], 2)",
            "assrt.equal(c['z'], 0)",
            "c2 = Counter([1, 2, 2, 3, 3, 3])",
            "assrt.equal(c2[1], 1)",
            "assrt.equal(c2[2], 2)",
            "assrt.equal(c2[3], 3)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_counter_most_common",
        description: "Counter.most_common returns items sorted by count",
        src: [
            "# globals: assrt",
            "from collections import Counter",
            "c = Counter('aabbbcc')",
            "mc = c.most_common(2)",
            "assrt.equal(mc[0][0], 'b')",
            "assrt.equal(mc[0][1], 3)",
            "assrt.equal(mc[1][1], 2)",
            "assrt.equal(len(c.most_common()), 3)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_counter_update_subtract",
        description: "Counter update and subtract modify counts in-place",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import Counter",
            "c = Counter('aab')",
            "c.update('ab')",
            "assrt.equal(c['a'], 3)",
            "assrt.equal(c['b'], 2)",
            "c.subtract('ab')",
            "assrt.equal(c['a'], 2)",
            "assrt.equal(c['b'], 1)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_counter_arithmetic",
        description: "Counter __add__, __sub__, __or__, __and__ via method calls",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import Counter",
            "c1 = Counter('aab')",
            "c2 = Counter('ab')",
            "c3 = c1.__add__(c2)",
            "assrt.equal(c3['a'], 3)",
            "assrt.equal(c3['b'], 2)",
            "c4 = c1.__sub__(c2)",
            "assrt.equal(c4['a'], 1)",
            "assrt.equal(c4.get('b', 0), 0)",
            "c5 = c1.__or__(c2)",
            "assrt.equal(c5['a'], 2)",
            "assrt.equal(c5['b'], 1)",
            "c6 = c1.__and__(c2)",
            "assrt.equal(c6['a'], 1)",
            "assrt.equal(c6['b'], 1)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_counter_elements",
        description: "Counter.elements yields each element repeated by count",
        src: [
            "# globals: assrt",
            "from collections import Counter",
            "c = Counter({'a': 3, 'b': 1})",
            "elems = list(c.elements())",
            "elems.sort()",
            "assrt.deepEqual(elems, ['a', 'a', 'a', 'b'])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_ordereddict_basic",
        description: "OrderedDict preserves insertion order and supports item access",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import OrderedDict",
            "od = OrderedDict()",
            "od['a'] = 1",
            "od['b'] = 2",
            "od['c'] = 3",
            "assrt.equal(od['a'], 1)",
            "assrt.equal(od['b'], 2)",
            "assrt.deepEqual(od.keys(), ['a', 'b', 'c'])",
            "assrt.deepEqual(od.values(), [1, 2, 3])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_ordereddict_popitem_move",
        description: "OrderedDict popitem and move_to_end work correctly",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import OrderedDict",
            "od = OrderedDict()",
            "od['a'] = 1",
            "od['b'] = 2",
            "od['c'] = 3",
            "item = od.popitem()",
            "assrt.deepEqual(item, ['c', 3])",
            "assrt.equal(len(od), 2)",
            "item2 = od.popitem(last=False)",
            "assrt.deepEqual(item2, ['a', 1])",
            "od2 = OrderedDict()",
            "od2['x'] = 10",
            "od2['y'] = 20",
            "od2['z'] = 30",
            "od2.move_to_end('x')",
            "assrt.deepEqual(od2.keys(), ['y', 'z', 'x'])",
            "od2.move_to_end('x', last=False)",
            "assrt.deepEqual(od2.keys(), ['x', 'y', 'z'])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_ordereddict_eq",
        description: "OrderedDict equality considers insertion order",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import OrderedDict",
            "od1 = OrderedDict()",
            "od1['a'] = 1",
            "od1['b'] = 2",
            "od2 = OrderedDict()",
            "od2['a'] = 1",
            "od2['b'] = 2",
            "od3 = OrderedDict()",
            "od3['b'] = 2",
            "od3['a'] = 1",
            "assrt.equal(od1.__eq__(od2), True)",
            "assrt.equal(od1.__eq__(od3), False)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_defaultdict_basic",
        description: "defaultdict calls factory for missing keys",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import defaultdict",
            "d = defaultdict(list)",
            "d['a'].append(1)",
            "d['a'].append(2)",
            "d['b'].append(3)",
            "assrt.deepEqual(d['a'], [1, 2])",
            "assrt.deepEqual(d['b'], [3])",
            "assrt.equal(len(d), 2)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_defaultdict_int",
        description: "defaultdict with int-returning factory works as a counter",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import defaultdict",
            "d = defaultdict(lambda: 0)",
            "for ch in 'hello':",
            "    d[ch] += 1",
            "assrt.equal(d['l'], 2)",
            "assrt.equal(d['h'], 1)",
            "assrt.equal(d['z'], 0)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_dict_conversion",
        description: "dict() converts Counter, OrderedDict, defaultdict to a plain dict",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import Counter, OrderedDict, defaultdict",
            "c = Counter('aab')",
            "d = dict(c)",
            "assrt.equal(d['a'], 2)",
            "assrt.equal(d['b'], 1)",
            "od = OrderedDict()",
            "od['x'] = 10",
            "od['y'] = 20",
            "d2 = dict(od)",
            "assrt.equal(d2['x'], 10)",
            "assrt.equal(d2['y'], 20)",
            "dd = defaultdict(list)",
            "dd['k'].append(1)",
            "dd['k'].append(2)",
            "d3 = dict(dd)",
            "assrt.deepEqual(d3['k'], [1, 2])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "collections_defaultdict_no_factory",
        description: "defaultdict with no factory raises KeyError on missing key",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem",
            "from collections import defaultdict",
            "d = defaultdict()",
            "assrt.throws(def():",
            "    x = d['missing']",
            ", /KeyError/)",
        ].join("\n"),
        js_checks: [],
    },

    // ── itertools ─────────────────────────────────────────────────────────

    {
        name: "itertools_count",
        description: "itertools.count counts from start by step",
        src: [
            "# globals: assrt",
            "from itertools import count, islice",
            "assrt.deepEqual(list(islice(count(), 5)), [0, 1, 2, 3, 4])",
            "assrt.deepEqual(list(islice(count(10, 2), 4)), [10, 12, 14, 16])",
            "assrt.deepEqual(list(islice(count(-1, -1), 4)), [-1, -2, -3, -4])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_cycle",
        description: "itertools.cycle cycles through an iterable indefinitely",
        src: [
            "# globals: assrt",
            "from itertools import cycle, islice",
            "assrt.deepEqual(list(islice(cycle([1, 2, 3]), 7)), [1, 2, 3, 1, 2, 3, 1])",
            "assrt.deepEqual(list(islice(cycle('ab'), 5)), ['a', 'b', 'a', 'b', 'a'])",
            "assrt.deepEqual(list(islice(cycle([42]), 3)), [42, 42, 42])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_repeat",
        description: "itertools.repeat repeats an element n times or forever",
        src: [
            "# globals: assrt",
            "from itertools import repeat, islice",
            "assrt.deepEqual(list(repeat(5, 3)), [5, 5, 5])",
            "assrt.deepEqual(list(repeat('x', 4)), ['x', 'x', 'x', 'x'])",
            "assrt.deepEqual(list(repeat(0, 0)), [])",
            "assrt.deepEqual(list(islice(repeat(7), 3)), [7, 7, 7])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_accumulate",
        description: "itertools.accumulate returns running totals",
        src: [
            "# globals: assrt",
            "from itertools import accumulate",
            "assrt.deepEqual(list(accumulate([1, 2, 3, 4])), [1, 3, 6, 10])",
            "assrt.deepEqual(list(accumulate([1, 2, 3], lambda a, b: a * b)), [1, 2, 6])",
            "assrt.deepEqual(list(accumulate([1, 2, 3], initial=10)), [10, 11, 13, 16])",
            "assrt.deepEqual(list(accumulate([])), [])",
            "assrt.deepEqual(list(accumulate([], initial=5)), [5])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_chain",
        description: "itertools.chain chains multiple iterables together",
        src: [
            "# globals: assrt",
            "from itertools import chain",
            "assrt.deepEqual(list(chain([1, 2], [3, 4])), [1, 2, 3, 4])",
            "assrt.deepEqual(list(chain([1], [], [2, 3])), [1, 2, 3])",
            "assrt.deepEqual(list(chain()), [])",
            "assrt.deepEqual(list(chain([1, 2])), [1, 2])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_chain_from_iterable",
        description: "itertools.chain.from_iterable chains from a single iterable of iterables",
        src: [
            "# globals: assrt",
            "from itertools import chain",
            "assrt.deepEqual(list(chain.from_iterable([[1, 2], [3, 4]])), [1, 2, 3, 4])",
            "assrt.deepEqual(list(chain.from_iterable([[1], [], [2, 3]])), [1, 2, 3])",
            "assrt.deepEqual(list(chain.from_iterable([])), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_compress",
        description: "itertools.compress filters data by boolean selectors",
        src: [
            "# globals: assrt",
            "from itertools import compress",
            "assrt.deepEqual(list(compress([1, 2, 3, 4, 5], [1, 0, 1, 0, 1])), [1, 3, 5])",
            "assrt.deepEqual(list(compress('ABCDE', [True, False, True, False, True])), ['A', 'C', 'E'])",
            "assrt.deepEqual(list(compress([1, 2, 3], [0, 0, 0])), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_dropwhile",
        description: "itertools.dropwhile drops elements while predicate is true",
        src: [
            "# globals: assrt",
            "from itertools import dropwhile",
            "assrt.deepEqual(list(dropwhile(lambda x: x < 5, [1, 4, 6, 4, 1])), [6, 4, 1])",
            "assrt.deepEqual(list(dropwhile(lambda x: True, [1, 2, 3])), [])",
            "assrt.deepEqual(list(dropwhile(lambda x: False, [1, 2, 3])), [1, 2, 3])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_filterfalse",
        description: "itertools.filterfalse yields elements where predicate is falsy",
        src: [
            "# globals: assrt",
            "from itertools import filterfalse",
            "assrt.deepEqual(list(filterfalse(lambda x: x % 2, range(10))), [0, 2, 4, 6, 8])",
            "assrt.deepEqual(list(filterfalse(lambda x: x, [0, 1, 0, 2, 0])), [0, 0, 0])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_groupby",
        description: "itertools.groupby groups consecutive equal elements",
        src: [
            "# globals: assrt",
            "from itertools import groupby",
            "result = list(groupby([1, 1, 2, 3, 3]))",
            "assrt.equal(result[0][0], 1)",
            "assrt.equal(result[1][0], 2)",
            "assrt.equal(result[2][0], 3)",
            "assrt.deepEqual(list(result[0][1]), [1, 1])",
            "assrt.deepEqual(list(result[1][1]), [2])",
            "assrt.deepEqual(list(result[2][1]), [3, 3])",
            "# With key function",
            "words = ['apple', 'ant', 'bat', 'bee', 'cat']",
            "keyed = [(k, list(g)) for k, g in groupby(words, lambda w: w[0])]",
            "assrt.equal(keyed[0][0], 'a')",
            "assrt.equal(keyed[1][0], 'b')",
            "assrt.equal(keyed[2][0], 'c')",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_islice",
        description: "itertools.islice slices an iterator",
        src: [
            "# globals: assrt",
            "from itertools import islice",
            "assrt.deepEqual(list(islice(range(10), 5)), [0, 1, 2, 3, 4])",
            "assrt.deepEqual(list(islice(range(10), 2, 7)), [2, 3, 4, 5, 6])",
            "assrt.deepEqual(list(islice(range(10), 2, 8, 2)), [2, 4, 6])",
            "assrt.deepEqual(list(islice(range(10), 0)), [])",
            "assrt.deepEqual(list(islice(range(10), None)), [0,1,2,3,4,5,6,7,8,9])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_pairwise",
        description: "itertools.pairwise yields overlapping consecutive pairs",
        src: [
            "# globals: assrt",
            "from itertools import pairwise",
            "assrt.deepEqual(list(pairwise([1, 2, 3, 4])), [[1, 2], [2, 3], [3, 4]])",
            "assrt.deepEqual(list(pairwise([1])), [])",
            "assrt.deepEqual(list(pairwise([])), [])",
            "assrt.deepEqual(list(pairwise('ABCD')), [['A','B'],['B','C'],['C','D']])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_starmap",
        description: "itertools.starmap maps a function with argument unpacking",
        src: [
            "# globals: assrt",
            "from itertools import starmap",
            "assrt.deepEqual(list(starmap(lambda x, y: x * y, [[2, 3], [4, 5], [1, 6]])), [6, 20, 6])",
            "assrt.deepEqual(list(starmap(lambda a, b, c: a + b + c, [[1,2,3],[4,5,6]])), [6, 15])",
            "assrt.deepEqual(list(starmap(pow, [[2, 3], [3, 2]])), [8, 9])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_takewhile",
        description: "itertools.takewhile yields elements while predicate is true",
        src: [
            "# globals: assrt",
            "from itertools import takewhile",
            "assrt.deepEqual(list(takewhile(lambda x: x < 5, [1, 4, 6, 4, 1])), [1, 4])",
            "assrt.deepEqual(list(takewhile(lambda x: True, [1, 2, 3])), [1, 2, 3])",
            "assrt.deepEqual(list(takewhile(lambda x: False, [1, 2, 3])), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_zip_longest",
        description: "itertools.zip_longest zips iterables using a fill value for shorter ones",
        src: [
            "# globals: assrt",
            "from itertools import zip_longest",
            "assrt.deepEqual(list(zip_longest([1, 2, 3], [4, 5])), [[1,4],[2,5],[3,None]])",
            "assrt.deepEqual(list(zip_longest([1, 2], [3, 4, 5], fillvalue=0)), [[1,3],[2,4],[0,5]])",
            "assrt.deepEqual(list(zip_longest([], [1, 2], fillvalue='x')), [['x',1],['x',2]])",
            "assrt.deepEqual(list(zip_longest()), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_product",
        description: "itertools.product returns the cartesian product of iterables",
        src: [
            "# globals: assrt",
            "from itertools import product",
            "assrt.deepEqual(list(product([1,2],[3,4])), [[1,3],[1,4],[2,3],[2,4]])",
            "assrt.deepEqual(list(product([0,1], repeat=2)), [[0,0],[0,1],[1,0],[1,1]])",
            "assrt.deepEqual(list(product([1,2],[3,4],[5,6])), [[1,3,5],[1,3,6],[1,4,5],[1,4,6],[2,3,5],[2,3,6],[2,4,5],[2,4,6]])",
            "assrt.deepEqual(list(product([], [1,2])), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_permutations",
        description: "itertools.permutations returns all r-length permutations",
        src: [
            "# globals: assrt",
            "from itertools import permutations",
            "assrt.deepEqual(list(permutations([1,2,3])), [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]])",
            "assrt.deepEqual(list(permutations([1,2,3], 2)), [[1,2],[1,3],[2,1],[2,3],[3,1],[3,2]])",
            "assrt.deepEqual(list(permutations([1,2], 0)), [[]])",
            "assrt.deepEqual(list(permutations([1], 2)), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_combinations",
        description: "itertools.combinations returns r-length combinations without repeats",
        src: [
            "# globals: assrt",
            "from itertools import combinations",
            "assrt.deepEqual(list(combinations([1,2,3,4], 2)), [[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]])",
            "assrt.deepEqual(list(combinations([1,2,3], 3)), [[1,2,3]])",
            "assrt.deepEqual(list(combinations([1,2,3], 0)), [[]])",
            "assrt.deepEqual(list(combinations([1,2], 3)), [])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "itertools_combinations_with_replacement",
        description: "itertools.combinations_with_replacement returns r-length combinations allowing repeats",
        src: [
            "# globals: assrt",
            "from itertools import combinations_with_replacement",
            "assrt.deepEqual(list(combinations_with_replacement([1,2,3], 2)), [[1,1],[1,2],[1,3],[2,2],[2,3],[3,3]])",
            "assrt.deepEqual(list(combinations_with_replacement([1,2], 3)), [[1,1,1],[1,1,2],[1,2,2],[2,2,2]])",
        ].join("\n"),
        js_checks: [],
    },

    // ── operator overloading ───────────────────────────────────────────────

    {
        name: "operator_overloading_basic",
        description: "Binary +, -, *, / dispatch to __add__, __sub__, __mul__, __truediv__",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class Vec:",
            "    def __init__(self, x, y):",
            "        self.x = x",
            "        self.y = y",
            "    def __add__(self, other):",
            "        return Vec(self.x + other.x, self.y + other.y)",
            "    def __sub__(self, other):",
            "        return Vec(self.x - other.x, self.y - other.y)",
            "    def __mul__(self, scalar):",
            "        return Vec(self.x * scalar, self.y * scalar)",
            "    def __truediv__(self, scalar):",
            "        return Vec(self.x / scalar, self.y / scalar)",
            "a = Vec(3, 4)",
            "b = Vec(1, 2)",
            "c = a + b",
            "assrt.equal(c.x, 4)",
            "assrt.equal(c.y, 6)",
            "d = a - b",
            "assrt.equal(d.x, 2)",
            "assrt.equal(d.y, 2)",
            "e = a * 2",
            "assrt.equal(e.x, 6)",
            "assrt.equal(e.y, 8)",
            "f = a / 2",
            "assrt.equal(f.x, 1.5)",
            "assrt.equal(f.y, 2)",
        ].join("\n"),
        js_checks: [
            "ρσ_op_add(",
            "ρσ_op_sub(",
            "ρσ_op_mul(",
            "ρσ_op_truediv(",
        ],
    },

    {
        name: "operator_overloading_floor_mod_pow",
        description: "// % ** dispatch to __floordiv__, __mod__, __pow__",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class Num:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __floordiv__(self, other):",
            "        return Num(self.v // other.v)",
            "    def __mod__(self, other):",
            "        return Num(self.v % other.v)",
            "    def __pow__(self, other):",
            "        return Num(self.v ** other.v)",
            "a = Num(10)",
            "b = Num(3)",
            "assrt.equal((a // b).v, 3)",
            "assrt.equal((a % b).v, 1)",
            "assrt.equal((a ** b).v, 1000)",
        ].join("\n"),
        js_checks: [
            "ρσ_op_floordiv(",
            "ρσ_op_mod(",
            "ρσ_op_pow(",
        ],
    },

    {
        name: "operator_overloading_bitwise",
        description: "&, |, ^, <<, >> dispatch to bitwise dunder methods",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class Bits:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __and__(self, other):",
            "        return Bits(self.v & other.v)",
            "    def __or__(self, other):",
            "        return Bits(self.v | other.v)",
            "    def __xor__(self, other):",
            "        return Bits(self.v ^ other.v)",
            "    def __lshift__(self, n):",
            "        return Bits(self.v << n)",
            "    def __rshift__(self, n):",
            "        return Bits(self.v >> n)",
            "a = Bits(0b1010)",
            "b = Bits(0b1100)",
            "assrt.equal((a & b).v, 0b1000)",
            "assrt.equal((a | b).v, 0b1110)",
            "assrt.equal((a ^ b).v, 0b0110)",
            "assrt.equal((a << 1).v, 0b10100)",
            "assrt.equal((a >> 1).v, 0b101)",
        ].join("\n"),
        js_checks: [
            "ρσ_op_and(",
            "ρσ_op_or(",
            "ρσ_op_xor(",
            "ρσ_op_lshift(",
            "ρσ_op_rshift(",
        ],
    },

    {
        name: "operator_overloading_unary",
        description: "Unary - + ~ dispatch to __neg__, __pos__, __invert__",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class MyNum:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __neg__(self):",
            "        return MyNum(-self.v)",
            "    def __pos__(self):",
            "        return MyNum(abs(self.v))",
            "    def __invert__(self):",
            "        return MyNum(~self.v)",
            "a = MyNum(5)",
            "assrt.equal((-a).v, -5)",
            "assrt.equal((+a).v, 5)",
            "assrt.equal((~a).v, ~5)",
        ].join("\n"),
        js_checks: [
            "ρσ_op_neg(",
            "ρσ_op_pos(",
            "ρσ_op_invert(",
        ],
    },

    {
        name: "operator_overloading_augmented",
        description: "+= -= *= dispatch to __iadd__, __isub__, __imul__ (or fall back to binary)",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class Counter:",
            "    def __init__(self, n):",
            "        self.n = n",
            "    def __iadd__(self, other):",
            "        self.n = self.n + other",
            "        return self",
            "    def __isub__(self, other):",
            "        self.n = self.n - other",
            "        return self",
            "c = Counter(10)",
            "c += 3",
            "assrt.equal(c.n, 13)",
            "c -= 4",
            "assrt.equal(c.n, 9)",
            // fallback: plain ints have no __iadd__, use native +=
            "x = 5",
            "x += 2",
            "assrt.equal(x, 7)",
        ].join("\n"),
        js_checks: [
            "ρσ_op_iadd(",
            "ρσ_op_isub(",
        ],
    },

    {
        name: "operator_overloading_reflected",
        description: "__radd__ is called when left side has no __add__",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "class MyNum:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __radd__(self, other):",
            "        return MyNum(other + self.v)",
            "n = MyNum(10)",
            "result = 5 + n",
            "assrt.equal(result.v, 15)",
        ].join("\n"),
        js_checks: ["ρσ_op_add("],
    },

    {
        name: "operator_overloading_fallback",
        description: "Without dunder methods, operators fall back to native JS behavior",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators",
            "assrt.equal(2 + 3, 5)",
            "assrt.equal(10 - 4, 6)",
            "assrt.equal(3 * 4, 12)",
            "assrt.equal(10 / 4, 2.5)",
            "assrt.equal(10 // 4, 2)",
            "assrt.equal(10 % 3, 1)",
            "assrt.equal(2 ** 8, 256)",
            "assrt.equal(6 & 3, 2)",
            "assrt.equal(6 | 3, 7)",
            "assrt.equal(6 ^ 3, 5)",
            "assrt.equal(1 << 4, 16)",
            "assrt.equal(32 >> 2, 8)",
        ].join("\n"),
        js_checks: ["ρσ_op_add("],
    },

    {
        name: "operator_overloading_no_flag",
        description: "Without overload_operators flag: + uses ρσ_list_add (not ρσ_op_add), * is native",
        src: [
            "# globals: assrt",
            "assrt.equal(2 + 3, 5)",
            "assrt.equal(3 * 4, 12)",
        ].join("\n"),
        // + should compile to ρσ_list_add (lightweight list/number/string helper)
        js_checks: ["ρσ_list_add(2, 3)", /assrt\.equal\(3 \* 4, 12\)/],
    },

    {
        name: "collections_counter_operator_syntax",
        description: "Counter +, -, |, & work via operator syntax with overload_operators",
        src: [
            "# globals: assrt",
            "from __python__ import overload_getitem, overload_operators",
            "from collections import Counter",
            "c1 = Counter('aab')",
            "c2 = Counter('ab')",
            "c3 = c1 + c2",
            "assrt.equal(c3['a'], 3)",
            "assrt.equal(c3['b'], 2)",
            "c4 = c1 - c2",
            "assrt.equal(c4['a'], 1)",
            "assrt.equal(c4.get('b', 0), 0)",
            "c5 = c1 | c2",
            "assrt.equal(c5['a'], 2)",
            "assrt.equal(c5['b'], 1)",
            "c6 = c1 & c2",
            "assrt.equal(c6['a'], 1)",
            "assrt.equal(c6['b'], 1)",
        ].join("\n"),
        js_checks: ["ρσ_op_add(", "ρσ_op_sub(", "ρσ_op_or(", "ρσ_op_and("],
    },

    // ── nested comprehensions ──────────────────────────────────────────────

    {
        name: "nested_comprehension_list_flatten",
        description: "list comprehension with two for-clauses flattens a 2-D list",
        src: [
            "# globals: assrt",
            "matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]",
            "flat = [x for row in matrix for x in row]",
            "assrt.deepEqual(flat, [1, 2, 3, 4, 5, 6, 7, 8, 9])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_list_filter",
        description: "list comprehension with two for-clauses and if-filter",
        src: [
            "# globals: assrt",
            "pairs = [x for i in range(4) for x in range(i) if x % 2 == 0]",
            "assrt.deepEqual(pairs, [0, 0, 0, 2])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_outer_filter",
        description: "list comprehension with if-filter on the outer for-clause",
        src: [
            "# globals: assrt",
            "result = [x for row in [[1,2],[3,4],[5,6]] if row[0] > 2 for x in row]",
            "assrt.deepEqual(result, [3, 4, 5, 6])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_three_levels",
        description: "list comprehension with three for-clauses (triple nested)",
        src: [
            "# globals: assrt",
            "result = [x for a in [[1,2],[3,4]] for b in [a, a] for x in b if x > 2]",
            "assrt.deepEqual(result, [3, 4, 3, 4])",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_set",
        description: "set comprehension with two for-clauses",
        src: [
            "# globals: assrt",
            "s = {x + y for x in range(3) for y in range(3)}",
            "assrt.equal(sorted(list(s)).toString(), [0,1,2,3,4].toString())",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_dict",
        description: "dict comprehension with two for-clauses",
        src: [
            "# globals: assrt",
            "d = {(i * 10 + j): i * j for i in range(3) for j in range(3) if i != j}",
            "assrt.equal(d[1], 0)",
            "assrt.equal(d[2], 0)",
            "assrt.equal(d[10], 0)",
            "assrt.equal(d[12], 2)",
            "assrt.equal(d[20], 0)",
            "assrt.equal(d[21], 2)",
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "nested_comprehension_range_product",
        description: "list comprehension that builds coordinate pairs (equivalent to itertools.product)",
        src: [
            "# globals: assrt",
            "coords = [[i, j] for i in range(2) for j in range(2)]",
            "assrt.deepEqual(coords, [[0,0],[0,1],[1,0],[1,1]])",
        ].join("\n"),
        js_checks: [],
    },

    // ── python_flags compiler option ──────────────────────────────────────

    {
        name: "python_flag_dict_literals_via_scoped_flags",
        description: "dict_literals flag via scoped_flags produces same JS as from __python__ import",
        run: function() {
            var src_inline = [
                "from __python__ import dict_literals",
                "x = {}",
            ].join("\n");
            var src_flagged = "x = {}";
            var js_inline  = compile(src_inline);
            var js_flagged = compile_with_flags(src_flagged, { dict_literals: true });
            // Both should produce the same dict() call pattern
            assert.ok(js_flagged.indexOf("dict_literal") !== -1 || js_flagged.indexOf("ρσ_dict") !== -1 || js_inline === js_flagged,
                "dict_literals flag should produce same output as inline import; got:\n" + js_flagged);
        },
    },

    {
        name: "python_flag_overload_operators_via_scoped_flags",
        description: "overload_operators flag via scoped_flags produces same JS as from __python__ import",
        run: function() {
            var src_inline  = "from __python__ import overload_operators\nx = a + b";
            var src_flagged = "x = a + b";
            var js_inline   = compile(src_inline);
            var js_flagged  = compile_with_flags(src_flagged, { overload_operators: true });
            assert.equal(js_inline.indexOf("ρσ_op_add") !== -1, true,
                "inline import: expected ρσ_op_add in: " + js_inline);
            assert.equal(js_flagged.indexOf("ρσ_op_add") !== -1, true,
                "scoped_flags: expected ρσ_op_add in: " + js_flagged);
        },
    },

    {
        name: "python_flag_overload_getitem_via_scoped_flags",
        description: "overload_getitem flag via scoped_flags produces same JS as from __python__ import",
        run: function() {
            var src_inline  = "from __python__ import overload_getitem\ny = obj[key]";
            var src_flagged = "y = obj[key]";
            var js_inline   = compile(src_inline);
            var js_flagged  = compile_with_flags(src_flagged, { overload_getitem: true });
            assert.equal(js_inline.indexOf("__getitem__") !== -1, true,
                "inline import: expected __getitem__ in: " + js_inline);
            assert.equal(js_flagged.indexOf("__getitem__") !== -1, true,
                "scoped_flags: expected __getitem__ in: " + js_flagged);
        },
    },

    {
        name: "python_flag_bound_methods_via_scoped_flags",
        description: "bound_methods flag via scoped_flags produces same JS as from __python__ import",
        run: function() {
            var src_inline = [
                "from __python__ import bound_methods",
                "class Foo:",
                "    def bar(self):",
                "        return 1",
            ].join("\n");
            var src_flagged = [
                "class Foo:",
                "    def bar(self):",
                "        return 1",
            ].join("\n");
            var js_inline  = compile(src_inline);
            var js_flagged = compile_with_flags(src_flagged, { bound_methods: true });
            assert.equal(js_inline.indexOf("bind") !== -1, true,
                "inline import: expected bind in: " + js_inline);
            assert.equal(js_flagged.indexOf("bind") !== -1, true,
                "scoped_flags: expected bind in: " + js_flagged);
        },
    },

    {
        name: "python_flag_hash_literals_via_scoped_flags",
        description: "hash_literals flag via scoped_flags produces same JS as from __python__ import",
        run: function() {
            var src_inline  = "from __python__ import hash_literals\ns = {1, 2, 3}";
            var src_flagged = "s = {1, 2, 3}";
            var js_inline   = compile(src_inline);
            var js_flagged  = compile_with_flags(src_flagged, { hash_literals: true });
            // Both should produce a set() call
            assert.equal(js_inline.indexOf("set") !== -1, true,
                "inline import: expected set() in: " + js_inline);
            assert.equal(js_flagged.indexOf("set") !== -1, true,
                "scoped_flags: expected set() in: " + js_flagged);
        },
    },

    {
        name: "python_flag_truthiness_via_scoped_flags",
        description: "truthiness flag via scoped_flags wraps if-conditions with ρσ_bool(; plain code does not",
        run: function() {
            var src = "if x:\n    pass";
            var src_inline  = "from __python__ import truthiness\n" + src;
            var js_inline   = compile(src_inline);
            var js_flagged  = compile_with_flags(src, { truthiness: true });
            var js_plain    = compile(src);
            assert.ok(/if\s*\(ρσ_bool\(/.test(js_inline),
                "inline import: expected if(ρσ_bool( in: " + js_inline);
            assert.ok(/if\s*\(ρσ_bool\(/.test(js_flagged),
                "scoped_flags: expected if(ρσ_bool( in: " + js_flagged);
            assert.ok(!/if\s*\(ρσ_bool\(/.test(js_plain),
                "no flag: if(ρσ_bool( should NOT appear in: " + js_plain);
        },
    },

    {
        name: "python_flag_truthiness_via_python_flags_option",
        description: "truthiness passed as python_flags string to embedded_compiler wraps if-conditions",
        run: function() {
            var make_ec = require("../../tools/embedded_compiler.js");
            var src = "if x:\n    pass";
            var ec_with = make_ec(RapydScript, baselib, null);
            var js_with = ec_with.compile(src, { python_flags: "truthiness" });
            assert.ok(/if\s*\(ρσ_bool\(/.test(js_with),
                "python_flags='truthiness': expected if(ρσ_bool( in: " + js_with);
            var ec_without = make_ec(RapydScript, baselib, null);
            var js_without = ec_without.compile(src, {});
            assert.ok(!/if\s*\(ρσ_bool\(/.test(js_without),
                "no python_flags: if(ρσ_bool( should NOT appear in: " + js_without);
        },
    },

    {
        name: "python_flag_all_flags_runtime",
        description: "overload_operators + overload_getitem work correctly at runtime via scoped_flags",
        src: [
            "# globals: assrt",
            "from __python__ import overload_operators, overload_getitem",
            "class Vec:",
            "    def __init__(self, x):",
            "        self.x = x",
            "    def __add__(self, other):",
            "        return Vec(self.x + other.x)",
            "    def __getitem__(self, key):",
            "        return self.x + key",
            "a = Vec(10)",
            "b = Vec(5)",
            "c = a + b",
            "assrt.equal(c.x, 15)",
            "assrt.equal(a[3], 13)",
        ].join("\n"),
        js_checks: ["ρσ_op_add", "__getitem__"],
    },

    // ── JSX ───────────────────────────────────────────────────────────────

    {
        name: "jsx_basic_element",
        description: "JSX: basic element compiles to React.createElement",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <div>Hello</div>",
        ].join("\n"),
        js_checks: ["React.createElement", '"div"', '"Hello"'],
        skip_run: true,
    },

    {
        name: "jsx_self_closing",
        description: "JSX: self-closing element compiles to React.createElement",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <input type='text' />",
        ].join("\n"),
        js_checks: ["React.createElement", '"input"', "type"],
        skip_run: true,
    },

    {
        name: "jsx_string_attribute",
        description: "JSX: string attributes become object properties",
        src: [
            "from __python__ import jsx",
            "def render():",
            '    return <div className="app" id="root">content</div>',
        ].join("\n"),
        js_checks: ["React.createElement", "className", '"app"', "id", '"root"'],
        skip_run: true,
    },

    {
        name: "jsx_expression_attribute",
        description: "JSX: expression attributes compile Python to JS",
        src: [
            "from __python__ import jsx",
            "def render(isActive):",
            "    return <div disabled={not isActive}>content</div>",
        ].join("\n"),
        js_checks: ["React.createElement", "disabled", "isActive"],
        skip_run: true,
    },

    {
        name: "jsx_boolean_attribute",
        description: "JSX: boolean attributes (no value) compile to true",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <input disabled />",
        ].join("\n"),
        js_checks: ["React.createElement", "disabled", "true"],
        skip_run: true,
    },

    {
        name: "jsx_hyphenated_attribute",
        description: "JSX: hyphenated attribute names are quoted as object keys",
        src: [
            "from __python__ import jsx",
            "def render():",
            '    return <button aria-label="Close">X</button>',
        ].join("\n"),
        js_checks: ["React.createElement", '"aria-label"', '"Close"'],
        skip_run: true,
    },

    {
        name: "jsx_expression_child",
        description: "JSX: expression children compile Python expressions to JS",
        src: [
            "from __python__ import jsx",
            "def render(count):",
            "    return <h1>Count: {count * 2}</h1>",
        ].join("\n"),
        js_checks: ["React.createElement", "count * 2"],
        skip_run: true,
    },

    {
        name: "jsx_nested_elements",
        description: "JSX: nested elements produce nested React.createElement calls",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <div><span>inner</span></div>",
        ].join("\n"),
        js_checks: ["React.createElement", '"div"', '"span"', '"inner"'],
        skip_run: true,
    },

    {
        name: "jsx_fragment",
        description: "JSX: fragments (<>...</>) compile to React.Fragment",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <>",
            "        <span>First</span>",
            "        <span>Second</span>",
            "    </>",
        ].join("\n"),
        js_checks: ["React.createElement", "React.Fragment", '"First"', '"Second"'],
        skip_run: true,
    },

    {
        name: "jsx_component",
        description: "JSX: component tags (uppercase) are passed as references",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <MyComponent name='test' />",
        ].join("\n"),
        js_checks: ["React.createElement", "MyComponent", "name"],
        skip_run: true,
    },

    {
        name: "jsx_dot_component",
        description: "JSX: dot-notation component tags compile as member expressions",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <Router.Route path='/home' />",
        ].join("\n"),
        js_checks: ["React.createElement", "Router.Route"],
        skip_run: true,
    },

    {
        name: "jsx_spread_attr",
        description: "JSX: spread attributes {...props} compile to object spread",
        src: [
            "from __python__ import jsx",
            "def render(props):",
            "    return <div {...props}>content</div>",
        ].join("\n"),
        js_checks: ["React.createElement", "...props"],
        skip_run: true,
    },

    {
        name: "jsx_multiline",
        description: "JSX: multi-line JSX compiles to nested React.createElement calls",
        src: [
            "from __python__ import jsx",
            "def render(title, body):",
            "    return (",
            "        <article>",
            "            <h2>{title}</h2>",
            "            <p>{body}</p>",
            "        </article>",
            "    )",
        ].join("\n"),
        js_checks: ["React.createElement", '"article"', '"h2"', '"p"', "title", "body"],
        skip_run: true,
    },

    {
        name: "jsx_no_jsx_without_flag",
        description: "JSX: < in expression is a comparison without the jsx flag",
        src: [
            "# globals: assrt",
            "x = 5",
            "assrt.equal(x < 10, True)",
        ].join("\n"),
        js_checks: ["x < 10"],
    },

    // ── JSX whitespace and HTML entity handling ──────────────────────────────

    {
        name: "jsx_nbsp_entity",
        description: "JSX: &nbsp; is decoded to a non-breaking space (U+00A0) in the JS string",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>Hello&nbsp;World</p>",
        ].join("\n"),
        js_checks: [/Hello[\u00a0]World/],
        skip_run: true,
    },

    {
        name: "jsx_amp_entity",
        description: "JSX: &amp; is decoded to & in the JS string",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>a &amp; b</p>",
        ].join("\n"),
        js_checks: [/"a & b"/],
        skip_run: true,
    },

    {
        name: "jsx_lt_gt_entities",
        description: "JSX: &lt; and &gt; are decoded to < and > in the JS string",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>1 &lt; 2 &gt; 0</p>",
        ].join("\n"),
        js_checks: [/"1 < 2 > 0"/],
        skip_run: true,
    },

    {
        name: "jsx_quot_entity",
        description: "JSX: &quot; is decoded to \" in the JS string",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>&quot;quoted&quot;</p>",
        ].join("\n"),
        js_checks: [/null, "\\\"quoted\\\""\)/],
        skip_run: true,
    },

    {
        name: "jsx_numeric_entity_decimal",
        description: "JSX: decimal numeric entity &#160; is decoded to U+00A0",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>a&#160;b</p>",
        ].join("\n"),
        js_checks: [/a[\u00a0]b/],
        skip_run: true,
    },

    {
        name: "jsx_numeric_entity_hex",
        description: "JSX: hex numeric entity &#x00A0; is decoded to U+00A0",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>a&#x00A0;b</p>",
        ].join("\n"),
        js_checks: [/a[\u00a0]b/],
        skip_run: true,
    },

    {
        name: "jsx_no_double_decode",
        description: "JSX: &amp;lt; decodes to &lt; (not <), entities decoded in one pass",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>&amp;lt;</p>",
        ].join("\n"),
        js_checks: [/"&lt;"/],
        skip_run: true,
    },

    {
        name: "jsx_inline_spaces_preserved",
        description: "JSX: spaces within inline text are preserved",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <p>Hello World</p>",
        ].join("\n"),
        js_checks: [/"Hello World"/],
        skip_run: true,
    },

    {
        name: "jsx_multiline_whitespace_collapsed",
        description: "JSX: whitespace-only lines between tags are dropped; text lines are preserved",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return (",
            "        <p>",
            "            Hello World",
            "        </p>",
            "    )",
        ].join("\n"),
        js_checks: [/"Hello World"/],
        skip_run: true,
    },

    {
        name: "jsx_single_space_same_line",
        description: "JSX: a single space on its own between same-line tags is preserved",
        src: [
            "from __python__ import jsx",
            "def render():",
            "    return <span>a </span>",
        ].join("\n"),
        js_checks: [/"a "/],
        skip_run: true,
    },

    // ── React standard library ───────────────────────────────────────────────

    {
        name: "react_import_usestate",
        description: "react lib: from react import useState compiles to React.useState reference",
        src: [
            "from react import useState",
            "def Counter():",
            "    count, setCount = useState(0)",
            "    return count",
        ].join("\n"),
        js_checks: ["React.useState", "useState"],
        skip_run: true,
    },

    {
        name: "react_import_multiple_hooks",
        description: "react lib: multiple hook imports each resolve to React.*",
        src: [
            "from react import useState, useEffect, useMemo, useRef, useCallback",
            "def Component(items):",
            "    count, setCount = useState(0)",
            "    ref = useRef(None)",
            "    result = useMemo(def(): return items.length;, [items])",
            "    def cb():",
            "        setCount(count + 1)",
            "    fn = useCallback(cb, [count])",
            "    useEffect(def(): pass;, [])",
            "    return count",
        ].join("\n"),
        js_checks: [
            "React.useState", "React.useEffect", "React.useMemo",
            "React.useRef", "React.useCallback",
        ],
        skip_run: true,
    },

    {
        name: "react_jsx_functional_component",
        description: "react lib: functional component with useState and JSX",
        src: [
            "from __python__ import jsx",
            "from react import useState",
            "def Counter():",
            "    count, setCount = useState(0)",
            "    def increment():",
            "        setCount(count + 1)",
            "    return <button onClick={increment}>{count}</button>",
        ].join("\n"),
        js_checks: [
            "React.useState", "React.createElement",
            '"button"', "increment", "count",
        ],
        skip_run: true,
    },

    {
        name: "react_use_effect",
        description: "react lib: useEffect with deps array compiles correctly",
        src: [
            "from react import useState, useEffect",
            "def Timer():",
            "    count, setCount = useState(0)",
            "    def tick():",
            "        setCount(count + 1)",
            "    useEffect(tick, [count])",
            "    return count",
        ].join("\n"),
        js_checks: ["React.useState", "React.useEffect", "tick", "count"],
        skip_run: true,
    },

    {
        name: "react_use_context",
        description: "react lib: createContext and useContext compile correctly",
        src: [
            "from react import createContext, useContext",
            "ThemeContext = createContext('light')",
            "def ThemedButton():",
            "    theme = useContext(ThemeContext)",
            "    return theme",
        ].join("\n"),
        js_checks: [
            "React.createContext", "React.useContext",
            "ThemeContext", "light",
        ],
        skip_run: true,
    },

    {
        name: "react_use_reducer",
        description: "react lib: useReducer with action dispatch compiles correctly",
        src: [
            "from react import useReducer",
            "def reducer(state, action):",
            "    if action.type == 'increment':",
            "        return state + 1",
            "    return state",
            "def Counter():",
            "    state, dispatch = useReducer(reducer, 0)",
            "    return state",
        ].join("\n"),
        js_checks: ["React.useReducer", "reducer", "dispatch"],
        skip_run: true,
    },

    {
        name: "react_use_ref",
        description: "react lib: useRef for DOM reference compiles correctly",
        src: [
            "from __python__ import jsx",
            "from react import useRef",
            "def FocusInput():",
            "    inputRef = useRef(None)",
            "    def handleClick():",
            "        inputRef.current.focus()",
            "    return <input ref={inputRef} />",
        ].join("\n"),
        js_checks: [
            "React.useRef", "inputRef", "current",
            "React.createElement", '"input"',
        ],
        skip_run: true,
    },

    {
        name: "react_memo_wrapper",
        description: "react lib: memo() wraps a component to prevent re-renders",
        src: [
            "from __python__ import jsx",
            "from react import memo",
            "def Row(props):",
            "    return <div>{props.label}</div>",
            "MemoRow = memo(Row)",
        ].join("\n"),
        js_checks: ["React.memo", "Row", "MemoRow"],
        skip_run: true,
    },

    {
        name: "react_create_context",
        description: "react lib: createContext creates a context object",
        src: [
            "from react import createContext",
            "UserContext = createContext(None)",
        ].join("\n"),
        js_checks: ["React.createContext", "UserContext"],
        skip_run: true,
    },

    {
        name: "react_forward_ref",
        description: "react lib: forwardRef passes ref to child component",
        src: [
            "from __python__ import jsx",
            "from react import forwardRef",
            "def FancyInput(props, ref):",
            "    return <input ref={ref} />",
            "FancyInputWithRef = forwardRef(FancyInput)",
        ].join("\n"),
        js_checks: ["React.forwardRef", "FancyInput", "FancyInputWithRef"],
        skip_run: true,
    },

    {
        name: "react_fragment_import",
        description: "react lib: Fragment import can be used as a component tag",
        src: [
            "from __python__ import jsx",
            "from react import Fragment",
            "def TwoItems():",
            "    return <Fragment><span>A</span><span>B</span></Fragment>",
        ].join("\n"),
        js_checks: ["React.Fragment", "React.createElement", '"span"'],
        skip_run: true,
    },

    {
        name: "react_use_id",
        description: "react lib: useId (React 18) compiles correctly",
        src: [
            "from react import useId",
            "def LabeledInput():",
            "    id = useId()",
            "    return id",
        ].join("\n"),
        js_checks: ["React.useId", "useId"],
        skip_run: true,
    },

    {
        name: "react_use_transition",
        description: "react lib: useTransition (React 18) compiles correctly",
        src: [
            "from react import useState, useTransition",
            "def SearchInput():",
            "    isPending, startTransition = useTransition()",
            "    query, setQuery = useState('')",
            "    def handleChange(e):",
            "        startTransition(def(): setQuery(e.target.value);)",
            "    return isPending",
        ].join("\n"),
        js_checks: ["React.useTransition", "React.useState", "startTransition"],
        skip_run: true,
    },

    {
        name: "react_class_component",
        description: "react lib: class component importing Component base class",
        src: [
            "from __python__ import jsx",
            "from react import Component",
            "class Greeter(Component):",
            "    def render(self):",
            "        return <h1>Hello, {self.props.name}</h1>",
        ].join("\n"),
        js_checks: [
            "React.Component", "Greeter", "render",
            "React.createElement", '"h1"',
        ],
        skip_run: true,
    },

    {
        name: "react_jsx_list_rendering",
        description: "react lib: list comprehension renders JSX list of elements",
        src: [
            "from __python__ import jsx",
            "from react import useState",
            "def TodoList():",
            "    items, setItems = useState(['a', 'b', 'c'])",
            "    return (",
            "        <ul>",
            "            {[<li key={i}>{item}</li> for i, item in enumerate(items)]}",
            "        </ul>",
            "    )",
        ].join("\n"),
        js_checks: [
            "React.useState", "React.createElement",
            '"ul"', '"li"', "enumerate",
        ],
        skip_run: true,
    },

    // Binding-pattern tests: verify that imported names are wired to React.* in
    // the compiled output via both the module export and the var binding.

    {
        name: "react_binding_memo",
        description: "react lib: memo is exported from module as React.memo and bound via var",
        src: [
            "from react import memo",
            "def A(): return 1",
            "B = memo(A)",
        ].join("\n"),
        // module init: ρσ_modules.react.memo = <something>; and React.memo assignment
        // import binding: var memo = ρσ_modules.react.memo
        js_checks: [
            "React.memo",
            "ρσ_modules.react.memo",
            "var memo",
            "memo(A)",
        ],
        skip_run: true,
    },

    {
        name: "react_binding_usestate",
        description: "react lib: useState is exported from module as React.useState and bound via var",
        src: [
            "from react import useState",
            "def C():",
            "    n, setN = useState(0)",
            "    return n",
        ].join("\n"),
        js_checks: [
            "React.useState",
            "ρσ_modules.react.useState",
            "var useState",
            "useState(0)",
        ],
        skip_run: true,
    },

    {
        name: "react_binding_useeffect",
        description: "react lib: useEffect is exported from module as React.useEffect and bound via var",
        src: [
            "from react import useEffect",
            "def D():",
            "    def run(): pass",
            "    useEffect(run, [])",
        ].join("\n"),
        js_checks: [
            "React.useEffect",
            "ρσ_modules.react.useEffect",
            "var useEffect",
            "useEffect(run",
        ],
        skip_run: true,
    },

    {
        name: "react_binding_forwardref",
        description: "react lib: forwardRef is exported from module as React.forwardRef and bound via var",
        src: [
            "from __python__ import jsx",
            "from react import forwardRef",
            "FancyInput = forwardRef(def(props, ref): return <input ref={ref}/>;)",
        ].join("\n"),
        js_checks: [
            "React.forwardRef",
            "ρσ_modules.react.forwardRef",
            "var forwardRef",
            "forwardRef(",
        ],
        skip_run: true,
    },

    {
        name: "react_binding_all_hooks",
        description: "react lib: every imported hook produces a var binding to ρσ_modules.react.*",
        src: [
            "from react import useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useLayoutEffect, useId",
        ].join("\n"),
        js_checks: [
            "React.useState", "React.useEffect", "React.useContext",
            "React.useReducer", "React.useCallback", "React.useMemo",
            "React.useRef", "React.useLayoutEffect", "React.useId",
            "var useState", "var useEffect", "var useContext",
            "var useReducer", "var useCallback", "var useMemo",
            "var useRef", "var useLayoutEffect", "var useId",
        ],
        skip_run: true,
    },

    {
        name: "react_counter_example",
        description: "react lib: full counter component from TODO example compiles correctly",
        src: [
            "from __python__ import jsx",
            "from react import useState, useEffect, memo",
            "def Counter(props):",
            "    count, setCount = useState(props.initial or 0)",
            "    def increment():",
            "        setCount(count + 1)",
            "    def decrement():",
            "        setCount(count - 1)",
            "    def log_change():",
            "        pass",
            "    useEffect(log_change, [count])",
            "    return (",
            "        <div className='counter'>",
            "            <h2>{props.title}</h2>",
            "            <button onClick={decrement}>-</button>",
            "            <span>{count}</span>",
            "            <button onClick={increment}>+</button>",
            "        </div>",
            "    )",
            "Counter = memo(Counter)",
        ].join("\n"),
        js_checks: [
            // hooks are wired correctly
            "React.useState", "React.useEffect", "React.memo",
            "var useState", "var useEffect", "var memo",
            // JSX output
            "React.createElement", '"div"', '"button"', '"span"', '"h2"',
            // logic
            "increment", "decrement", "count",
        ],
        skip_run: true,
    },

    {
        name: "react_lazy_suspense",
        description: "react lib: lazy and Suspense compile correctly",
        src: [
            "from __python__ import jsx",
            "from react import lazy, Suspense",
            "def Fallback():",
            "    return <div>Loading...</div>",
            "def App():",
            "    return <Suspense fallback={<Fallback/>}></Suspense>",
        ].join("\n"),
        js_checks: [
            "React.lazy", "React.Suspense",
            "var lazy", "var Suspense",
            "React.createElement",
        ],
        skip_run: true,
    },

    {
        name: "react_use_callback_deps",
        description: "react lib: useCallback dependency array passes through correctly",
        src: [
            "from react import useState, useCallback",
            "def Form():",
            "    value, setValue = useState('')",
            "    def onChange(e):",
            "        setValue(e.target.value)",
            "    handler = useCallback(onChange, [value])",
            "    return handler",
        ].join("\n"),
        js_checks: [
            "React.useCallback", "React.useState",
            "var useCallback", "var useState",
            "useCallback(onChange",
        ],
        skip_run: true,
    },

    {
        name: "react_use_memo_deps",
        description: "react lib: useMemo dependency array passes through correctly",
        src: [
            "from react import useState, useMemo",
            "def Expensive(items):",
            "    count, setCount = useState(0)",
            "    def compute(): return items.length * count",
            "    result = useMemo(compute, [items, count])",
            "    return result",
        ].join("\n"),
        js_checks: [
            "React.useMemo", "React.useState",
            "var useMemo", "var useState",
            "useMemo(compute",
        ],
        skip_run: true,
    },

    // ── JSON support ─────────────────────────────────────────────────────────

    {
        name: "json_stringify_dict",
        description: "JSON.stringify on a Python dict produces valid JSON",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals",
            "d = {'key': 'value', 'num': 42}",
            "s = JSON.stringify(d)",
            "assrt.equal(jstype(s), 'string')",
            "parsed = JSON.parse(s)",
            "assrt.ok(isinstance(parsed, dict))",
            "assrt.equal(parsed.get('key'), 'value')",
            "assrt.equal(parsed.get('num'), 42)",
        ].join("\n"),
    },

    {
        name: "json_parse_returns_dict",
        description: "JSON.parse returns ρσ_dict instances for objects",
        src: [
            "# globals: assrt",
            "parsed = JSON.parse('{\"a\": 1, \"b\": 2}')",
            "assrt.ok(isinstance(parsed, dict))",
            "assrt.equal(parsed.get('a'), 1)",
            "assrt.equal(parsed.get('b'), 2)",
            "assrt.equal(len(parsed), 2)",
        ].join("\n"),
        // JSON.parse in RapydScript must compile to ρσ_json_parse (not the native global)
        js_checks: ["ρσ_json_parse"],
    },

    {
        name: "json_stringify_nested_dict",
        description: "JSON.stringify and parse handle nested dicts correctly",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals",
            "outer = {'inner': {'x': 1, 'y': 2}}",
            "s = JSON.stringify(outer)",
            "parsed = JSON.parse(s)",
            "assrt.ok(isinstance(parsed, dict))",
            "inner = parsed.get('inner')",
            "assrt.ok(isinstance(inner, dict))",
            "assrt.equal(inner.get('x'), 1)",
            "assrt.equal(inner.get('y'), 2)",
        ].join("\n"),
    },

    {
        name: "json_dict_with_list_values",
        description: "JSON.stringify/parse handles dicts with list values",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals",
            "d = {'items': [1, 2, 3], 'name': 'test'}",
            "s = JSON.stringify(d)",
            "parsed = JSON.parse(s)",
            "assrt.ok(isinstance(parsed, dict))",
            "items = parsed.get('items')",
            "assrt.ok(Array.isArray(items))",
            "assrt.equal(items[0], 1)",
            "assrt.equal(items[2], 3)",
        ].join("\n"),
    },

    {
        name: "json_dict_null_bool_values",
        description: "JSON.stringify/parse handles None, True, False values",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals",
            "d = {'a': None, 'b': True, 'c': False}",
            "s = JSON.stringify(d)",
            "parsed = JSON.parse(s)",
            "assrt.ok(isinstance(parsed, dict))",
            "assrt.equal(parsed.get('a'), None)",
            "assrt.equal(parsed.get('b'), True)",
            "assrt.equal(parsed.get('c'), False)",
        ].join("\n"),
    },

    {
        name: "json_parse_array_of_dicts",
        description: "JSON.parse converts objects inside arrays to dicts",
        src: [
            "# globals: assrt",
            "arr = JSON.parse('[{\"x\": 1}, {\"y\": 2}]')",
            "assrt.ok(Array.isArray(arr))",
            "assrt.ok(isinstance(arr[0], dict))",
            "assrt.ok(isinstance(arr[1], dict))",
            "assrt.equal(arr[0].get('x'), 1)",
            "assrt.equal(arr[1].get('y'), 2)",
        ].join("\n"),
    },

    {
        name: "json_roundtrip_dict_comprehension",
        description: "JSON round-trip works with dict comprehensions",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals",
            "d = {str(i): i * i for i in range(4)}",
            "s = JSON.stringify(d)",
            "parsed = JSON.parse(s)",
            "assrt.ok(isinstance(parsed, dict))",
            "assrt.equal(parsed.get('0'), 0)",
            "assrt.equal(parsed.get('2'), 4)",
            "assrt.equal(parsed.get('3'), 9)",
        ].join("\n"),
    },

    // ── __hash__ dunder ───────────────────────────────────────────────────

    {
        name: "hash_basic",
        description: "def __hash__ in a class is dispatched by hash() builtin",
        src: [
            "# globals: assrt",
            "class Point:",
            "    def __init__(self, x, y):",
            "        self.x = x",
            "        self.y = y",
            "    def __hash__(self):",
            "        return hash(self.x) ^ hash(self.y)",
            "p1 = Point(1, 2)",
            "p2 = Point(1, 2)",
            "p3 = Point(3, 4)",
            "assrt.equal(hash(p1), hash(p2))",
            "assrt.notEqual(hash(p1), hash(p3))",
        ].join("\n"),
        js_checks: ["Point.prototype.__hash__"],
    },

    {
        name: "hash_identity",
        description: "class without __hash__ gets a stable identity hash",
        src: [
            "# globals: assrt",
            "class Foo:",
            "    def __init__(self, x):",
            "        self.x = x",
            "a = Foo(1)",
            "b = Foo(1)",
            "h_a1 = hash(a)",
            "h_a2 = hash(a)",
            "h_b  = hash(b)",
            "assrt.equal(h_a1, h_a2)",
            "assrt.notEqual(h_a1, h_b)",
        ].join("\n"),
    },

    {
        name: "hash_unhashable_via_eq",
        description: "class that defines __eq__ without __hash__ becomes unhashable (TypeError)",
        src: [
            "# globals: assrt",
            "class Bar:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __eq__(self, other):",
            "        return self.v == other.v",
            "b = Bar(1)",
            "caught = False",
            "try:",
            "    hash(b)",
            "except TypeError:",
            "    caught = True",
            "assrt.ok(caught, 'hash(Bar()) should raise TypeError')",
        ].join("\n"),
        js_checks: [".prototype.__hash__ = null"],
    },

    {
        name: "hash_explicit_eq_and_hash",
        description: "class that defines both __eq__ and __hash__ is hashable",
        src: [
            "# globals: assrt",
            "class Key:",
            "    def __init__(self, v):",
            "        self.v = v",
            "    def __eq__(self, other):",
            "        return self.v == other.v",
            "    def __hash__(self):",
            "        return hash(self.v)",
            "k1 = Key('x')",
            "k2 = Key('x')",
            "assrt.equal(hash(k1), hash(k2))",
        ].join("\n"),
        js_checks: ["Key.prototype.__hash__"],
    },

    {
        name: "hash_primitives",
        description: "hash() of primitives follows Python semantics",
        src: [
            "# globals: assrt",
            "assrt.equal(hash(None), 0)",
            "assrt.equal(hash(True), 1)",
            "assrt.equal(hash(False), 0)",
            "assrt.equal(hash(42), 42)",
            "assrt.equal(hash(42.0), 42)",
            "assrt.equal(jstype(hash('hello')), 'number')",
            "assrt.equal(hash('hello'), hash('hello'))",
        ].join("\n"),
    },

    // ── __getattr__ / __setattr__ / __delattr__ / __getattribute__ ────────────

    {
        name: "getattr_dunder_basic",
        description: "__getattr__ is called as fallback when an attribute is not found",
        src: [
            "# globals: assrt",
            "class Bag:",
            "    def __getattr__(self, name):",
            "        return 'missing_' + name",
            "b = Bag()",
            "# Missing attributes fall back to __getattr__.",
            "assrt.equal(b.foo, 'missing_foo')",
            "assrt.equal(b.bar, 'missing_bar')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler"],
    },

    {
        name: "setattr_dunder_basic",
        description: "__setattr__ intercepts all attribute assignments including those in __init__",
        src: [
            "# globals: assrt",
            "class Recorder:",
            "    def __init__(self):",
            "        # Each assignment goes through __setattr__.",
            "        self.x = 10",
            "    def __setattr__(self, name, value):",
            "        # Store doubled numeric values via bypass.",
            "        if jstype(value) is 'number':",
            "            object.__setattr__(self, name, value * 2)",
            "        else:",
            "            object.__setattr__(self, name, value)",
            "r = Recorder()",
            "# x was doubled by __setattr__ during __init__.",
            "assrt.equal(r.x, 20, 'x doubled by __setattr__ in __init__')",
            "r.y = 7",
            "assrt.equal(r.y, 14, 'y doubled by __setattr__')",
            "r.name = 'hello'",
            "assrt.equal(r.name, 'hello', 'string stored as-is')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler", "ρσ_object_setattr"],
    },

    {
        name: "delattr_dunder_basic",
        description: "__delattr__ intercepts del obj.attr",
        src: [
            "# globals: assrt",
            "class Guarded:",
            "    def __init__(self):",
            "        # Track deleted names.",
            "        object.__setattr__(self, 'deleted', [])",
            "    def __setattr__(self, name, value):",
            "        object.__setattr__(self, name, value)",
            "    def __delattr__(self, name):",
            "        self.deleted.append(name)",
            "        object.__delattr__(self, name)",
            "g = Guarded()",
            "g.x = 5",
            "assrt.equal(g.x, 5)",
            "del g.x",
            "assrt.ok(g.deleted.indexOf('x') >= 0, 'x recorded as deleted by __delattr__')",
            "# After deletion the attribute is gone (returns undefined).",
            "assrt.equal(g.x, undefined, 'x is gone after del')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler"],
    },

    {
        name: "getattribute_dunder_basic",
        description: "__getattribute__ overrides ALL attribute access",
        src: [
            "# globals: assrt",
            "class AllCaps:",
            "    def __init__(self):",
            "        object.__setattr__(self, 'value', 'hello')",
            "    def __getattribute__(self, name):",
            "        # Use object.__getattribute__ (compiles to ρσ_object_getattr) to bypass the hook.",
            "        raw = object.__getattribute__(self, name)",
            "        if jstype(raw) is 'string':",
            "            return raw.toUpperCase()",
            "        return raw",
            "a = AllCaps()",
            "assrt.equal(a.value, 'HELLO', '__getattribute__ transforms string values')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler"],
    },

    {
        name: "getattribute_with_getattr_fallback",
        description: "__getattribute__ raising AttributeError falls back to __getattr__",
        src: [
            "# globals: assrt",
            "class Fallback:",
            "    def __init__(self):",
            "        object.__setattr__(self, 'real', 1)",
            "    def __getattribute__(self, name):",
            "        if name is 'real':",
            "            return object.__getattribute__(self, name)",
            "        raise AttributeError(name)",
            "    def __getattr__(self, name):",
            "        return 'fallback'",
            "f = Fallback()",
            "assrt.equal(f.real, 1, 'real attribute via __getattribute__')",
            "assrt.equal(f.anything, 'fallback', 'unknown attribute via __getattr__ fallback')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler"],
    },

    {
        name: "setattr_object_setattr_bypass",
        description: "object.__setattr__ bypasses __setattr__ to avoid infinite recursion",
        src: [
            "# globals: assrt",
            "class Doubler:",
            "    def __init__(self):",
            "        self.x = 5",
            "    def __setattr__(self, name, value):",
            "        # Double all numeric values, then store directly.",
            "        if jstype(value) is 'number':",
            "            object.__setattr__(self, name, value * 2)",
            "        else:",
            "            object.__setattr__(self, name, value)",
            "d = Doubler()",
            "assrt.equal(d.x, 10, 'value doubled by __setattr__')",
            "d.y = 3",
            "assrt.equal(d.y, 6)",
            "d.label = 'alice'",
            "assrt.equal(d.label, 'alice', 'string value stored as-is')",
        ].join("\n"),
    },

    {
        name: "attr_dunders_inheritance",
        description: "__getattr__ is inherited by subclasses",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def __getattr__(self, name):",
            "        return 'from_base'",
            "class Child(Base):",
            "    def __init__(self):",
            "        self.own = 'child_own'",
            "c = Child()",
            "assrt.equal(c.own, 'child_own', 'own attribute still direct')",
            "assrt.equal(c.missing, 'from_base', '__getattr__ inherited from Base')",
        ].join("\n"),
        js_checks: ["ρσ_attr_proxy_handler"],
    },

    {
        name: "attr_dunders_getattr_with_setattr",
        description: "__setattr__ stores via bypass, __getattr__ reads back",
        src: [
            "# globals: assrt",
            "class AttrStore:",
            "    def __init__(self):",
            "        object.__setattr__(self, '_store', {})",
            "    def __setattr__(self, name, value):",
            "        self._store[name] = value",
            "    def __getattr__(self, name):",
            "        if name in self._store:",
            "            return self._store[name]",
            "        raise AttributeError(name)",
            "d = AttrStore()",
            "d.x = 1",
            "d.y = 2",
            "assrt.equal(d.x, 1)",
            "assrt.equal(d.y, 2)",
            "caught = False",
            "try:",
            "    _ = d.z",
            "except AttributeError:",
            "    caught = True",
            "assrt.ok(caught, 'missing attr raises AttributeError')",
        ].join("\n"),
    },

    // ── __class_getitem__ ─────────────────────────────────────────────────

    {
        name: "class_getitem_basic",
        description: "Class[item] calls __class_getitem__(cls, item) and returns the result",
        src: [
            "# globals: assrt",
            "class Box:",
            "    def __class_getitem__(cls, item):",
            "        return cls.__name__ + '[' + str(item) + ']'",
            "assrt.equal(Box[42], 'Box[42]')",
            "assrt.equal(Box['x'], 'Box[x]')",
        ].join("\n"),
        js_checks: ["Box.__class_getitem__("],
    },

    {
        name: "class_getitem_cls_is_class",
        description: "__class_getitem__ receives the class as cls; can return it",
        src: [
            "# globals: assrt",
            "class Stack:",
            "    def __class_getitem__(cls, item):",
            "        return cls",
            "assrt.ok(Stack[int] is Stack)",
            "assrt.ok(Stack[str] is Stack)",
        ].join("\n"),
    },

    {
        name: "class_getitem_subclass_inherits",
        description: "subclass without __class_getitem__ inherits it from parent; cls is the subclass",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def __class_getitem__(cls, item):",
            "        return cls.__name__ + '<' + str(item) + '>'",
            "class Child(Base):",
            "    pass",
            "assrt.equal(Base[42], 'Base<42>')",
            "assrt.equal(Child[42], 'Child<42>')",
        ].join("\n"),
    },

    {
        name: "class_getitem_subclass_overrides",
        description: "subclass can override __class_getitem__",
        src: [
            "# globals: assrt",
            "class Base:",
            "    def __class_getitem__(cls, item):",
            "        return 'base'",
            "class Child(Base):",
            "    def __class_getitem__(cls, item):",
            "        return 'child'",
            "assrt.equal(Base[1], 'base')",
            "assrt.equal(Child[1], 'child')",
        ].join("\n"),
    },

    {
        name: "class_getitem_classvar",
        description: "__class_getitem__ can access class variables via cls",
        src: [
            "# globals: assrt",
            "class Tagged:",
            "    prefix = 'Tag'",
            "    def __class_getitem__(cls, item):",
            "        return cls.prefix + ':' + str(item)",
            "assrt.equal(Tagged['int'], 'Tag:int')",
        ].join("\n"),
    },

    {
        name: "class_getitem_builtin_name",
        description: "Built-in types int/str/float/bool have .__name__ so they work as __class_getitem__ arguments",
        src: [
            "# globals: assrt",
            "class TypedList:",
            "    prefix = 'TypedList'",
            "    def __class_getitem__(cls, item):",
            "        return cls.prefix + '[' + item.__name__ + ']'",
            "assrt.equal(TypedList[int], 'TypedList[int]')",
            "assrt.equal(TypedList[str], 'TypedList[str]')",
            "assrt.equal(TypedList[float], 'TypedList[float]')",
            "assrt.equal(TypedList[bool], 'TypedList[bool]')",
        ].join("\n"),
    },

    // ── __init_subclass__ hook ────────────────────────────────────────────

    {
        name: "init_subclass_basic",
        description: "__init_subclass__ is called when a subclass is created",
        src: [
            "# globals: assrt",
            "log = []",
            "class Base:",
            "    def __init_subclass__(cls, **kwargs):",
            "        log.append(cls.__name__)",
            "class Child(Base):",
            "    pass",
            "class GrandChild(Child):",
            "    pass",
            "assrt.deepEqual(log, ['Child', 'GrandChild'])",
        ].join("\n"),
        js_checks: ['.__init_subclass__.call(Child)', '.__init_subclass__.call(GrandChild)'],
    },

    {
        name: "init_subclass_cls_is_subclass",
        description: "__init_subclass__ receives the subclass as cls",
        src: [
            "# globals: assrt",
            "received = []",
            "class Base:",
            "    def __init_subclass__(cls, **kwargs):",
            "        received.append(cls)",
            "class Child(Base):",
            "    pass",
            "assrt.equal(received.length, 1)",
            "assrt.equal(received[0], Child)",
        ].join("\n"),
    },

    {
        name: "init_subclass_kwargs",
        description: "keyword arguments from class header are passed to __init_subclass__",
        src: [
            "# globals: assrt",
            "log = []",
            "class Base:",
            "    def __init_subclass__(cls, tag=None, **kwargs):",
            "        log.append(tag)",
            "class Child(Base, tag='alpha'):",
            "    pass",
            "class Other(Base, tag='beta'):",
            "    pass",
            "assrt.deepEqual(log, ['alpha', 'beta'])",
        ].join("\n"),
        js_checks: ["ρσ_isc_kw"],
    },

    {
        name: "init_subclass_super_chain",
        description: "super().__init_subclass__ propagates to grandparent",
        src: [
            "# globals: assrt",
            "calls = []",
            "class GrandParent:",
            "    def __init_subclass__(cls, **kwargs):",
            "        calls.append('GrandParent:' + cls.__name__)",
            "class Parent(GrandParent):",
            "    def __init_subclass__(cls, **kwargs):",
            "        super().__init_subclass__(**kwargs)",
            "        calls.append('Parent:' + cls.__name__)",
            "class Child(Parent):",
            "    pass",
            "assrt.deepEqual(calls, ['GrandParent:Parent', 'GrandParent:Child', 'Parent:Child'])",
        ].join("\n"),
    },

    {
        name: "init_subclass_set_classvar",
        description: "__init_subclass__ can set class variables on the subclass",
        src: [
            "# globals: assrt",
            "class Registry:",
            "    _registry = []",
            "    def __init_subclass__(cls, **kwargs):",
            "        cls._registered = True",
            "        Registry._registry.append(cls.__name__)",
            "class A(Registry):",
            "    pass",
            "class B(Registry):",
            "    pass",
            "assrt.equal(A._registered, True)",
            "assrt.equal(B._registered, True)",
            "assrt.deepEqual(Registry._registry, ['A', 'B'])",
        ].join("\n"),
    },

    {
        name: "init_subclass_no_hook_no_call",
        description: "no __init_subclass__ defined: class definition works normally",
        src: [
            "# globals: assrt",
            "class Base:",
            "    pass",
            "class Child(Base):",
            "    pass",
            "c = Child()",
            "assrt.ok(isinstance(c, Child))",
        ].join("\n"),
    },

    // ── except* / ExceptionGroup ──────────────────────────────────────────

    {
        name: "except_star_basic",
        description: "except* catches matching exceptions from an ExceptionGroup",
        src: [
            "# globals: assrt",
            'eg = ExceptionGroup("errors", [ValueError("bad"), ValueError("again")])',
            "caught_ve = []",
            "try:",
            "    raise eg",
            "except* ValueError as g:",
            "    for e in g.exceptions:",
            "        caught_ve.append(str(e))",
            "assrt.equal(len(caught_ve), 2)",
            'assrt.ok(caught_ve[0].indexOf("bad") >= 0)',
            'assrt.ok(caught_ve[1].indexOf("again") >= 0)',
        ].join("\n"),
        js_checks: ["ExceptionGroup", "ρσ_eg_exceptions"],
    },

    {
        name: "except_star_multiple_handlers",
        description: "multiple except* clauses each receive their matching sub-group",
        src: [
            "# globals: assrt",
            'eg = ExceptionGroup("mixed", [ValueError("v1"), TypeError("t1"), ValueError("v2")])',
            "val_count = 0",
            "type_count = 0",
            "try:",
            "    raise eg",
            "except* ValueError as g:",
            "    val_count = len(g.exceptions)",
            "except* TypeError as g:",
            "    type_count = len(g.exceptions)",
            "assrt.equal(val_count, 2)",
            "assrt.equal(type_count, 1)",
        ].join("\n"),
    },

    {
        name: "except_star_unmatched_reraise",
        description: "unmatched exceptions from an ExceptionGroup are re-raised",
        src: [
            "# globals: assrt",
            'eg = ExceptionGroup("mixed", [ValueError("v"), KeyError("k")])',
            "caught = False",
            "reraised = False",
            "try:",
            "    try:",
            "        raise eg",
            "    except* ValueError as g:",
            "        caught = True",
            "except ExceptionGroup as outer:",
            "    reraised = True",
            "    assrt.equal(len(outer.exceptions), 1)",
            "    assrt.ok(isinstance(outer.exceptions[0], KeyError))",
            "assrt.ok(caught)",
            "assrt.ok(reraised)",
        ].join("\n"),
    },

    {
        name: "except_star_non_group",
        description: "except* also handles a plain (non-ExceptionGroup) exception",
        src: [
            "# globals: assrt",
            "caught = False",
            "try:",
            '    raise ValueError("plain")',
            "except* ValueError as g:",
            "    caught = True",
            "    assrt.ok(isinstance(g, ValueError))",
            "assrt.ok(caught)",
        ].join("\n"),
    },

    {
        name: "except_star_bare",
        description: "bare except* catches all remaining exceptions",
        src: [
            "# globals: assrt",
            'eg = ExceptionGroup("all", [ValueError("v"), TypeError("t")])',
            "total = 0",
            "try:",
            "    raise eg",
            "except* as g:",
            "    total = len(g.exceptions)",
            "assrt.equal(total, 2)",
        ].join("\n"),
    },

    {
        name: "except_star_exception_group_class",
        description: "ExceptionGroup class has correct attributes and subgroup/split methods",
        src: [
            "# globals: assrt",
            'eg = ExceptionGroup("demo", [ValueError("v"), TypeError("t"), ValueError("v2")])',
            "assrt.equal(eg.message, 'demo')",
            "assrt.equal(len(eg.exceptions), 3)",
            "sub = eg.subgroup(ValueError)",
            "assrt.equal(len(sub.exceptions), 2)",
            "parts = eg.split(ValueError)",
            "assrt.equal(len(parts[0].exceptions), 2)",
            "assrt.equal(len(parts[1].exceptions), 1)",
        ].join("\n"),
    },

    // ── * and ** unpacking operators ──────────────────────────────────────────

    {
        name: "list_spread_basic",
        description: "list spread: [*a, 1, 2] flattens iterable into a new list",
        src: [
            "# globals: assrt",
            "a = [1, 2, 3]",
            "b = [*a, 4, 5]",
            "assrt.deepEqual(b, [1, 2, 3, 4, 5])",
        ].join("\n"),
        js_checks: [/\.\.\./],
    },

    {
        name: "list_spread_middle",
        description: "list spread: spread in the middle and at both ends",
        src: [
            "# globals: assrt",
            "a = [2, 3]",
            "b = [1, *a, 4]",
            "assrt.deepEqual(b, [1, 2, 3, 4])",
            "x = [10, 20]",
            "y = [30, 40]",
            "z = [*x, *y]",
            "assrt.deepEqual(z, [10, 20, 30, 40])",
        ].join("\n"),
    },

    {
        name: "list_spread_string",
        description: "list spread: *string unpacks characters",
        src: [
            "# globals: assrt",
            "chars = [*'abc', 'd']",
            "assrt.deepEqual(chars, ['a', 'b', 'c', 'd'])",
        ].join("\n"),
    },

    {
        name: "list_spread_first",
        description: "list spread: spread as the very first element",
        src: [
            "# globals: assrt",
            "a = [1, 2]",
            "b = [*a, 3]",
            "assrt.deepEqual(b, [1, 2, 3])",
            "c = [*a]",
            "assrt.deepEqual(c, [1, 2])",
        ].join("\n"),
    },

    {
        name: "set_spread_basic",
        description: "set spread: {*a, 1} builds a set from iterable and literals",
        src: [
            "# globals: assrt",
            "a = [1, 2, 3]",
            "s = {*a, 4}",
            "assrt.ok(isinstance(s, set))",
            "assrt.equal(len(s), 4)",
            "assrt.ok(s.has(1))",
            "assrt.ok(s.has(4))",
        ].join("\n"),
        js_checks: ["ρσ_set(["],
    },

    {
        name: "set_spread_multiple",
        description: "set spread: multiple spreads merge iterables into a set",
        src: [
            "# globals: assrt",
            "a = [1, 2]",
            "b = [3, 4]",
            "s = {*a, *b}",
            "assrt.equal(len(s), 4)",
            "assrt.ok(s.has(2))",
            "assrt.ok(s.has(3))",
        ].join("\n"),
    },

    {
        name: "kwargs_spread_expr",
        description: "**expr in function call accepts arbitrary expression, not just symbol",
        src: [
            "# globals: assrt",
            "def f(a=0, b=0, c=0):",
            "    return a + b + c",
            "opts = {'a': 1, 'b': 2, 'c': 3}",
            "assrt.equal(f(**opts), 6)",
        ].join("\n"),
    },

    {
        name: "kwargs_spread_getattr",
        description: "**obj.attr in function call spreads attribute access result",
        src: [
            "# globals: assrt",
            "class Cfg:",
            "    params = {'x': 10, 'y': 20}",
            "def add(x=0, y=0):",
            "    return x + y",
            "assrt.equal(add(**Cfg.params), 30)",
        ].join("\n"),
    },

    {
        name: "star_in_call_existing",
        description: "*args in function call: existing behaviour still works",
        src: [
            "# globals: assrt",
            "def f(a, b, c):",
            "    return a + b + c",
            "args = [1, 2, 3]",
            "assrt.equal(f(*args), 6)",
        ].join("\n"),
    },

    // ── tuple type ────────────────────────────────────────────────────────────

    {
        name: "tuple_from_list",
        description: "tuple() converts a list to a plain array",
        src: [
            "# globals: assrt",
            "t = tuple([1, 2, 3])",
            "assrt.equal(t[0], 1)",
            "assrt.equal(t[1], 2)",
            "assrt.equal(t[2], 3)",
            "assrt.equal(len(t), 3)",
        ].join("\n"),
    },

    {
        name: "tuple_from_string",
        description: "tuple() converts a string to an array of characters",
        src: [
            "# globals: assrt",
            "t = tuple('abc')",
            "assrt.equal(t[0], 'a')",
            "assrt.equal(t[1], 'b')",
            "assrt.equal(t[2], 'c')",
            "assrt.equal(len(t), 3)",
        ].join("\n"),
    },

    {
        name: "tuple_empty",
        description: "tuple() with no args returns an empty array",
        src: [
            "# globals: assrt",
            "t = tuple()",
            "assrt.equal(len(t), 0)",
        ].join("\n"),
    },

    {
        name: "tuple_annotation_variable",
        description: "tuple used as a variable type annotation with paren notation compiles and runs",
        src: [
            "# globals: assrt",
            "coords: tuple = (10, 20)",
            "assrt.equal(coords[0], 10)",
            "assrt.equal(coords[1], 20)",
        ].join("\n"),
        js_checks: ["coords = [10, 20]"],
    },

    {
        name: "tuple_annotation_function_arg",
        description: "tuple used as a function argument type annotation works",
        src: [
            "# globals: assrt",
            "def first(t: tuple):",
            "    return t[0]",
            "assrt.equal(first([7, 8, 9]), 7)",
        ].join("\n"),
    },

    {
        name: "tuple_iterable",
        description: "tuple() result is iterable with for-in",
        src: [
            "# globals: assrt",
            "t = tuple([10, 20, 30])",
            "total = 0",
            "for v in t:",
            "    total += v",
            "assrt.equal(total, 60)",
        ].join("\n"),
    },

    {
        name: "list_spread_is_list",
        description: "result of [*a] is a proper Python list with list methods",
        src: [
            "# globals: assrt",
            "a = [1, 2]",
            "b = [*a, 3]",
            "assrt.ok(isinstance(b, list))",
            "b.append(4)",
            "assrt.equal(len(b), 4)",
        ].join("\n"),
    },

    // ── copy ──────────────────────────────────────────────────────────────

    {
        name: "copy_primitives",
        description: "copy.copy returns primitives unchanged",
        src: [
            "# globals: assrt",
            "from copy import copy",
            "assrt.equal(copy(42), 42)",
            "assrt.equal(copy('hello'), 'hello')",
            "assrt.equal(copy(True), True)",
            "assrt.equal(copy(None), None)",
        ].join("\n"),
    },

    {
        name: "copy_list_shallow",
        description: "copy.copy of a list returns a shallow copy",
        src: [
            "# globals: assrt",
            "from copy import copy",
            "orig = [1, [2, 3], 4]",
            "c = copy(orig)",
            "assrt.equal(len(c), 3)",
            "assrt.equal(c[0], 1)",
            // shallow: inner list is the same object
            "assrt.ok(c[1] is orig[1])",
            // modifying the copy does not affect the original
            "c.append(5)",
            "assrt.equal(len(orig), 3)",
            "assrt.equal(len(c), 4)",
        ].join("\n"),
    },

    {
        name: "copy_dict_shallow",
        description: "copy.copy of a dict returns a shallow copy",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals, overload_getitem",
            "from copy import copy",
            "inner = [99]",
            "orig = {'a': 1, 'b': inner}",
            "c = copy(orig)",
            "assrt.equal(c['a'], 1)",
            // shallow: inner list is the same object
            "assrt.ok(c['b'] is orig['b'])",
            "c['x'] = 100",
            "assrt.ok(not ('x' in orig))",
        ].join("\n"),
    },

    {
        name: "copy_set_shallow",
        description: "copy.copy of a set returns an independent copy",
        src: [
            "# globals: assrt",
            "from copy import copy",
            "orig = {1, 2, 3}",
            "c = copy(orig)",
            "assrt.equal(len(c), 3)",
            "c.add(4)",
            "assrt.equal(len(orig), 3)",
            "assrt.equal(len(c), 4)",
        ].join("\n"),
    },

    {
        name: "copy_class_instance_shallow",
        description: "copy.copy of a class instance is shallow",
        src: [
            "# globals: assrt",
            "from copy import copy",
            "class Point:",
            "    def __init__(self, x, y):",
            "        self.x = x",
            "        self.y = y",
            "p = Point(1, 2)",
            "p.data = [10, 20]",
            "q = copy(p)",
            "assrt.equal(q.x, 1)",
            "assrt.equal(q.y, 2)",
            "assrt.ok(q is not p)",
            // shallow: mutable attribute is the same object
            "assrt.ok(q.data is p.data)",
        ].join("\n"),
    },

    {
        name: "copy_custom_copy_hook",
        description: "__copy__ method is called by copy.copy",
        src: [
            "# globals: assrt",
            "from copy import copy",
            "class MyObj:",
            "    def __init__(self, val):",
            "        self.val = val",
            "        self.copy_called = False",
            "    def __copy__(self):",
            "        result = MyObj(self.val * 2)",
            "        return result",
            "obj = MyObj(5)",
            "c = copy(obj)",
            "assrt.equal(c.val, 10)",
        ].join("\n"),
    },

    {
        name: "deepcopy_list_nested",
        description: "copy.deepcopy of a list with nested lists returns independent copies",
        src: [
            "# globals: assrt",
            "from copy import deepcopy",
            "orig = [1, [2, 3], [4, [5, 6]]]",
            "d = deepcopy(orig)",
            "assrt.equal(d[0], 1)",
            "assrt.equal(d[1][0], 2)",
            "assrt.equal(d[2][1][0], 5)",
            // deep: inner lists are different objects
            "assrt.ok(d[1] is not orig[1])",
            "assrt.ok(d[2][1] is not orig[2][1])",
            // mutating copy does not affect original
            "d[1].append(99)",
            "assrt.equal(len(orig[1]), 2)",
        ].join("\n"),
    },

    {
        name: "deepcopy_dict_nested",
        description: "copy.deepcopy of a dict with nested dicts returns independent copies",
        src: [
            "# globals: assrt",
            "from __python__ import dict_literals, overload_getitem",
            "from copy import deepcopy",
            "orig = {'a': {'x': 1}, 'b': [2, 3]}",
            "d = deepcopy(orig)",
            "assrt.equal(d['a']['x'], 1)",
            "assrt.ok(d['a'] is not orig['a'])",
            "assrt.ok(d['b'] is not orig['b'])",
            "d['a']['x'] = 99",
            "assrt.equal(orig['a']['x'], 1)",
        ].join("\n"),
    },

    {
        name: "deepcopy_circular",
        description: "copy.deepcopy handles circular references without infinite recursion",
        src: [
            "# globals: assrt",
            "from copy import deepcopy",
            "a = [1, 2]",
            "a.push(a)   # circular reference",
            "b = deepcopy(a)",
            "assrt.equal(b[0], 1)",
            "assrt.equal(b[1], 2)",
            "assrt.ok(b[2] is b)",  // circularity preserved in the copy
            "assrt.ok(b is not a)",
        ].join("\n"),
    },

    {
        name: "deepcopy_custom_hook",
        description: "__deepcopy__(memo) method is called by copy.deepcopy",
        src: [
            "# globals: assrt",
            "from copy import deepcopy",
            "class Node:",
            "    def __init__(self, val):",
            "        self.val = val",
            "        self.children = []",
            "    def __deepcopy__(self, memo):",
            "        result = Node(self.val * 10)",
            "        return result",
            "n = Node(7)",
            "m = deepcopy(n)",
            "assrt.equal(m.val, 70)",
            "assrt.ok(m is not n)",
        ].join("\n"),
    },

    {
        name: "deepcopy_class_instance",
        description: "copy.deepcopy of a class instance deeply copies instance attributes",
        src: [
            "# globals: assrt",
            "from copy import deepcopy",
            "class Box:",
            "    def __init__(self, items):",
            "        self.items = items",
            "b = Box([1, 2, 3])",
            "c = deepcopy(b)",
            "assrt.ok(c is not b)",
            "assrt.ok(c.items is not b.items)",
            "c.items.append(4)",
            "assrt.equal(len(b.items), 3)",
        ].join("\n"),
    },

    // ── str.expandtabs ────────────────────────────────────────────────────

    {
        name: "expandtabs_default",
        description: "str.expandtabs() with default tabsize=8 replaces tabs with spaces",
        src: [
            "# globals: assrt",
            'assrt.equal(str.expandtabs("\\t"), "        ")',
            'assrt.equal(str.expandtabs("a\\tb"), "a       b")',
            'assrt.equal(str.expandtabs("ab\\tc"), "ab      c")',
        ].join("\n"),
        js_checks: ["expandtabs"],
    },

    {
        name: "expandtabs_custom_tabsize",
        description: "str.expandtabs(tabsize) respects a custom tabsize",
        src: [
            "# globals: assrt",
            'assrt.equal(str.expandtabs("\\t", 4), "    ")',
            'assrt.equal(str.expandtabs("a\\tb", 4), "a   b")',
            'assrt.equal(str.expandtabs("abc\\td", 4), "abc d")',
            'assrt.equal(str.expandtabs("ab\\tcd", 4), "ab  cd")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "expandtabs_tabsize_zero",
        description: "str.expandtabs(0) removes all tab characters",
        src: [
            "# globals: assrt",
            'assrt.equal(str.expandtabs("a\\tb\\tc", 0), "abc")',
            'assrt.equal(str.expandtabs("\\t\\t", 0), "")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "expandtabs_newline_resets_column",
        description: "str.expandtabs() resets column counter at newlines",
        src: [
            "# globals: assrt",
            'assrt.equal(str.expandtabs("a\\n\\tb", 4), "a\\n    b")',
            'assrt.equal(str.expandtabs("abc\\n\\td", 4), "abc\\n    d")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "expandtabs_instance_method",
        description: "expandtabs works as an instance method via str.prototype",
        src: [
            "# globals: assrt",
            "from pythonize import strings",
            "strings()",
            'assrt.equal("\\t".expandtabs(), "        ")',
            'assrt.equal("a\\tb".expandtabs(4), "a   b")',
        ].join("\n"),
        js_checks: [],
    },

    {
        name: "expandtabs_no_tabs",
        description: "str.expandtabs() returns string unchanged when no tabs present",
        src: [
            "# globals: assrt",
            'assrt.equal(str.expandtabs("hello world"), "hello world")',
            'assrt.equal(str.expandtabs(""), "")',
        ].join("\n"),
        js_checks: [],
    },

];

// ── Runner ───────────────────────────────────────────────────────────────────

function run_tests(filter) {
    var tests = filter
        ? TESTS.filter(function (t) { return t.name === filter; })
        : TESTS;

    if (tests.length === 0) {
        console.error(colored("No test found: " + filter, "red"));
        process.exit(1);
    }

    var failures = [];

    tests.forEach(function (test) {

        // Custom run function (for tests that need direct JS-level control)
        if (typeof test.run === "function") {
            try {
                test.run();
            } catch (e) {
                failures.push(test.name);
                var msg = e.stack || String(e);
                console.log(colored("FAIL  " + test.name, "red") +
                            " [run]\n      " + msg + "\n");
                return;
            }
            console.log(colored("PASS  " + test.name, "green") +
                        "  –  " + test.description);
            return;
        }

        var js;

        // 1 – compile RapydScript → JS
        try {
            js = test.virtual_files ? compile_virtual(test.src, test.virtual_files) : compile(test.src);
        } catch (e) {
            failures.push(test.name);
            console.log(colored("FAIL  " + test.name, "red") +
                        " [compile error]\n      " + e + "\n");
            return;
        }

        // 2 – verify expected patterns appear in the JS output
        try {
            check_js_patterns(test.name, js, test.js_checks);
            // also check patterns that must NOT appear
            (test.js_not_checks || []).forEach(function (pat) {
                var found = (pat instanceof RegExp) ? pat.test(js) : js.indexOf(pat) !== -1;
                if (found) {
                    var desc = (pat instanceof RegExp) ? String(pat) : JSON.stringify(pat);
                    throw new Error("compiled JS unexpectedly contains " + desc + "\n  in test: " + test.name);
                }
            });
        } catch (e) {
            failures.push(test.name);
            console.debug("Emitted JS:\n" + js + "\n");
            console.log(colored("FAIL  " + test.name, "red") +
                        " [JS pattern mismatch]\n      " + e.message + "\n");
            return;
        }

        // 3 – run the JS; assertions embedded in src catch wrong values
        // (skipped for tests that produce JSX or other non-executable output)
        if (!test.skip_run) {
            try {
                run_js(js);
            } catch (e) {
                failures.push(test.name);
                var msg = e.stack || String(e);
                console.log(colored("FAIL  " + test.name, "red") +
                            " [runtime]\n      " + msg + "\n");
                return;
            }
        }

        console.log(colored("PASS  " + test.name, "green") +
                    "  –  " + test.description);
    });

    console.log("");
    if (failures.length) {
        console.log(colored(failures.length + " test(s) failed.", "red"));
    } else {
        console.log(colored("All " + tests.length + " unit tests passed!", "green"));
    }
    process.exit(failures.length ? 1 : 0);
}

var filter = process.argv[2] || null;
run_tests(filter);
