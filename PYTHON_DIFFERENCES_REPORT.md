# RapydScript vs Python: Differences Report

This report catalogs every place in the README where RapydScript behavior
differs from standard Python, assesses whether each claim is still accurate,
and notes which items are covered by tests.

---

## Summary Table

| # | Topic | README Claim | Accurate? | Tested? |
|---|-------|-------------|-----------|---------|
| 1 | Function argument leniency | Too few args → `undefined` instead of `TypeError` | ✓ Yes | Added (python_compat.pyj) |
| 2 | `*args` + optional arg duplication | Duplicate kwarg silently ignored | ✓ Yes | Added (python_compat.pyj) |
| 3 | Positional-only parameter enforcement | Passing by keyword silently ignored | ✓ Yes | Added (python_compat.pyj) |
| 4 | Keyword-only parameter enforcement | Passing positionally raises no error | ✓ Yes | Added (python_compat.pyj) |
| 5 | `is` operator | Maps to `===` (strict equality, not Python identity) | ✓ Yes | generic.pyj |
| 6 | Arithmetic: `1 + '1'` | Results in `'11'` (JS string coercion) | ✓ Yes | Added (python_compat.pyj) |
| 7 | List concatenation without `overload_operators` | `[1] + [1]` results in a string, not a list | ✓ Yes | Added (python_compat.pyj) |
| 8 | Ordering operators on containers | `<`, `>`, `<=`, `>=` use JS coercion (not element-wise) | ✓ Yes | Added (python_compat.pyj) |
| 9 | List `sort()` | `sort()` = Python numeric sort; JS sort available as `jssort()` | ✓ Fixed | baselib.pyj, collections.pyj, python_compat.pyj |
| 10 | List `pop()` | `pop()` = Python bounds-checked pop; JS pop available as `jspop()` | ✓ Fixed | baselib.pyj, collections.pyj, python_compat.pyj |
| 11 | Sets: no `__hash__` for custom objects | Object equality via `is` (identity); `__hash__` not dispatched for set membership | ✓ Yes | Noted in python_features.pyj #47 (skipped) |
| 12 | Dicts: JS object by default | Non-existent key returns `undefined` (not `KeyError`) | ✓ Yes | Added (python_compat.pyj) |
| 13 | Dicts: numeric keys auto-converted | Number keys become strings in JS object dicts | ✓ Yes | Added (python_compat.pyj) |
| 14 | Dicts: keys as attributes | Dict keys accessible as object properties | ✓ Yes | Added (python_compat.pyj) |
| 15 | Dicts: no `.keys()/.values()/.items()` etc. by default | JS objects lack Python dict methods without `dict_literals` flag | ✓ Yes | scoped_flags.pyj |
| 16 | Strings: not Python strings by default | Python string methods on `str` object, not on string instances | ✓ Yes | str.pyj |
| 17 | `strings()` leaves `split()`/`replace()` as JS versions | After `strings()`, `split()` and `replace()` remain JS implementations | ✓ Yes | Added (python_compat.pyj) |
| 18 | Strings: UTF-16 semantics | Non-BMP characters are surrogate pairs | ✓ Yes | Documented; `str.uchrs/uslice/ulen` helpers exist |
| 19 | Truthiness: JS semantics by default | Empty `[]` and `{}` are truthy without `truthiness` flag | ✓ Yes | python_features.pyj #40 |
| 20 | Method binding: not automatic | `f = obj.method; f()` loses `self` | ✓ Yes | scoped_flags.pyj |
| 21 | Nested classes | Fully supported — full tests in `test/classes.pyj` | ✓ Yes | classes.pyj |
| 22 | Multiple inheritance MRO | May differ from Python's C3 MRO in complex hierarchies | ✓ Yes | Documented |
| 23 | `global` keyword | Prefers outer-scope variable over module-global when both exist | ✓ Yes | Added (python_compat.pyj) |
| 24 | `__slots__` | Accepted syntactically but does not restrict attribute creation | ✓ Yes | Noted in python_features.pyj #23 (skipped) |
| 25 | Star imports | Not supported (by design) | ✓ Yes | Documented |
| 26 | Regex: no lookbehind | JavaScript regex engine has no lookbehind support | ✓ Yes (ES5); ES2018+ does have lookbehind, so ES6 mode may vary | regexp.pyj |
| 27 | Regex: MatchObject `start()`/`end()` | May return incorrect values for nested capture groups | ✓ Yes | regexp.pyj |
| 28 | Generators: ES5 default | Down-compiled to ES5 switch statements by default | ✓ Yes | generators.pyj |
| 29 | Extra keywords | All JavaScript keywords are also reserved | ✓ Yes | generic.pyj (throws tests) |
| 30 | `slice()` builtin | Fully supported — `slice(start, stop, step)`, `.indices()`, equality, `isinstance` all work | ✓ Yes | python_features.pyj #63, slice.pyj |
| 31 | `int.bit_length()` | Not supported | ✓ Yes | Noted in python_features.pyj #17 (skipped) |
| 32 | `float.is_integer()` | Not supported | ✓ Yes | Noted in python_features.pyj #18 (skipped) |
| 33 | `zip(strict=True)` | Not supported | ✓ Yes | Noted in python_features.pyj #27 (skipped) |
| 34 | `vars()`/`locals()`/`globals()` | Not implemented | ✓ Yes | Noted in python_features.pyj #60 (skipped) |
| 35 | `complex()` / `j` suffix | No complex number type | ✓ Yes | Noted in python_features.pyj #42, #59 (skipped) |
| 36 | `b'...'` bytes literals | No bytes type; use `encodings` module | ✓ Yes | Noted in python_features.pyj #43 (skipped) |
| 37 | `except*` (exception groups) | Not supported (Python 3.11+) | ✓ Yes | Noted in python_features.pyj #44 (skipped) |
| 38 | `__new__` constructor hook | Supported — `def __new__(cls, ...)` with `super().__new__(cls)` | ✓ Yes | Now supported; see unit tests `new_basic`, `new_singleton`, etc. |
| 39 | `__del__` destructor | Not supported | ✓ Yes | Noted in python_features.pyj #46 (skipped) |
| 40 | `__hash__` for set/dict membership | Not dispatched; uses JS identity (`===`) | ✓ Yes | Noted in python_features.pyj #47 (skipped) |
| 41 | `__getattr__`/`__setattr__`/`__delattr__` | Not supported | ✓ Yes | Noted in python_features.pyj #48 (skipped) |
| 42 | `__getattribute__` | Not supported | ✓ Yes | Noted in python_features.pyj #49 |
| 43 | `__class_getitem__` | Supported — `Class[item]` compiles to `Class.__class_getitem__(item)` at compile time; implicit classmethod, subclasses inherit with correct `cls` | ✓ Yes | Now supported; see unit tests `class_getitem_*` |
| 44 | `__init_subclass__` | Not supported | ✓ Yes | Noted in python_features.pyj #52 (skipped) |

