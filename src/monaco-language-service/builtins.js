// builtins.js — Typed stubs for RapydScript / Python built-in functions.
//
// Provides hover docs, signature help, and richer completion detail for
// functions that are always available in RapydScript without any import.
//
// Public API:
//   import { BuiltinsRegistry } from './builtins.js';
//   const reg = new BuiltinsRegistry();
//   reg.get('len');              // BuiltinInfo | null
//   reg.getNames();              // string[]
//   reg.getHoverMarkdown('len'); // string | null
//   reg.getSignatureInfo('len'); // SignatureInfo | null

// ---------------------------------------------------------------------------
// BuiltinInfo
// ---------------------------------------------------------------------------

/**
 * Descriptor for a single built-in symbol.
 *
 * @typedef {{ label: string, type?: string, optional?: boolean, rest?: boolean }} BParam
 */
export class BuiltinInfo {
    /**
     * @param {object} opts
     * @param {string}   opts.name
     * @param {string}   [opts.kind='function']   'function' | 'class' | 'var'
     * @param {BParam[]|null} [opts.params]
     * @param {string|null}   [opts.return_type]
     * @param {string|null}   [opts.doc]
     */
    constructor(opts) {
        this.name        = opts.name;
        this.kind        = opts.kind        || 'function';
        this.params      = opts.params      || null;
        this.return_type = opts.return_type || null;
        this.doc         = opts.doc         || null;
    }
}

// ---------------------------------------------------------------------------
// Stub definitions
// ---------------------------------------------------------------------------

/** Shorthand for building a param descriptor. */
function p(label, opts) {
    return Object.assign({ label }, opts || {});
}

