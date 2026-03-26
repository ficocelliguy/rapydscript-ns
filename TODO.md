
### libraries

- Update readme with new default python feature behavior
- single-element tuple (x,)
- -byte type?

- Now fix Optional (which uses (params, None) - a two-element tuple that should become [params, None]) in `typing.pyj` at `def __class_getitem__`


- remove repl_mode and make repl make a new context for each "run" press

- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [ the python typing library (see python differences report) ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

---

Example — typing library usage in RapydScript:

```python
from typing import List, Dict, Optional, TypeVar, Generic

T = TypeVar('T')

class Stack(Generic[T]):
    def __init__(self):
        self._items: List[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> Optional[T]:
        return self._items.pop() if self._items else None

def word_count(text: str) -> Dict[str, int]:
    counts: Dict[str, int] = {}
    for word in text.split():
        counts[word] = counts.get(word, 0) + 1
    return counts

def first(items: List[T]) -> Optional[T]:
    return items[0] if items else None

s = Stack()
s.push(1)
s.push(2)
print(s.pop())       # 2
print(word_count("hello world hello"))  # {'hello': 2, 'world': 1}
```

ρσ_dict {jsmap: Map(1)}
jsmap: 
Map(1)
[[Entries]]
0:{"hello world hello" => 1}
key:"hello world hello"
value:1