---

## Detailed Notes on Key Differences

### Function Argument Validation

RapydScript intentionally does **not** raise `TypeError` for:
- Calling a function with too few arguments (extra params are `undefined`)
- Calling a function with too many arguments (extras silently discarded)
- Passing a positional-only parameter by keyword (named kwarg silently ignored)
- Passing a keyword-only parameter positionally (no error raised)
- Specifying an optional argument twice when `*args` is present

**Rationale:** Performance and interoperability with JavaScript libraries that
frequently call functions with varying argument patterns.

### Dict Defaults (JavaScript Object Semantics)

Without `from __python__ import dict_literals, overload_getitem`:
- `{...}` creates a plain JS object, not a Python dict
- Missing keys return `undefined`, not `KeyError`
- Numeric keys are silently coerced to strings: `d[1]` and `d['1']` are the same key
- Dict keys are also accessible as properties: `d.foo == d['foo']`
- No `.keys()`, `.values()`, `.items()`, `.get()`, `.pop()` methods

Use `from __python__ import dict_literals, overload_getitem` for full Python dict semantics.

### List Method Name Conflicts (Resolved)

RapydScript lists are native JavaScript arrays. The method naming has been
restored to match Python conventions:
- `list.sort()` — Python numeric sort (in-place, supports `key` and `reverse`)
- `list.pop()` — Python bounds-checked pop (raises `IndexError` for out-of-bounds)
- `list.jssort()` — native JS lexicographic sort (for JS interop)
- `list.jspop()` — native JS pop (no bounds check, ignores arguments)
- `list.pysort()` / `list.pypop()` — backward-compat aliases for `sort()`/`pop()`