const STUBS = [
    // ── Python built-ins ──────────────────────────────────────────────────
    new BuiltinInfo({ name: 'abs',
        params: [p('x', { type: 'number' })],
        return_type: 'number',
        doc: 'Return the absolute value of x.' }),

    new BuiltinInfo({ name: 'all',
        params: [p('iterable')],
        return_type: 'bool',
        doc: 'Return True if all elements of the iterable are true (or if the iterable is empty).' }),

    new BuiltinInfo({ name: 'any',
        params: [p('iterable')],
        return_type: 'bool',
        doc: 'Return True if any element of the iterable is true.' }),

    new BuiltinInfo({ name: 'bool', kind: 'class',
        params: [p('x', { optional: true })],
        return_type: 'bool',
        doc: 'Return a Boolean value. x is converted using the standard truth-testing procedure.' }),

    new BuiltinInfo({ name: 'callable',
        params: [p('obj')],
        return_type: 'bool',
        doc: 'Return True if the object appears callable.' }),

    new BuiltinInfo({ name: 'chr',
        params: [p('i', { type: 'int' })],
        return_type: 'str',
        doc: 'Return the string representing a character at Unicode code point i.' }),

    new BuiltinInfo({ name: 'complex', kind: 'class',
        params: [p('real_or_string', { optional: true }), p('imag', { type: 'number', optional: true })],
        return_type: 'complex',
        doc: 'Create a complex number.\n\nForms:\n- `complex()` → `0j`\n- `complex(x)` → `x+0j` (from int/float/bool/complex), or parse Python complex string\n- `complex(real, imag)` → `real + imag*j`\n\nLiteral syntax: `4j` is equivalent to `complex(0, 4)`, and `3+4j` creates a complex number via addition.\n\nAttributes:\n- `.real` — the real part (float)\n- `.imag` — the imaginary part (float)\n\nMethods:\n- `.conjugate()` — return the complex conjugate `(real - imag*j)`\n\nSupports: `+`, `-`, `*`, `/`, `**`, unary `-`/`+`, `abs()`, `bool()`, `==`, `repr()`, `str()`.\n\nExample:\n\n    c = complex(3, 4)\n    c.real            # 3\n    c.imag            # 4\n    abs(c)            # 5.0\n    c.conjugate()     # (3-4j)\n    c * complex(1, 2) # (-5+10j)\n    3 + 4j            # (3+4j)  — literal syntax' }),

    new BuiltinInfo({ name: 'dict', kind: 'class',
        params: [p('**kwargs', { rest: true })],
        return_type: 'dict',
        doc: 'Create a new dictionary.' }),

    new BuiltinInfo({ name: 'dir',
        params: [p('obj', { optional: true })],
        return_type: 'list',
        doc: 'Without argument, return the list of names in the current local scope. With argument, return a list of attributes of that object.' }),

    new BuiltinInfo({ name: 'divmod',
        params: [p('a', { type: 'number' }), p('b', { type: 'number' })],
        return_type: '[int, int]',
        doc: 'Return (a // b, a % b) as a pair.' }),

    new BuiltinInfo({ name: 'enumerate',
        params: [p('iterable'), p('start', { type: 'int', optional: true })],
        return_type: 'iterable',
        doc: 'Return an enumerate object yielding (index, value) pairs.' }),

    new BuiltinInfo({ name: 'filter',
        params: [p('function'), p('iterable')],
        return_type: 'iterable',
        doc: 'Return an iterator of elements from iterable for which function returns true.' }),

    new BuiltinInfo({ name: 'format',
        params: [p('value'), p('spec', { type: 'str', optional: true })],
        return_type: 'str',
        doc: 'Return value formatted according to the format spec string.\n\nEquivalent to calling `value.__format__(spec)` or applying spec as a `str.format()` format-spec field. The spec mini-language is the same as what follows `:` in f-strings and `str.format()` fields: alignment (`<>^=`), sign (`+-`), width, grouping (`,_`), precision (`.N`), and type (`bcdoxXeEfFgGns%`).\n\nExamples:\n\n    format(42, \'08b\')    # \'00101010\'\n    format(3.14, \'.2f\')  # \'3.14\'\n    format(\'hi\', \'>10\')  # \'        hi\'\n    format(42)           # \'42\'' }),

    new BuiltinInfo({ name: 'float', kind: 'class',
        params: [p('x', { optional: true })],
        return_type: 'float',
        doc: 'Return a floating-point number from x.\n\nInstance method:\n- `.is_integer()` — return `True` if the float has no fractional part (i.e. is a whole number), `False` otherwise. `Infinity` and `NaN` return `False`.\n\nExample:\n\n    (1.0).is_integer()   # True\n    (1.5).is_integer()   # False\n    (1e10).is_integer()  # True' }),

    new BuiltinInfo({ name: 'getattr',
        params: [p('obj'), p('name', { type: 'str' }), p('default', { optional: true })],
        return_type: 'any',
        doc: 'Return the value of the named attribute of obj. If not found, return default (or raise AttributeError).' }),

    new BuiltinInfo({ name: 'hash',
        params: [p('obj')],
        return_type: 'int',
        doc: 'Return the hash value of obj. Strings and numbers are hashed by value; class instances by identity. Raises TypeError for unhashable types (list, set, dict). Objects with __hash__ dispatch to it.' }),

    new BuiltinInfo({ name: 'hasattr',
        params: [p('obj'), p('name', { type: 'str' })],
        return_type: 'bool',
        doc: 'Return True if obj has an attribute with the given name.' }),

    new BuiltinInfo({ name: 'hex',
        params: [p('x', { type: 'int' })],
        return_type: 'str',
        doc: 'Return the hexadecimal representation of an integer.' }),

    new BuiltinInfo({ name: 'id',
        params: [p('obj')],
        return_type: 'int',
        doc: 'Return the identity of an object.' }),

    new BuiltinInfo({ name: 'int', kind: 'class',
        params: [p('x', { optional: true }), p('base', { type: 'int', optional: true })],
        return_type: 'int',
        doc: 'Return an integer from x, optionally in the given base.\n\nInstance method:\n- `.bit_length()` — return the number of bits needed to represent the integer in binary, excluding the sign and leading zeros. Equivalent to `floor(log2(abs(n))) + 1` for nonzero `n`; returns `0` for `0`.\n\nExample:\n\n    (0).bit_length()    # 0\n    (1).bit_length()    # 1\n    (255).bit_length()  # 8\n    (256).bit_length()  # 9\n    (-5).bit_length()   # 3  (sign ignored)' }),

    new BuiltinInfo({ name: 'isinstance',
        params: [p('obj'), p('classinfo')],
        return_type: 'bool',
        doc: 'Return True if obj is an instance of classinfo (or a subclass thereof).' }),

    new BuiltinInfo({ name: 'issubclass',
        params: [p('cls'), p('classinfo')],
        return_type: 'bool',
        doc: 'Return True if cls is a subclass of classinfo. classinfo may be a class or tuple of classes.' }),

    new BuiltinInfo({ name: 'iter',
        params: [p('obj'), p('sentinel', { optional: true })],
        return_type: 'iterator',
        doc: 'iter(iterable) → iterator over iterable. iter(callable, sentinel) → calls callable repeatedly until it returns sentinel.' }),

    new BuiltinInfo({ name: 'len',
        params: [p('s')],
        return_type: 'int',
        doc: 'Return the number of items in a container.' }),

    new BuiltinInfo({ name: 'list', kind: 'class',
        params: [p('iterable', { optional: true })],
        return_type: 'list',
        doc: 'Create a list from an iterable, or an empty list.' }),

    new BuiltinInfo({ name: 'next',
        params: [p('iterator'), p('default', { optional: true })],
        return_type: 'any',
        doc: 'Retrieve the next item from an iterator. If the iterator is exhausted, return default; if default is not given, raise StopIteration.' }),

    new BuiltinInfo({ name: 'object', kind: 'class',
        params: [],
        return_type: 'object',
        doc: 'Create a new featureless base object instance.\n\nThe base class of all Python classes. Calling `object()` with no arguments returns a new, unique instance useful as a sentinel value:\n\n    MISSING = object()   # unique sentinel\n    if value is MISSING:\n        ...\n\nKey behaviours:\n- Each call returns a distinct instance (`object() is not object()`).\n- `isinstance(x, object)` returns `True` for any `object()` instance (and subclasses).\n- `class Foo(object):` works as an explicit base class.\n- `repr()` returns `\'<object object at 0x…>\'`.\n- `hash()` returns a stable identity hash.\n\nNote: unlike Python, you *can* add arbitrary attributes to an `object()` instance in RapydScript (JS objects are open by default).' }),

    new BuiltinInfo({ name: 'map',
        params: [p('function'), p('iterable'), p('*iterables', { rest: true })],
        return_type: 'iterable',
        doc: 'Return an iterator applying function to each item of iterable.' }),

    new BuiltinInfo({ name: 'max',
        params: [p('iterable'), p('*args', { rest: true })],
        return_type: 'any',
        doc: 'Return the largest item in an iterable or the largest of two or more arguments.' }),

    new BuiltinInfo({ name: 'min',
        params: [p('iterable'), p('*args', { rest: true })],
        return_type: 'any',
        doc: 'Return the smallest item in an iterable or the smallest of two or more arguments.' }),

    new BuiltinInfo({ name: 'ord',
        params: [p('c', { type: 'str' })],
        return_type: 'int',
        doc: 'Return the Unicode code point integer for a one-character string.' }),

    new BuiltinInfo({ name: 'pow',
        params: [p('base', { type: 'number' }), p('exp', { type: 'number' }), p('mod', { optional: true })],
        return_type: 'number',
        doc: 'Return base raised to the power exp, optionally modulo mod.' }),

    new BuiltinInfo({ name: 'print',
        params: [p('*args', { rest: true }), p('sep', { default_val: "' '" }), p('end', { default_val: "'\\n'" })],
        return_type: 'None',
        doc: 'Print objects to the console. Items are separated by sep (default space). Transpiles to console.log().' }),

    new BuiltinInfo({ name: 'range',
        params: [p('start_or_stop', { type: 'int' }), p('stop', { type: 'int', optional: true }), p('step', { type: 'int', optional: true })],
        return_type: 'range',
        doc: 'Return a sequence of numbers. range(stop) counts from 0. range(start, stop[, step]) counts from start.' }),

    new BuiltinInfo({ name: 'repr',
        params: [p('obj')],
        return_type: 'str',
        doc: 'Return a string containing a printable representation of obj.' }),

    new BuiltinInfo({ name: 'reversed',
        params: [p('seq')],
        return_type: 'iterator',
        doc: 'Return a reverse iterator over a sequence.' }),

    new BuiltinInfo({ name: 'round',
        params: [p('number', { type: 'number' }), p('ndigits', { type: 'int', optional: true })],
        return_type: 'number',
        doc: 'Round number to ndigits decimal places (default 0).' }),

    new BuiltinInfo({ name: 'set', kind: 'class',
        params: [p('iterable', { optional: true })],
        return_type: 'set',
        doc: 'Create a new set, optionally populated from an iterable.' }),

    new BuiltinInfo({ name: 'slice', kind: 'class',
        params: [p('start_or_stop', { type: 'int' }), p('stop', { type: 'int', optional: true }), p('step', { type: 'int', optional: true })],
        return_type: 'slice',
        doc: 'Create a slice object representing the set of indices specified by range(start, stop, step).\n\nForms:\n- `slice(stop)` — equivalent to `slice(None, stop, None)`\n- `slice(start, stop)` — equivalent to `slice(start, stop, None)`\n- `slice(start, stop, step)` — full form\n\nAttributes: `.start`, `.stop`, `.step` (each may be `None`).\n\nMethod: `.indices(length)` — returns `(start, stop, step)` normalized for a sequence of the given length.\n\nExample:\n\n    s = slice(1, 5)\n    lst[s]         # same as lst[1:5]\n    s.indices(10)  # (1, 5, 1)' }),

    new BuiltinInfo({ name: 'setattr',
        params: [p('obj'), p('name', { type: 'str' }), p('value')],
        return_type: 'None',
        doc: 'Set the named attribute on obj to value.' }),

    new BuiltinInfo({ name: 'sorted',
        params: [p('iterable'), p('key', { optional: true }), p('reverse', { type: 'bool', optional: true })],
        return_type: 'list',
        doc: 'Return a new sorted list from the items in iterable.' }),

    new BuiltinInfo({ name: 'super',
        params: [],
        return_type: 'object',
        doc: 'Return a proxy object that delegates method calls to a parent class.\n\nUse `super()` inside a class method to call parent class methods:\n\n    class Child(Parent):\n        def __init__(self):\n            super().__init__()\n        def greet(self):\n            return super().greet() + " from child"\n\nAlso supports the two-argument form `super(ClassName, self)` for explicit MRO lookup.' }),

    new BuiltinInfo({ name: 'str', kind: 'class',
        params: [p('obj', { optional: true })],
        return_type: 'str',
        doc: 'Return a string version of obj.' }),

    new BuiltinInfo({ name: 'sum',
        params: [p('iterable'), p('start', { optional: true })],
        return_type: 'number',
        doc: 'Sum the items of iterable, optionally starting from start (default 0).' }),

    new BuiltinInfo({ name: 'type',
        params: [p('obj')],
        return_type: 'type',
        doc: 'Return the type of an object.' }),

    new BuiltinInfo({ name: 'zip',
        params: [p('*iterables', { rest: true }), p('strict', { optional: true })],
        return_type: 'iterable',
        doc: 'Return an iterator of tuples, where each tuple groups the i-th element from each iterable. With strict=True, raises ValueError if the iterables have different lengths.' }),

    // ── RapydScript-specific ──────────────────────────────────────────────
    new BuiltinInfo({ name: 'jstype',
        params: [p('x')],
        return_type: 'str',
        doc: 'Return the JavaScript typeof string for x (e.g. "number", "string", "object").' }),

    new BuiltinInfo({ name: 'repr',
        params: [p('obj')],
        return_type: 'str',
        doc: 'Return a developer-friendly string representation of obj.' }),

    // ── JS globals ────────────────────────────────────────────────────────
    new BuiltinInfo({ name: 'parseInt',
        params: [p('string', { type: 'str' }), p('radix', { type: 'int', optional: true })],
        return_type: 'int',
        doc: 'Parse a string and return an integer. Specify radix for the base (e.g. 16 for hex).' }),

    new BuiltinInfo({ name: 'parseFloat',
        params: [p('string', { type: 'str' })],
        return_type: 'float',
        doc: 'Parse a string and return a floating-point number.' }),

    new BuiltinInfo({ name: 'isNaN',
        params: [p('value')],
        return_type: 'bool',
        doc: 'Return True if value is NaN (Not a Number).' }),

    new BuiltinInfo({ name: 'isFinite',
        params: [p('value')],
        return_type: 'bool',
        doc: 'Return True if value is a finite number.' }),

    new BuiltinInfo({ name: 'setTimeout',
        params: [p('callback'), p('delay', { type: 'number' }), p('*args', { rest: true })],
        return_type: 'int',
        doc: 'Call callback after delay milliseconds. Returns a timeout ID.' }),

    new BuiltinInfo({ name: 'setInterval',
        params: [p('callback'), p('delay', { type: 'number' })],
        return_type: 'int',
        doc: 'Call callback repeatedly at every delay milliseconds. Returns an interval ID.' }),

    new BuiltinInfo({ name: 'clearTimeout',
        params: [p('id', { type: 'int' })],
        return_type: 'None',
        doc: 'Cancel a timeout set with setTimeout.' }),

    new BuiltinInfo({ name: 'clearInterval',
        params: [p('id', { type: 'int' })],
        return_type: 'None',
        doc: 'Cancel an interval set with setInterval.' }),

    new BuiltinInfo({ name: 'encodeURIComponent',
        params: [p('str', { type: 'str' })],
        return_type: 'str',
        doc: 'Encode a URI component by escaping special characters.' }),

    new BuiltinInfo({ name: 'decodeURIComponent',
        params: [p('str', { type: 'str' })],
        return_type: 'str',
        doc: 'Decode a URI component previously encoded with encodeURIComponent.' }),
];

