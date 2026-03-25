# Python Feature Coverage Report — RapydScript-NS

## ✅ Fully Supported

| Feature | Notes |
|---|---|
| `super()` — 0-arg and 2-arg forms | `super().method()` and `super(Cls, self).method()` both work |
| `except TypeA, TypeB as e:` | RapydScript comma-separated form; catches multiple exception types |
| `except (TypeA, TypeError) as e:` | Tuple form also supported |
| `except*` / `ExceptionGroup` (Python 3.11+) | Full support: `ExceptionGroup` class with `subgroup()`/`split()`; `except*` dispatches to typed handlers, re-raises unmatched; bare `except*:` catches all remaining |
| `try / else` | `else` block runs only when no exception was raised |
| `for / else` | `else` block runs when loop completes without `break`; nested break isolation works |
| `while / else` | `else` block runs when loop condition becomes `False` without a `break`; nested `break` isolation correct |
| `with A() as a, B() as b:` | Multiple context managers in one statement; exits in LIFO order (Python-correct) |
| `callable(fn)` | Works for plain functions and objects with `__call__` |
| `round(x, ndigits=0)` | Full Python semantics including negative `ndigits` |
| `enumerate(iterable, start=0)` | `start` parameter supported |
| `str.isspace()`, `str.islower()`, `str.isupper()` | Working string predicates |
| `str.isalpha()` | Regex-based; empty string returns `False` |
| `str.isdigit()` | Regex-based (`\d+`) |
| `str.isalnum()` | Regex-based |
| `str.isidentifier()` | Checks `^[a-zA-Z_][a-zA-Z0-9_]*$` |
| `str.casefold()` | Maps to `.toLowerCase()` |
| `str.removeprefix(prefix)` | Returns unchanged string if prefix not found |
| `str.removesuffix(suffix)` | Returns unchanged string if suffix not found |
| `str.expandtabs(tabsize=8)` | Replaces `\t` with spaces to the next tab stop; `\n`/`\r` reset the column counter; `tabsize=0` removes all tabs; available as an instance method after `from pythonize import strings; strings()` |
| `str * n` string repetition | Works when `from __python__ import overload_operators` is active |
| `list * n` / `n * list` | Works with `overload_operators`; returns a proper RapydScript list |
| `list + list` concatenation | `[1,2] + [3,4]` returns `[1, 2, 3, 4]`; `+=` extends in-place. No flag required. |
| `match / case` | Structural pattern matching (Python 3.10) fully supported |
| Variable type annotations `x: int = 1` | Parsed and ignored (no runtime enforcement); annotated assignments work normally |
| Ellipsis literal `...` as expression | Parsed as a valid expression; evaluates to JS `undefined` at runtime |
| Generator `.throw()` | Works via JS generator protocol |
| Generator `.send()` | Works via `g.next(value)` |
| `yield from` | Works; return value of sub-generator is not accessible |
| `+=`, `-=`, `*=`, `/=`, `//=`, `**=`, `%=`, `&=`, `\|=`, `^=`, `<<=`, `>>=` | All augmented assignments work |
| `raise X from Y` exception chaining | Sets `__cause__` on the thrown exception; `from None` also supported |
| Starred assignment `a, *b, c = ...` | Works |
| `[*a, 1, *b]` list spread | Works; any iterable; translates to `[...a, 1, ...b]` |
| `{*a, 1, *b}` set spread | Works; translates to `ρσ_set([...a, 1, ...b])` |
| `**expr` in function calls | Works with any expression (variable, attr access, call, dict literal), not just plain names |
| `@classmethod`, `@staticmethod`, `@property` / `@prop.setter` | All work |
| `{**dict1, **dict2}` dict spread | Works as merge replacement for the missing `\|` operator |
| `dict.fromkeys()` | Works with `dict_literals` flag |
| Chained comparisons `a < b < c` and `a < b > c` | Same-direction and mixed-direction chains both work; middle operand evaluated once |
| `for`, `while`, `try/except/finally`, `with`, `match/case` | All control-flow constructs work |
| Classes, inheritance, decorators, `__dunder__` methods | Fully supported |
| Nested class definitions | Accessible as `Outer.Inner` and via instance (`self.Inner`); arbitrary nesting depth; nested class may inherit from outer-scope classes |
| List / dict / set comprehensions, generator expressions | Fully supported |
| f-strings, `str.format()`, `format()` builtin, all common `str.*` methods | Fully supported |
| `abs()`, `divmod()`, `any()`, `all()`, `sum()`, `min()`, `max()` | All work |
| `sorted()`, `reversed()`, `zip()`, `map()`, `filter()` | All work |
| `set` with full union/intersection/difference API | Fully supported |
| `isinstance()`, `hasattr()`, `getattr()`, `setattr()`, `dir()` | All work |
| `bin()`, `hex()`, `oct()`, `chr()`, `ord()` | All work |
| `int(x, base)`, `float(x)` with ValueError on bad input | Works |
| `lambda` keyword | Full support: args, defaults, `*args`, ternary body, closures, nesting |
| Arithmetic operator overloading — `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__`, `__neg__`, `__pos__`, `__abs__`, `__invert__`, `__lshift__`, `__rshift__`, `__and__`, `__or__`, `__xor__`, `__radd__`, `__iadd__` etc. | Dispatched when `from __python__ import overload_operators` is active; comparison operators (`<`, `>`, `<=`, `>=`) are **not** re-dispatched — call `obj.__lt__(other)` directly |
| Nested comprehensions (multi-`for` clause) | `[x for row in matrix for x in row if cond]`; works for list, set, and dict comprehensions |
| Positional-only parameters `def f(a, b, /):` | Full support — parser enforces placement; runtime passes positional args correctly |
| Keyword-only parameters `def f(a, *, b):` | Full support — bare `*` separator enforced; `b` must be passed as keyword |
| Walrus operator `:=` | Fully supported: hoisted in `if`/`while` conditions at any scope; comprehension filter assigns to enclosing scope (Python-correct). |
| `__call__` dunder dispatch | `obj()` dispatches to `obj.__call__(args)` for callable objects; `callable(obj)` also returns `True`; both forms work. Requires `from __python__ import truthiness`. |
| **Truthiness / `__bool__`** | Full Python truthiness via `from __python__ import truthiness`: empty `[]`, `{}`, `set()`, `''` are falsy; `__bool__` is dispatched; `and`/`or` return operand values; `not`, `if`, `while`, `assert`, ternary all use `ρσ_bool()`. |
| `frozenset(iterable)` | Immutable set: construction from list/set/iterable; `in`, `len()`, iteration, `copy()`, `union()`, `intersection()`, `difference()`, `symmetric_difference()`, `issubset()`, `issuperset()`, `isdisjoint()` — all return `frozenset`. `isinstance(x, frozenset)` works. Compares equal to a `set` with the same elements via `__eq__`. No mutation methods (`add`, `remove`, etc.). |
| `issubclass(cls, classinfo)` | Checks prototype chain; `classinfo` may be a class or tuple of classes; every class is a subclass of itself; raises `TypeError` for non-class arguments. |
| `hash(obj)` and `__hash__` dunder | Numbers hash by value (int identity, float → int form if whole); strings use djb2; `None` → 0; booleans → 0/1; `def __hash__(self)` in a class is dispatched by `hash()`; class instances without `__hash__` get a stable identity hash; defining `__eq__` without `__hash__` makes the class unhashable (Python semantics — `hash()` raises `TypeError`); `list`, `set`, `dict` raise `TypeError`. |
| `__getattr__` / `__setattr__` / `__delattr__` / `__getattribute__` dunders | Full attribute-access interception via JS `Proxy`. Classes defining any of these automatically wrap instances. `__getattr__` is called only for missing attributes; `__getattribute__` overrides all lookups; `__setattr__` intercepts every assignment (including those in `__init__`); `__delattr__` intercepts `del obj.attr`. Use `object.__setattr__(self, name, value)` / `object.__getattribute__(self, name)` / `object.__delattr__(self, name)` (compiled to `ρσ_object_setattr` / `ρσ_object_getattr` / `ρσ_object_delattr`) to bypass the hooks and avoid infinite recursion. Subclasses automatically inherit proxy wrapping. Requires a JS environment that supports `Proxy`; gracefully degrades to plain attribute access in environments without `Proxy`. |
| `__class_getitem__` dunder | `Class[item]` dispatches at compile time to `Class.__class_getitem__(item)`. Behaves as an implicit `@classmethod`: `cls` is bound to the calling class. Subclasses inherit `__class_getitem__` and receive the subclass as `cls`. Multi-argument subscripts (`Class[A, B]`) are passed as a JS array. |
| `__init_subclass__` hook | Called automatically on the parent class whenever a subclass is created (e.g. `class Child(Base):`). Implicit `@classmethod`: `cls` receives the new subclass. Keyword arguments in the class header (`class Child(Base, tag='x'):`) are forwarded to `__init_subclass__` as keyword arguments. `super().__init_subclass__(**kwargs)` propagates up the hierarchy. No explicit call needed — the compiler emits it after inheritance setup and identity properties are assigned. |
| `next(iterator[, default])` | Advances a JS-protocol iterator (`{done, value}`); returns `default` when exhausted if provided, otherwise raises `StopIteration`. Works with `iter()`, `range()`, `enumerate()`, generators, and any object with a `.next()` or `__next__()` method. |
| `StopIteration` exception | Defined as a builtin exception class; raised by `next()` when an iterator is exhausted and no default is given. |
| `iter(callable, sentinel)` | Two-argument form calls `callable` (no args) repeatedly until the return value equals `sentinel` (strict `===`). Returns a lazy iterator compatible with `for` loops, `next()`, `list()`, and all iterator consumers. Works with plain functions and callable objects (`__call__`). |
| `dict \| dict` and `dict \|= dict` (Python 3.9+) | Dict merge via `\|` creates a new merged dict (right-side values win); `\|=` updates in-place. Requires `from __python__ import overload_operators, dict_literals`. |
| `slice(start, stop[, step])` | Full Python `slice` class: 1-, 2-, and 3-argument forms; `.start`, `.stop`, `.step` attributes; `.indices(length)` → `(start, stop, step)`; `str()` / `repr()`; `isinstance(s, slice)`; equality `==`; use as subscript `lst[s]` (read, write, `del`) all work. |
| `__import__(name[, globals, locals, fromlist, level])` | Runtime lookup in the compiled module registry (`ρσ_modules`). Without `fromlist` (or empty `fromlist`) returns the top-level package, matching Python's semantics. `ImportError` / `ModuleNotFoundError` raised for unknown modules. **Constraint**: the module must have been statically imported elsewhere in the source so it is present in `ρσ_modules`. |
| `ImportError`, `ModuleNotFoundError` | Both defined as runtime exception classes; `ModuleNotFoundError` is a subclass of `ImportError` (same as Python 3.6+). |

