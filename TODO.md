
### libraries

- The 7n literal isn't supported by the parser — use BigInt()

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python pprint library] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there.

### Async generator example

```py
# `async def` + `yield` makes an async generator. The function returns an
# async iterator immediately; values are pulled with `await it.next()` or
# consumed with `async for`.

from asyncio import sleep

async def countdown(n):
    while n > 0:
        await sleep(0)            # cooperative yield to the event loop
        yield n
        n -= 1

async def main():
    async for x in countdown(3):
        print(x)                  # prints 3, then 2, then 1

main()
```

### pprint example

```py
# pprint pretty-prints nested data structures. A value is shown on one line
# when it fits within `width`; otherwise containers are broken across lines
# with Python-style indentation.

from pprint import pprint, pformat

data = {
    'name': 'RapydScript',
    'tags': ['python', 'javascript', 'compiler'],
    'stats': {'modules': 30, 'tests': 158},
}

pprint(data, width=50)
# {"name": "RapydScript",
#  "stats": {"modules": 30, "tests": 158},
#  "tags": ["python", "javascript", "compiler"]}

# pformat returns the string instead of printing it
text = pformat(data, width=50)
```