// ---------------------------------------------------------------------------
// Built-in type member stubs
// Each entry is compatible with _dts_member_to_item in completions.js:
//   { name, kind ('method'|'property'), params?, return_type?, doc? }
// ---------------------------------------------------------------------------

function m(name, kind, params, return_type, doc) {
    return { name, kind, params: params || null, return_type: return_type || null, doc: doc || null };
}
function mp(label, type) { return { name: label, type, optional: false, rest: false }; }

const TYPE_MEMBERS = {
    list: new Map([
        // JS array property
        ['length',      m('length',      'property', null,                       'int',  'The number of elements in the array.')],
        // Python-compat methods
        ['append',      m('append',      'method',   [mp('item', 'any')],        'None', 'Append item to the end of the list.')],
        ['extend',      m('extend',      'method',   [mp('iterable', 'any')],    'None', 'Extend the list by appending all items from the iterable.')],
        ['insert',      m('insert',      'method',   [mp('index', 'int'), mp('item', 'any')], 'None', 'Insert item before index.')],
        ['remove',      m('remove',      'method',   [mp('item', 'any')],        'None', 'Remove the first occurrence of item.')],
        ['pop',         m('pop',         'method',   [mp('index', 'int')],       'any',  'Remove and return item at index (default last).')],
        ['index',       m('index',       'method',   [mp('item', 'any')],        'int',  'Return first index of item.')],
        ['count',       m('count',       'method',   [mp('item', 'any')],        'int',  'Return number of occurrences of item.')],
        ['sort',        m('sort',        'method',   [],                         'None', 'Sort the list in place.')],
        ['reverse',     m('reverse',     'method',   [],                         'None', 'Reverse the list in place.')],
        ['copy',        m('copy',        'method',   [],                         'list', 'Return a shallow copy of the list.')],
        ['clear',       m('clear',       'method',   [],                         'None', 'Remove all items from the list.')],
        // JS array methods
        ['push',        m('push',        'method',   [mp('...items', 'any')],    'int',  'Append one or more elements and return the new length.')],
        ['slice',       m('slice',       'method',   [mp('start', 'int'), mp('end', 'int')], 'list', 'Return a shallow slice of the array.')],
        ['splice',      m('splice',      'method',   [mp('start', 'int'), mp('deleteCount', 'int')], 'list', 'Change contents by removing or inserting elements.')],
        ['concat',      m('concat',      'method',   [mp('...arrays', 'any')],   'list', 'Merge two or more arrays.')],
        ['join',        m('join',        'method',   [mp('separator', 'str')],   'str',  'Join all elements into a string.')],
        ['indexOf',     m('indexOf',     'method',   [mp('item', 'any')],        'int',  'Return first index of item, or -1 if not found.')],
        ['lastIndexOf', m('lastIndexOf', 'method',   [mp('item', 'any')],        'int',  'Return last index of item, or -1 if not found.')],
        ['includes',    m('includes',    'method',   [mp('item', 'any')],        'bool', 'Return true if item is in the array.')],
        ['forEach',     m('forEach',     'method',   [mp('callback', 'function')], 'None', 'Execute callback for each element.')],
        ['map',         m('map',         'method',   [mp('callback', 'function')], 'list', 'Create a new array with the results of calling callback.')],
        ['filter',      m('filter',      'method',   [mp('callback', 'function')], 'list', 'Create a new array with elements that pass the callback test.')],
        ['reduce',      m('reduce',      'method',   [mp('callback', 'function'), mp('initial', 'any')], 'any', 'Reduce array to a single value.')],
        ['find',        m('find',        'method',   [mp('callback', 'function')], 'any', 'Return first element satisfying callback, or undefined.')],
        ['findIndex',   m('findIndex',   'method',   [mp('callback', 'function')], 'int', 'Return index of first element satisfying callback, or -1.')],
        ['every',       m('every',       'method',   [mp('callback', 'function')], 'bool', 'Return true if all elements satisfy callback.')],
        ['some',        m('some',        'method',   [mp('callback', 'function')], 'bool', 'Return true if at least one element satisfies callback.')],
        ['flat',        m('flat',        'method',   [mp('depth', 'int')],       'list', 'Create a new array with sub-arrays flattened.')],
        ['fill',        m('fill',        'method',   [mp('value', 'any'), mp('start', 'int'), mp('end', 'int')], 'list', 'Fill elements with a static value.')],
        ['shift',       m('shift',       'method',   [],                         'any',  'Remove and return the first element.')],
        ['unshift',     m('unshift',     'method',   [mp('...items', 'any')],    'int',  'Prepend elements and return the new length.')],
    ]),

    str: new Map([
        // JS string property
        ['length',      m('length',      'property', null,                       'int',  'The number of characters in the string.')],
        // Python-compat methods
        ['upper',       m('upper',       'method',   [],                         'str',  'Return an upper-case copy of the string.')],
        ['lower',       m('lower',       'method',   [],                         'str',  'Return a lower-case copy of the string.')],
        ['strip',       m('strip',       'method',   [mp('chars', 'str')],       'str',  'Return a copy with leading and trailing whitespace removed.')],
        ['lstrip',      m('lstrip',      'method',   [mp('chars', 'str')],       'str',  'Return a copy with leading whitespace removed.')],
        ['rstrip',      m('rstrip',      'method',   [mp('chars', 'str')],       'str',  'Return a copy with trailing whitespace removed.')],
        ['split',       m('split',       'method',   [mp('sep', 'str'), mp('maxsplit', 'int')], 'list', 'Return a list of words split on sep.')],
        ['find',        m('find',        'method',   [mp('sub', 'str')],         'int',  'Return the lowest index of sub, or -1 if not found.')],
        ['replace',     m('replace',     'method',   [mp('old', 'str'), mp('new', 'str')], 'str', 'Return a copy with all occurrences of old replaced by new.')],
        ['startswith',  m('startswith',  'method',   [mp('prefix', 'str')],      'bool', 'Return True if the string starts with prefix.')],
        ['endswith',    m('endswith',    'method',   [mp('suffix', 'str')],      'bool', 'Return True if the string ends with suffix.')],
        ['format',      m('format',      'method',   [mp('*args', 'any')],       'str',  'Return a formatted version of the string.')],
        ['encode',      m('encode',      'method',   [mp('encoding', 'str')],    'bytes', 'Encode the string.')],
        ['join',        m('join',        'method',   [mp('iterable', 'any')],    'str',  'Join iterable elements with this string as separator.')],
        // JS string methods
        ['toUpperCase', m('toUpperCase', 'method',   [],                         'str',  'Return an upper-case copy of the string.')],
        ['toLowerCase', m('toLowerCase', 'method',   [],                         'str',  'Return a lower-case copy of the string.')],
        ['trim',        m('trim',        'method',   [],                         'str',  'Return a copy with leading and trailing whitespace removed.')],
        ['trimStart',   m('trimStart',   'method',   [],                         'str',  'Return a copy with leading whitespace removed.')],
        ['trimEnd',     m('trimEnd',     'method',   [],                         'str',  'Return a copy with trailing whitespace removed.')],
        ['includes',    m('includes',    'method',   [mp('sub', 'str')],         'bool', 'Return true if sub is found anywhere in the string.')],
        ['startsWith',  m('startsWith',  'method',   [mp('prefix', 'str')],      'bool', 'Return true if the string starts with prefix.')],
        ['endsWith',    m('endsWith',    'method',   [mp('suffix', 'str')],      'bool', 'Return true if the string ends with suffix.')],
        ['indexOf',     m('indexOf',     'method',   [mp('sub', 'str')],         'int',  'Return first index of sub, or -1.')],
        ['lastIndexOf', m('lastIndexOf', 'method',   [mp('sub', 'str')],         'int',  'Return last index of sub, or -1.')],
        ['slice',       m('slice',       'method',   [mp('start', 'int'), mp('end', 'int')], 'str', 'Extract a section of the string.')],
        ['substring',   m('substring',   'method',   [mp('start', 'int'), mp('end', 'int')], 'str', 'Return characters between start and end.')],
        ['charAt',      m('charAt',      'method',   [mp('index', 'int')],       'str',  'Return character at the given index.')],
        ['charCodeAt',  m('charCodeAt',  'method',   [mp('index', 'int')],       'int',  'Return UTF-16 code of character at index.')],
        ['repeat',      m('repeat',      'method',   [mp('count', 'int')],       'str',  'Return the string repeated count times.')],
        ['padStart',    m('padStart',    'method',   [mp('length', 'int'), mp('pad', 'str')], 'str', 'Pad start of string to target length.')],
        ['padEnd',      m('padEnd',      'method',   [mp('length', 'int'), mp('pad', 'str')], 'str', 'Pad end of string to target length.')],
        ['match',       m('match',       'method',   [mp('regex', 'str')],       'list', 'Match string against a regular expression.')],
        ['replaceAll',  m('replaceAll',  'method',   [mp('old', 'str'), mp('new', 'str')], 'str', 'Return a copy with all occurrences replaced.')],
    ]),

    dict: new Map([
        // Python-compat methods
        ['keys',       m('keys',       'method', [],                             'list', 'Return a view of the dictionary keys.')],
        ['values',     m('values',     'method', [],                             'list', 'Return a view of the dictionary values.')],
        ['items',      m('items',      'method', [],                             'list', 'Return a view of the (key, value) pairs.')],
        ['get',        m('get',        'method', [mp('key', 'any'), mp('default', 'any')], 'any', 'Return value for key, or default if not found.')],
        ['update',     m('update',     'method', [mp('other', 'dict')],          'None', 'Update the dictionary with key-value pairs from other.')],
        ['pop',        m('pop',        'method', [mp('key', 'any'), mp('default', 'any')], 'any', 'Remove and return value for key.')],
        ['clear',      m('clear',      'method', [],                             'None', 'Remove all items from the dictionary.')],
        ['copy',       m('copy',       'method', [],                             'dict', 'Return a shallow copy of the dictionary.')],
        ['setdefault', m('setdefault', 'method', [mp('key', 'any'), mp('default', 'any')], 'any', 'Return value for key; if missing, insert key with default.')],
        ['has_key',    m('has_key',    'method', [mp('key', 'any')],             'bool', 'Return True if key is in the dictionary.')],
    ]),

    number: new Map([
        ['toFixed',       m('toFixed',       'method', [mp('digits', 'int')],   'str',  'Format number to fixed decimal places.')],
        ['toPrecision',   m('toPrecision',   'method', [mp('precision', 'int')], 'str', 'Format number to specified precision.')],
        ['toString',      m('toString',      'method', [mp('radix', 'int')],    'str',  'Convert number to string in given base.')],
        ['toExponential', m('toExponential', 'method', [mp('digits', 'int')],   'str',  'Format number in exponential notation.')],
    ]),
};

