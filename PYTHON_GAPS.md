# RapydScript-NS: Python Compatibility Gaps & Browser-Friendly Additions

This document identifies features an experienced Python developer would expect that are missing
or behave differently in RapydScript-NS, with a focus on what is relevant and useful in a
browser context. Server-side features (file I/O, subprocesses, sockets, threading, etc.)
are excluded as they do not apply.

Items that are fully supported — even if only behind a flag — are not listed here. See the
README for the full feature and module support tables.

---

## 1. Silent Behavioral Differences (Gotchas)

These features exist but behave differently from Python in ways that will silently produce
wrong results — no error is raised.

### 1.1 `is` / `is not` — Identity vs. Equality

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

### 1.2 String Encoding — UTF-16 Surrogate Pairs

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

### 1.3 `global` Scoping in Nested Functions

**Python:** `global x` inside a nested function forces `x` to refer to the module-level
variable, bypassing any intermediate closure scopes.
**RapydScript:** If a variable named `x` exists in an intermediate outer function scope,
that scope takes precedence over the module-level scope, even with `global x`.

**Impact:** Code with complex nested closures + `global` declarations may write to the wrong
scope silently.

---

### 1.4 Numeric Dict Keys Are Coerced to Strings

**Python:** `d = {}; d[1] = 'a'; d['1'] = 'b'; len(d) == 2` (integer and string keys distinct).
**RapydScript:** The Python `dict` type (backed by ES6 `Map`) stores them distinctly, but
literal `{1: 'a', '1': 'b'}` and plain JS object interop may coerce integer keys to strings.

**Impact:** Code mixing numeric keys with the same string representation may produce collisions
when interoperating with JS APIs that return plain objects.

---

### 1.5 Multiple Inheritance MRO

**Python:** C3 linearization guarantees a deterministic and consistent method resolution order.
**RapydScript:** Built on the JS prototype chain. In diamond inheritance or complex hierarchies
the order may differ from Python's C3 MRO.

**Impact:** Unexpected method is called when multiple parent classes define the same method
name. Hard to debug because no error is raised.

---

### 1.7 `str.split()` With No Argument Splits Only On Space

**Python:** `s.split()` (no args) splits on runs of any whitespace (space, tab, newline,
form feed, etc.) **and** strips leading/trailing whitespace.
**RapydScript:** `s.split()` splits on the single space character only. Tabs and newlines
remain attached to neighbouring tokens.

```python
"hello\nworld\tfoo".split()
# Python:    ['hello', 'world', 'foo']
# RapydScript: ['hello\nworld\tfoo']  (one element)
```

**Impact:** Tokenising multi-line text, log lines, or anything containing tabs produces
garbage. **Workaround:** `re.split(r'\s+', s.strip())` or `s.split(None)` if supported.

---

### 1.8 `1 / 0` Returns `None` Instead Of Raising `ZeroDivisionError`

**Python:** Division by zero raises `ZeroDivisionError`.
**RapydScript:** `1 / 0` evaluates to `None`. Code that catches `ZeroDivisionError`
will never enter the handler, and downstream arithmetic on the `None` result either
fails later with a confusing type error or silently produces more `None`s.

**Impact:** Numerical code that defensively catches division-by-zero is broken silently.

---

### 1.9 `str(ExceptionInstance)` Includes The Class Name

**Python:** `str(ValueError("bad"))` → `"bad"`.
**RapydScript:** `str(ValueError("bad"))` → `"ValueError: bad"`.

```python
try:
    raise ValueError("bad")
except ValueError as e:
    assert str(e) == "bad"   # Fails — str(e) is "ValueError: bad"
```

**Impact:** Any code that introspects exception messages by stringifying the exception
gets a different string than Python. Use `e.args[0]` or `e.message` instead.

---

### 1.11 Tuples Are Unhashable As Dict Keys

**Python:** Tuples of hashable values are themselves hashable and work as dict keys.
**RapydScript:** Storing a tuple key works, but retrieval raises `KeyError` because
each tuple literal is a fresh array with a different identity.

