
### libraries


- remove repl_mode and make repl make a new context for each "run" press
- `.replace(str, str)` replaces only the first occurrence.
- eval is js

- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [`vars()` / `locals()` / `globals()`  ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).


# Example: Dataclasses

```py
from dataclasses import dataclass, field, asdict, replace

@dataclass
class Point:
    x: int
    y: int = 0

p = Point(3, 4)
print(repr(p))          # Point(x=3, y=4)
print(p == Point(3, 4)) # True

@dataclass
class Polygon:
    name: str
    vertices: list = field(default_factory=list)

    def area(self):
        return len(self.vertices)

tri = Polygon("triangle", [Point(0,0), Point(1,0), Point(0,1)])
print(tri.name)         # triangle
print(tri.area())       # 3
print(asdict(tri))      # {'name': 'triangle', 'vertices': [...]}

p2 = replace(p, y=99)
print(p2)               # Point(x=3, y=99)
print(p.y)              # 4  (original unchanged)
```

ReferenceError: ρσ_in is not defined



# Example: zip(strict=True)

```py
keys = ['a', 'b', 'c']
values = [1, 2, 3]

# Paired iteration — strict mode ensures lengths match
for k, v in zip(keys, values, strict=True):
    print(k, v)   # a 1 / b 2 / c 3

# Mismatched lengths raise ValueError
try:
    list(zip([1, 2], [10], strict=True))
except ValueError as e:
    print(e)   # zip() has arguments with different lengths
```

ReferenceError: ρσ_desugar_kwargs is not defined


## `vars()` / `locals()` / `globals()` example

```py
class Config:
    def __init__(self, host, port, debug):
        self.host  = host
        self.port  = port
        self.debug = debug

cfg = Config('localhost', 8080, True)

# vars(obj) — snapshot of instance attributes
d = vars(cfg)
print(d['host'])   # localhost
print(d['port'])   # 8080

# Iterate over all attributes
for k, v in d.items():
    print(k, '=', v)
# host = localhost
# port = 8080
# debug = True

# vars() and locals() return an empty dict (JS scope not introspectable)
print(vars())    # {}
print(locals())  # {}

# globals() returns a dict of the JS global namespace
g = globals()
print('Math' in g)   # True
```
The last line transpiles to `console.log(ρσ_in("Math", g));`
however it throws the error:
`ReferenceError: ρσ_in is not defined`

