
### libraries

- jsx support -needs testing & integration - spaces support?

- collections not recognized in editor - check other libraries too

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- examples of using js libraries in rapydscript in readme


I would like you to add support for [ __new__` constructor hook ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report.

---

### `__import__` example

```python
# Any module used with __import__ must first be statically imported
# so that it ends up in ρσ_modules at runtime.
from collections import Counter, deque

# Basic: retrieve a module object by name
collections = __import__('collections')
c = collections.Counter('mississippi')
print(c.most_common(3))   # [('s', 4), ('i', 4), ('p', 2)]

# Dotted name without fromlist → top-level package returned
# (mirrors Python: __import__('os.path') returns the 'os' module)
top = __import__('collections')
print(top is collections)  # True

# With fromlist → the named (sub)module is returned directly
mod = __import__('collections', None, None, ['deque'])
d = mod.deque([1, 2, 3])
d.appendleft(0)
print(list(d))  # [0, 1, 2, 3]

# Missing module → ModuleNotFoundError
try:
    __import__('no_such_module')
except ModuleNotFoundError as e:
    print(e.message)  # No module named 'no_such_module'
```