```python
d = {(1, 2): "a"}
d[(1, 2)]   # Python: "a"; RapydScript: KeyError
```

**Impact:** Common patterns like memoising on `(x, y)` coordinates, sparse grid storage,
or graph adjacency keyed by node pairs do not work.

---

### 1.12 Python `int` Is Not Arbitrary Precision

**Python:** Integers have unbounded precision. `2 ** 100` is exact.
**RapydScript:** `int` is a JS `Number` (53-bit safe integer range). `2 ** 100`
silently becomes a float (`1.2676506e30`) and loses precision; `2 ** 64 + 1 == 2 ** 64`
is `True`.

**Note:** RapydScript has a `long` builtin backed by JS `BigInt`, but standard `int`
arithmetic does not auto-promote.

**Impact:** Cryptographic, combinatorial, and hash code that relies on big integers
silently produces wrong results.

---

### 1.13 Integer-Valued Float Literals Lose Their Float-ness

**Python:** `1.0` is a `float`; `isinstance(1.0, float)` is `True`.
**RapydScript:** Float literals whose value happens to be integral (`1.0`, `2.0`,
`100.0`) compile down to the integer `Number` `1`. `isinstance(1.0, float)` is `False`.
`type(1.0)` is `int`.

**Impact:** Code that branches on `isinstance(x, float)` to distinguish "definitely a
float" from "could be int" misclassifies values that started life as `1.0`.

---

### 1.14 `format(x, '.2e')` Produces 1-Digit Exponent

**Python:** Scientific notation pads the exponent to at least 2 digits.
`format(3.14159, '.2e')` → `'3.14e+00'`.
**RapydScript:** No padding — `format(3.14159, '.2e')` → `'3.14e+0'`.

**Impact:** String-equality checks on formatted scientific notation fail. Affects
log parsers, golden-file tests, and anything that text-matches numeric output.

---

### 1.15 `Counter.most_common` Returns Lists, Not Tuples

**Python:** `Counter("aab").most_common()` → `[('a', 2), ('b', 1)]` (list of tuples).
**RapydScript:** Returns `[['a', 2], ['b', 1]]` (list of lists).

**Impact:** Element access (`top[0][0]`) still works, but tuple-specific patterns
(`for word, count in ...:` is fine; `isinstance(top[0], tuple)` is not) diverge.

---

## 2. Missing Language Features

### 2.1 `__del__` Destructor — No Guaranteed Finalizer

`__del__` methods are not called reliably. JavaScript's GC is non-deterministic and provides
no equivalent to CPython's reference-counting finalizer.

**Browser relevance:** Low — most `__del__` usage is for file handles or network connections
that do not exist in the browser. However, the `FinalizationRegistry` API (available in all
modern browsers since 2021) could provide best-effort `__del__` support for cleanup of
external resources like WebGL buffers, WebSockets, etc. Worth adding with a clear caveat
that timing is not guaranteed.

---

### 2.2 `locals()` Always Returns Empty Dict

`vars()`, `locals()`, and `globals()` all exist as builtins. JavaScript provides no mechanism
to introspect local variables at runtime, so `locals()` always returns an empty dict.
`globals()` works on module-level/global state, and `vars(obj)` introspects the passed object.
Python code that uses `locals()` for string template substitution
(e.g., `'{x}'.format(**locals())`) will break silently.

---

### 2.3 `from module import *` Not Allowed

Star imports are intentionally unsupported to prevent namespace pollution. Python developers
who rely on them (e.g., `from math import *`) must enumerate imports explicitly.

**Impact:** Not a behavioral difference, but a friction point when porting code.

---

### 2.4 f-string Debugging Format `f'{x=}'` — Partial Support

The form `f'{x=}'` and expression forms (`f'{x+1=}'`) **do work** and produce `"x=42"` /
`"x+1=43"`. Two divergences from Python remain:

1. **No `repr()` conversion for the value.** Python's `f'{x=}'` is equivalent to
   `f'x={repr(x)}'`. RapydScript uses `str(x)` instead, so strings come out without quotes:

   ```python
   y = "hello"
   f'{y=}'   # Python: "y='hello'".  RapydScript: "y=hello".
   ```

2. **`!r` and `!s` conversion modifiers (`f'{x=!r}'`, `f'{x=!s}'`) untested** and may
   not parse.

**Workaround:** write `f'{x=!r}'` or `f'x={x!r}'` explicitly if you need the repr form
to work — verify before relying on it.

---

### 2.5 Ellipsis Evaluates to `undefined`

`...` (Ellipsis) parses as a valid expression but evaluates to JS `undefined` rather than
Python's `Ellipsis` singleton object. Code that stores `...` in containers or checks
`x is Ellipsis` will behave incorrectly.

---

### 2.6 `@` Matrix Multiplication Operator (`__matmul__`)

Python 3.5+ uses `@` for matrix multiplication and dispatches to `__matmul__` /
`__rmatmul__` / `__imatmul__`. The RapydScript parser does not accept `@` as a binary
operator — the token is reserved exclusively for decorators — so `a @ b` is a compile
error and no `__matmul__` dunder dispatch exists.

**Browser relevance:** Low. No NumPy in the browser, but it forecloses building any
matrix-style DSL that wants the Python-idiomatic operator (graphics libraries, neural
network demos, computational geometry).

---

### 2.7 `oct()` Builtin

`hex()` and `bin()` are provided, but `oct()` is not. Octal literals (`0o755`) parse and
evaluate correctly; only the conversion function is missing.

```python
hex(255)   # "0xff"     — works
bin(10)    # "0b1010"   — works
oct(8)     # ReferenceError: oct is not defined
```

**Workaround:** `"0o" + (n).toString(8)`.

---

### 2.8 `memoryview`

`memoryview` does not exist. `bytes` and `bytearray` are supported, but the zero-copy
buffer-protocol view that `memoryview` provides over them has no RapydScript equivalent —
slicing a `bytes` always allocates a new object.

**Browser relevance:** Low–medium. The common pattern of "share a byte range without
copying" can usually be expressed with `Uint8Array` subarrays via JS interop.

---

### 2.9 Numeric Underscore Literals (PEP 515)

Python 3.6+ allows underscores in numeric literals for readability: `1_000_000`,
`0xFF_FF_FF`, `3.14_159`. RapydScript rejects these with `Unexpected token: name
«_000_000»`.

**Impact:** Constants ported from Python lose readability or become parse errors.
**Workaround:** strip the underscores: `1000000`, `0xFFFFFF`.

---

### 2.10 `*` Unpacking In Collection Literals (PEP 448)

Python 3.5+ supports starred unpacking inside list, tuple, and set literals:

```python
a = [1, 2, 3]
b = [0, *a, 4]                # [0, 1, 2, 3, 4]
t = (0, *a, 4)
s = {*a, 4, 5}
```

RapydScript rejects all three with `Unexpected token: operator «*»`. Dict `**` unpacking
in dict literals (`{**a, **b}`) **does** work — only list/tuple/set unpacking is missing.

**Workaround:** `[0] + a + [4]` or `list(a) + [4]`.

---

### 2.11 PEP 604 Union Type Syntax `X | Y`

Python 3.10+ allows `int | str` in annotations as shorthand for `Union[int, str]`.
RapydScript parses the annotation, but at function-definition time it evaluates the
expression `int | str` — which calls `__or__` on the `int` builtin (a JS function),
throwing `TypeError: unsupported operand type(s) for |: 'function' and 'function'`.

**Workaround:** use `Union[int, str]` or `Optional[X]` from `typing`. But see 2.12 —
those also have issues.

---

### 2.13 Python Iterator Protocol (`__iter__` / `__next__`) Ignored

A class that implements Python's iterator protocol (`__iter__` returning self,
`__next__` raising `StopIteration`) is **not consumable** by `list(...)`,
`for ... in`, `sum(...)`, or other Python-style consumers in RapydScript.