// Extra str members added when pythonize_strings is enabled.
// These are the methods from pythonize.strings() not already in TYPE_MEMBERS.str.
const PYTHONIZE_STR_EXTRA_MEMBERS = new Map([
    ['capitalize',  m('capitalize',  'method', [],                                                          'str',  'Return a copy with the first character capitalized and the rest lowercased.')],
    ['islower',     m('islower',     'method', [],                                                          'bool', 'Return True if all cased characters are lowercase.')],
    ['isupper',     m('isupper',     'method', [],                                                          'bool', 'Return True if all cased characters are uppercase.')],
    ['isspace',     m('isspace',     'method', [],                                                          'bool', 'Return True if all characters in the string are whitespace.')],
    ['swapcase',    m('swapcase',    'method', [],                                                          'str',  'Return a copy with uppercase characters converted to lowercase and vice versa.')],
    ['title',       m('title',       'method', [],                                                          'str',  'Return a title-cased version of the string.')],
    ['center',      m('center',      'method', [mp('width', 'int'), mp('fillchar', 'str')],                 'str',  'Return the string centered in a field of the given width.')],
    ['count',       m('count',       'method', [mp('sub', 'str'), mp('start', 'int'), mp('end', 'int')],    'int',  'Return the number of non-overlapping occurrences of sub.')],
    ['rfind',       m('rfind',       'method', [mp('sub', 'str'), mp('start', 'int'), mp('end', 'int')],    'int',  'Return the highest index of sub, or -1 if not found.')],
    ['index',       m('index',       'method', [mp('sub', 'str'), mp('start', 'int'), mp('end', 'int')],    'int',  'Like find, but raise ValueError if sub is not found.')],
    ['rindex',      m('rindex',      'method', [mp('sub', 'str'), mp('start', 'int'), mp('end', 'int')],    'int',  'Like rfind, but raise ValueError if sub is not found.')],
    ['ljust',       m('ljust',       'method', [mp('width', 'int'), mp('fillchar', 'str')],                 'str',  'Return the string left-justified in a field of the given width.')],
    ['rjust',       m('rjust',       'method', [mp('width', 'int'), mp('fillchar', 'str')],                 'str',  'Return the string right-justified in a field of the given width.')],
    ['partition',   m('partition',   'method', [mp('sep', 'str')],                                         'list', 'Split at the first occurrence of sep; return a 3-element tuple.')],
    ['rpartition',  m('rpartition',  'method', [mp('sep', 'str')],                                         'list', 'Split at the last occurrence of sep; return a 3-element tuple.')],
    ['rsplit',      m('rsplit',      'method', [mp('sep', 'str'), mp('maxsplit', 'int')],                   'list', 'Return a list of words split on sep from the right.')],
    ['splitlines',  m('splitlines',  'method', [mp('keepends', 'bool')],                                    'list', 'Return a list of the lines in the string, breaking at line boundaries.')],
    ['zfill',       m('zfill',       'method', [mp('width', 'int')],                                       'str',  'Pad the string on the left with zeros to fill a field of the given width.')],
]);

