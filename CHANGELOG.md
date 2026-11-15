Unreleased
=======================
* Added Python's builtin exception hierarchy: `BaseException` (with `SystemExit`, `KeyboardInterrupt`, `GeneratorExit`), `ArithmeticError` (`ZeroDivisionError` now subclasses it, plus `OverflowError`, `FloatingPointError`), `RuntimeError` (`NotImplementedError`, `RecursionError`), `OSError` (aliases `IOError`/`EnvironmentError`; `FileNotFoundError`, `PermissionError`, `TimeoutError`, `ConnectionError` and subclasses, ...), `UnicodeError` (`UnicodeDecodeError` now subclasses it, plus `UnicodeEncodeError`), `EOFError`, `BufferError`, `StopAsyncIteration`, and the `Warning` classes. Previously `raise NotImplementedError(...)` and friends failed with `ReferenceError` — including inside the bundled `decimal` and `logging` modules. `except Exception` no longer catches `SystemExit`/`KeyboardInterrupt`/`GeneratorExit`; `except RecursionError` catches JS stack overflow; `raise SomeError` (the class) raises an instance.
* Added the `NotImplemented` singleton. Binary dunders that `return NotImplemented` now fall through to the reflected method (`__radd__`, ...) and then `TypeError`, and `__eq__` falls back to identity, as in Python. This fixes `decimal` and `fractions` comparisons/arithmetic with unsupported operand types, which previously raised `ReferenceError`.
* Exceptions now stringify like Python: `str(ValueError('bad'))` is `'bad'` (was `'ValueError: bad'`), `repr()` is `ValueError('bad')`, `e.args` is a tuple and `str(KeyError('k'))` is `"'k'"`. Native JS errors caught by `except` follow suit (`str(e)` is the message) and `type(e).__name__` gives the Python name (`NameError` for a JS `ReferenceError`).
* Fix: `contextlib` and `asyncio` raised a private `RuntimeError` class, so `except RuntimeError` in user code did not catch their errors.
* Added async comprehensions: `[v async for v in agen()]`, the dict and set forms, `async for` clauses after ordinary ones, and `(v async for v in agen())` async generator expressions.
* Fix: `super().method()` inside a `@classmethod` passed the class as an argument (`Parent.method(this, ...)`) instead of calling the parent classmethod with the subclass as `cls`.
* Generators now have Python's `send()` / `throw()` / `close()`: `send()` and `throw()` return the next yielded value and raise `StopIteration` (with the return value as `.value`) when the generator finishes, `throw()` accepts an exception class or instance, and `close()` runs pending `finally` blocks. Async generators get `asend()` / `athrow()` / `aclose()`. `next()` keeps the JS iterator protocol.
* Fix: `import enum` produced invalid JavaScript (`var enum = ...`); the identifier is now emitted as `ρσ_enum`. `Enum` subclasses now support value and name lookup (`Color(2)`, `Color['RED']`, `ValueError` for an unknown value), `len()`, and `__members__`. A class inherits `__new__` dispatch from an imported base class.
* `json.loads()` now returns dicts and lists (it returned plain JS objects and arrays, without `.get()`, `.items()` or `.append()`). `json.dumps()` is a Python-compatible encoder: its output matches Python's (`{"a": 1, "b": [1, 2]}` with the default separators — it was compact before), `separators=` works (it was a no-op), `allow_nan` defaults to `True` as in Python, `ensure_ascii` escapes non-ASCII, non-string keys are converted, and sets or other unserializable values raise `TypeError` instead of producing `{"jsset":{}}`.
* `math` gains `isclose`, `isfinite`, `gcd` / `lcm` (any number of arguments), `comb`, `perm`, `prod`, `isqrt`, `dist`, `log2`, `cbrt`, `exp2`, `tau` and `nan`; `hypot` takes any number of coordinates; `sqrt`, `log`, `log10`, `log2` and `log1p` raise `ValueError: math domain error` instead of returning `NaN` / `-inf`. `random` gains a `Random` class (independent seeded generators, `getstate` / `setstate`), `choices`, `gauss`, `normalvariate`, `expovariate`, `triangular`, `betavariate`, `gammavariate` and `getrandbits`; `sample` and `choice` accept any sequence (including `range`) and raise Python's errors. Seeded sequences from `random()`, `randint()` and `shuffle()` are unchanged.
* `except` clauses accept dotted exception classes (`except json.JSONDecodeError:`).
* Fix: `list.count()` / `tuple.count()` compared with identity (`[[1]].count([1])` was 0); `id()` returned `undefined` for lists, dicts and other objects without a RapydScript object id, so every such object shared one id; `isinstance(True, int)`, `issubclass(bool, int)` and `isinstance(x, object)` were `False`; `1 == True` was `False` (comparisons against a `True`/`False` literal); and `repr()` of a string containing `'` escaped it instead of switching to double quotes (`"it's"`).
* `return` (with or without a value) is now allowed in a generator, as in Python; the value becomes the result of `yield from`. It used to be a compile error.
* Fix: an annotated assignment with a subscripted type, `x: list[int] = [1]`, dropped the assignment (the subscript parser took `list[int] = [1]` as an item assignment); the same applied to parameter annotations with defaults (`def f(xs: list[int] = [])`).
* Type enforcement (on by default) no longer rejects valid calls: an `int` is accepted for a `float` or `complex` parameter and a `bool` for `int` (PEP 484's numeric tower), `Optional`/`Union` members follow the same rule, and annotations with no runtime meaning (string forward references, `TypeVar`s) accept any value. `list[int]`, `dict[str, int]` and other builtin generics (PEP 585) and `int | None` unions (PEP 604) now evaluate to annotation objects instead of crashing.
* Fix: `await` inside a list, set or dict comprehension produced invalid JavaScript; such comprehensions now run in an awaited async function.
* Fix: `match` class patterns used a plain JS `instanceof`, so builtin patterns (`case int(n):`, `case str():`, `case float():`, `case list():`) never matched. They now follow `isinstance`, and a single positional sub-pattern of a builtin type captures the subject. Positional patterns read `__match_args__` from the class body (they crashed), mapping patterns match only mappings and look keys up through the dict (so non-literal keys like `Color.RED` work), and `**rest` binds a dict.
* Fix: `str.replace('', x)` looped forever; it now inserts `x` between every character, as Python does.
* Added keyword-only parameters after `*args` (`def f(*args, key=None)`, `def f(a, *rest, k)`), required keyword-only parameters after optional ones (`def f(*, a=1, b)`), and bare `*`, keyword-only and `/` parameters in lambdas (`lambda x, *, factor=3: ...`).
* Fix: `==` / `!=` evaluated an operand twice when it wasn't a plain name or literal, so `while (x := next(it)) != 0:` consumed several items per test and `f() == 1` style comparisons with subscripts called `f` twice. Only names, literals and attribute chains on them are now compared inline.
* Fix: indexing a list, tuple or string out of range returned `undefined`; it now raises `IndexError` (and assigning past the end of a list raises too). Unpacking checks counts (`a, b = [1, 2, 3]` raises `ValueError: too many values to unpack`), and `len()` of a number raises `TypeError`. These apply under the default `overload_getitem` flag.
* Fix: `re.findall()` ignored capture groups (it returned whole matches); it now returns the group, or a tuple of groups, as Python does. `re.sub()`, `re.subn()`, `re.findall()` and `re.finditer()` no longer loop forever on patterns that can match the empty string (`re.sub('x*', '-', 'abc')`). `re.subn()` returns a tuple.
* Fix: `Counter`, `defaultdict` and `OrderedDict` stored their data in a plain JS object, so every key became a string (`Counter([1, 2, 2]).most_common(1)` gave `[['2', 2]]`) and tuple keys were mangled. They are now real `dict` subclasses, as in Python: keys keep their types, views and dict methods are inherited, `most_common()` returns tuples, and their reprs match Python's (`Counter({'a': 2, 'b': 1})`, `defaultdict(<class 'list'>, {...})`). Subclassing `dict` in user code also works now (it failed on read-only `__argnames__`/`__module__`), and dict equality compares values with `==` and accepts dict subclasses.
* Fix: a decorated function's recursive calls bypassed the decorator: `@lru_cache def fib(n): ... fib(n - 1)` compiled to a named function expression whose own name shadowed the decorated `fib`, so nothing was memoized. `lru_cache` also ignored keyword arguments, keyed on `JSON.stringify` (distinct objects collided), and evicted first-in rather than least-recently-used; it now keys on the arguments' `hash()`/`==` and `cache_info()` returns a `CacheInfo`.
* Floats print like Python where JavaScript can tell they are floats: `inf`, `-inf`, `nan`, `-0.0`, and exponent form for small values (`1e-05`, `1.5e-10`). Integer-valued floats such as `1.0` still print as `1`, since JS has a single number type.
* Fix: sets and dicts compared every object member by identity, so `{(0, 0), (0, 0)}` had two members, `d[(1, 2)]` raised `KeyError` after `d[(1, 2)] = x`, and classes defining `__eq__`/`__hash__` (and `Fraction`, `Decimal`, `frozenset`) never matched. Tuples, frozensets and objects with `__hash__` are now looked up by `hash()` and `==`, as in Python; tuples now hash by value. Other values (numbers, strings, lists, plain objects) are stored exactly as before.
* Fix: `dict.keys()`, `.values()` and `.items()` returned one-shot JS iterators (`len(d.keys())` was `0`, `'a' in d.keys()` was `False`, a second loop saw nothing). They now return live views like Python's: reusable, sized, supporting `in`, `reversed()`, a `dict_keys([...])` repr, and set operations on keys/items views. `items()` yields tuples. Views still provide the JS iterator `next()` method for existing code. Set binary operators (`|`, `&`, `-`, `^`) now return `NotImplemented` for a non-set operand, so the other operand's reflected method can answer.
* Fix: `round()` and float formatting (`'{:.0f}'`, `'%.1f'`) rounded exact ties away from zero; they now round to even like Python (`round(2.5) == 2`, `format(0.125, '.2f') == '0.12'`). `round(x, -n)` follows the same rule.
* Fix: assigning to an extended slice (`a[::2] = [...]`, `a[::-1] = ...`) replaced the whole list. It now assigns the selected positions, with Python's `ValueError` when the lengths differ.
* Fix: `print(..., end=...)` was ignored. Text printed without a trailing newline is now held and continued by the next print (a JS console can only write whole lines), and printed on its own once the running code finishes if nothing follows. `print(..., file=obj)` writes to any object with a `write()` method.
* Fix: `int()` and `float()` accepted any numeric prefix (`int('12abc')` was `12`, `int('3.5')` was `3`, `float('1.5abc')` was `1.5`). They now accept exactly Python's literal syntax, including `_` digit separators and `0x`/`0o`/`0b` prefixes, and raise `ValueError` with Python's messages.
* `rapydscript -x` now provides timers (`setTimeout` etc.) to the executed program, so `asyncio.sleep` and other async code run.
* Fix: a `with` block's `__exit__` was skipped when the body left via `return`, `break` or `continue`, so `@contextmanager` cleanup after `yield` (and `finally` blocks around it) never ran. Normal exit now runs in a JS `finally`. Each `with` also has its own exception variable, so an inner `with` that suppresses an exception no longer makes the enclosing one skip its `__exit__`.
* Fix: `x in range(...)` was always `False`. `range` now supports `in` (in constant time), indexing including negative indices (`IndexError` when out of range), `reversed()`, `==`, and raises `ValueError` for a zero step; its repr is `range(0, 10)` like Python's. `reversed()` also accepts dicts and other finite iterables.
* Fix: `max()`/`min()` returned the key value instead of the element when given `key=` (`max(words, key=len)` gave `4`), and `NaN` for strings, tuples, lists and objects with `__lt__`/`__gt__`. They now return the first maximal/minimal element using Python ordering, raise `ValueError` for an empty iterable, and no longer overflow the stack on very large inputs.
* Fix: decorators on methods received a function that took `self` from `this`, so a Python-style wrapper (`def wrapper(self, x): return fn(self, x)`) failed with a missing-argument `TypeError`. A decorated method's function now takes `self` (or `cls`) as its first argument, and the decorator's result is turned back into a method; a decorator that returns its argument unchanged (registration, `abc.abstractmethod`) keeps the original method.
* Fix: `**` now binds tighter than a unary operator on its left and is right-associative: `-x ** 2` is `-(x ** 2)` (was `(-x) ** 2`) and `2 ** 3 ** 2` is `512` (was `64`); `2 ** -1` still works.
* Fix: `not` bound tighter than comparisons, so `not x == y` meant `(not x) == y` and `if not a in b:` took the wrong branch. It now binds like Python's: looser than comparisons, tighter than `and`.
* Fix: comparisons chain the way Python's do. `==`, `!=`, `is`, `is not`, `in` and `not in` now share a precedence level with `<`/`>`/`<=`/`>=`, so `0 < x == 5` and `a == b == c` mean `(0 < x) and (x == 5)` (they were `(0 < x) == 5`). Every chain evaluates each middle operand once and short-circuits; a parenthesized comparison like `(a < b) < c` is not a chain. Previously only `<`/`>`/`<=`/`>=` chained, and chains of three or more with a complex middle operand compiled incorrectly.
* Fix: several statements after a compound statement's colon on one line (`def f(): a(); b()`, also `for`/`while`/`class` methods) only put the first one in the body; the rest ran at the enclosing level. A one-line `def __exit__(self, *a): log(); return False` placed its `return` at module level, silently ending the program.
* Fix: tuple assignment to subscripts, `a[0], a[2] = a[2], a[0]` and `d['a'], d['b'] = 1, 2`, did nothing or raised `KeyError` under the default `overload_getitem` flag; `lst[i], i = 5, 1` produced invalid JavaScript.
* Fix: `import a, b` (several modules in one statement) crashed the compiler with `Cannot read properties of undefined (reading 'classes')`, even when every module exists.
* Fix: `int()` and `float()` with no argument crashed, which broke `defaultdict(int)` / `defaultdict(float)`. `int(x)` of a float now truncates at full precision (it wrapped past 32 bits: `int(3e10)` was `-64771072`) and raises `OverflowError`/`ValueError` for infinity/NaN.
* Added the `oct()` builtin.
* Added `web_repl().reset()`, and source maps no longer attribute the runtime prelude to line 1.
* Added the `property()` builtin (with `getter`/`setter`/`deleter`), `@x.deleter`, and the descriptor protocol: class attributes with `__get__`/`__set__`/`__delete__` act as descriptors, and `__set_name__` is called when the class is created. `del obj.attr` now goes through deleters and raises `AttributeError` for a missing attribute, and the `delattr()` builtin was added.
* Added metaclasses: `class C(metaclass=M)` runs `M.__new__` and `M.__init__` with `(name, bases, namespace)`. Methods defined on the metaclass are callable on the class and its subclasses, `isinstance(C, M)` holds, and `type(C)` returns `M`. `type(name, bases, dict)` creates a class. `type(5)`, `type('s')` and `type([])` return `int`, `str` and `list` (they returned JS constructors), and `type(SomeClass)` returns `type`.
* Fix: `super()` followed the JS prototype chain, so in diamond hierarchies (`class D(B, C)`) cooperative `super()` calls skipped `C`. They now follow Python's C3 method resolution order. `Cls.__mro__` is available on classes with multiple bases, an inconsistent hierarchy raises `TypeError`, `issubclass(D, C)` is `True` for a non-first base, and `super().__init__(**kw)` works in a root mixin class.
* Classes that define only `__getitem__` can be iterated (`for`, `list()`, `sum()`, unpacking) and searched with `in`, using Python's sequence protocol. `in` on an object with `__iter__` but no `__contains__` searches its items.
* `enumerate()`, `zip()`, `divmod()`, `str.partition()`/`rpartition()` and the `itertools` functions (`product`, `permutations`, `combinations`, `pairwise`, `groupby`, `zip_longest`) yield tuples. Slicing a tuple returns a tuple.
* Fix: `set()` printed as `{}`; set methods (`union`, `intersection`, `issubset`, ...) now accept any iterable, not only sets.
* Strings gain `casefold`, `removeprefix`, `removesuffix`, `rsplit`, `isalpha`, `isdigit`, `isdecimal`, `isnumeric`, `isalnum`, `isidentifier`, `isascii`, `isprintable`, `istitle`, `expandtabs`, `translate`, `encode` and `str.maketrans`. The `is*` checks are Unicode-aware. Fix: `zfill` puts zeros after a sign (`'-42'.zfill(6)` is `'-00042'`), `count('')` counts the empty positions, and `splitlines()` no longer returns a trailing empty line and recognises all of Python's line boundaries.
* Added the `ascii()` builtin. Functions have `__name__` (`'<lambda>'` for lambdas), `obj.__dict__` gives the instance attributes as a dict that writes changes back to the object, and `SystemExit(code).code` is set.
* `collections.namedtuple` instances are real tuples (`len()`, `isinstance(p, tuple)`, `p == (1, 2)`, slicing), and `namedtuple` accepts keyword arguments, `defaults=`, `rename=` and `module=`. `_fields` is a tuple and `_asdict()` returns a dict.
* Fix: a method whose body called a module-level function of the same name (`def unpack(self, b): return unpack(b)`) called itself instead.
* Fix: a classmethod or staticmethod inherited from an ancestor of an imported class was called as an instance method (`numbers.Integral.register(X)` failed).
* Fix: `super().method(key=value)` with only keyword arguments passed the instance as the first positional argument.
* `str.join()` accepts any iterable (dict keys, sets, generators). Builtin container methods are bound, so `max(d, key=d.get)`, `Counter().most_common` and `deque().append` work when passed as values.
* f-strings accept `f'{x = }'` (with spaces), nested replacement fields in format specs (`f'{x:>{width}}'`), and expressions containing braces or quotes (`f"{ {'a': 1}['a'] }"`).
* Starred expressions work in unparenthesised tuples: `return 1, *rest` and `t = *rest, 9`.
* JavaScript reserved words that are ordinary Python names (`default`, `function`, `var`, `static`, `switch`, `case`, ...) can be used as variable, parameter, function and class names. They are renamed in the generated JavaScript. This makes `field(default=0)` and `json.dumps(obj, default=fn)` work.
* `*args` is a tuple. `'%s' % [1, 2]` formats the list as one value. `'{:g}'` and `'{:e}'` formatting match Python (`format(1e20, 'g')` is `'1e+20'`, exponents have at least two digits). A `@staticmethod` can be called through an instance.
* `bin/web-repl-export` no longer overwrites the freshly built bundle with the copy in `web-repl/` when exporting to another directory.
* Added standard library modules: `sys`, `os` and `os.path`, `time`, `types`, `numbers`, `collections.abc`, `warnings`, `weakref`, `struct`, `queue`, `secrets`, `inspect` and `calendar`.
* Reading a name after `del name` raises `NameError` (it gave `undefined`), and reading a local variable before it is assigned raises `UnboundLocalError`, as in Python. Deleting an unbound name raises too. Only reads that can find the name unbound are checked at run time.
* Builtin methods read as values keep their receiver: `add = items.append`, `map('<{}>'.format, xs)`, `seen.add` and `', '.join` work when passed around or called later.
* A metaclass's `__call__` now runs when its classes are instantiated, so the singleton pattern (`def __call__(cls, *args, **kw): ... super().__call__(*args, **kw)`) works. Attributes defined on a metaclass are readable through its classes (`cls._instances`).
* `Cls.__dict__` returns the class namespace (methods, class variables, static attributes) as a read-only mapping. `obj.__dict__` and `vars(obj)` no longer list methods bound onto the instance by `bound_methods`.
* `rapydscript -x` keeps docstrings, so `__doc__` is available when running code (`--keep-docstrings` is still needed for compiled output).
* `datetime` gains `tzinfo`, `timezone` (`timezone.utc`, `UTC`), `tzinfo=` on `datetime` and `time`, `astimezone()`, offsets in `isoformat()` / `fromisoformat()` (all Python 3.11 ISO formats), `datetime.strptime()`, the remaining `strftime` directives (`%y`, `%z`, `%Z`, `%U`, `%W`, `%G`, `%V`, `%c`, ...), `isoformat(timespec=)` and `__format__`. Aware datetimes compare and subtract in UTC. Fixes: `repr(time(14))`, `ctime()` day padding, `bool(time(0))`, microseconds in `fromtimestamp()`/`timestamp()`, and Python's error messages.
* `string` gains `capwords()`. `Template.substitute()` / `safe_substitute()` accept keyword arguments, and `Template` supports `get_identifiers()`, `is_valid()` and subclass `delimiter` / `idpattern` / `pattern`. `Formatter().format()` accepts keyword arguments, attribute and index lookups, conversions and nested specs, with all of CPython's hooks.
* Fix: `print()` with several arguments passed the first one to `console.log` as a format string, so `print('50%d', 1)` printed `501`. `format()` and `str.format()` right-aligned strings by default (`format('a', '5')` was `'    a'`); strings now align left and numbers right, as in Python. `repr()` escapes control and other non-printable characters (`'\x0b'`), and `'{!a}'` uses `ascii()`.
* Fix: `getattr(3, 'x', default)` and `hasattr(3, 'x')` crashed on numbers and other primitives, `hasattr()` didn't catch an `AttributeError` raised by `__getattr__` or a property, and the `AttributeError` message is now Python's (`'P' object has no attribute 'x'`).
* Fix: U+2028 / U+2029 inside a string literal ended the line, so such strings failed to compile.
* Fix: with `bound_methods`, a class defining `__new__` (or other static methods) failed on instantiation.
* Fix: a `super()` call with `*args` and keyword arguments could lose its positional arguments when the same code was compiled twice (e.g. for two JS versions).

version 0.9.9
=======================
* Added support for js object-style key access and destructuring for jsmap, which python dictionary literals are transpiled into, for better integration into other js code

version 0.9.8
=======================
* Added support for Python-style relative imports: `from .mod import x`, `from ..pkg import y`, `from . import name`, `from ...top import z`, etc.
* Added `service.clearVirtualFiles()` on the Monaco language service — wipes all registered virtual files and re-runs diagnostics on every attached model.

version 0.9.7
=======================
* Added `export_all` compile option — prefixes `export` to every top-level user-declared function, class, and variable in the output.
* Added `parse()` on the web-repl bundle — `RapydScript.parse(code, opts)` on the browser bundle now returns the AST directly.
* `SyntaxError` now extends the host's native `SyntaxError` when available (`window.SyntaxError` / `globalThis.SyntaxError`, falling back to `Error`) and expose a Babel/Acorn-style `.loc = {line, column}` alongside the existing `.line`/`.col`/`.lineNumber`/`.fileName` fields.

version 0.9.6
=======================
* Added Python-style division-by-zero: `1 / 0`, `5 // 0`, and `7 % 0` now raise `ZeroDivisionError` (matches CPython) instead of producing `Infinity`/`NaN`. The augmented forms `/=`, `//=`, and `%=` also raise. Controlled by the new `python_division` flag, on by default; disable per-scope with `from __python__ import no_python_division` to revert to raw JS arithmetic semantics. When `overload_operators` is active, the operator dispatch helpers always raise on a zero divisor (matches the existing `python_modulo` precedence).
* Added support for the Python iterator protocol (`__iter__` / `__next__`). A class that defines `__iter__(self)` (returning an iterator, typically `self`) and `__next__(self)` (returning the next value, raising `StopIteration` to stop) is now consumable by every iteration mechanism: `for x in obj`, `list(obj)`, `tuple(obj)`, `set(obj)`, `sum(obj)`, `iter(obj)`, `next(it)`, list/set/dict/generator comprehensions, `[*obj]` / `(*obj,)` / `{*obj}` spread, and native JS `for...of` / `[...obj]` — under both `--js-version 5` and modern targets. The compiler emits `Cls.prototype[Symbol.iterator] = Cls.prototype.__iter__` (already done) plus `Cls.prototype.next = ρσ_next_method`, a new runtime adapter that translates `__next__` / `StopIteration` into the JS `{done, value}` protocol. Both `raise StopIteration` (bare class) and `raise StopIteration()` are accepted.
* Added support for Python-style `*expr` unpacking inside tuple literals (PEP 448): `(0, *a, 4)`, `(*a, *b)`, and the single-element `(*a,)` form now compile to `ρσ_tuple_decorate([0, ...a, 4])`. List spread (`[*a, ...]`) and set spread (`{*a, ...}`) — which already worked — are unchanged. A bare `(*a)` without a trailing comma raises a parse error, matching CPython.
* Added Python-style `str.split()` on any whitespace: calling `.split()` with no argument — or with `None` as the separator — now splits on runs of any whitespace (space, tab, newline, carriage return, form-feed, vertical-tab) and strips leading/trailing whitespace, matching CPython. Previously `.split()` with no args was rewritten to `.split(" ")` (single-space only), so `"hello\nworld\tfoo".split()` returned `['hello\nworld\tfoo']`; it now returns `['hello', 'world', 'foo']`. `split(None, maxsplit)` honors Python maxsplit semantics (whitespace past the final boundary is preserved verbatim). Explicit separators (`s.split(',')`) continue to use native JS semantics.
* Added Python-style bitwise operator precedence: `&`, `|`, `^`, `<<`, `>>` now bind **tighter** than comparison operators (`==`, `!=`, `<`, `>`, `<=`, `>=`, `in`), matching CPython's precedence table. So `a & b == c` parses as `(a & b) == c` (Python) instead of `a & (b == c)` (JS). Controlled by the new `python_bitwise_precedence` flag, on by default; disable per-scope with `from __python__ import no_python_bitwise_precedence` to revert to JavaScript precedence. Inter-bitwise precedence (`&` > `^` > `|`) and arithmetic-vs-shift precedence are unchanged.
* Fix: `with` statement now calls `__exit__(None, None, None)` on normal exit (Python protocol) instead of `__exit__()` with zero arguments. Class-based context managers that declare the standard `def __exit__(self, exc_type, exc_val, exc_tb):` signature — including under `type_enforcement` — no longer raise `TypeError: __exit__() missing required positional argument: 'exc_type'` on normal exit. The exception path continues to pass `(exc_type, exc_val, exc_tb)` as before. Backward compatibility: classes whose `__exit__` declares no explicit positional parameters (`def __exit__(self):`, `def __exit__(self, *args)`, or all-default forms) keep the legacy 0-arg calling convention on normal exit, so existing code that relied on the old behavior continues to work.
* Added support for runtime `isinstance()` checks against `typing` generic forms — `Optional[X]`, `Union[X, Y]`, `List[X]`, `Dict[K, V]`, `Set[X]`, `Tuple[...]`, `Type[X]`, `Literal[...]`, `Callable`, `ClassVar[X]`, `Final[X]`, `Any`, and abstract aliases (`Iterator`, `Iterable`, `Sequence`, `Mapping`, etc.). Function parameter annotations like `def f(x: Optional[int])` now enforce correctly at call time under `type_enforcement` instead of raising `TypeError: Right-hand side of 'instanceof' is not callable`.
* Added the `decimal` standard library module (`Decimal`, `Context`, `getcontext`, `setcontext`, `localcontext`, rounding modes `ROUND_HALF_EVEN` etc., exceptions `InvalidOperation`, `DivisionByZero`, `ConversionSyntax`). Arbitrary-precision arithmetic backed by JS `BigInt`; full dunder arithmetic / comparison / conversion with reflected forms; `quantize()`, `sqrt()`, `normalize()`, `fma()`, `as_tuple()`, `to_eng_string()`; supports NaN / sNaN / +/-Infinity.
* Added the `difflib` standard library module.
* Added the `fractions` standard library module.
* Added `contextlib.asynccontextmanager` decorator.
* Added support for `tuple` as a distinct runtime type.
* Added support for Python printf-style `%` string formatting when the left operand is a string.
* Added support for Python `bytes` and `bytearray` builtins.
* Added support for Python-style set operators on `set` and `frozenset`: `|`, `&`, `-`, `^`, `<=`, `>=`, `<`, `>`, `|=`, `&=`, `-=`, `^=`.
* Added support for string repeat with `*` operator (e.g. `'ab' * 3`, `5 * '-'`), negative counts return empty string
* Added broader JavaScript library type hints in the language service (completions, hover, and diagnostics for browser/DOM globals via `.d.ts` parsing)
* Fix: Invalid dictionary iteration now raises `ValueError` when tuple-unpacking string keys (e.g. `for k, v in d:` without `.items()`)
* Fix: A user-defined `class Error(Exception)` no longer shadows the native JS `Error` constructor that baselib relies on for stack capture and exception inheritance. Class definitions are now emitted as `var Name = function Name() {...}` instead of a hoisted `function Name() {...}` declaration, preventing the prototype cycle and infinite recursion that previously occurred when baselib and user code shared a scope (e.g. in the web-repl bundle).

version 0.9.5
=======================
* Added support for `__slots__` enforcement via JS Proxy (subclass merging, graceful fallback)
* Added support for exception `.args` property (all exception classes capture constructor arguments)
* Added support for dict `|` (merge) and `|=` (update) operators
* Added Python-style `repr()` formatting: single-quoted strings, `repr()` applied to container elements
* Added `interface extends` support in the language service TypeScript definition parser
* Fix: Improved type checking for bitwise and unary operators (raises `TypeError` for invalid types)

version 0.9.4
=======================
* Added the `statistics` standard library module (`mean`, `fmean`, `median`, `median_low`, `median_high`, `median_grouped`, `mode`, `multimode`, `stdev`, `pstdev`, `variance`, `pvariance`, `harmonic_mean`, `geometric_mean`, `quantiles`, `covariance`, `correlation`, `linear_regression`, `NormalDist`)
* Added the `pprint` standard library module (`pprint`, `pformat`, `PrettyPrinter`, `isreadable`, `isrecursive`, `saferepr`)
* Added `ChainMap` to the `collections` standard library module
* Added support for `bigint` literals and the `bigint()` builtin
* Fix: Added the `type` builtin to global scope
* Fix: Performance problem during long editor sessions in the language service

version 0.9.3
=======================
* Added the `bisect` standard library module (`bisect_left`, `bisect_right`, `bisect`, `insort_left`, `insort_right`, `insort`, optional `key` parameter)
* Added the `base64` standard library module
* Added the `string` standard library module (character constants, `Template`, `Formatter`)
* Added the `html` standard library module (`escape`, `unescape`, `HTMLParser`, etc.)
* Added the `asyncio` standard library module (`sleep()`, `gather()`, `create_task()`, etc.)
* Added the `urllib` standard library module
* Added the `http` standard library module (`HTTPStatus`, `HTTPConnection`, `HTTPSConnection`, `HTTPResponse`, `SimpleCookie`, `Morsel`, `CookieError`)
* Added the `csv` standard library module (`reader`, `writer`, `DictReader`, `DictWriter`, `Dialect`, `register_dialect`, QUOTE_* constants, etc.)
* Added the `textwrap` standard library module (`TextWrapper`, `wrap`, `fill`, `shorten`, `dedent`, `indent`)
* Added the `logging` standard library module (`getLogger`, `basicConfig`, `Logger`, `Handler`, `StreamHandler`, `Formatter`, `Filter`, level constants, etc.)
* Added the `heapq` standard library module (`heappush`, `heappop`, `heapify`, `heapreplace`, `heappushpop`, `nlargest`, `nsmallest`)
* Added support for parenthesized `with` statements: `with (A() as a, B() as b):` — multi-line and trailing comma supported
* Added support for async generators (`async def` with `yield`) and `async for` — compiles to JS `async function*` (wrapped) and `for await ... of`
* Added support for `float("inf")` and `float("-inf")`
* Added `long()` type and improved pretty-printing of `type()` return values
* Language service: bare imports now correctly provide type hints; infinite loop warning

version 0.9.2
=======================
  * Added the contextlib standard library
  * Added the datetime standard library
  * Added the io standard library
  * Added the json standard library
  * Added support for the `debugger` keyword 
  * Added TypeScript definitions for compiler.js
  * Simplified ExtraBuiltins interface

version 0.9.0
=======================
  * All optional Python compatibility features are now enabled by default. See Python Feature Coverage from the README
  * Add `enum` standard library module
  * Add `dataclasses` standard library module
  * Add `abc` standard library module (`ABC`, `abstractmethod`, `Protocol`)
  * Add `typing` standard library module
  * Add support for `eval()` and `exec()` to run python/rapydscript code. Please use this responsibly.
  * Add support for `vars()` and `globals()` builtins
  * Add support for complex numbers and complex number literals
  * Add support for `bytes` literals and the `ByteString` type
  * Add support for `__format__` dunder method
  * Add support for Python-style container comparison (chained `<`/`>`)
  * Add support for strict `zip()` behavior
  * Add support for `object()`, `int.bit_length()`, and `float.is_integer()`
  * Prevent JavaScript-style arithmetic type coercion when attempting to sum invalid mixed data types


version 0.8.4
=======================
  * Added support for jsx
  * Added support for basic React components
  * support for __new__, __getattr__, __setattr__, __delattr__, __class_getitem__, __init_subclass__
  * added `copy` standard library


version 0.8.0 - 0.8.3
=======================

  * Add language service with tab-completion, return type inference, hover tips, and typing exports
  * Add source maps support for the transpiled js
  * Add `itertools` standard library module
  * Add `collections` standard library module
  * Add `functools` standard library module
  * Add `numpy` standard library module
  * Add `async`/`await` support
  * Add lambda expression support
  * Add structural pattern matching (`match`/`case`) support
  * Add starred assignment support (e.g. `a, *b = [1, 2, 3]`)
  * Add ellipsis operator and subscript tuple support
  * Add walrus operator (`:=`) support
  * Add dict merge literal support (`{**a, **b}`)
  * Add positional-only (`/`) and keyword-only (`*`) parameter separators
  * Add `@classmethod` decorator support with improved class property access
  * Add nested comprehension support
  * Add overloaded operator support
  * Add Python-style truthiness for empty lists and dicts
  * Add `super()` support
  * Add compiler flags to enable optional pythonic behaviors
  * Add `any()` and `all()` builtins
  * Add tree shaking support for reduced output size
  * Add module mode for exporting root-level functions
  * Add support for virtual imports
  * Add support for bundling pythonized strings into compiled output
  * `print` now maps to `console.log`; `window.print` maps to the JS printer dialog
  * Add custom class mapping support in `dict()`

version 0.7.22
=======================

  * Fix assignment operators other than the plain = not working with overload_getitem
  * Fix dict.popitem() removing the first rather than the last item

version 0.7.21
=======================

  * class decorators are now called after the class prototype is populated
  * Fix len(range()) giving incorrect results
  * Add support for {var=} to format strings
  * Fix unary operators discarding parentheses
  * Add a __module__ property to function objects
  * Get isinstance working for int and float

version 0.7.20
========================

  * lint: Fix using a tuple for destructuring assignment not registering the defined symbols
  * Add head and body and base to elementmaker
  * Make the gettext tools available in the embedded compiler
  * re.pyj: Allow lookbehind assertions since they are supported in modern JS engines

version 0.7.19 
========================

  * Fix calling super-class methods in a method accepting `*args` not working
  * Fix list.pypop() removing the first instead of the last element
  * Fix exponentiation operator being used when js-version >= 6 rather than 7
  * Disallow assignments in while conditionals
  * Avoid unnecessary function annotations for functions that have empty signatures
  * Fix handing of "not in" operator when LHS is also a binary operator with higher precedence
  * Dont accept while statements without a trailing colon
  * msgfmt: fix parsing of escapes in msg strings
  * Fix missing enclosing brackets when translating an assert to an AssertionError
  * Fix comments at the bottom of the file not being output
  * Fix comments before first statement not being output for imported modules
  * Fix outputting top-level comments preventing output of baselib
  * Allow using NaN with the is operator
  * Fix anonymous function definitions inside class definitions hoisting their variables into the class prototype.
  * Fix gettext catalog generation when plurals are present
  * Fix int() not working correctly on floating point numbers which have exponential string representations.
  * Fix encoding of \u00ad
  * Fir repeated calls to random.seed() with the same seed not fully resetting the RNG.
  * Fix an error in handling chained binary operators involving comparison operators and an equality operator.
  * Ensure repr() of set is always correct

version 0.7.18
==================

  * Support the else: clause for try: statements
  * Use the JS ** operator instead of Math.pow() when --js-version > 5
  * Detect syntax errors of the form atomic token followed by atomic token
  * Fix ** operator not working with parenthesized unary expressions
  * Handle changed output from newer version of regenerator
  * Detect missing indentation for blocks as a syntax error
  * Linter: recognize pow() as a global function

version 0.7.17
==================

  * Fix attempts to access calss variables from inside instance methods not
    working
  * Fix stdlib random.random() method not working in the Edge browser

version 0.7.16
==================

  * Fix using function generators not working if installed version of uglify-js >= 3
  * Speedup the compiler slightly by making reading options more efficient

version 0.7.15
==================

  * Fix , flag for str.format thousands grouping not working
  * Fix iteration over TouchList not working in Safari
  * Fix }} escapes not being converted to } in f-strings

