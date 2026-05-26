- import some standard python scripts and see what is supported and what is not

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ python style `str.split()` on any whitespace, not just spaces (see python gaps §1.7)] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.



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