// ---------------------------------------------------------------------------
// BuiltinsRegistry
// ---------------------------------------------------------------------------

export class BuiltinsRegistry {
    constructor() {
        this._stubs = new Map();
        for (const stub of STUBS) {
            this._stubs.set(stub.name, stub);
        }
    }

    /**
     * Return the BuiltinInfo for name, or null.
     * @param {string} name
     * @returns {BuiltinInfo|null}
     */
    get(name) {
        return this._stubs.get(name) || null;
    }

    /**
     * Return all registered stub names.
     * @returns {string[]}
     */
    getNames() {
        return Array.from(this._stubs.keys());
    }

    /**
     * Merge the pythonize string methods into the 'str' type members so that
     * dot-completions on string variables include all Python-style methods.
     * Safe to call multiple times (idempotent).
     */
    enablePythonizeStrings() {
        const str_map = TYPE_MEMBERS.str;
        for (const [name, member] of PYTHONIZE_STR_EXTRA_MEMBERS) {
            if (!str_map.has(name)) str_map.set(name, member);
        }
    }

    /**
     * Return the Map of member stubs for a built-in type, or null.
     * Each value is compatible with _dts_member_to_item in completions.js.
     * @param {string} type_name  e.g. 'list', 'str', 'dict', 'number'
     * @returns {Map|null}
     */
    getTypeMembers(type_name) {
        return TYPE_MEMBERS[type_name] || null;
    }

