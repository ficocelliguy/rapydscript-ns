
### libraries

- simple way to turn on all python opt-in options

- remove repl_mode and make repl make a new context for each "run" press
ø
- rework tests to use jest

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [ `str.expandtabs(tabsize)` ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

Please add a feature flag to the compiler, accessible via the standard compiler, the web-repl, and the cli. It should default to true, and if true, it should keep the current behavior. It should be named something about enabling legacy rapydscript features, and if false, it should turn on every optional flag, such as dict_literals, overload_getitem, and:
from pythonize import strings
strings()

--legacy_rapydscript