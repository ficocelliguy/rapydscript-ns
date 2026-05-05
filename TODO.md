
### libraries


- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python style string library Character constants, `Template`, `Formatter` ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

---

### proposed changelog (next release)

version 0.9.3
=======================
  * Added the `base64` standard library module
  * Added the `string` standard library module (character constants, `Template`, `Formatter`)
  * Added support for `float("inf")` and `float("-inf")`
  * Added `long()` type and improved pretty-printing of `type()` return values
  * Language service: bare imports now correctly provide type hints