    /**
     * Return hover markdown for a built-in, or null.
     * @param {string} name
     * @returns {string|null}
     */
    getHoverMarkdown(name) {
        const stub = this.get(name);
        if (!stub) return null;
        const sig = _build_sig(stub);
        let md = '```python\n' + sig + '\n```';
        if (stub.doc) md += '\n\n' + stub.doc;
        return md;
    }

    /**
     * Return Monaco-compatible signature info for a built-in, or null.
     * @param {string} name
     * @returns {{ label: string, params: {label: string}[], doc: string|null }|null}
     */
    getSignatureInfo(name) {
        const stub = this.get(name);
        if (!stub || !stub.params) return null;
        const param_strs = stub.params.map(_param_label);
        const label = stub.name + '(' + param_strs.join(', ') + ')';
        return {
            label,
            params: param_strs.map(function (s) { return { label: s }; }),
            doc:    stub.doc,
        };
    }
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function _param_label(p) {
    let s = p.label;
    if (p.type && p.type !== 'any') s += ': ' + p.type;
    if (p.optional) s += '?';
    return s;
}

function _build_sig(stub) {
    const ps = stub.params ? stub.params.map(_param_label).join(', ') : '';
    let sig = stub.name + '(' + ps + ')';
    if (stub.return_type && stub.return_type !== 'None') sig += ' → ' + stub.return_type;
    return sig;
}
