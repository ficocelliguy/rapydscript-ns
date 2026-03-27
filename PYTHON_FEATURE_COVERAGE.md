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
| `str.expandtabs(tabsize=8)` | Replaces `\t` with spaces to the next tab stop; `\n`/`\r` reset the column counter; `tabsize=0` removes all tabs; available as an instance method on any string (via the default `pythonize_strings` patch) |
| `str * n` string repetition | Works (via `overload_operators`, on by default) |
| `list * n` / `n * list` | Works (via `overload_operators`); returns a proper RapydScript list |
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
| `dict.fromkeys()` | Works (via `dict_literals`, on by default) |
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
| Arithmetic operator overloading — `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__`, `__neg__`, `__pos__`, `__abs__`, `__invert__`, `__lshift__`, `__rshift__`, `__and__`, `__or__`, `__xor__`, `__radd__`, `__iadd__` etc. | Dispatched via `overload_operators` (on by default); comparison operators (`<`, `>`, `<=`, `>=`) are **not** re-dispatched — call `obj.__lt__(other)` directly |
| Nested comprehensions (multi-`for` clause) | `[x for row in matrix for x in row if cond]`; works for list, set, and dict comprehensions |
| Positional-only parameters `def f(a, b, /):` | Full support — parser enforces placement; runtime passes positional args correctly |
| Keyword-only parameters `def f(a, *, b):` | Full support — bare `*` separator enforced; `b` must be passed as keyword |
| Walrus operator `:=` | Fully supported: hoisted in `if`/`while` conditions at any scope; comprehension filter assigns to enclosing scope (Python-correct). |
| `__call__` dunder dispatch | `obj()` dispatches to `obj.__call__(args)` for callable objects; `callable(obj)` also returns `True`; both forms work. Active via `truthiness` (on by default). |
| **Truthiness / `__bool__`** | Full Python truthiness via `truthiness` (on by default): empty `[]`, `{}`, `set()`, `''` are falsy; `__bool__` is dispatched; `and`/`or` return operand values; `not`, `if`, `while`, `assert`, ternary all use `ρσ_bool()`. |
| `frozenset(iterable)` | Immutable set: construction from list/set/iterable; `in`, `len()`, iteration, `copy()`, `union()`, `intersection()`, `difference()`, `symmetric_difference()`, `issubset()`, `issuperset()`, `isdisjoint()` — all return `frozenset`. `isinstance(x, frozenset)` works. Compares equal to a `set` with the same elements via `__eq__`. No mutation methods (`add`, `remove`, etc.). |
| `issubclass(cls, classinfo)` | Checks prototype chain; `classinfo` may be a class or tuple of classes; every class is a subclass of itself; raises `TypeError` for non-class arguments. |
| `hash(obj)` and `__hash__` dunder | Numbers hash by value (int identity, float → int form if whole); strings use djb2; `None` → 0; booleans → 0/1; `def __hash__(self)` in a class is dispatched by `hash()`; class instances without `__hash__` get a stable identity hash; defining `__eq__` without `__hash__` makes the class unhashable (Python semantics — `hash()` raises `TypeError`); `list`, `set`, `dict` raise `TypeError`. |
| `__getattr__` / `__setattr__` / `__delattr__` / `__getattribute__` dunders | Full attribute-access interception via JS `Proxy`. Classes defining any of these automatically wrap instances. `__getattr__` is called only for missing attributes; `__getattribute__` overrides all lookups; `__setattr__` intercepts every assignment (including those in `__init__`); `__delattr__` intercepts `del obj.attr`. Use `object.__setattr__(self, name, value)` / `object.__getattribute__(self, name)` / `object.__delattr__(self, name)` (compiled to `ρσ_object_setattr` / `ρσ_object_getattr` / `ρσ_object_delattr`) to bypass the hooks and avoid infinite recursion. Subclasses automatically inherit proxy wrapping. Requires a JS environment that supports `Proxy`; gracefully degrades to plain attribute access in environments without `Proxy`. |
| `__class_getitem__` dunder | `Class[item]` dispatches at compile time to `Class.__class_getitem__(item)`. Behaves as an implicit `@classmethod`: `cls` is bound to the calling class. Subclasses inherit `__class_getitem__` and receive the subclass as `cls`. Multi-argument subscripts (`Class[A, B]`) are passed as a JS array. |
| `__init_subclass__` hook | Called automatically on the parent class whenever a subclass is created (e.g. `class Child(Base):`). Implicit `@classmethod`: `cls` receives the new subclass. Keyword arguments in the class header (`class Child(Base, tag='x'):`) are forwarded to `__init_subclass__` as keyword arguments. `super().__init_subclass__(**kwargs)` propagates up the hierarchy. No explicit call needed — the compiler emits it after inheritance setup and identity properties are assigned. |
| `next(iterator[, default])` | Advances a JS-protocol iterator (`{done, value}`); returns `default` when exhausted if provided, otherwise raises `StopIteration`. Works with `iter()`, `range()`, `enumerate()`, generators, and any object with a `.next()` or `__next__()` method. |
| `StopIteration` exception | Defined as a builtin exception class; raised by `next()` when an iterator is exhausted and no default is given. |
| `iter(callable, sentinel)` | Two-argument form calls `callable` (no args) repeatedly until the return value equals `sentinel` (strict `===`). Returns a lazy iterator compatible with `for` loops, `next()`, `list()`, and all iterator consumers. Works with plain functions and callable objects (`__call__`). |
| `dict \| dict` and `dict \|= dict` (Python 3.9+) | Dict merge via `\|` creates a new merged dict (right-side values win); `\|=` updates in-place. Active via `overload_operators` + `dict_literals` (both on by default). |
| `__format__` dunder                           | `format()`, `str.format()`, and f-strings all dispatch to `__format__`; default `__format__` auto-generated for classes (returns `__str__()` for empty spec, raises `TypeError` for non-empty spec); `!r`/`!s`/`!a` transformers bypass `__format__` correctly |
| `slice(start, stop[, step])` | Full Python `slice` class: 1-, 2-, and 3-argument forms; `.start`, `.stop`, `.step` attributes; `.indices(length)` → `(start, stop, step)`; `str()` / `repr()`; `isinstance(s, slice)`; equality `==`; use as subscript `lst[s]` (read, write, `del`) all work. |
| `__import__(name[, globals, locals, fromlist, level])` | Runtime lookup in the compiled module registry (`ρσ_modules`). Without `fromlist` (or empty `fromlist`) returns the top-level package, matching Python's semantics. `ImportError` / `ModuleNotFoundError` raised for unknown modules. **Constraint**: the module must have been statically imported elsewhere in the source so it is present in `ρσ_modules`. |
| `ImportError`, `ModuleNotFoundError` | Both defined as runtime exception classes; `ModuleNotFoundError` is a subclass of `ImportError` (same as Python 3.6+). |
| `bytes(source[, encoding[, errors]])` and `bytearray(source[, encoding[, errors]])` | Full Python semantics: construction from integer (n zero bytes), list/iterable of ints (0–255), string + encoding (`utf-8`, `latin-1`, `ascii`), `Uint8Array`, or another `bytes`/`bytearray`. Key methods: `hex([sep[, bytes_per_sep]])`, `decode(encoding)`, `fromhex(s)` (static), `count`, `find`, `rfind`, `index`, `rindex`, `startswith`, `endswith`, `join`, `split`, `replace`, `strip`, `lstrip`, `rstrip`, `upper`, `lower`, `copy`. `bytearray` adds: `append`, `extend`, `insert`, `pop`, `remove`, `reverse`, `clear`, `__setitem__` (single and slice). Slicing returns a new `bytes`/`bytearray`. `+` concatenates; `*` repeats; `==` compares element-wise; `in` tests integer or subsequence membership; `isinstance(x, bytes)` / `isinstance(x, bytearray)` work; `bytearray` is a subclass of `bytes`. `repr()` returns `b'...'` notation. `Uint8Array` values may be passed anywhere a `bytes`-like object is accepted. |
| `object()` | Featureless base-class instance: `object()` returns a unique instance; `isinstance(x, object)` works; `class Foo(object):` explicit base works; `repr()` → `'<object object at 0x…>'`; `hash()` returns a stable identity hash; each call returns a distinct object suitable as a sentinel value. Note: unlike CPython, JS objects are open, so arbitrary attributes can be set on `object()` instances. |
| `float.is_integer()` | Returns `True` if the float has no fractional part (i.e. is a whole number), `False` otherwise. `float('inf').is_integer()` and `float('nan').is_integer()` both return `False`, matching Python semantics. Added to `Number.prototype` in the baselib so it works on any numeric literal or variable. |
| `int.bit_length()` | Returns the number of bits needed to represent the integer in binary, excluding the sign and leading zeros. `(0).bit_length()` → `0`; `(255).bit_length()` → `8`; `(256).bit_length()` → `9`; sign is ignored (`(-5).bit_length()` → `3`). Added to `Number.prototype` in the baselib. |
| Arithmetic type coercion — `TypeError` on incompatible operands | `1 + '1'` raises `TypeError: unsupported operand type(s) for +: 'int' and 'str'`; all arithmetic operators (`+`, `-`, `*`, `/`, `//`, `%`, `**`) enforce compatible types in their `ρσ_op_*` helpers. `bool` is treated as numeric (like Python's `int` subclass). Activated by `overload_operators` (on by default). String `+` string and numeric `+` numeric are allowed; mixed types raise `TypeError` with a Python-style message. |
| `eval(expr[, globals[, locals]])` | String literals are compiled as **RapydScript source** at compile time (the compiler parses and transpiles the string, just like Python's `eval` takes Python source). `eval(expr)` maps to native JS direct `eval` for scope access. `eval(expr, globals)` / `eval(expr, globals, locals)` use `Function` constructor with explicit bindings; `locals` override `globals`. Runtime `ρσ_` helpers referenced in the compiled string are automatically injected into the Function scope. Only string *literals* are transformed at compile time; dynamic strings are passed through unchanged. |
| `exec(code[, globals[, locals]])` | String literals are compiled as **RapydScript source** at compile time. Executes the compiled code string; always returns `None`. Without `globals`/`locals` uses native `eval` (scope access). With `globals`/`locals` uses `Function` constructor — mutable objects (lists, dicts) passed in `globals` are accessible by reference, so side-effects are visible after the call. `ρσ_dict` instances (created when `dict_literals` flag is active) are correctly unwrapped via their `jsmap` backing store. |

---

## Python Compatibility Flags (Default-On)

All flags below are enabled by default. They can be turned off per-file, per-scope, or globally via the CLI.

### Opt-out: per-file or per-scope

Place at the top of a file to affect the whole file, or inside a function to affect only that scope:

```python
from __python__ import no_truthiness           # single flag
from __python__ import no_dict_literals, no_overload_operators  # multiple flags
```

To re-enable a flag in a nested scope after an outer scope turned it off:

```python
from __python__ import truthiness
```

### Opt-out: CLI (all files)

```sh
rapydscript compile --python-flags=no_dict_literals,no_truthiness input.pyj
```

Flags in `--python-flags` are comma-separated. Prefix a flag with `no_` to disable it; omit the prefix to force-enable it (useful when combining with `--legacy-rapydscript`).

### Disable all flags (legacy mode)

```sh
rapydscript compile --legacy-rapydscript input.pyj
```

This restores the original RapydScript behavior: plain JS objects for `{}`, no operator overloading, JS truthiness, unbound methods, and no `String.prototype` patching.

### Flag reference

| Flag | What it enables | Effect when disabled |
|---|---|---|
| `dict_literals` | `{}` creates a Python `ρσ_dict` with `.keys()`, `.values()`, `.items()`, `.get()`, `.pop()`, `.update()`, `fromkeys()`, and `KeyError` on missing key access. | `{}` becomes a plain JS object; no Python dict methods; missing key access returns `undefined`. |
| `overload_getitem` | `obj[key]` dispatches to `obj.__getitem__(key)` when defined; `obj[a:b:c]` passes a `slice` object; dict `[]` access raises `KeyError` on missing key. | `[]` compiles to plain JS property access; no `__getitem__` dispatch; no slice dispatch. |
| `bound_methods` | Class methods are automatically bound to `self`, so they retain their `self` binding when stored in a variable or passed as a callback. | Detached method references lose `self` (JS default behavior). |
| `hash_literals` | When `dict_literals` is off, `{}` creates `Object.create(null)` rather than `{}`, preventing prototype-chain pollution from keys like `toString`. Has no visible effect while `dict_literals` is on. | `{}` becomes a plain `{}` (inherits from `Object.prototype`). Only relevant when `dict_literals` is also disabled. |
| `overload_operators` | Arithmetic and bitwise operators (`+`, `-`, `*`, `/`, `//`, `%`, `**`, `&`, `\|`, `^`, `~`, `<<`, `>>`) and their augmented-assignment forms dispatch to dunder methods (`__add__`, `__mul__`, etc.) when defined on the left operand. Also enables `str * n` string repetition, `list * n` / `n * list` list repetition, and `dict \| dict` / `dict \|= dict` merge. | All operators compile directly to JS; no dunder dispatch. `str * n` produces `NaN`; list repetition and dict merge are unavailable. |
| `truthiness` | Python truthiness semantics: `[]`, `{}`, `set()`, `''`, `0`, `None` are falsy; objects with `__bool__` are dispatched; `and`/`or` return the deciding operand value (not `True`/`False`); `not`, `if`, `while`, `assert`, and ternary all route through `ρσ_bool()`. Also enables `__call__` dispatch: `obj(args)` invokes `obj.__call__(args)` for callable objects. | Truthiness is JS-native (all objects truthy); `__bool__` is never called; `and`/`or` return booleans; `__call__` is not dispatched. |
| `jsx` | JSX syntax (`<Tag attr={expr}>children</Tag>` and `<>...</>` fragments) is recognised as expression syntax and compiled to `React.createElement` calls (or equivalent). | `<` is always a less-than operator; angle-bracket tokens are never parsed as JSX. |
| `pythonize_strings` *(output-level option, not a `from __python__` flag)* | `String.prototype` is patched at startup with Python string methods (`strip`, `lstrip`, `rstrip`, `join`, `format`, `capitalize`, `lower`, `upper`, `find`, `rfind`, `index`, `rindex`, `count`, `startswith`, `endswith`, `center`, `ljust`, `rjust`, `zfill`, `partition`, `rpartition`, `splitlines`, `expandtabs`, `swapcase`, `title`, `isspace`, `islower`, `isupper`). Equivalent to calling `from pythonize import strings; strings()` manually. Note: `split()` and `replace()` are intentionally kept as their JS versions. | Python string methods are not available on string instances; call `str.strip(s)` etc., or import and call `strings()` from `pythonize` manually. Disable globally with `--legacy-rapydscript`. |

---

## ❌ Not Supported — Missing from Baselib (runtime)

| Feature                             | Priority                                                   |
|-------------------------------------|------------------------------------------------------------|
| `vars()` / `locals()` / `globals()` | 🟢 Low — not defined; use direct attribute access          |
| `complex(real, imag)`               | 🟢 Low — no complex number type                            |
| `input(prompt)`                     | 🔴 N/A — no simple cli input in browser; use `prompt()`    |
| `compile()`                         | 🔴 N/A — Python compile/code objects have no JS equivalent |
| `memoryview(obj)`                   | 🔴 N/A — no buffer protocol in browser context             |
| `open(path)`                        | 🔴 N/A — no filesystem access in browser context           |

---

## ❌ Not Supported — Parser / Syntax Level

| Feature                                       | Priority                                                             |
|-----------------------------------------------|----------------------------------------------------------------------|
| `from module import *` (star imports)         | 🟢 Low — intentionally unsupported (by design, to prevent namespace pollution) |
| `zip(strict=True)`                            | 🟢 Low                                                               |
| `__slots__` enforcement                       | 🟢 Low — accepted but does not restrict attribute assignment         |
| Complex number literals `3+4j`                | 🟢 Low — no `j` suffix; no complex type                              |
| `__del__` destructor / finalizer              | 🟢 Low — JS has no guaranteed finalizer                              |

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
| `typing`      | ✅           | `TYPE_CHECKING`, `Any`, `Union`, `Optional`, `ClassVar`, `Final`, `Literal`, `NoReturn`, `List`, `Dict`, `Set`, `FrozenSet`, `Tuple`, `Type`, `Callable`, `Iterator`, `Iterable`, `Generator`, `Sequence`, `MutableSequence`, `Mapping`, `MutableMapping`, `Awaitable`, `Coroutine`, `AsyncGenerator`, `AsyncIterator`, `AsyncIterable`, `IO`, `TextIO`, `BinaryIO`, `Pattern`, `Match`, `TypeVar`, `Generic`, `Protocol`, `cast`, `overload`, `no_type_check`, `no_type_check_decorator`, `runtime_checkable`, `get_type_hints`, `TypedDict`, `NamedTuple`, `AnyStr`, `Text` — all available in `src/lib/typing.pyj` |
| `dataclasses` | ✅           | `@dataclass`, `field()`, `asdict()`, `astuple()`, `replace()`, `fields()`, `is_dataclass()`, `MISSING` in `src/lib/dataclasses.pyj`; `frozen=True`, `order=True`, inheritance supported; note: `field()` first positional arg is the default value (JS reserved word `default` cannot be used as a kwarg) |
| `enum`        | ✅           | `Enum` base class in `src/lib/enum.pyj`; `.name`, `.value`, iteration, `isinstance` checks; `IntEnum`/`Flag` not available |
| `abc`         | ✅           | `ABC`, `@abstractmethod`, `Protocol`, `@runtime_checkable`, `ABCMeta` (informational), `get_cache_token()` in `src/lib/abc.pyj`; abstract method enforcement via `__init__` guard; `ABC.register()` for virtual subclasses with isinstance support; `Symbol.hasInstance` enables structural isinstance for `@runtime_checkable` protocols; `ABCMeta` metaclass not usable (no metaclass support), use `ABC` base class instead |
| `contextlib`  | ❌           | `contextmanager`, `suppress`, `ExitStack`, `asynccontextmanager` not available                |
| `string`      | ❌           | Character constants, `Template`, `Formatter` not available                                    |
| `json`        | ❌           | No Python wrapper; JS `JSON.parse` / `JSON.stringify` work directly via verbatim JS           |
| `datetime`    | ❌           | `date`, `time`, `datetime`, `timedelta` not available                                         |
| `inspect`     | ❌           | `signature`, `getmembers`, `isfunction` etc. not available                                    |
| `asyncio`     | ❌           | Event loop, `gather`, `sleep`, `Queue`, `Task` wrappers not available; use `async`/`await`    |
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
| `is` / `is not` | Object identity | Strict equality `===` / `!==` |
| `//` floor division on floats | `math.floor(a/b)` always | Correct for integers; uses `Math.floor` (same result for well-behaved floats) |
| `%` on negative numbers | Python modulo (always non-negative) | JS remainder (can be negative) |
| `int` / `float` distinction | Separate types | Both are JS `number`; `isinstance(x, int)` and `isinstance(x, float)` use heuristics |
| `dict` key ordering | Insertion order guaranteed (3.7+) | Depends on JS engine (V8 preserves insertion order in practice) |
| `global` / `nonlocal` scoping | Full cross-scope declaration | `global` works for module-level; if a variable exists in both an intermediate outer scope **and** the module-level scope, the outer scope takes precedence (differs from Python where `global` always forces module-level) |
| `Exception.message` | Not standard; use `.args[0]` | `.message` is the standard attribute (JS `Error` style) |
| `re` module | Full PCRE (lookbehind, full unicode, conditional groups) | No lookbehind; limited unicode property escapes; no `(?(1)...)` conditional groups |
| Function call argument count | Too few args → `TypeError`; too many → `TypeError` | Too few args → extra params are `undefined`; too many → extras silently discarded. No `TypeError` is raised in either case. |
| Positional-only param enforcement | Passing by keyword raises `TypeError` | Passing by keyword is silently ignored — the named arg is discarded and the parameter gets `undefined` (no error raised) |
| Keyword-only param enforcement | Passing positionally raises `TypeError` | Passing positionally raises no error — the extra positional arg is silently discarded and the default value is used |
| `is` / `is not` with `NaN` | `math.nan is math.nan` → `True` (same object) | `x is NaN` compiles to `isNaN(x)` (not `x === NaN`), making NaN checks work correctly |
| `<`, `>`, `<=`, `>=` on lists / containers | Element-wise lexicographic comparison | Falls through to JS coercion — operands are stringified first (e.g. `[10] < [9]` is `True` because `'[10]' < '[9]'`). Comparison dunders (`__lt__` etc.) can be defined and called directly but are not auto-dispatched by these operators. |
| Default `{}` dict — numeric keys | Integer keys are stored as integers | Numeric keys are auto-coerced to strings by the JS engine: `d[1]` and `d['1']` refer to the same slot |
| Default `{}` dict — attribute access | `d.foo` raises `AttributeError` | `d.foo` and `d['foo']` access the same slot; keys are also properties |
| String encoding | Unicode strings (full code-point aware) | UTF-16 — non-BMP characters (e.g. emoji) are stored as surrogate pairs. Use `str.uchrs()`, `str.uslice()`, `str.ulen()` for code-point-aware operations. |
| Multiple inheritance MRO | C3 linearization (MRO) always deterministic | Built on JS prototype chain; may differ from Python's C3 MRO in complex or diamond-inheritance hierarchies |
| Generators — output format | Native Python generator objects | Down-compiled to ES5 state-machine switch statements by default; pass `--js-version 6` for native ES6 generators (smaller and faster) |
| Reserved keywords | Python keywords only | All JavaScript reserved words (`default`, `switch`, `delete`, `void`, `typeof`, etc.) are also reserved in RapydScript, since it compiles to JS |
| `parenthesized with (A() as a, B() as b):` | Multiple context managers in parenthesized form (3.10+) | Not meaningful in a browser/event-driven context; multi-context `with` without parens works |

---

## Test File

`test/python_features.pyj` contains runnable assertions for all features surveyed.
Features that are not supported have their test code commented out with a `# SKIP:` label
and an explanation. Run with:

```sh
node bin/rapydscript test python_features
```
