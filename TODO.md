
### libraries

- The 7n literal isn't supported by the parser — use BigInt()

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python urllib library ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

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
