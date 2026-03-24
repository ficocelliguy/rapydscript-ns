
### libraries

- jsx support -needs testing & integration - spaces support?

- collections not recognized in editor - check other libraries too

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- examples of using js libraries in rapydscript in readme


I would like you to add support for [ `__getattr__` / `__setattr__` / `__delattr__` / `__getattribute__`    ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature.

---

### `__import__` example

```python
# __new__ and __hash__ example:
# __new__ controls instance creation; __hash__ makes the class usable
# as a dict key or set member.

class Color:
    _cache = {}

    def __new__(cls, r, g, b):
        key = (r, g, b)
        if key in cls._cache:
            return cls._cache[key]
        instance = super().__new__(cls)
        cls._cache[key] = instance
        return instance

    def __init__(self, r, g, b):
        self.r = r
        self.g = g
        self.b = b

    def __eq__(self, other):
        return self.r == other.r and self.g == other.g and self.b == other.b

    def __hash__(self):
        return hash((self.r, self.g, self.b))

    def __repr__(self):
        return f'Color({self.r}, {self.g}, {self.b})'

red   = Color(255, 0, 0)
red2  = Color(255, 0, 0)
green = Color(0, 255, 0)

print(red is red2)        # True  — __new__ returns the cached instance
print(red == red2)        # True  — __eq__

seen = {red, green}
print(len(seen))          # 2
print(Color(255, 0, 0) in seen)   # True — __hash__ + __eq__ used by set
```

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

---

### `__getattr__` / `__setattr__` / `__delattr__` / `__getattribute__` example

```python
# Validated attribute store: reject bad values at assignment time,
# log every read, and provide a default for missing attributes.

class SmartRecord:
    def __init__(self, **kw):
        object.__setattr__(self, '_data', {})
        object.__setattr__(self, '_reads', 0)
        for k, v in kw.items():
            self[k] = v   # goes through __setattr__

    def __setattr__(self, name, value):
        # Reject None for any attribute starting with 'required_'
        if name.startswith('required_') and value is None:
            raise ValueError(name + ' cannot be None')
        self._data[name] = value

    def __getattr__(self, name):
        # Fallback for attributes not found by normal lookup.
        if name in self._data:
            return self._data[name]
        return None   # default for missing attrs

    def __getattribute__(self, name):
        # Count every read (except internal ones).
        if name is not '_reads' and not name.startswith('_'):
            object.__setattr__(self, '_reads', object.__getattribute__(self, '_reads') + 1)
        return object.__getattribute__(self, name)

    def __delattr__(self, name):
        if name in self._data:
            del self._data[name]

r = SmartRecord()
r.required_x = 10
r.required_y = 20
print(r.required_x + r.required_y)   # 30
print(r._reads)                       # 2 (two reads above)

r.required_x = None   # ValueError: required_x cannot be None

del r.required_y
print(r.required_y)   # None  (attribute gone, __getattr__ returns default)
```

---

### `__class_getitem__` example

```python
# __class_getitem__ enables subscript notation on a class itself.
# Useful for generic-style type hints and factory patterns.

class TypedList:
    prefix = 'TypedList'

    def __class_getitem__(cls, item):
        # Returns a descriptor string like "TypedList[int]"
        return cls.prefix + '[' + item.__name__ + ']'

print(TypedList[int])   # TypedList[int]
print(TypedList[str])   # TypedList[str]

# Subclasses inherit __class_getitem__; cls is the actual subclass.
class StrictList(TypedList):
    prefix = 'StrictList'

print(StrictList[float])  # StrictList[float]
```
