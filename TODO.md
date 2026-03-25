
### libraries

- simple way to turn on all python opt-in options

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service?

- examples of using js libraries in rapydscript in readme?


I would like you to add support for [`str.expandtabs(tabsize)`   ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

