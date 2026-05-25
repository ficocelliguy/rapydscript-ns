

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [the python fractions module ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.


## Example: Set operators

```python
admins = {'alice', 'bob'}
editors = {'bob', 'carol', 'dave'}

everyone   = admins | editors           # {'alice', 'bob', 'carol', 'dave'}
both_roles = admins & editors           # {'bob'}
admin_only = admins - editors           # {'alice'}
one_role   = admins ^ editors           # {'alice', 'carol', 'dave'}

assert {'alice'} <= admins              # subset
assert admins >= {'bob'}                # superset

active = {'alice', 'bob'}
active |= {'carol'}                     # in-place union
```

## Example: bytes / bytearray

```python
# Bytes literal syntax
greeting = b'Hello'
assert len(greeting) == 5
assert greeting[0] == 72                # 'H'
assert greeting.decode('utf-8') == 'Hello'

# Constructors
payload = bytes('café', 'utf-8')        # b'caf\xc3\xa9'
zeros   = bytes(4)                       # b'\x00\x00\x00\x00'
ints    = bytes([0xDE, 0xAD, 0xBE, 0xEF])
assert ints.hex() == 'deadbeef'
assert bytes.fromhex('deadbeef') == ints

# Slicing returns bytes (not arrays)
head = greeting[:2]                     # b'He'
assert isinstance(head, bytes)

# bytearray is the mutable variant
buf = bytearray(b'\x00\x00\x00\x00')
buf[0] = 0x7F
buf.append(0xFF)
buf.extend([1, 2, 3])
assert len(buf) == 8
```

## Example: `%` string formatting

```python
# Positional
assert '%s world' % 'hello' == 'hello world'
assert '%d items, %.2f each' % (5, 1.25) == '5 items, 1.25 each'

# Padding, sign, alt form
assert '%05d' % 42 == '00042'
assert '%+d / %+d' % (5, -5) == '+5 / -5'
assert '%#x' % 255 == '0xff'

# Mapping
ev = '%(level)s [%(name)s] %(msg)s' % {
    'level': 'INFO', 'name': 'app', 'msg': 'started',
}
assert ev == 'INFO [app] started'

# Augmented form
log = 'count=%d'
log %= 9
assert log == 'count=9'
```

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
