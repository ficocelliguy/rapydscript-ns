- import some standard python scripts and see what is supported and what is not

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ Python style `1/0` returns `None` instead of `ZeroDivisionError` (see python gaps §1.8)] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.



Example: runtime `isinstance` on `typing` generics
--------------------------------------------------

```python
from typing import Optional, Union, List, Any

def first_int(values: List[Union[int, str]]) -> Optional[int]:
    for v in values:
        if isinstance(v, int):
            return v
    return None

print(first_int([1, "x", 2]))                    # 1
print(isinstance(None, Optional[int]))           # True
print(isinstance("hi", Union[int, str]))         # True
print(isinstance([1, 2, 3], List[int]))          # True
print(isinstance({"k": 1}, Any))                 # True
```


Example: `__exit__(None, None, None)` on normal context-manager exit
--------------------------------------------------------------------

```python
class Timer:
    def __enter__(self):
        self.start = Date.now()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = Date.now() - self.start
        if exc_type is None:
            print('completed in', elapsed, 'ms')
        else:
            print('failed after', elapsed, 'ms:', exc_type.__name__)
        return False

with Timer():
    do_work()              # prints "completed in N ms"
```


Example: Python-style bitwise operator precedence
-------------------------------------------------

```python
from __python__ import python_bitwise_precedence

FLAG_READ  = 0x01
FLAG_WRITE = 0x02
FLAG_EXEC  = 0x04

perms = FLAG_READ | FLAG_WRITE

# Bitwise binds tighter than comparison, exactly like CPython.
if perms & FLAG_READ == FLAG_READ:
    print('can read')

# Bitfield masking expressions read naturally without parens.
assert 0b1100 & 0b1010 == 0b1000
assert 1 << 3 == 8
assert perms & FLAG_EXEC == 0
```


Example: `str.split()` on any whitespace (Python semantics)
-----------------------------------------------------------

```python
log_line = "  2026-05-26\tINFO\t handler   started \n"
fields = log_line.split()
assert fields == ['2026-05-26', 'INFO', 'handler', 'started']

# split(None, maxsplit) keeps whitespace past the final split boundary
header, body = "Subject:\tHello\n\nworld".split(None, 1)
assert header == 'Subject:'
assert body == 'Hello\n\nworld'

# Empty and all-whitespace inputs yield []
assert "".split() == []
assert " \t\n ".split() == []
```


Example: `*a` unpacking in list, tuple, and set literals (PEP 448)
------------------------------------------------------------------

```python
head = [1, 2]
tail = [4, 5]

# Spread anywhere in a list literal
combined = [0, *head, 3, *tail, 6]
assert combined == [0, 1, 2, 3, 4, 5, 6]

# Tuple literal — single-element spread needs the trailing comma
just_head = (*head,)
mixed_t   = (0, *head, *tail)
assert just_head == (1, 2)
assert mixed_t == (0, 1, 2, 4, 5)

# Set literal — duplicates collapse
unique = {*head, *tail, 1, 5}
assert len(unique) == 4
```


Example: Python iterator protocol (`__iter__` / `__next__`)
-----------------------------------------------------------

```python
class Squares:

    def __init__(self, n):
        self.n = n
        self.i = 0

    def __iter__(self):
        self.i = 0
        return self

    def __next__(self):
        if self.i >= self.n:
            raise StopIteration
        v = self.i * self.i
        self.i += 1
        return v

# Consumable by every iteration mechanism:
assert list(Squares(4)) == [0, 1, 4, 9]
assert sum(Squares(5)) == 0 + 1 + 4 + 9 + 16
assert tuple(Squares(3)) == (0, 1, 4)

# for-loop
out = []
for x in Squares(3):
    out.push(x)
assert out == [0, 1, 4]

# Comprehensions and * spread
assert [x + 1 for x in Squares(3)] == [1, 2, 5]
assert [*Squares(3)] == [0, 1, 4]

# Manual iter() / next()
it = iter(Squares(2))
assert next(it) == 0
assert next(it) == 1
assert next(it, 'done') == 'done'
```


Example: Division by zero raises `ZeroDivisionError` (Python semantics)
----------------------------------------------------------------------

```python
def safe_ratio(num, denom):
    try:
        return num / denom
    except ZeroDivisionError:
        return None

assert safe_ratio(10, 4) == 2.5
assert safe_ratio(10, 0) is None

# // and % raise the same error
try:
    x = 5 // 0
except ZeroDivisionError as e:
    assert e.message == 'integer division or modulo by zero'

# Opt out per-scope to recover JS Infinity / NaN behaviour:
#   from __python__ import no_python_division
```
