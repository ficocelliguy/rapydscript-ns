
### libraries

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- export .t.ds for language service

- add squiggle if import is misnamed / not found - needs testing

- add opt-out for python truthyness
- add web-repl flag for python truthiness?
- include python truthiness in compiler call

- update changelist for 8.0

Currently, in the monaco editor using the language service, if an import is from a file that can't be found or has a typo, all of the language hints stop working. Instead, I would like the import ot be flagged specifically with a fed squiggle to help the user identify the issue.

I would like you to add support for [  Python's extended subscript syntax where commas inside [] implicitly form a tuple ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README to mention this support.




Python Feature Gap Report: RapydScript-NS

Summary

RapydScript-NS covers the vast majority of Python 2/3 core syntax well. The gaps fall into four categories: modern Python syntax, OOP/protocol features, standard library modules, and semantic  
differences.

  ---
1. Modern Python Syntax (Not Supported)

┌───────────────────────────────────────────────┬────────────────┬──────────────────────────────────────────────────────────────┐
│                    Feature                    │ Python Version │                            Notes                             │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ match/case (structural pattern matching)      │ 3.10+          │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Walrus operator :=                            │ 3.8+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ lambda keyword                                │ all            │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Variable type annotations x: int = 1          │ 3.6+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Positional-only parameters (def f(a, /, b):)  │ 3.8+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Keyword-only parameters (def f(a, *, b):)     │ 3.0+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Starred assignment a, *b, c = [1,2,3,4,5]     │ 3.0+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Dict merge literal {**d1, **d2}               │ 3.5+           │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Parenthesized with (multi-context)            │ 3.10+          │  - doesn't make sense in a web context                       │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Exception chaining raise X from Y             │ 3.0+           │ Plain raise only                                             │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ except* (exception groups)                    │ 3.11+          │ No support                                                   │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Nested comprehensions (for a in b for c in d) │ all            │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Complex number literals 3+4j                  │ all            │ No j suffix                                                  │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ Ellipsis literal ... as expression            │ all            │ -tested                                                      │
├───────────────────────────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────┤
│ b'...' bytes literals                         │ all            │ No b prefix; encoding module exists but no native bytes type │
└───────────────────────────────────────────────┴────────────────┴──────────────────────────────────────────────────────────────┘

  ---
2. OOP and Dunder Protocol Gaps

Not Supported at All

┌─────────────────────────────────────────┬─────────────────────────────────────────────────────────────────┐
│                 Feature                 │                              Notes                              │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ super()                                 │ -tested                                                         │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __new__                                 │ No alternative constructor support                              │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __del__                                 │ No destructor/finalizer                                         │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __hash__                                │ Explicitly noted as not implemented; set/dict uses === identity │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __bool__                                │ Empty [] and {} are truthy in JS (differs from Python)          │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __call__                                │ Objects cannot be made callable via dunder                      │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __getattr__ / __setattr__ / __delattr__ │ No attribute access interception                                │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __getattribute__                        │ No attribute lookup overriding                                  │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __format__                              │ No custom format() behavior                                     │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __slots__                               │ No slot declarations                                            │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __class_getitem__                       │ No MyClass[T] generic syntax support                            │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ __init_subclass__                       │ No subclass hooks                                               │
├─────────────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
│ classmethod decorator                   │ Not tested/documented (may partially work via @staticmethod)    │
└─────────────────────────────────────────┴─────────────────────────────────────────────────────────────────┘

Arithmetic/Comparison Operator Overloading

All of these dunder methods are not dispatched — operators always use JS native semantics:

__add__, __radd__, __sub__, __mul__, __truediv__, __floordiv__, __mod__, __pow__, __lt__, __le__, __gt__, __ge__, __ne__, __neg__, __pos__, __abs__, __invert__, __lshift__, __rshift__, __and__,
__or__, __xor__

(Only __eq__, __contains__, __iter__, __len__, __enter__, __exit__, __repr__, __str__ are dispatched)

Nested Classes

Noted in test file (test/classes.pyj) as "not yet fully implemented."

Abstract Base Classes (ABCs)

No abc module, no @abstractmethod, no Protocol support.

  ---
3. Built-in Functions Missing

┌──────────────────────────┬────────────────────────────────────────────────┐
│         Function         │                     Notes                      │
├──────────────────────────┼────────────────────────────────────────────────┤
│ super()                  │ tested                                         │
├──────────────────────────┼────────────────────────────────────────────────┤
│ issubclass()             │ Not implemented                                │
├──────────────────────────┼────────────────────────────────────────────────┤
│ hash()                   │ Not implemented                                │
├──────────────────────────┼────────────────────────────────────────────────┤
│ format(value, spec)      │ Not listed; str.format() works                 │
├──────────────────────────┼────────────────────────────────────────────────┤
│ vars()                   │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ locals()                 │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ globals()                │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ exec()                   │ Not listed (JS eval works directly via v'...') │
├──────────────────────────┼────────────────────────────────────────────────┤
│ eval()                   │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ compile()                │ N/A                                            │
├──────────────────────────┼────────────────────────────────────────────────┤
│ __import__()             │ Not supported                                  │
├──────────────────────────┼────────────────────────────────────────────────┤
│ input()                  │ Not built in                                   │
├──────────────────────────┼────────────────────────────────────────────────┤
│ open()                   │ Not built in                                   │
├──────────────────────────┼────────────────────────────────────────────────┤
│ bytes() / bytearray()    │ Not built in                                   │
├──────────────────────────┼────────────────────────────────────────────────┤
│ memoryview()             │ N/A (browser context)                          │
├──────────────────────────┼────────────────────────────────────────────────┤
│ zip(..., strict=True)    │ strict kwarg not supported                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ enumerate(x, start=N)    │ start parameter may not be supported           │
├──────────────────────────┼────────────────────────────────────────────────┤
│ all() / any()            │ tested                                         │
├──────────────────────────┼────────────────────────────────────────────────┤
│ next(iter, default?)     │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ iter(callable, sentinel) │ Two-arg form likely not supported              │
├──────────────────────────┼────────────────────────────────────────────────┤
│ round(x, ndigits?)       │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ slice()                  │ Not listed as builtin object                   │
├──────────────────────────┼────────────────────────────────────────────────┤
│ frozenset()              │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ complex()                │ Not listed                                     │
├──────────────────────────┼────────────────────────────────────────────────┤
│ object()                 │ Not listed                                     │
└──────────────────────────┴────────────────────────────────────────────────┘

  ---
4. Standard Library Modules Missing

These are Python stdlib modules with no equivalent in src/lib/:

┌─────────────┬─────────────────────────────────────────────────────────────────────────────────┐
│   Module    │                                 What's Missing                                  │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ collections │ tested                                                                          │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ functools   │ tested                                                                          │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ itertools   │ tested                                                                          │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ typing      │ List, Dict, Optional, Union, Tuple, Generic, TypeVar, etc.                      │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ dataclasses │ @dataclass, field(), asdict(), astuple()                                        │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ contextlib  │ contextmanager, suppress, ExitStack, asynccontextmanager                        │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ copy        │ copy(), deepcopy()                                                              │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ string      │ Character constants, Template, Formatter                                        │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ json        │ dumps, loads (JS JSON works directly, but no Python wrapper)                    │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ datetime    │ date, time, datetime, timedelta                                                 │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ inspect     │ signature, getmembers, isfunction, etc.                                         │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ asyncio     │ Event loop, gather, sleep, Queue, Task wrappers                                 │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ enum        │ Enum, IntEnum, Flag                                                             │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ abc         │ ABC, abstractmethod                                                             │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ io          │ StringIO, BytesIO                                                               │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ struct      │ Binary packing/unpacking                                                        │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ hashlib     │ MD5, SHA-256, etc.                                                              │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ hmac        │ Keyed hashing                                                                   │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ base64      │ (partial — encodings module exists)                                             │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ urllib      │ URL parsing/encoding (no urllib.parse)                                          │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ html        │ escape, unescape                                                                │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ csv         │ CSV parsing                                                                     │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ textwrap    │ wrap, fill, dedent, indent                                                      │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ pprint      │ Pretty-printing                                                                 │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ logging     │ Logging framework                                                               │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ unittest    │ Test framework (custom runner used instead)                                     │
└─────────────┴─────────────────────────────────────────────────────────────────────────────────┘

  ---
5. Semantic Differences (Traps)

These features exist but behave differently from Python:

┌─────────────────────────┬────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────┐
│         Feature         │              Python Behavior               │                              RapydScript Behavior                               │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ Truthiness of []        │ False                                      │ True (JS semantics)                                                             │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ Truthiness of {}        │ False                                      │ True (JS semantics)                                                             │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ is / is not             │ Object identity                            │ Strict equality === / !==                                                       │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ // on floats            │ math.floor(a/b)                            │ Correct for integers; JS Math.floor used                                        │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ % on negative numbers   │ Python modulo (always positive)            │ JS remainder (can be negative)                                                  │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ int / float distinction │ Separate types                             │ Both are JS number                                                              │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ String * repetition     │ 'a' * 3 == 'aaa'                           │ Requires pythonize module or JS-side workaround                                 │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ sort() / pop()          │ Standard list methods                      │ Renamed to pysort() / pypop()                                                   │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ Method binding          │ Unbound by default, self passed explicitly │ Same — but differs if you store methods in variables without bound_methods flag │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ dict key ordering       │ Insertion order (3.7+)                     │ Depends on JS engine (V8: insertion order)                                      │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ global scoping          │ Full cross-scope declaration               │ Partial — interactions with nonlocal can be confusing                           │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ Exception .message      │ Not standard (Python uses .args[0])        │ .message is standard (JS style)                                                 │
├─────────────────────────┼────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────┤
│ re module               │ Full PCRE features                         │ No lookbehind, limited unicode, no (?(1)...)                                    │
└─────────────────────────┴────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────┘

  ---
Priority Gaps (Most Impactful)

If prioritizing what to implement next, these have the highest user impact:

1. super() — required for idiomatic OOP code - done
2. Operator overloading (__add__, __lt__, etc.) — blocks numerical/scientific code - done
3. __bool__ / truthiness fix — silent Python compatibility trap - done
   → frozenset — first medium-priority missing builtin - done
4. lambda keyword — commonly expected - done
5. all() / any() — extremely common builtins - done
6. functools.reduce / partial — core functional programming tools - done
7. collections.defaultdict / Counter — frequently used - done
8. Nested comprehensions — common Python pattern - done
9. Walrus operator := — increasingly common in modern Python - done
10. classmethod decorator — standard OOP pattern - done



       