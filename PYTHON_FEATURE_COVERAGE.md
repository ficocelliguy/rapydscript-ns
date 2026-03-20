# Python Feature Coverage Report — RapydScript-NS

## ✅ Fully Supported

| Feature | Notes |
|---|---|
| `super()` — 0-arg and 2-arg forms | `super().method()` and `super(Cls, self).method()` both work |
| `except TypeA, TypeB as e:` | RapydScript comma-separated form; catches multiple exception types |
| `except (TypeA, TypeError) as e:` | Tuple form also supported |
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
| `str * n` string repetition | Works when `from __python__ import overload_operators` is active |
| `list * n` / `n * list` | Works with `overload_operators`; returns a proper RapydScript list |
| `match / case` | Structural pattern matching (Python 3.10) fully supported |
| Variable type annotations `x: int = 1` | Parsed and ignored (no runtime enforcement); annotated assignments work normally |
| Ellipsis literal `...` as expression | Parsed as a valid expression; evaluates to JS `undefined` at runtime |
| Generator `.throw()` | Works via JS generator protocol |
| Generator `.send()` | Works via `g.next(value)` |
| `yield from` | Works; return value of sub-generator is not accessible |
| `+=`, `-=`, `*=`, `/=`, `//=`, `**=`, `%=`, `&=`, `\|=`, `^=`, `<<=`, `>>=` | All augmented assignments work |
| `raise X from Y` exception chaining | Sets `__cause__` on the thrown exception; `from None` also supported |
| Starred assignment `a, *b, c = ...` | Works |
| `@classmethod`, `@staticmethod`, `@property` / `@prop.setter` | All work |
| `{**dict1, **dict2}` dict spread | Works as merge replacement for the missing `\|` operator |
| `dict.fromkeys()` | Works with `dict_literals` flag |
| Chained comparisons `a < b < c` and `a < b > c` | Same-direction and mixed-direction chains both work; middle operand evaluated once |
| `for`, `while`, `try/except/finally`, `with`, `match/case` | All control-flow constructs work |
| Classes, inheritance, decorators, `__dunder__` methods | Fully supported |
| List / dict / set comprehensions, generator expressions | Fully supported |
| f-strings, `str.format()`, all common `str.*` methods | Fully supported |
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
| `hash(obj)` | Numbers hash by value (int identity, float → int form if whole); strings use djb2; `None` → 0; booleans → 0/1; objects with `__hash__` dispatch to it; class instances get a stable identity hash; `list`, `set`, `dict` raise `TypeError`. |
| `next(iterator[, default])` | Advances a JS-protocol iterator (`{done, value}`); returns `default` when exhausted if provided, otherwise raises `StopIteration`. Works with `iter()`, `range()`, `enumerate()`, generators, and any object with a `.next()` or `__next__()` method. |
| `StopIteration` exception | Defined as a builtin exception class; raised by `next()` when an iterator is exhausted and no default is given. |
| `dict \| dict` and `dict \|= dict` (Python 3.9+) | Dict merge via `\|` creates a new merged dict (right-side values win); `\|=` updates in-place. Requires `from __python__ import overload_operators, dict_literals`. |

---

## ❌ Not Supported — Missing from Baselib (runtime)

| Feature                             | Priority                                                               |
|-------------------------------------|------------------------------------------------------------------------|
| `format(value[, spec])`             | 🟢 Low — not a builtin; `str.format()` and f-strings work              |
| `iter(callable, sentinel)`          | 🟢 Low — two-arg form not supported; single-arg `iter(iterable)` works |
| `slice(start, stop[, step])`        | 🟢 Low — not a builtin object; list slicing syntax `a[1:5:2]` works    |
| `complex(real, imag)`               | 🟢 Low — no complex number type                                        |
| `vars()` / `locals()` / `globals()` | 🟢 Low — not defined; use direct attribute access                      |
| `str.expandtabs(tabsize)`           | 🟢 Low                                                                 |
| `int.bit_length()`                  | 🟢 Low — useful for bit manipulation                                   |
| `float.is_integer()`                | 🟢 Low                                                                 |
| `exec(code)`                        | 🟢 Low — use `v'eval(...)'` for inline JS evaluation                  |
| `eval(expr)`                        | 🟢 Low — use `v'eval(...)'` for inline JS evaluation                  |
| `compile()`                         | 🔴 N/A — Python compile/code objects have no JS equivalent            |
| `__import__(name)`                  | 🟢 Low — not supported; use `import` statement                        |
| `input(prompt)`                     | 🟢 Low — not built in; use `prompt()` via `v'prompt(...)'`            |
| `open(path)`                        | 🔴 N/A — no filesystem access in browser context                      |
| `bytes(x)` / `bytearray(x)`        | 🟢 Low — no built-in bytes type; use `Uint8Array` via verbatim JS     |
| `memoryview(obj)`                   | 🔴 N/A — no buffer protocol in browser context                        |
| `object()`                          | 🟢 Low — base `object` type not exposed; use plain `{}` or a class    |
| `abc` module — `ABC`, `@abstractmethod`, `Protocol` | 🟢 Low — no abc module; no enforcement of abstract methods |

---

## ❌ Not Supported — Parser / Syntax Level