version 0.7.14
==================

  * Fix }} escapes not being processed correctly in format strings
  * Fix function definitions inside loops causing errors on ancient JS engines
  * Fix --js-version command line argument not working

version 0.7.13
==================

  * A uuid module for the standard library
  * Implement the full python interface for the min() and max() functions
  * Implement the full python interface for rangeobjects
  * Implement the divmod function from python

version 0.7.12
==================

  * Fix == failing when one of the arguments is None and the other is an object
  * Make the range() function return an object that behaves like the python range() object
  * Fix de-structuring assignment not working with iterators

version 0.7.11
==================

* Fix slice assignment not working
* Implement the global keyword
* Make list.pysort a stable sort on all JS engines
* Fix a typo that broke the REPL when XDG_CACHE_HOME is an absolute path

version 0.7.10
==================

* Fix passing of keyword args to the dict() function not working
* Improve the string representation of dicts and HTMLElements

version 0.7.9
==============

* BACWARDS INCOMPATIBLE: Make the `type()` function behave more like python's
  `type()` function. It now return the class of the passed in argument, instead
  of a string type name. For existing code that use `type()`, replace `type()` by
  `jstype()`

* Fix multiple newlines not being properly escaped in interpolated string literals

version 0.7.8
==============

* Fix --cache-dir option defaulting to current working directory instead of being disabled
* Fix display of option names containing more than a single hyphen
* Fix including backslashes and/or newlines in interpolated string literals
* Fix spurious error message from linter when using interpolated string literals

