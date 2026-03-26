
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


I would like you to add support for [ bytes(x)` / `bytearray(x) ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Please also add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

# bytes / bytearray example

```python
header = bytes([0x89, 0x50, 0x4E, 0x47])   # PNG magic bytes
print(header.hex())                          # '89504e47'

msg = bytes('hello world', 'utf-8')
print(repr(msg))                             # b'hello world'
print(msg.decode('utf-8'))                   # hello world

buf = bytearray(msg)
buf[0] = 72                                  # 'H'
print(buf.decode('utf-8'))                   # Hello world
```
