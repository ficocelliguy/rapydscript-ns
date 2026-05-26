
- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ python decimal module ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.

## Example: tuple as a distinct type

```python
# Tuple literal — distinct from a list, with .count() and .index()
colors = ('red', 'green', 'blue', 'red')
assert isinstance(colors, tuple)
assert not isinstance(colors, list)
assert colors.count('red') == 2
assert colors.index('green') == 1

# Empty, single, and the tuple() constructor
empty   = ()
single  = (42,)                # trailing comma required
built   = tuple([1, 2, 3])
assert isinstance(empty, tuple) and len(empty) == 0
assert single[0] == 42 and isinstance(single, tuple)
assert built.index(2) == 1

# Concatenation and repetition stay as tuples
joined   = (1, 2) + (3, 4)     # (1, 2, 3, 4)
repeated = (0,) * 3            # (0, 0, 0)
assert isinstance(joined, tuple) and isinstance(repeated, tuple)

# Python-style repr
assert str(()) == '()'
assert str((42,)) == '(42,)'
assert str((1, 2, 3)) == '(1, 2, 3)'
```

## Example: Fractions (exact rational arithmetic)

```python
from fractions import Fraction

# Construction: int/int, single int, float, string
half  = Fraction(1, 2)
third = Fraction('1/3')
quart = Fraction(0.25)
assert quart == Fraction(1, 4)

# Exact arithmetic — no float drift
assert half + third == Fraction(5, 6)
assert half - third == Fraction(1, 6)
assert half * third == Fraction(1, 6)
assert half / third == Fraction(3, 2)

# Always stored reduced, denominator positive
f = Fraction(6, -8)
assert f.numerator == -3 and f.denominator == 4

# Best rational approximation under a denominator cap
pi = Fraction(3.141592653589793)
assert pi.limit_denominator(10)  == Fraction(22, 7)
assert pi.limit_denominator(100) == Fraction(311, 99)

# Mixed-type comparison with int / float; banker's rounding
assert Fraction(3, 2) > 1 and Fraction(3, 2) < 1.6
assert round(Fraction(5, 2)) == 2          # half rounds to even
assert float(Fraction(3, 4)) == 0.75
assert str(Fraction(3, 4)) == '3/4'
```

## Example: `asynccontextmanager` + `async with`

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def session(url):
    resource = await acquire(url)
    try:
        yield resource
    finally:
        await resource.close()

async def main():
    async with session('/data') as r:
        data = await r.read()
        return data
```

## Example: Multi-line anonymous `def` as a call argument

```python
items = [3, -1, 4, 1, 5, -9, 2]

# Multi-line def passed directly to map(), followed by another arg
squared_positives = list(map(def(x):
    if x < 0:
        return 0
    return x * x
, items))
assert squared_positives == [9, 0, 16, 1, 25, 0, 4]

# Multi-line def alongside a keyword argument
by_abs = sorted(items, key=def(x):
    return x if x >= 0 else -x
)
assert by_abs == [-1, 1, 2, 3, 4, 5, -9]

# Multi-line defs inside a dict literal
ops = {'square': def(x):
    return x * x
, 'cube': def(x):
    y = x * x
    return y * x
}
assert ops['square'](4) == 16
assert ops['cube'](3) == 27
```

## Example: Defining a class named `Error`

```python
# `class Error(Exception)` no longer shadows the native JS Error constructor
# that baselib uses internally for stack capture and exception inheritance.
class Error(Exception):
    def __init__(self, msg, code):
        Exception.__init__(self, msg)
        self.code = code

class SubError(Error):
    pass

e = Error('boom', 42)
assert e.message == 'boom'
assert e.code == 42
assert isinstance(e, Error) and isinstance(e, Exception)
assert e.stack            # native Error.stack still captured by baselib

try:
    raise SubError('sub', 7)
except Error as err:      # subclass caught via its base
    assert isinstance(err, SubError)
    assert err.code == 7
```

## Example: `difflib` — diffs, fuzzy matches, and unified diffs

```python
from difflib import (
    SequenceMatcher, get_close_matches, ndiff, unified_diff,
)

# Similarity ratio between two strings
assert SequenceMatcher(None, 'abcd', 'bcde').ratio() == 0.75

# Fuzzy spell-check style matching
assert get_close_matches('appel', ['apple', 'apply', 'banana']) == ['apple', 'apply']

# Human-readable line-by-line delta
delta = ndiff(['one\n', 'two\n', 'three\n'],
              ['ore\n', 'tree\n', 'emu\n'])
assert any(line == '- one\n' for line in delta)
assert any(line == '+ ore\n' for line in delta)

# Standard unified diff (drop-in replacement for patch-style output)
ud = unified_diff(['1\n', '2\n', '3\n', '4\n', '5\n'],
                  ['1\n', '2\n', 'X\n', '4\n', '5\n'],
                  'a.txt', 'b.txt', n=1)
assert ud[0] == '--- a.txt\n'
assert ud[1] == '+++ b.txt\n'
assert ud[2] == '@@ -2,3 +2,3 @@\n'
```