version 0.7.7
==============

* Implement literal string interpolation (PEP 498)
* Fix incorrect method binding when using the `bound_methods` scoped flag and calling the super-class `__init__()` method
* elementmaker: Ignore kwargs that have types other than bool, string or func
* gettext: Allow registering callbacks for notification when new translation data is installed
* Fix a rare crash in the linter

version 0.7.6
==============

* Fix nested imports beyond two levels not working
* Fix iteration over NodeList/HTMLCollection not working with ES 6 output in Edge and Chrome < 51
* Add WebSocket to the list of known global class names

version 0.7.5
==============

* Add an option to have the compiler generate all its cache files in a central
  directory. Use --cache-dir if you dislike having the `*.pyj-cached` files spread
  throughout your source code

version 0.7.4
==============

* Fix piping data into rapydscript for compilation not working

version 0.7.3
==============

* Fix extra-semicolon after chain assignment, and also avoid using a temp
  variable for non-destructuring chain assignments

* Fix a bug in the compiler cache system that could cause the compiler to
  output incorrect code when re-compiling a previously cached module that was
  imported from more than one other module.

* Add the builtin `pow()` function from python

* Workaround for a bug in the latest release of Chrome that broke the web REPL
  and embedded compiler.

version 0.7.2
==============

* Fix multiline string literals not working in some contexts, such as after
  return or yield keywords

