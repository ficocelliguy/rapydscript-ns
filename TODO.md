
### libraries


- remove repl_mode and make repl make a new context for each "run" press
- `.replace(str, str)` replaces only the first occurrence.

- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [ `abc` module — `ABC`, `@abstractmethod`, `Protocol`  ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

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

## `__format__` dunder example

```py
class Money:
    def __init__(self, amount):
        self.amount = amount
    def __str__(self):
        return str(self.amount)
    def __format__(self, spec):
        if spec == 'usd':
            return '$' + str(self.amount)
        if spec == 'eur':
            return '€' + str(self.amount)
        return format(self.amount, spec)

m = Money(42)
print(format(m, 'usd'))           # $42
print(str.format('{:eur}', m))    # €42
print(f'{m:.2f}')                 # 42.00
print(f'Total: {m:usd}')          # Total: $42
```

## `object()` example

```py
# Sentinel — a unique value that compares equal only to itself
MISSING = object()

def get(mapping, key):
    result = mapping.get(key, MISSING)
    if result is MISSING:
        return 'not found'
    return result

d = {'a': 1, 'b': None}
print(get(d, 'a'))   # 1
print(get(d, 'b'))   # None  (distinguished from MISSING)
print(get(d, 'c'))   # not found

# Explicit base class
class Node(object):
    def __init__(self, val):
        self.val = val

n = Node(42)
print(isinstance(n, object))  # True
print(n.val)                  # 42
```

## `float.is_integer()` example

```py
print((1.0).is_integer())     # True
print((1.5).is_integer())     # False
print((0.0).is_integer())     # True
print((-3.0).is_integer())    # True
print((1e10).is_integer())    # True

values = [1.0, 2.5, 3.0, 4.7, 5.0]
whole = [x for x in values if x.is_integer()]
print(whole)   # [1.0, 3.0, 5.0]
```

## `int.bit_length()` example

```py
print((0).bit_length())     # 0
print((1).bit_length())     # 1
print((255).bit_length())   # 8
print((256).bit_length())   # 9
print((-5).bit_length())    # 3  (sign ignored)

# Pack a list of values into the minimum number of bits each requires
values = [0, 7, 8, 255, 1024]
for v in values:
    print(v, '->', v.bit_length(), 'bits')
# 0 -> 0 bits
# 7 -> 3 bits
# 8 -> 4 bits
# 255 -> 8 bits
# 1024 -> 11 bits
```
