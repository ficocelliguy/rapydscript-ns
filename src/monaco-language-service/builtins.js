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

    new BuiltinInfo({ name: 'float', kind: 'class',
        params: [p('x', { optional: true })],
        return_type: 'float',
        doc: 'Return a floating-point number from x.' }),

    new BuiltinInfo({ name: 'getattr',
        params: [p('obj'), p('name', { type: 'str' }), p('default', { optional: true })],
        return_type: 'any',
        doc: 'Return the value of the named attribute of obj. If not found, return default (or raise AttributeError).' }),

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
        doc: 'Return an integer from x, optionally in the given base.' }),

    new BuiltinInfo({ name: 'isinstance',
        params: [p('obj'), p('classinfo')],
        return_type: 'bool',
        doc: 'Return True if obj is an instance of classinfo (or a subclass thereof).' }),

    new BuiltinInfo({ name: 'iter',
        params: [p('obj')],
        return_type: 'iterator',
        doc: 'Return an iterator object for obj.' }),

    new BuiltinInfo({ name: 'len',
        params: [p('s')],
        return_type: 'int',
        doc: 'Return the number of items in a container.' }),

    new BuiltinInfo({ name: 'list', kind: 'class',
        params: [p('iterable', { optional: true })],
        return_type: 'list',
        doc: 'Create a list from an iterable, or an empty list.' }),

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
        params: [p('*args', { rest: true })],
        return_type: 'None',
        doc: 'Print objects to the console, separated by sep and followed by end.' }),

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

    new BuiltinInfo({ name: 'setattr',
        params: [p('obj'), p('name', { type: 'str' }), p('value')],
        return_type: 'None',
        doc: 'Set the named attribute on obj to value.' }),

    new BuiltinInfo({ name: 'sorted',
        params: [p('iterable'), p('key', { optional: true }), p('reverse', { type: 'bool', optional: true })],
        return_type: 'list',
        doc: 'Return a new sorted list from the items in iterable.' }),

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
        params: [p('*iterables', { rest: true })],
        return_type: 'iterable',
        doc: 'Return an iterator of tuples, where each tuple groups the i-th element from each iterable.' }),

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