```python
class Squares:
    def __init__(self, n): self.n = n
    def __iter__(self): self.i = 0; return self
    def __next__(self):
        if self.i >= self.n: raise StopIteration
        v = self.i * self.i; self.i += 1; return v

list(Squares(4))   # TypeError: iterator.next is not a function
```

RapydScript expects JS-style iterators with a `.next()` method returning
`{done, value}`. The Python protocol is not adapted.

**Workaround:** generator functions (`def f(): yield ...`) work correctly — use
those instead of writing iterator classes by hand. Or implement `[Symbol.iterator]`
via a v-block.

---

### 2.14 Python Async Iterator Protocol (`__aiter__` / `__anext__`) Ignored

Symmetric to 2.13 for the async case. `async for` compiles to JS `for await ... of`,
which requires `Symbol.asyncIterator`. Classes implementing `__aiter__` / `__anext__`
fail with `TypeError: ρσ_Iter is not async iterable`.

**Workaround:** use `async def` generators (`async def f(): yield ...`) instead.

---

### 2.15 `print(..., file=buf)` Ignored

The `file=` keyword argument to `print()` is silently dropped — output goes to the
default sink (`console.log`) instead of the file-like object. `sep=` and `end=`
both work.

```python
from io import StringIO
buf = StringIO()
print("hello", file=buf)
buf.getvalue()    # Python: "hello\n". RapydScript: "" (and "hello" went to console).
```

---

### 2.16 `raise X from Y` Cause Chain

`raise X from Y` syntactically works but `e.__cause__` is not populated, so the chain
is unavailable for inspection or traceback formatting.

---

### 2.17 Reserved-By-Baselib Variable Names

RapydScript installs several Python type/builtin names as `let`-bound module-level
globals: `long`, `float`, `int`, `complex`, `str`, `repr`, `format`, `arraylike`,
plus the standard JS reserved words. Reusing these as ordinary variables at module
scope produces a runtime `SyntaxError: Identifier 'X' has already been declared`.

```python
long = "this is text"   # SyntaxError at runtime
```

