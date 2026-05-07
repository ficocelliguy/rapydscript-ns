
### libraries

- The 7n literal isn't supported by the parser — use BigInt()

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python heapq module] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there.

### asyncio example

```python
import asyncio

async def fetch(url, delay):
    await asyncio.sleep(delay)
    return 'data from ' + url

async def main():
    results = await asyncio.gather(
        fetch('https://api.example.com/a', 0.1),
        fetch('https://api.example.com/b', 0.2),
    )
    for r in results:
        print(r)

asyncio.run(main())
```

### urllib example

```python
from urllib.parse import urlencode, urlparse, urljoin
from urllib.request import urlopen
from urllib.error import URLError, HTTPError
import asyncio

BASE = 'https://httpbin.org/'

async def get_json(path, params=None):
    url = urljoin(BASE, path)
    if params:
        url += '?' + urlencode(params)
    resp = await urlopen(url)
    return await resp.json()

async def main():
    # Parse and inspect a URL
    r = urlparse('https://user:pw@api.example.com:8080/v1/items?page=2#top')
    print(r.scheme, r.hostname, r.port, r.path, r.query)

    # Fetch JSON (requires network)
    try:
        data = await get_json('get', [['foo', 'bar'], ['n', '42']])
        print(data)
    except HTTPError as e:
        print('HTTP', e.code, e.msg)
    except URLError as e:
        print('Network error:', e.reason)

asyncio.run(main())
```

### bisect example

```python
from bisect import bisect_left, bisect_right, insort

# Grade boundaries
breakpoints = [60, 70, 80, 90]
grades = 'FDCBA'

def grade(score):
    return grades[bisect_right(breakpoints, score)]

print([grade(s) for s in [55, 62, 74, 83, 91, 100]])
# ['F', 'D', 'C', 'B', 'A', 'A']

# Maintain a sorted log of timestamps as they arrive out of order
log = []
for ts in [1715, 1700, 1730, 1710, 1725]:
    insort(log, ts)
print(log)  # [1700, 1710, 1715, 1725, 1730]

# Find insertion window using lo/hi to search only a slice
data = [1, 3, 5, 10, 20, 30]
pos = bisect_left(data, 15, 3, 6)  # search only indices 3..5
print(pos)  # 4 (between 10 and 20)
```

### http example

```python
from http         import HTTPStatus
from http.client  import HTTPConnection, HTTPSConnection, HTTPException
from http.cookies import SimpleCookie
import asyncio

async def fetch_api(host, path, headers=None):
    conn = HTTPSConnection(host)
    conn.request('GET', path, headers=headers or {})
    resp = await conn.getresponse()
    conn.close()
    if resp.status >= 400:
        print('Error', resp.status, resp.reason)
        return None
    body = await resp.read()
    return body

async def main():
    # Check status code constants
    print(HTTPStatus.OK)           # 200
    print(HTTPStatus.NOT_FOUND)    # 404
    print(HTTPStatus.IM_A_TEAPOT)  # 418

    # Build and inspect cookies
    c = SimpleCookie()
    c.load('session=abc123; user=alice')
    for name, morsel in c.items():
        print(name, '=', morsel.value)

    # Set a cookie with attributes
    c['token'] = 'xyz'
    c['token']['path']    = '/'
    c['token']['max-age'] = 3600
    print(c.output())  # Set-Cookie: token=xyz; Max-Age=3600; Path=/

    # Fetch JSON over HTTPS (requires network)
    try:
        data = await fetch_api('httpbin.org', '/get')
        print(data)
    except HTTPException as e:
        print('Request failed:', e)

asyncio.run(main())
```

### csv example

```python
import csv
from io import StringIO

# Parse CSV from a list of strings
rows = []
for row in csv.reader(['name,age,city', 'Alice,30,"New York"', 'Bob,25,"Los Angeles, CA"']):
    rows.push(row)
print(rows[1])  # ['Alice', '30', 'New York']
print(rows[2])  # ['Bob', '25', 'Los Angeles, CA']

# Write CSV to a StringIO buffer
buf = StringIO()
w = csv.writer(buf)
w.writerow(['product', 'price', 'in stock'])
w.writerows([
    ['Widget', '9.99', 'True'],
    ['Gadget', '24.99', 'False'],
])
print(buf.getvalue())

# DictReader: access rows as dicts
data = ['name,score', 'Eve,99', 'Frank,88']
for row in csv.DictReader(data):
    print(row['name'], '->', row['score'])

# DictWriter: write dicts in field order
out = StringIO()
dw = csv.DictWriter(out, fieldnames=['name', 'score'])
dw.writeheader()
dw.writerow({'name': 'Grace', 'score': '95'})
print(out.getvalue())  # name,score\r\nGrace,95\r\n

# Custom dialect
csv.register_dialect('pipes', delimiter='|')
sio = StringIO()
csv.writer(sio, dialect='pipes').writerow(['a', 'b', 'c'])
print(sio.getvalue())  # a|b|c\r\n
csv.unregister_dialect('pipes')
```