### Truthiness

Default truthiness follows JavaScript rules:
- `[]`, `{}`, any non-null object → **truthy** (unlike Python)
- `0`, `''`, `null`, `undefined`, `NaN` → falsy

Enable Python truthiness with `from __python__ import truthiness`:
- Empty containers (`[]`, `{}`, `set()`, `''`) → falsy
- `__bool__` and `__len__` dunders are dispatched

### String Method Availability

Python string methods are available via the `str` object:
```python
str.strip('  hello  ')   # 'hello'
str.split('a b')         # ['a', 'b']
```

To make them available on string instances, call `from pythonize import strings; strings()`.
However, `split()` and `replace()` are **always** the JS versions — Python semantics
for these two methods must be accessed via `str.split(s)` / `str.replace(s, ...)`.

Notable JS-vs-Python difference for `split()`:
- Python `'a  b'.split()` → `['a', 'b']` (splits on any whitespace, strips leading/trailing)
- JS `'a  b'.split()` → `['a  b']` (no-arg form returns single-element array)

### Method Binding

RapydScript **does not** auto-bind methods to instances. This matches
JavaScript semantics but differs from Python:
```python
obj = MyClass()
obj.method()          # ✓ works — 'self' is correctly set
f = obj.method
f()                   # ✗ 'self' is undefined/window (unbound)
```

Use `from __python__ import bound_methods` inside a class to enable auto-binding.

### `global` Keyword Scope

RapydScript's `global` keyword slightly differs from Python's: if a variable
exists in an intermediate outer function scope **and** in the module-level
(global) scope, the outer function scope variable takes precedence.
In Python, `global` always refers to the module-level scope.

### `is` Operator

`is` compiles to `===` (strict equality), not Python's object identity check.
This means:
- `1 is 1` is `True` (same as Python)
- `'a' is 'a'` is `True` (same as Python for interned strings)
- `[1] is [1]` is `False` (same as Python — different objects)
- But `NaN is NaN` is `False` in JS (`NaN !== NaN`), which differs from Python

### Ordering Operators on Containers

RapydScript does **not** overload `<`, `>`, `<=`, `>=` for lists or other
containers. These fall through to JS comparison which coerces to strings:
```python
[10] < [9]    # True in RapydScript (JS: '10' < '9' string compare)
              # False in Python (numeric element comparison)
```
Use explicit element comparisons or define `__lt__` etc. and call them directly.

### Regular Expressions

