
### libraries

- The 7n literal isn't supported by the parser — use BigInt()

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python http library ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

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
