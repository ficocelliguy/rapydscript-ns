
### libraries

- fix error from vuln report
- https://socket.dev/npm/package/rapydscript-ns/alerts/0.8.1?tab=dependencies
- https://snyk.io/test/github/ficocelliguy/rapydscript-ns

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- examples of using js libraries in rapydscript in readme


I would like you to add support for [ [List Concatenation (+) Without overload_operators]() ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report.