The `re` module wraps JavaScript's regex engine. Key limitations:
1. **Lookbehind** — not supported in ES5; may work in ES6+ environments
2. **Unicode** — non-BMP characters may require ES6 `u` flag
3. **`MatchObject.start()`/`.end()`** for sub-groups — incorrect for some
   nested-capture patterns (JS doesn't expose sub-group positions directly)

### Generators

By default, generators compile to ES5 state-machine switch statements (larger
but widely compatible). Pass `--js-version 6` to emit native ES6 generators.

---

## Features Completely Absent (not in Python either, but noteworthy)

| Feature | Notes |
|---------|-------|
| `v'...'` verbatim JS | RapydScript-only; embeds raw JS |
| Existential operator `x?.y` | Borrowed from CoffeeScript |
| `?` null-coalescing shorthand `a = b ? c` | RapydScript-specific |
| `def` as expression | Assign anonymous multi-line functions |
| `.call(this)` chaining syntax | Invoke anonymous functions immediately |

---

*Report generated 2026-03-21. Test coverage additions in `test/python_compat.pyj`.*

---

## Recommendations for Improving Python Compatibility

The following improvements are prioritized by how frequently they surprise Python users and how disruptive the gap is in practice. Items marked 🔥 are silent footguns — they produce wrong behavior with no error, making them especially harmful.

---

### 1. 🔥 Fix List Concatenation (`+`) Without `overload_operators`

**Current:** `[1, 2] + [3, 4]` silently produces the string `'[1, 2][3, 4]'` — a completely wrong result with no warning.

**Recommendation:** Make basic list `+` concatenation work correctly by default, without requiring `overload_operators`. This could be done at the compiler level by emitting a `.concat()` call whenever the `+` operator is applied between two list literals or list-typed variables. Alternatively, emit a runtime check: if both operands are arrays, use `.concat()`.

**Why:** This is one of the worst silent footguns in the language. Any Python programmer who writes `result = list_a + list_b` will get corrupted output that looks like a string. The fact that `overload_operators` fixes it is obscure and adds overhead for an operation Python users expect to always work.

---

### 2. ✅ Rename `pysort()` / `pypop()` Back to `sort()` / `pop()` — **IMPLEMENTED**

**Implemented:** `list.sort()` now performs Python-style numeric sort (in-place, supports `key` and `reverse`). `list.pop()` now performs Python-style bounds-checked pop (raises `IndexError` for out-of-bounds). The native JS versions are available as `list.jssort()` and `list.jspop()`. The old `pysort()` / `pypop()` names are retained as backward-compat aliases.

---

### 3. 🔥 Enable Python Truthiness by Default (or Warn on Empty Container Tests)

**Current:** `if []:` evaluates to `True` (JS semantics). Python semantics require `from __python__ import truthiness`.

**Recommendation:** Either (a) make `truthiness` the default behavior and provide a `from __js__ import truthiness` escape hatch for legacy code, or (b) emit a compiler warning when a list/dict/set literal is used directly as an `if` condition without the `truthiness` flag.

**Why:** The truthiness of empty containers is one of the most fundamental Python idioms. `if items:`, `while queue:`, and `if not result:` are idiomatic Python in virtually every codebase. Getting them silently wrong without the `truthiness` flag is a trap that is very hard to debug.

---

### 4. Make Python Dict the Default (or Promote `dict_literals` to a Global Default)

**Current:** `{}` creates a plain JS object. Missing keys return `undefined`, numeric keys are coerced to strings, and `.keys()` / `.values()` / `.items()` don't exist. Full Python dict semantics require `from __python__ import dict_literals, overload_getitem`.

**Recommendation:** Promote `dict_literals` to an opt-out default via a compiler flag (`--python-dicts` or similar). Alternatively, provide a project-level config option to enable it globally so users don't have to add the import to every file.

**Why:** Python dicts are used everywhere. The behavior gap (missing key → `undefined` instead of `KeyError`, numeric keys aliasing to string keys, no `.items()`) causes subtle bugs that are extremely hard to trace. The current model forces users to remember a file-level import for behavior they'd expect to be the baseline.

---

### 5. Auto-Apply `strings()` or Make Python String Methods Available on Instances

**Current:** Python string methods like `.strip()`, `.split()`, `.upper()` live on the `str` module object (`str.strip(s)`) rather than on string instances. To use instance-style calls, users must call `from pythonize import strings; strings()`. Even then, `.split()` and `.replace()` remain JS versions.

**Recommendation:** Two improvements:
1. Make `strings()` apply automatically in Python-compatibility mode, or provide a cleaner `from __python__ import strings` import.
2. Overwrite the JS `.split()` and `.replace()` with Python-correct implementations inside `strings()`. The current doc explicitly says these two are **intentionally** left as JS versions — this should be reconsidered, as it makes `strings()` provide incomplete Python compatibility.

**Why:** Method calls on string instances (`s.split()`, `s.strip()`, `s.startswith('x')`) are the default mental model for every Python user. Having to write `str.split(s)` instead of `s.split()` is jarring and prevents Python code from running without modification.

---

### 6. Add `__getattr__` / `__setattr__` Support via ES6 Proxy

**Current:** `__getattr__` and `__setattr__` are not supported. Attribute access interception is impossible.

**Recommendation:** In ES6 mode (`--js-version 6`), implement `__getattr__` and `__setattr__` by wrapping class instances in a `Proxy` when those dunders are defined. The `get` and `set` traps can delegate to the user's `__getattr__` / `__setattr__` methods with a fallback to the underlying object.

**Why:** `__getattr__` is used extensively for lazy loading, dynamic APIs, mock objects, ORMs, and proxy patterns. It's the basis for many Python libraries (e.g. `dataclasses`-style field access, `unittest.mock`, `attrs`). Without it, an entire class of Python patterns is unavailable. ES6 Proxy support is well-established in all modern JS environments.

---

### 7. Add Stub Modules for `typing`, `dataclasses`, and `enum`

**Current:** `typing`, `dataclasses`, and `enum` are completely absent.

**Recommendation:**
- **`typing`**: Add a stub `src/lib/typing.pyj` that exports `List`, `Dict`, `Optional`, `Union`, `Tuple`, `Any`, `TypeVar`, `Generic`, `Callable` — all as no-ops or identity functions. This lets users write `from typing import Optional, List` without import errors, and allows type-annotated Python code to run unchanged.
- **`enum`**: Add a basic `Enum` base class where `class Color(Enum): RED = 1` creates an object with `.name` and `.value` attributes, iteration over members, and `Color.RED` access. This is well-defined behavior with no JS-fundamental blockers.
- **`dataclasses`**: Add a `@dataclass` decorator that introspects class-level annotations and generates `__init__`, `__repr__`, and `__eq__`. This is a high-value feature — dataclasses are ubiquitous in modern Python and could be implemented in ~100 lines of RapydScript using the existing annotation support.

**Why:** These three modules are among the most-imported in modern Python codebases. Their absence means entire categories of modern Python patterns — type hints, structured data classes, enumerated constants — fail at import time with no workaround other than rewriting the code.

---

### 8. Add a `copy` Module (`copy.copy` / `copy.deepcopy`)

**Current:** No `copy` module. Shallow and deep copy must be done via JS idioms (`Object.assign`, `JSON.parse(JSON.stringify(...))`) or verbatim JS.

**Recommendation:** Add `src/lib/copy.pyj` with:
- `copy(obj)` — shallow clone: spread for plain objects, `.slice()` for arrays, class instance duplication via `Object.assign(Object.create(proto), obj)`.
- `deepcopy(obj)` — deep clone: recursive traversal for plain objects/arrays; use `structuredClone()` (ES2022) when available with a recursive fallback.

**Why:** `copy.deepcopy` is one of the most commonly needed utilities when porting Python code. Many algorithms depend on working with independent copies of mutable data structures. Without it, users either introduce subtle aliasing bugs or write verbose verbatim-JS workarounds.

---

### Summary: Priority Order

| Priority | Item | Effort | Impact |
|---|---|---|---|
| 1 | Fix list `+` concatenation (silent footgun) | Low — compiler emit change | 🔥 High |
| 2 | ~~Rename `pysort`/`pypop` back to `sort`/`pop`~~ | ✅ Done | 🔥 High |
| 3 | Default Python truthiness | Medium — flag change + regression test | 🔥 High |
| 4 | Default Python dicts | Medium — compiler flag or config | High |
| 5 | Python string methods on instances | Low — fix `strings()` split/replace | High |
| 6 | `typing`, `dataclasses`, `enum` stubs | Medium — ~200 lines per module | High |
| 7 | `copy` module | Low — ~80 lines | Medium |
| 8 | `__getattr__`/`__setattr__` via Proxy | High — ES6 only, code-gen complexity | Medium |