### logging example

```python
import logging
from logging import Logger, StreamHandler, Formatter, Filter, DEBUG, INFO

# Root logger via basicConfig
logging.basicConfig(level=DEBUG, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logging.info('app started')
logging.warning('low disk space: %d%% remaining', 12)

# Named logger with custom handler
class BufferStream:
    def __init__(self):
        self.lines = []
    def write(self, s):
        self.lines.push(s)

buf    = BufferStream()
logger = logging.getLogger('myapp.db')
logger.setLevel(DEBUG)
logger.addHandler(StreamHandler(buf))
logger.addFilter(Filter('myapp'))      # only pass records from myapp.*

logger.debug('connecting to %s', 'localhost:5432')
logger.info('query took %d ms', 42)

# Child logger inherits parent's handlers via propagation
child = logging.getLogger('myapp.db.pool')
child.info('pool size: %d', 5)  # propagates to myapp.db handler

# Silence a noisy subsystem
logging.getLogger('myapp.cache').setLevel(logging.ERROR)

# Custom level
logging.addLevelName(25, 'AUDIT')
logger.log(25, 'user %s logged in', 'alice')
```

### textwrap example

```python
from textwrap import wrap, fill, dedent, indent, shorten, TextWrapper

# Wrap a long string to 30 chars per line
text = "The quick brown fox jumped over the lazy dog near the river bank."
print(fill(text, 30))
# The quick brown fox jumped
# over the lazy dog near the
# river bank.

# Indented paragraph
print(fill(text, 30, initial_indent="    ", subsequent_indent="    "))

# Remove common indentation
code = dedent("""
    def greet(name):
        return "Hello, " + name
""")
print(code)

# Add > prefix to non-empty lines
print(indent("Hello\nWorld\n\nFoo", "> "))
# > Hello
# > World
#
# > Foo

# Shorten long text with ellipsis
print(shorten("one two three four five six seven", width=20))
# one two three [...]

# TextWrapper for repeated wrapping with the same settings
wrapper = TextWrapper(width=20, max_lines=3, placeholder=" [...more]")
for line in wrapper.wrap("alpha beta gamma delta epsilon zeta eta theta iota kappa"):
    print(line)
```

### f-string debugging format example

```python
x = 42
pi = 3.14159
name = "Alice"
nums = [1, 2, 3]

print(f'{x=}')          # x=42
print(f'{pi=:.2f}')     # pi=3.14
print(f'{name=!r}')     # name="Alice"  (repr uses double quotes)
print(f'{nums=}')       # nums=[1, 2, 3]
print(f'{x=} {pi=:.1f}')  # x=42 pi=3.1
```


### Argument type enforcement example

```python
from __python__ import type_enforcement

def greet(name: str, /, *, loud: bool = False) -> str:
    return name.upper() if loud else name

print(greet("Alice"))              # Alice
print(greet("Bob", loud=True))     # BOB

# greet(name="Carol")              # TypeError: positional-only arg
# greet("Dave", True)              # TypeError: missing required keyword-only arg 'loud'
# greet(42)                        # TypeError: argument 'name' must be str
```

### heapq (priority queue) example

```python
from heapq import heappush, heappop, heapify, nsmallest, nlargest

# Build a min-heap by pushing items one at a time
tasks = []
heappush(tasks, (3, 'low priority task'))
heappush(tasks, (1, 'urgent task'))
heappush(tasks, (2, 'normal task'))

# Pop in priority order (smallest first)
while tasks:
    priority, name = heappop(tasks)
    print(priority, name)
# 1 urgent task
# 2 normal task
# 3 low priority task

# heapify converts an existing list in-place
scores = [85, 42, 91, 17, 63]
heapify(scores)
print(scores[0])   # 17  (min is always at index 0)

# nsmallest / nlargest without a heap
data = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]
print(nsmallest(3, data))   # [1, 1, 2]
print(nlargest(3, data))    # [9, 6, 5]

# nlargest with a key
students = [('Alice', 88), ('Bob', 95), ('Carol', 73)]
top2 = nlargest(2, students, key=def(s): return s[1];)
print(top2)   # [('Bob', 95), ('Alice', 88)]
```
