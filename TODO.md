
### libraries


- remove repl_mode and make repl make a new context for each "run" press

- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [ python dataclasses class ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

# Example: Tuple Literals

```py
# Single-element tuple requires a trailing comma
point = (42,)
print(point[0])   # 42

# Multi-element tuple
rgb = (255, 128, 0)
r, g, b = rgb
print(r, g, b)    # 255 128 0

# Nested tuple unpacking in a for loop
segments = [((0, 0), (1, 1)), ((2, 3), (4, 5))]
for (x1, y1), (x2, y2) in segments:
    print(x1, y1, '->', x2, y2)

# isinstance with a tuple of types
def classify(x):
    if isinstance(x, (int, float)):
        return 'number'
    return 'other'

print(classify(3))      # number
print(classify('hi'))   # other
```

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