---

## ❌ Not Supported — Missing from Baselib (runtime)

| Feature                             | Priority                                                               |
|-------------------------------------|------------------------------------------------------------------------|
| `vars()` / `locals()` / `globals()` | 🟢 Low — not defined; use direct attribute access                      |
| `int.bit_length()`                  | 🟢 Low — useful for bit manipulation                                   |
| `float.is_integer()`                | 🟢 Low                                                                 |
| `exec(code)`                        | 🟢 Low — use `v'eval(...)'` for inline JS evaluation                  |
| `eval(expr)`                        | 🟢 Low — use `v'eval(...)'` for inline JS evaluation                  |
| `input(prompt)`                     | 🟢 Low — not built in; use `prompt()` via `v'prompt(...)'`            |
| `bytes(x)` / `bytearray(x)`        | 🟢 Low — no built-in bytes type; use `Uint8Array` via verbatim JS     |
| `object()`                          | 🟢 Low — base `object` type not exposed; use plain `{}` or a class    |
| `abc` module — `ABC`, `@abstractmethod`, `Protocol` | 🟢 Low — no abc module; no enforcement of abstract methods |
| `complex(real, imag)`               | 🟢 Low — no complex number type                                        |
| `compile()`                         | 🔴 N/A — Python compile/code objects have no JS equivalent            |
| `memoryview(obj)`                   | 🔴 N/A — no buffer protocol in browser context                        |
| `open(path)`                        | 🔴 N/A — no filesystem access in browser context                      |

