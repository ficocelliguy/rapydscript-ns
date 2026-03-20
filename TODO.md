
### libraries

- two space tabs?
- random ns functions are in type hints for objects

- fix error from vuln report
- https://socket.dev/npm/package/rapydscript-ns/alerts/0.8.1?tab=dependencies
- https://snyk.io/test/github/ficocelliguy/rapydscript-ns

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- export .t.ds for language service

- add web-repl flag for python truthiness?
- include python truthiness in compiler call

- update changelist for 8.0

I would like you to add support for [  Python's extended subscript syntax where commas inside [] implicitly form a tuple ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README to mention this support.
Python Feature Gap Report: RapydScript-NS


       