
### libraries


- remove repl_mode and make repl make a new context for each "run" press

- `.replace(str, str)` replaces only the first occurrence. (needs testing)
- multi-line parenthesized import isn't supported (needs testing)
-  backslash sequences in verbatim JS triple-quote blocks must be doubled (needs testing)

- remove omit_function_metadata

- vscode plugin based on language service?


I would like you to add support for [python style multi-line parenthesized import ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

### base64 example

```python
from base64 import b64encode, b64decode, urlsafe_b64encode, urlsafe_b64decode

message = bytes([72, 101, 108, 108, 111])   # b'Hello'
encoded = b64encode(message)
print(encoded.decode('ascii'))              # SGVsbG8=
decoded = b64decode(encoded)
print(list(decoded))                        # [72, 101, 108, 108, 111]

safe_enc = urlsafe_b64encode(bytes([251, 254, 254]))
print(safe_enc.decode('ascii'))             # -_7-  (no + or /)
```

### str.replace example

```python
text = 'the cat sat on the mat'
print(text.replace('at', 'og'))     # the cog sog on the mog  (all replaced)
print(text.replace('at', 'og', 2))  # the cog sog on the mat  (first 2 only)
csv = '1,2,3,4'
print(csv.replace(',', ' | '))      # 1 | 2 | 3 | 4
```

### multi-line parenthesized import example

```python
from math import (
    floor,
    ceil,
    sqrt,
    pi,
)

print(floor(3.9))   # 3
print(ceil(3.1))    # 4
print(sqrt(16))     # 4
print(pi)           # 3.141592653589793
```
