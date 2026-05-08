# RapydScript-NS: Python Compatibility Gaps & Browser-Friendly Additions

This document identifies features an experienced Python developer would expect that are missing
or behave differently in RapydScript-NS, with a focus on what is relevant and useful in a
browser context. Server-side features (file I/O, subprocesses, sockets, threading, etc.)
are excluded as they do not apply.

---

## 1. Silent Behavioral Differences (Gotchas)

These features exist but behave differently from Python in ways that will silently produce
wrong results — no error is raised.

### 1.1 `%` Modulo on Negative Numbers *(partially resolved)*

**Python:** `%` always returns a non-negative result (true modulo).
```python
-7 % 3   # → 2  (Python)
-7 % 3   # → -1 (RapydScript default — JS remainder semantics)
```
**Status:** Fixed when using `from __python__ import overload_operators` or
`from __python__ import python_modulo`. In bare mode (no flags) the JS remainder semantics
still apply.

**Impact:** Any algorithm relying on modular arithmetic (wrapping, circular indexing) may
produce wrong results in code that does not use the Python operator flags.

---

### 1.2 `is` / `is not` — Identity vs. Equality

**Python:** `is` tests object identity (pointer comparison).
**RapydScript:** `is` compiles to `===` (strict equality), so `x is y` is true whenever
`x === y`, including for equal primitive values that would be distinct Python objects.

```python
a = 1000
b = 1000
a is b   # False in Python (separate int objects)
         # True in RapydScript (1000 === 1000)
```
**Impact:** Code that checks `obj is None` or `obj is sentinel_value` works correctly.
Code that expects `is` to return `False` for equal-but-distinct numeric values will be wrong.

**Note:** This is already documented in the README, but it is subtle and trips up experts.
The recommended pattern — using a unique sentinel object — works correctly.

---

### 1.3 Function Arguments: `TypeError` on Wrong Count *(opt-in, not default)*

**Python:** Too few or too many positional arguments raises `TypeError` at call time.
**RapydScript default:** Extra args are silently discarded; missing args become `undefined`.

```python
def f(a, b):
    return a + b

f(1, 2, 3)   # Python: TypeError. RapydScript default: silently returns 3
f(1)         # Python: TypeError. RapydScript default: returns NaN (1 + undefined)
```
**Status:** Argument count and type-annotation enforcement is now available via the
`type_enforce` flag on function definitions (emits runtime checks). Not enabled by default
because it adds overhead to every call. Developers writing library code with strict APIs
should opt in.

---

### 1.4 Positional-Only and Keyword-Only Parameters Not Enforced

**Python:** Positional-only params (`/`) cannot be passed by keyword; keyword-only params
(`*`) cannot be passed positionally. Both raise `TypeError` on violations.
**RapydScript:** Violations are silently discarded — the param gets `undefined` with no error.

```python
def f(a, b, /, *, c):
    return a + b + c

f(1, b=2, c=3)   # Python: TypeError (b is positional-only)
                  # RapydScript: b silently becomes undefined, a=1, c=3
```
**Impact:** API design contracts expressed via param ordering are not enforced.

---

### 1.5 String Encoding — UTF-16 Surrogate Pairs

**Python:** Strings are sequences of Unicode code points (full 21-bit range).
**RapydScript:** Strings are JS strings — UTF-16. Emoji and other non-BMP characters
(U+10000–U+10FFFF) are represented as surrogate pairs and count as length 2.

```python
s = '😀'
len(s)      # 1 in Python, 2 in RapydScript
s[0]        # '😀' in Python, '\uD83D' (broken surrogate) in RapydScript
```
**RapydScript provides:** `str.ulen()`, `str.uchrs()`, `str.uslice()` for code-point-aware
operations, but they must be used consciously.

**Impact:** Any code handling emoji, Asian CJK extension, or mathematical symbols may silently
produce wrong lengths or corrupt characters when sliced.

---

### 1.6 `global` Scoping in Nested Functions

**Python:** `global x` inside a nested function forces `x` to refer to the module-level
variable, bypassing any intermediate closure scopes.
**RapydScript:** If a variable named `x` exists in an intermediate outer function scope,
that scope takes precedence over the module-level scope, even with `global x`.

**Impact:** Code with complex nested closures + `global` declarations may write to the wrong
scope silently.

---

### 1.7 Numeric Dict Keys Are Coerced to Strings

**Python:** `d = {}; d[1] = 'a'; d['1'] = 'b'; len(d) == 2` (integer and string keys distinct).
**RapydScript:** The Python `dict` type (backed by ES6 `Map`) stores them distinctly, but
literal `{1: 'a', '1': 'b'}` and plain JS object interop may coerce integer keys to strings.

**Impact:** Code mixing numeric keys with the same string representation may produce collisions
when interoperating with JS APIs that return plain objects.

---

### 1.8 `Exception.args` vs `.message`

**Python:** `Exception('msg').args == ('msg',)` and `.message` is not a standard attribute.
**RapydScript:** `.message` is the primary attribute (JS `Error` convention). `.args` is
not populated as a tuple with the message.