---

## ❌ Not Supported — Parser / Syntax Level

| Feature                                       | Priority                                                             |
|-----------------------------------------------|----------------------------------------------------------------------|
| `from module import *` (star imports)         | 🟢 Low — intentionally unsupported (by design, to prevent namespace pollution) |
| `zip(strict=True)`                            | 🟢 Low                                                               |
| `__slots__` enforcement                       | 🟢 Low — accepted but does not restrict attribute assignment         |
| Complex number literals `3+4j`                | 🟢 Low — no `j` suffix; no complex type                              |
| `b'...'` bytes literals                       | 🟢 Low — no `b` prefix; use the `encodings` module for encoding work |
| `__del__` destructor / finalizer              | 🟢 Low — JS has no guaranteed finalizer                              |
| `__format__` dunder                           | 🟢 Low — `format()` builtin not defined; `__format__` not dispatched |

---

## Standard Library Modules

Modules with a `src/lib/` implementation available are marked ✅. All others are absent.

| Module        | Status      | Notes                                                                                         |
|---------------|-------------|-----------------------------------------------------------------------------------------------|
| `math`        | ✅           | Full implementation in `src/lib/math.pyj`                                                     |
| `random`      | ✅           | RC4-seeded PRNG in `src/lib/random.pyj`                                                       |
| `re`          | ✅           | Regex wrapper in `src/lib/re.pyj`;  limited vs full PCRE (no lookbehind, limited unicode, no conditional groups); `MatchObject.start()`/`.end()` may return incorrect values for sub-groups in nested-capture patterns (JS regex API does not expose sub-group positions) |
| `encodings`   | ✅           | Base64 and encoding helpers; partial `base64` coverage                                        |
| `collections` | ✅           | `defaultdict`, `Counter`, `OrderedDict`, `deque`                                              |
| `functools`   | ✅           | `reduce`, `partial`, `wraps`, `lru_cache`                                                     |
| `itertools`   | ✅           | Common iteration tools                                                                        |
| `numpy`       | ✅           | Full numpy-like library in `src/lib/numpy.pyj`; `numpy.random` and `numpy.linalg` sub-modules |
| `copy`        | ✅           | `copy()` shallow copy and `deepcopy()` (circular-ref-safe via memo Map); `__copy__` / `__deepcopy__(memo)` hooks honoured; handles list, set, frozenset, dict, class instances, and plain JS objects |
| `typing`      | ❌           | `List`, `Dict`, `Optional`, `Union`, `Tuple`, `Generic`, `TypeVar` — none available           |
| `dataclasses` | ❌           | `@dataclass`, `field()`, `asdict()`, `astuple()` not available                                |
| `contextlib`  | ❌           | `contextmanager`, `suppress`, `ExitStack`, `asynccontextmanager` not available                |
| `string`      | ❌           | Character constants, `Template`, `Formatter` not available                                    |
| `json`        | ❌           | No Python wrapper; JS `JSON.parse` / `JSON.stringify` work directly via verbatim JS           |
| `datetime`    | ❌           | `date`, `time`, `datetime`, `timedelta` not available                                         |
| `inspect`     | ❌           | `signature`, `getmembers`, `isfunction` etc. not available                                    |
| `asyncio`     | ❌           | Event loop, `gather`, `sleep`, `Queue`, `Task` wrappers not available; use `async`/`await`    |
| `enum`        | ❌           | `Enum`, `IntEnum`, `Flag` not available                                                       |
| `abc`         | ❌           | `ABC`, `abstractmethod` not available                                                         |
| `io`          | ❌           | `StringIO`, `BytesIO` not available                                                           |
| `struct`      | ❌           | Binary packing/unpacking not available                                                        |
| `hashlib`     | ❌           | MD5, SHA-256 etc. not available; use Web Crypto API via verbatim JS                           |
| `hmac`        | ❌           | Keyed hashing not available                                                                   |
| `base64`      | ❌ (partial) | Partial coverage via `encodings` module; no full `base64` module                              |
| `urllib`      | ❌           | URL parsing/encoding (`urllib.parse`) not available; use JS `URL` API                         |
| `html`        | ❌           | `escape`, `unescape` not available; use JS DOM APIs                                           |
| `csv`         | ❌           | CSV parsing not available                                                                     |
| `textwrap`    | ❌           | `wrap`, `fill`, `dedent`, `indent` not available                                              |
| `pprint`      | ❌           | Pretty-printing not available                                                                 |
| `logging`     | ❌           | Logging framework not available; use `console.*` directly                                     |
| `unittest`    | ❌           | Not available; RapydScript uses a custom test runner (`node bin/rapydscript test`)            |