**Impact:** A `long` variable in ported code (common for "long description", "long
text") silently breaks compilation. The compiler does not flag this — the error
surfaces only when the JS is executed.

---

### 2.18 `import a, b` With One Missing Module Gives Confusing Error

A single `import` statement that imports multiple modules where **one** is missing
reports `Cannot read properties of undefined (reading 'classes')` instead of a clear
"module not found" message. Splitting onto separate lines gives the correct error.

```python
import io, sys     # "Cannot read properties of undefined (reading 'classes')"
# vs
import io
import sys         # "Failed Import: 'sys' module doesn't exist"
```

---

## 3. Missing Standard Library Modules (Browser-Relevant)

These are absent from `src/lib/` and have no substitute.

### 3.1 `enum.IntEnum`, `IntFlag`, `StrEnum`, and `Flag`

The `enum` module provides `Enum` but not `IntEnum` (auto-comparable with integers),
`StrEnum` (Python 3.11+), `IntFlag`, or `Flag` (bitfield enums). These are common in protocol
implementations, permission systems, and state machines.

```python
from enum import IntEnum
class Color(IntEnum):
    RED = 1
    GREEN = 2
Color.RED < Color.GREEN   # True — comparison with int semantics
```

---

### 3.2 `hashlib` — Cryptographic Hashing

`hashlib.sha256`, `hashlib.md5`, etc. The Web Crypto API provides `crypto.subtle.digest`
but its async/buffer-based interface is awkward. A thin `hashlib`-compatible wrapper over
`crypto.subtle` with a synchronous-friendly API (using the sync `crypto.getRandomValues`)
for non-cryptographic hashes would be valuable.

---

### 3.3 `sys`

No `sys` module. `sys.argv` (irrelevant in browser), `sys.platform`,
`sys.version`, `sys.maxsize`, `sys.float_info`, `sys.exit()`, and
`sys.stdout`/`sys.stderr` redirection have no counterparts.

**Browser relevance:** Low–medium. A stub exposing `sys.platform = 'browser'`,
`sys.version`, and a no-op `sys.exit` would absorb most tutorial code without behavior.

---

### 3.4 `pathlib`

`pathlib.Path` is missing. Even in a browser, `Path` is useful as a path-string parser
for URL paths, asset names, and storage keys (`.name`, `.suffix`, `.parent`, `.stem`,
`.with_suffix()`). A pure-string implementation that does not touch the filesystem would
cover the common use cases.

---

### 3.5 Missing `operator` Module Helpers

`src/lib/operator.pyj` exposes only `add`, `sub`, `mul`, `div`, `lt`, `le`, `eq`, `ne`,
`ge`, `gt`. The common composition helpers are missing:

- `itemgetter(i)` / `itemgetter(i, j, …)`
- `attrgetter('name')` / `attrgetter('a.b')`
- `methodcaller('name', *args, **kwargs)`
- `truediv`, `floordiv`, `mod`, `pow`
- `and_`, `or_`, `xor`, `lshift`, `rshift`, `invert`
- `neg`, `pos`, `not_`, `abs`
- `contains`, `indexOf`, `countOf`
- The `i*` in-place variants

These are heavily used as `key=` arguments to `sorted`, `min`, `max`, `groupby`, etc.

---

### 3.6 Missing `math` Functions

`math.pi`, `math.sqrt`, `math.floor`, `math.ceil`, `math.factorial`, `math.log`,
`math.sin`/`cos`/`tan`, and `math.e` are all present. Notably missing:

- `math.gcd` (and `math.lcm`)
- `math.isclose` (Python 3.5+)
- `math.inf`, `math.nan` (constants)
- `math.copysign`, `math.fmod`, `math.remainder`
- `math.dist`, `math.hypot` (multi-arg)
- `math.prod` (Python 3.8+)
- `math.comb`, `math.perm` (Python 3.8+)

`math.gcd` in particular is so common in numeric tutorials that its absence is jarring.

---

### 3.7 Missing String Methods On `str` Builtin

- `str.maketrans(from, to)` — static method missing. `str.translate(table)` exists
  but there is no convenient way to build the translation table.
- `str.encode(encoding)` — instance method missing. `bytes` literals work, but
  converting an existing `str` to UTF-8 `bytes` requires `TextEncoder` via a v-block.
- `bytes.decode(encoding)` — same limitation in reverse.

---

### 3.8 Missing Built-In Exception Classes

`RuntimeError` is **not** defined as a built-in. The `asyncio` library defines it
locally, but user code that does `raise RuntimeError(...)` at module scope fails with
`ReferenceError: RuntimeError is not defined`. Likely also missing or partially missing:
`NotImplementedError`, `OSError`, `IOError`, `FileNotFoundError`, `PermissionError`,
`InterruptedError`, `BlockingIOError`, `ConnectionError`, `LookupError`, `OverflowError`,
`FloatingPointError`, `ArithmeticError`, `BufferError`, `EnvironmentError`.

**Impact:** Code ported from Python often raises these without importing anything;
porting requires substituting `Exception` or defining the class manually.

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

### 4.3 `Cls.method(arg)` vs `@Cls.method`

`Cls.method(arg)` compiles to `Cls.prototype.method.call(arg)` (unbound Python 2 style).
`@Cls.method` as a decorator stores the constructor property and calls it differently.
These are different lookup paths. A method that must work both as a decorator and as a
direct class call needs to be installed on both `cls.property` and `cls.prototype.property`.

---

### 4.5 Verbatim Blocks Are Truly Verbatim — No Escape Processing

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

### 4.6 `jstype(x) is 'number'` for `typeof` Checks

Python's `type(x)` does not return a string. For JS-style `typeof` checks:

```python
jstype(x) is 'number'    # correct
type(x) is int           # also works for pure RS objects
```
The `jstype()` builtin is the RS equivalent of JS's `typeof`.

---

## 5. Summary Priority Table

Priority weighs frequency-of-need, effort-to-implement, and whether a workaround exists.
Entries marked **NEW** were added in the 2026-05-26 coverage audit.

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| **NEW** High | `str.split()` splits only on space (§1.7) | Low | Silent wrong tokenisation of multi-line text |
| **NEW** High | `1/0` returns `None` instead of `ZeroDivisionError` (§1.8) | Low | Defensive numeric code misbehaves silently |
| **NEW** High | Python iterator protocol ignored (§2.13) | Medium | Hand-written `__iter__`/`__next__` classes don't work |
| **NEW** High | Tuples unhashable as dict keys (§1.11) | Medium | Memoisation, sparse grids, graph keys break |
| **NEW** High | `str.encode()` / `bytes.decode()` missing (§3.7) | Low | Common UTF-8 conversion pattern needs v-block |
| High | `enum.IntEnum`, `IntFlag`, `Flag` (§3.1) | Medium | Protocol and permission modeling; bitfield enums |
| **NEW** Medium | PEP 604 `X \| Y` union syntax (§2.11) | Medium | Modern annotations break on definition |
| **NEW** Medium | `str(exc)` includes class name (§1.9) | Low | Exception-message comparisons fail |
| **NEW** Medium | `*a` unpacking in list/tuple/set literals (§2.10) | Medium | Common PEP 448 idiom doesn't parse |
| **NEW** Medium | Numeric underscore literals `1_000_000` (§2.9) | Low | Readable numeric constants fail to parse |
| **NEW** Medium | `math.gcd`, `math.isclose`, `math.inf`/`nan`, `math.prod` (§3.6) | Low | Common numeric helpers |
| **NEW** Medium | `operator.itemgetter`, `attrgetter`, `methodcaller` (§3.5) | Low | Idiomatic `key=` for `sorted`/`min`/`max` |
| **NEW** Medium | `print(..., file=buf)` ignored (§2.15) | Low | Output redirection idiom fails silently |
| **NEW** Medium | Async iterator protocol ignored (§2.14) | Medium | Async generator class pattern broken |
| **NEW** Medium | `RuntimeError` and other builtin exceptions missing (§3.8) | Low | `raise RuntimeError(...)` fails |
| **NEW** Medium | `sys` module missing (§3.3) | Low | `sys.platform`, `sys.version`, `sys.exit` |
| **NEW** Medium | `pathlib` missing (§3.4) | Medium | Path-string parsing is browser-useful |
| Medium | `@` matmul + `__matmul__` dunder (§2.6) | Medium | DSL hospitality (graphics, math libraries) |
| Medium | `hashlib` shim over Web Crypto (§3.2) | Medium | Avoids verbatim Web Crypto calls in user code |
| Medium | f-string `f'{x=}'` uses `str` not `repr` (§2.4) | Low | Subtle but easy to fix once known |
| **NEW** Low | `Counter.most_common` returns lists not tuples (§1.15) | Low | Element access still works |
| **NEW** Low | `format(x, '.2e')` 1-digit exponent (§1.14) | Trivial | Pad exponent in formatter |
| **NEW** Low | Integer-valued float literals lose `float` type (§1.13) | Medium | Hard to fix without runtime type tagging |
| **NEW** Low | Integer arbitrary precision (§1.12) | High | Workaround: explicit `long()` for big ints |
| **NEW** Low | `raise X from Y` doesn't set `__cause__` (§2.16) | Low | Chained exceptions don't display |
| **NEW** Low | `long`/`float`/`int` as variable names cause SyntaxError (§2.17) | Low | Compiler should reject or auto-rename |
| **NEW** Low | `import a, b` confusing error if one missing (§2.18) | Trivial | Better diagnostic |
| Low | `oct()` builtin (§2.7) | Trivial | Symmetry with `hex()` / `bin()` |
| Low | `__del__` via `FinalizationRegistry` (§2.1) | Medium | Resource cleanup (best-effort) |