* Add a scoped flag `hash_literals` to control whether `{}` literals generate
  JavaScript arrays or JavaScript hashes. Note that the `dict_literals` scoped
  flag takes precedence over this flag.

* Add a builtin function `get_module()` to get a reference to the module dicts
  for a previously imported module.

* Nicer error messages when web-repl-export is not called correctly

version 0.7.1
==============

* Make importing of non-aliased submodules `import module.submodule` work just
  like in python (the submodule name is bound into the parent namespace at
  the import statement rather than at import time)

* Fix referring to class variables not working. Now there is no need to use 
  `A.prototype.x` one can just do `A.x` and the compiler will handle it automatically,
  provided it knows that A is a class.

* Fix a regression in 0.6.0 that broke using @staticmethod for methods that accept arguments

version 0.7.0
==============

New features
-------------

 * Implement the existential operator, see the README for details.
 * Add the any() and all() builtin functions from python
 * Drop support for the JavaScript form of the conditional ternary operator
   (backwards incompatible). This was done mainly to free up the `?` operator for use
   as the existential operator.
 * Add a traceback module to the standard library that works like the python
   one 
 * Full support for negative indices on lists: `a=-1; b[a] is b[-1]`

Bug fixes
------------
 * Fix local variables in except: blocks not being declared
 * Make defining custom exception classes work just as in python (just subclass
   Exception and you are done)
 * Make the default `__repr__()` method use the base class implementation when available
 * Fix the del operator: Now your can use it to delete slices of arrays,
   variable names, etc.
 * Make the use of javascript reserved words as identifiers a compile time error, instead of a runtime error
 * Fix optimization of range() causing incorrect behavior when the stop expression is dynamic