**Impact:** Code accessing `.args[0]` to get the error message will get `undefined`.

---

### 1.9 Multiple Inheritance MRO

**Python:** C3 linearization guarantees a deterministic and consistent method resolution order.
**RapydScript:** Built on the JS prototype chain. In diamond inheritance or complex hierarchies
the order may differ from Python's C3 MRO.

**Impact:** Unexpected method is called when multiple parent classes define the same method
name. Hard to debug because no error is raised.

---

## 2. Missing Language Features

### 2.1 `__slots__` Not Enforced

`__slots__ = ['x', 'y']` is parsed and accepted but has no runtime effect — arbitrary
attributes can still be set on instances. No `AttributeError` is raised for assignments to
undeclared attributes.

**Browser relevance:** Used frequently for memory efficiency and API documentation. Enforcement
via `Object.seal()` or a `Proxy`-based guard would be possible in modern browsers.

---

### 2.2 `__del__` Destructor — No Guaranteed Finalizer

`__del__` methods are not called reliably. JavaScript's GC is non-deterministic and provides
no equivalent to CPython's reference-counting finalizer.

**Browser relevance:** Low — most `__del__` usage is for file handles or network connections
that do not exist in the browser. However, the `FinalizationRegistry` API (available in all
modern browsers since 2021) could provide best-effort `__del__` support for cleanup of
external resources like WebGL buffers, WebSockets, etc. Worth adding with a clear caveat
that timing is not guaranteed.

---

### 2.3 `locals()` Always Returns Empty Dict

JavaScript provides no mechanism to introspect local variables at runtime. `locals()` always
returns an empty dict. Python code that uses `locals()` for string template substitution
(e.g., `'{x}'.format(**locals())`) will break silently.

---

### 2.4 `from module import *` Not Allowed

Star imports are intentionally unsupported to prevent namespace pollution. Python developers
who rely on them (e.g., `from math import *`) must enumerate imports explicitly.

**Impact:** Not a behavioral difference, but a friction point when porting code.

---

### 2.5 Async Generators Not Supported

`async def` functions with `yield` (async generators) are not supported. Only basic
`async def` + `await` (coroutines) and synchronous generators work.

**Browser relevance:** Async generators are useful for streaming data (e.g., consuming a
`ReadableStream` line by line). This gap is significant for browser I/O patterns.

---

### 2.6 `asynccontextmanager` Not Available

`contextlib.asynccontextmanager` is absent. Only synchronous `@contextmanager` is implemented.

---

### 2.7 f-string Debugging Format `f'{x=}'` Not Supported

Python 3.8+ supports `f'{x=}'` which expands to `f'x={repr(x)}'`. This is not implemented.

```python
x = 42
print(f'{x=}')   # Python: "x=42". RapydScript: syntax error or wrong output
```

---

### 2.8 Ellipsis Evaluates to `undefined`

`...` (Ellipsis) parses as a valid expression but evaluates to JS `undefined` rather than
Python's `Ellipsis` singleton object. Code that stores `...` in containers or checks
`x is Ellipsis` will behave incorrectly.

---

## 3. Missing Standard Library Modules (Browser-Relevant)

These are absent from `src/lib/` and have no substitute.

### 3.1 `decimal` — Decimal Arithmetic

`Decimal` arithmetic avoids floating-point rounding errors. Essential for financial
calculations in browser apps (e-commerce, budgeting tools). JS does not have a built-in
equivalent; a pure-JS implementation would need to be compiled in.

---

### 3.2 `fractions` — Rational Arithmetic

`Fraction(numerator, denominator)` with full arithmetic. Useful for music theory apps,
math tutoring tools, and any domain requiring exact rational computation.

---

### 3.3 `statistics` — Statistical Functions

`mean`, `median`, `mode`, `stdev`, `variance`, `quantiles`. Very commonly needed in
data-visualization browser apps. Currently `numpy` covers much of this but `statistics`
is lighter-weight and doesn't require the full numpy import.

---

### 3.4 `difflib` — Sequence Comparison

`difflib.unified_diff`, `difflib.SequenceMatcher`, `difflib.get_close_matches`. Useful
for browser-based code editors, version comparison tools, and fuzzy matching UIs.

---

### 3.5 `pprint` — Pretty Printing

`pprint.pformat` / `pprint.pprint`. Primarily a debugging/REPL aid. Given the in-browser
REPL in this project, implementing `pprint` would make output more readable.

---

### 3.6 `hashlib` — Cryptographic Hashing

`hashlib.sha256`, `hashlib.md5`, etc. The Web Crypto API provides `crypto.subtle.digest`
but its async/buffer-based interface is awkward. A thin `hashlib`-compatible wrapper over
`crypto.subtle` with a synchronous-friendly API (using the sync `crypto.getRandomValues`)
for non-cryptographic hashes would be valuable.

---

### 3.7 `enum.IntEnum` and `enum.Flag`

