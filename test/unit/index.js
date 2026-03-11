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
        // nonlocal → the outer variable is accessed/modified directly
        js_checks: ["counter += 1"],
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
        js_checks: [fs.readFileSync(path.join(__dirname, "fixtures", "fibonacci_expected.js"), "utf-8")],
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
            "nums.sort(lambda a, b: a - b)",
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
        } catch (e) {
            failures.push(test.name);
            console.debug("Emitted JS:\n" + js + "\n");
            console.log(colored("FAIL  " + test.name, "red") +
                        " [JS pattern mismatch]\n      " + e.message + "\n");
            return;
        }

        // 3 – run the JS; assertions embedded in src catch wrong values
        try {
            run_js(js);
        } catch (e) {
            failures.push(test.name);
            var msg = e.stack || String(e);
            console.log(colored("FAIL  " + test.name, "red") +
                        " [runtime]\n      " + msg + "\n");
            return;
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
