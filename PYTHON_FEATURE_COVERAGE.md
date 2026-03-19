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

## Test File

`test/python_features.pyj` contains runnable assertions for all features surveyed.
Features that are not supported have their test code commented out with a `# SKIP:` label
and an explanation. Run with:

```sh
node bin/rapydscript test python_features
```
