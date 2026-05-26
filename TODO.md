- import some standard python scripts and see what is supported and what is not

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ python decimal module ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.



## Example: `asynccontextmanager` + `async with`

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def session(url):
    resource = await acquire(url)
    try:
        yield resource
    finally:
        await resource.close()

async def main():
    async with session('/data') as r:
        data = await r.read()
        return data

main()
```

ReferenceError: Exception is not defined