version 0.6.4
==============

 * Support for docstrings in modules, classes and functions, just like python.
   By default the docstrings are discarded (except in the REPL). There is a
   compiler option to keep the docstrings as the `__doc__` attribute in the
   output JavaScript.

 * Add hexlify()/unhexlify() to the encodings stdlib module

 * Object literals now produce JavaScript objects that have no prototype. This
   makes them more like python dicts, in that there is no need to use
   Object.keys() and Object.hasOwnProperty() to iterate/test their keys.

version 0.6.3
==============

 * Add a module to the standard library to easily add python string methods to the JavaScript String object, if needed.
 * Fix isinstance('a', str) not working
 * Prevent an infinite loop in str.count() when needle is an empty string
 * Fix default values for function args not working when combined with annotations
 * Change the prefix used internally for RapydScript private symbols from `_$rapyd$_` to `ρσ_` as it makes the output JavaScript easier to read

version 0.6.2
==============

 * Support multiple inheritance, just as in python
 * Support method auto-binding for classes, just as in python, via an optional scoped flag. See the Method binding section in the README for details

version 0.6.1
==============

Bug fix release, fixing a couple of regressions in 0.6.0

 * Fix a regression caused by the new kwargs code that caused incorrect construction of classes when called with kwargs
 * Fix a regression when calling super class methods with kwargs

