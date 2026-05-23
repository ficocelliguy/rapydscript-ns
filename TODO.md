
`dict(ns.getServer("n00dles")) = "jsset": {}`

`ns.getPlayer().` missing properties


- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python style __slots__ enforcement] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there.

Please gracefully fall back if the browser doesn't support the tools required.

### Exception args example

```python
try:
    raise ValueError("invalid input", 42)
except ValueError as e:
    print(e.args[0])   # "invalid input"
    print(e.args[1])   # 42
    print(e.message)   # "invalid input"
```

### __slots__ example

```python
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(1, 2)
p.x = 10       # OK — 'x' is declared in __slots__
p.z = 3         # AttributeError — 'z' is not in __slots__
```

### Pretty-print containers example

```python
print([1, 'hello', None, True])   # [1, 'hello', None, True]
print({'key': 'val'})             # {'key': 'val'}
print({1, 'two'})                 # {1, 'two'}
print([[1, 2], [3, 4]])           # [[1, 2], [3, 4]]
print(repr('hello'))              # 'hello'
```

