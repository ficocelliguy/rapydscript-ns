

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ python style Multi-line Anonymous Functions in Call Arguments ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.

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