The `enum` module provides `Enum` but not `IntEnum` (auto-comparable with integers),
`StrEnum` (Python 3.11+), or `Flag` (bitfield enums). These are common in protocol
implementations, permission systems, and state machines.

```python
from enum import IntEnum
class Color(IntEnum):
    RED = 1
    GREEN = 2
Color.RED < Color.GREEN   # True — comparison with int semantics
```

---

### 3.8 `collections.ChainMap`

`ChainMap` provides a multi-level dict lookup (like layered config or scope chains) without
copying. Not currently in `collections.pyj`.

---

## 4. Tricky Patterns That Require Workarounds

These are not missing features but patterns that silently work differently or require
non-obvious syntax.

### 4.1 Python String Methods on String Literals

String literals in RapydScript do NOT have Python methods (`.strip()`, `.join()`, etc.)
available by default in all contexts. Using string methods requires:

- `from pythonize import strings; strings()` (patches `String.prototype` at runtime), or
- the `--pythonize-strings` compiler option, or
- calling `str.strip(s)` (module-level form) instead of `s.strip()`

**Impact:** The most common pattern in Python — `s.strip().split(',')` — will throw a
`TypeError` in some contexts without the above setup.

---

### 4.2 Multi-line Anonymous Functions in Call Arguments

Multi-line `def` blocks cannot be used as inline arguments to function calls:

```python
# Does NOT compile correctly:
result = map(def(x):
    return x * 2
, my_list)

# Must use a named helper:
def double(x):
    return x * 2
result = map(double, my_list)
```

---

### 4.3 JavaScript Reserved Words as Identifiers

All JavaScript reserved words are also forbidden in RapydScript. Common Python identifiers
that break: `default`, `delete`, `switch`, `case`, `break`, `var`, `void`, `typeof`,
`instanceof`. Also cannot be used as keyword argument names in function calls.

```python
def configure(default=None):   # 'default' is reserved — compile error
    ...
# Must rename: def configure(dflt=None):
```

---

### 4.4 Class Named `Error` Shadows JS `Error`

Defining a class named `Error` (e.g., `class Error(Exception)`) compiles to a JS function
that shadows the global `JS Error` constructor. If that class is then imported in another
module context (e.g., the web REPL), the import line `var Error = ρσ_modules.mymod.Error`
shadows the native `Error`, causing infinite recursion in `Exception.__init__`.

**Workaround:** Never name a RapydScript class `Error`. Use `MyError`, `AppError`,
`ValueError` (which is already defined in baselib), etc.

---

### 4.5 `Cls.method(arg)` vs `@Cls.method`

`Cls.method(arg)` compiles to `Cls.prototype.method.call(arg)` (unbound Python 2 style).
`@Cls.method` as a decorator stores the constructor property and calls it differently.
These are different lookup paths. A method that must work both as a decorator and as a
direct class call needs to be installed on both `cls.property` and `cls.prototype.property`.

---

### 4.6 `range` Cannot Be Shadowed as a Parameter Name

```python
def histogram(data, range):   # compile/runtime error — range shadows builtin
    ...
# Must rename: def histogram(data, data_range):
```

This extends to other builtins: prefer prefixed parameter names when a parameter naturally
matches a builtin name.

---

### 4.7 Verbatim Blocks Are Truly Verbatim — No Escape Processing

Inside `v'...'` blocks, Python escape sequences are NOT processed. `\n` in a v-block
becomes a literal backslash-n in the JS output, not a newline.

```python
# Wrong — \n is not a newline in the regex:
pat = v'/foo\nbar/'

# Right — write the exact JS you want:
pat = v'/foo\nbar/'   # only works as a real newline if you have a literal newline
```
For regex literals, write exactly the JS you want. Double-escaping (`\\n`) produces `\\n`
in JS (two characters), not a newline.

---

### 4.8 `jstype(x) is 'number'` for `typeof` Checks

Python's `type(x)` does not return a string. For JS-style `typeof` checks:

```python
jstype(x) is 'number'    # correct
type(x) is int           # also works for pure RS objects
```
The `jstype()` builtin is the RS equivalent of JS's `typeof`.

---

## 5. Summary Priority Table

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| High | `enum.IntEnum`, `Flag` | Medium | Protocol and permission modeling |
| High | `statistics` module | Low | Data analysis without full numpy import |
| Medium | `pprint` module | Low | REPL output quality |
| Medium | `collections.ChainMap` | Low | Multi-level scope/config dicts |
| Medium | f-string `f'{x=}'` debugging format | Low | Developer experience |
| Medium | `__slots__` enforcement via `Proxy` | Medium | Memory + API documentation |
| Medium | `fractions` module | Medium | Exact rational arithmetic |
| Medium | `hashlib` shim over Web Crypto | Medium | Hashing without verbatim JS |
| Low | `decimal` module | High | Financial calculations |
| Low | `difflib` module | High | Text diff, fuzzy matching |
| Low | Async generators | High | Streaming browser I/O |
| Low | `asynccontextmanager` | Medium | Async resource management |
| Low | `__del__` via `FinalizationRegistry` | Medium | Resource cleanup (best-effort) |