version 0.6.0
==============

New features
--------------------

 * Support for function type annotations, just like in Python 3. You can now
   create optional type annotation in RapydScript, exactly as you would in
   Python 3.

 * Support for *scoped flags* -- a mechanism to change the behavior of the
   compiler in sections of code using simple statements in the code. These work
   like compiler pragmas in C/C++ but have the additional feature that they are
   local to a scope -- i.e. they are automatically reset when leaving the scope
   they are defined in, which could be a function or a module or even a class.

 * Support for python style dicts using the exact same syntax as in python. The
   default syntax still creates JavaScript objects, but you can switch to
   python dicts using a scoped flag:
   ```py
   from __python__ import dict_literals, overload_getitem
   ```
   This will cause the default syntax to generate python dicts.

 * Add an **encodings.pyj** module to the stdlib which is very useful to convert
   between utf-8 bytearrays, base64 encoded strings, and native strings.

 * Implement repeating of string literals with the * operator
   `'a' * 3 == 'aaa'`


Bugfixes
----------

 * Enable use of keyword arguments/values when calling all functions, even if
   they have not been defined with keyword arguments.

 * Fix use of `*args/**kw` when calling functions that are the result of a
   complex expression, causing the expression to be evaluated twice.
 
 * Fix negative const index on expression containing a function call causing
   the function call to be executed twice

 * Fix --import-dirs not being used when recursively processing imports