| Feature                                       | Priority                                                             |
|-----------------------------------------------|----------------------------------------------------------------------|
| `zip(strict=True)`                            | 🟢 Low                                                               |
| Nested class definitions                      | 🟢 Low — noted as not yet fully implemented                          |
| `__slots__` enforcement                       | 🟢 Low — accepted but does not restrict attribute assignment         |
| Complex number literals `3+4j`                | 🟢 Low — no `j` suffix; no complex type                              |
| `b'...'` bytes literals                       | 🟢 Low — no `b` prefix; use the `encodings` module for encoding work |
| `except*` (exception groups, Python 3.11+)    | 🟢 Low — no parser support                                           |
| `__new__` constructor hook                    | 🟢 Low — no alternative constructor support                          |
| `__del__` destructor / finalizer              | 🟢 Low — JS has no guaranteed finalizer                              |
| `__hash__` dunder                             | 🟢 Low — not dispatched; set/dict use `===` object identity          |
| `__getattr__` / `__setattr__` / `__delattr__` | 🟢 Low — no attribute-access interception                            |
| `__getattribute__`                            | 🟢 Low — no attribute-lookup override                                |
| `__format__` dunder                           | 🟢 Low — `format()` builtin not defined; `__format__` not dispatched |
| `__class_getitem__`                           | 🟢 Low — no `MyClass[T]` generic subscript syntax                    |
| `__init_subclass__` hook                      | 🟢 Low                                                               |

---

## Standard Library Modules

Modules with a `src/lib/` implementation available are marked ✅. All others are absent.

| Module | Status | Notes |
|---|---|---|
| `math` | ✅ | Full implementation in `src/lib/math.pyj` |
| `random` | ✅ | RC4-seeded PRNG in `src/lib/random.pyj` |
| `re` | ✅ | Regex wrapper in `src/lib/re.pyj`; limited vs full PCRE (no lookbehind, limited unicode, no conditional groups) |
| `encodings` | ✅ | Base64 and encoding helpers; partial `base64` coverage |
| `collections` | ✅ | `defaultdict`, `Counter`, `OrderedDict`, `deque` |
| `functools` | ✅ | `reduce`, `partial`, `wraps`, `lru_cache` |
| `itertools` | ✅ | Common iteration tools |
| `numpy` | ✅ | Full numpy-like library in `src/lib/numpy.pyj`; `numpy.random` and `numpy.linalg` sub-modules |
| `typing` | ❌ | `List`, `Dict`, `Optional`, `Union`, `Tuple`, `Generic`, `TypeVar` — none available |
| `dataclasses` | ❌ | `@dataclass`, `field()`, `asdict()`, `astuple()` not available |
| `contextlib` | ❌ | `contextmanager`, `suppress`, `ExitStack`, `asynccontextmanager` not available |
| `copy` | ❌ | `copy()` / `deepcopy()` not available |
| `string` | ❌ | Character constants, `Template`, `Formatter` not available |
| `json` | ❌ | No Python wrapper; JS `JSON.parse` / `JSON.stringify` work directly via verbatim JS |
| `datetime` | ❌ | `date`, `time`, `datetime`, `timedelta` not available |
| `inspect` | ❌ | `signature`, `getmembers`, `isfunction` etc. not available |
| `asyncio` | ❌ | Event loop, `gather`, `sleep`, `Queue`, `Task` wrappers not available; use `async`/`await` with JS Promises directly |
| `enum` | ❌ | `Enum`, `IntEnum`, `Flag` not available |
| `abc` | ❌ | `ABC`, `abstractmethod` not available |
| `io` | ❌ | `StringIO`, `BytesIO` not available |
| `struct` | ❌ | Binary packing/unpacking not available |
| `hashlib` | ❌ | MD5, SHA-256 etc. not available; use Web Crypto API via verbatim JS |
| `hmac` | ❌ | Keyed hashing not available |
| `base64` | ❌ (partial) | Partial coverage via `encodings` module; no full `base64` module |
| `urllib` | ❌ | URL parsing/encoding (`urllib.parse`) not available; use JS `URL` API |
| `html` | ❌ | `escape`, `unescape` not available; use JS DOM APIs |
| `csv` | ❌ | CSV parsing not available |
| `textwrap` | ❌ | `wrap`, `fill`, `dedent`, `indent` not available |
| `pprint` | ❌ | Pretty-printing not available |
| `logging` | ❌ | Logging framework not available; use `console.*` directly |
| `unittest` | ❌ | Not available; RapydScript uses a custom test runner (`node bin/rapydscript test`) |

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
| `.sort()` / `.pop()` | Standard list methods | Renamed to `.pysort()` / `.pypop()` to avoid shadowing JS array methods |
| Unbound method references | Methods are unbound by default | Same — but storing a method in a variable without the `bound_methods` compiler flag loses `self` binding |
| `dict` key ordering | Insertion order guaranteed (3.7+) | Depends on JS engine (V8 preserves insertion order in practice) |
| `global` / `nonlocal` scoping | Full cross-scope declaration | `global` works for module-level; interactions with `nonlocal` can be confusing in nested closures |
| `Exception.message` | Not standard; use `.args[0]` | `.message` is the standard attribute (JS `Error` style) |
| `re` module | Full PCRE (lookbehind, full unicode, conditional groups) | No lookbehind; limited unicode property escapes; no `(?(1)...)` conditional groups |
| `parenthesized with (A() as a, B() as b):` | Multiple context managers in parenthesized form (3.10+) | Not meaningful in a browser/event-driven context; multi-context `with` without parens works |

---

## Test File

`test/python_features.pyj` contains runnable assertions for all features surveyed.
Features that are not supported have their test code commented out with a `# SKIP:` label
and an explanation. Run with:

```sh
node bin/rapydscript test python_features
```
