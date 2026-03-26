
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


I would like you to add support for [ Add a basic `Enum` base class where `class Color(Enum): RED = 1` creates an object with `.name` and `.value` attributes, iteration over members, and `Color.RED` access. ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