---

## Semantic Differences

Features that exist in RapydScript but behave differently from standard Python:

| Feature | Python Behavior | RapydScript Behavior |
|---|---|---|
| Truthiness of `[]` / `{}` | `False` | `True` (JS semantics) unless `from __python__ import truthiness` is active |
| `is` / `is not` | Object identity | Strict equality `===` / `!==` |
| `//` floor division on floats | `math.floor(a/b)` always | Correct for integers; uses `Math.floor` (same result for well-behaved floats) |
| `%` on negative numbers | Python modulo (always non-negative) | JS remainder (can be negative) |
| `int` / `float` distinction | Separate types | Both are JS `number`; `isinstance(x, int)` and `isinstance(x, float)` use heuristics |
| `str * n` repetition | Always works | Requires `from __python__ import overload_operators` |
| Unbound method references | Methods are unbound by default | Same — but storing a method in a variable without the `bound_methods` compiler flag loses `self` binding |
| `dict` key ordering | Insertion order guaranteed (3.7+) | Depends on JS engine (V8 preserves insertion order in practice) |
| `global` / `nonlocal` scoping | Full cross-scope declaration | `global` works for module-level; if a variable exists in both an intermediate outer scope **and** the module-level scope, the outer scope takes precedence (differs from Python where `global` always forces module-level) |
| `Exception.message` | Not standard; use `.args[0]` | `.message` is the standard attribute (JS `Error` style) |
| `re` module | Full PCRE (lookbehind, full unicode, conditional groups) | No lookbehind; limited unicode property escapes; no `(?(1)...)` conditional groups |
| `parenthesized with (A() as a, B() as b):` | Multiple context managers in parenthesized form (3.10+) | Not meaningful in a browser/event-driven context; multi-context `with` without parens works |
| Function call argument count | Too few args → `TypeError`; too many → `TypeError` | Too few args → extra params are `undefined`; too many → extras silently discarded. No `TypeError` is raised in either case. |
| Positional-only param enforcement | Passing by keyword raises `TypeError` | Passing by keyword is silently ignored — the named arg is discarded and the parameter gets `undefined` (no error raised) |
| Keyword-only param enforcement | Passing positionally raises `TypeError` | Passing positionally raises no error — the extra positional arg is silently discarded and the default value is used |
| `is` / `is not` with `NaN` | `math.nan is math.nan` → `True` (same object) | `x is NaN` compiles to `isNaN(x)` (not `x === NaN`), making NaN checks work correctly |
| Arithmetic type coercion | `1 + '1'` raises `TypeError` | `1 + '1'` → `'11'`; JS coerces the number to a string |
| `<`, `>`, `<=`, `>=` on lists / containers | Element-wise lexicographic comparison | Falls through to JS coercion — operands are stringified first (e.g. `[10] < [9]` is `True` because `'[10]' < '[9]'`). Comparison dunders (`__lt__` etc.) can be defined and called directly but are not auto-dispatched by these operators. |
| Default `{}` dict — missing key | `KeyError` raised | Returns `undefined`; use `from __python__ import dict_literals, overload_getitem` to get `KeyError` |
| Default `{}` dict — numeric keys | Integer keys are stored as integers | Numeric keys are auto-coerced to strings by the JS engine: `d[1]` and `d['1']` refer to the same slot |
| Default `{}` dict — attribute access | `d.foo` raises `AttributeError` | `d.foo` and `d['foo']` access the same slot; keys are also properties |
| Default `{}` dict — Python dict methods | `.keys()`, `.values()`, `.items()`, `.get()`, `.pop()`, `.update()` all available | None of these methods exist on a plain JS object dict; use `from __python__ import dict_literals` for full Python dict semantics |
| String methods on instances | `'hello'.strip()` works directly | Python string methods live on the `str` module object (`str.strip(s)`), not on string instances. JS native methods (`.toUpperCase()`, `.trim()`, etc.) work on instances. Call `from pythonize import strings; strings()` to copy Python methods onto string instances. |
| `strings()` — `split()` / `replace()` | `'a b'.split()` splits on whitespace; `'aaa'.replace('a','b')` replaces all | After `strings()`, `split()` and `replace()` are **intentionally left** as JS versions: no-arg `.split()` returns a one-element array; `.replace(str, str)` replaces only the first occurrence. Use `str.split(s)` / `str.replace(s, old, new)` for Python semantics. |
| String encoding | Unicode strings (full code-point aware) | UTF-16 — non-BMP characters (e.g. emoji) are stored as surrogate pairs. Use `str.uchrs()`, `str.uslice()`, `str.ulen()` for code-point-aware operations. |
| Multiple inheritance MRO | C3 linearization (MRO) always deterministic | Built on JS prototype chain; may differ from Python's C3 MRO in complex or diamond-inheritance hierarchies |
| Generators — output format | Native Python generator objects | Down-compiled to ES5 state-machine switch statements by default; pass `--js-version 6` for native ES6 generators (smaller and faster) |
| Reserved keywords | Python keywords only | All JavaScript reserved words (`default`, `switch`, `delete`, `void`, `typeof`, etc.) are also reserved in RapydScript, since it compiles to JS |

---

## Test File

`test/python_features.pyj` contains runnable assertions for all features surveyed.
Features that are not supported have their test code commented out with a `# SKIP:` label
and an explanation. Run with:

```sh
node bin/rapydscript test python_features
```
