
### libraries


- remove repl_mode and make repl make a new context for each "run" press
- `.replace(str, str)` replaces only the first occurrence.
- eval is js

- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [ <, >, <=, >= on lists / containers (python-style, not the javascript type coercion fallthrough) ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

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

## `eval` and `exec` example

```py
# eval — evaluate a RapydScript expression, optional explicit scope
print(eval("1 + 2"))                          # 3
print(eval("x * x", {"x": 7}))               # 49
print(eval("a + b", {"a": 10}, {"b": 5}))    # 15  (locals merged over globals)

# exec — execute a RapydScript code string, always returns None
log = []
exec("log.append('hello')", {"log": log})
print(log[0])   # hello

exec("for i in range(3):\n    log.append(i * i)", {"log": log})
print(log)      # ['hello', 0, 1, 4]

result = exec("1 + 1")
print(result)   # None
```

## `abc` module example

```py
from abc import ABC, abstractmethod, Protocol, runtime_checkable

# Abstract base class — subclasses must implement area()
class Shape(ABC):
    @abstractmethod
    def area(self): pass

    @abstractmethod
    def perimeter(self): pass

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self):
        return 3.14159 * self.r * self.r
    def perimeter(self):
        return 2 * 3.14159 * self.r

c = Circle(5)
print(c.area())       # 78.53975
print(c.perimeter())  # 31.4159

# Attempting to instantiate the abstract class raises TypeError:
# Shape()  ->  TypeError: Can't instantiate abstract class Shape
#              with abstract methods area, perimeter

# Virtual subclass registration
class Square:
    def __init__(self, side):
        self.side = side
    def area(self):
        return self.side * self.side
    def perimeter(self):
        return 4 * self.side

Shape.register(Square)
print(isinstance(Square(4), Shape))  # True

# Protocol — structural subtyping
@runtime_checkable
class Drawable(Protocol):
    def draw(self): pass

class Canvas:
    def draw(self):
        print('drawing...')

print(isinstance(Canvas(), Drawable))  # True
print(isinstance(42, Drawable))        # False
```

# Example: Arithmetic Type Coercion

```py
from __python__ import overload_operators  # on by default; shown here for clarity

# Valid arithmetic — same types or compatible (bool is an int subclass)
print(1 + 2)        # 3
print('a' + 'b')    # 'ab'
print('ha' * 3)     # 'hahaha'
print(True + 1)     # 2  (bool treated as int)

# Incompatible types raise TypeError, just like Python
try:
    result = 1 + 'x'
except TypeError as e:
    print(e)   # unsupported operand type(s) for +: 'int' and 'str'

try:
    result = 'hello' - 1
except TypeError as e:
    print(e)   # unsupported operand type(s) for -: 'str' and 'int'
```

# Example: Full PCRE regex (lookbehind, unicode, fullmatch)

```py
import re

# Positive lookbehind — strip 'px' only when preceded by a digit
print(re.sub(r'(?<=\d)px', '', '12px 3em 7px'))  # '12 3em 7'

# Negative lookbehind — replace 'b' not preceded by 'a'
print(re.sub(r'(?<!a)b', 'X', 'ab cb'))  # 'ab cX'

# fullmatch — entire string must satisfy the pattern
print(re.fullmatch(r'\d+', '42'))       # <re.MatchObject ...>
print(re.fullmatch(r'\d+', '42abc'))    # None

# Named groups work with lookbehind
m = re.search(r'(?P<word>\w+)(?<=\d)', 'price99')
print(m.group('word'))  # 'price99'
print(m.end())          # 8
```

## Example: Ordered Comparisons on Lists and Custom Objects

```py
from __python__ import overload_operators  # on by default

# Lists compare lexicographically — same semantics as Python
print([1, 2] < [1, 3])     # True   (first differing element: 2 < 3)
print([1, 2] < [1, 2, 0])  # True   (shorter prefix is less)
print([3] > [2, 99])       # True   (first element dominates)
print([1, 2] <= [1, 2])    # True   (equal lists are <=)
print([1] >= [1, 0])       # False

# Custom __lt__ / __le__ / __gt__ / __ge__ are dispatched automatically
class Version:
    def __init__(self, major, minor):
        self.major = major
        self.minor = minor
    def __lt__(self, other):
        if self.major != other.major:
            return self.major < other.major
        return self.minor < other.minor
    def __le__(self, other):
        return self is other or self.__lt__(other)
    def __gt__(self, other):
        return other.__lt__(self)
    def __ge__(self, other):
        return other.__le__(self)
    def __repr__(self):
        return f"Version({self.major}, {self.minor})"

v1 = Version(1, 9)
v2 = Version(2, 0)
v3 = Version(2, 0)
print(v1 < v2)   # True
print(v2 <= v3)  # True  (equal)
print(v2 > v1)   # True

# Chained comparisons with lists
assert [1] < [2] < [3]   # True
assert [3] > [2] > [1]   # True

# Incompatible types raise TypeError
try:
    result = [1, 2] < 5
except TypeError as e:
    print(e)   # '<' not supported between instances of 'list' and 'int'
```