version 0.5.2
==============

 * New module in stdlib: **aes.pyj** that implements the symmetric encryption
   ciphers: AES-GCM, AES-CBC, AES-CTR

 * Improved support for TypedArrays -- you can now iterate over them just like
   normal arrays and also repr() wors for them.

 * elementmaker.pyj: Allow setting HTML 5 boolean attributes using True/False.
   Fix E.iframe() not working.

 * Make the equality operators also work with javascript dicts (when
   javascript objects are used as dicts)


version 0.5.1
==============

Fix a bug that caused the equality operators to not work for lists. Also,
fix the new equality operators causing their arguments to be evaluated twice
when the arguments are expressions, such as function calls, generators, object
literals, etc.

version 0.5.0
==============

Below are listed all the major new features and backwards incompatible changes
since the creation of the rapydscript-ng fork, up to version 0.5.0

Backwards incompatible changes:
--------------------------------------------------------------

* A new module/import system that works just like python's, with modules in
  ``.pyj`` files and packages in directories with an ``__init__.pyj`` file.

* The equality operators now work with all container types (list/set/dict) as
  well as user defined classes that implement the `__eq__()` method, just as in
  python. 

* Remove the `to` and `til` operators

* Change syntax for embedded JavaScript literals. Now one uses a normal string
  literal, with the **v** prefix, for example:
  ```py
  for v'i = 0; i < 10; i++':
    pass
  ```
  The old compile time magic function `JS()` used for JavaScript literals has been removed.

