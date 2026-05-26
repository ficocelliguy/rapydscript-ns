- import some standard python scripts and see what is supported and what is not

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [ Python style `1/0` returns `None` instead of `ZeroDivisionError` (see python gaps §1.8)] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.



Example: runtime `isinstance` on `typing` generics
--------------------------------------------------

```python

```


Example: `__exit__(None, None, None)` on normal context-manager exit
--------------------------------------------------------------------

```python
class Timer:
    def __enter__(self):
        self.start = Date.now()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = Date.now() - self.start
        if exc_type is None:
            print('completed in', elapsed, 'ms')
        else:
            print('failed after', elapsed, 'ms:', exc_type.__name__)
        return False

with Timer():
    do_work()              # prints "completed in N ms"
```

ReferenceError: do_work is not defined