* String literals now behave exactly like python. You can use raw string
  literal, escapes for unicode such as `\u2122` or `\N{...}` etc.

* Dict literals now do not treat identifiers as strings, so you can use arbitrary expressions as keys.

* Remove the ``@kwargs`` decorator. Keyword arguments now work seamlessly, just
  as in python.

Major new features:
--------------------

* There is now an in browser REPL (Read-Eval-Print-Loop) for RapydScript,
  available at: https://sw.kovidgoyal.net/rapydscript/repl/

* There is now a linter that performs pyflakes style of undefined/unused
  checks.

* Instructions for easily embedding the RapydScript compiler in a webapp are
  now in the README.

* A new stdlib module: **elementmaker.pyj** that allows for easy creation of
  DOM trees within RapydScript code. For example:
  ```py
  from elementmaker import E
  E.div(class_='mydiv', title='A tooltip', data_special='xxx',
	E.a(href='javascript: void(0)', onclick=def():
		# handle the click event
	),
	'Some text'
  )
  ```

* All the python string functions are now available, including `format()`. However, for reasons of
  compatibility with external javascript code, they are not implemented as
  methods on string objects, instead, use the global ```str``` object, for
  example:
  ```py
  str.format('{:02d} {}', 1, "wow") == '01 wow'
  ```
  There is a convenience module in the stdlib to add these functions to the
  JavaScript String object, if needed.

* Support dict and set comprehensions

* Support the python conditional operator syntax: ```a if b else c```

New features
-------------------------

* Implement `str()` and `repr()` functions that work well for JavaScript arrays and
  Objects as well as your own custom classes that define the `__repr__()` and
  `__str__()` methods

* A builtin `sorted()` function that behaves like python's

* A builtin `id()` function that behaves like python's (only for objects
  defined in RapydScript)

* Support for dynamic properties just as in python with the `@property` decorator

* Allow trailing commas in function calls and function definitions

* Allow specifying multiple locations to search for modules to import

* Allow iteration `(for x in ...)` to work for DOM based array like containers
  such as `NodeList` and `NamedNodeMap` even when they come from a different frame.

* Support for internationalization, works just like in python (see README for
  details).

* Linter: Allow suppressing errors at file level as well

* Automatic concantenation of neighboring string literals: '1' '2' == '12'

* Support for arbitrary expressions as decorators

* Support for generator comprehensions

* The stdlib's `re.pyj` module has been greatly enhanced. It's functionality is
  now much closer to python's re module.

* Added support for the with statement (context managers)

* Support for binary number literals

* A builtin set type and set literals

* Support recursive destructuring in assignments and for loop expressions.

* Add a new ES 6 output mode that emits faster code for ES 6 compatible
  runtimes


In addition there have been hundreds of bug fixes.
