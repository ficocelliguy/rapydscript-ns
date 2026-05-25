

- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python `bytes` / `bytearray` shim over `Uint8Array ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file). Remove the suggestion from PYTHON_GAPS if it is there. Run the full unit test suite to check for regressions. Add a note in the CHANGELOG under the next unreleased version number.


## Example: Set operators

```python
admins = {'alice', 'bob'}
editors = {'bob', 'carol', 'dave'}

everyone   = admins | editors           # {'alice', 'bob', 'carol', 'dave'}
both_roles = admins & editors           # {'bob'}
admin_only = admins - editors           # {'alice'}
one_role   = admins ^ editors           # {'alice', 'carol', 'dave'}

assert {'alice'} <= admins              # subset
assert admins >= {'bob'}                # superset

active = {'alice', 'bob'}
active |= {'carol'}                     # in-place union
```

## Example: bytes / bytearray

```python
# Bytes literal syntax
greeting = b'Hello'
assert len(greeting) == 5
assert greeting[0] == 72                # 'H'
assert greeting.decode('utf-8') == 'Hello'

# Constructors
payload = bytes('café', 'utf-8')        # b'caf\xc3\xa9'
zeros   = bytes(4)                       # b'\x00\x00\x00\x00'
ints    = bytes([0xDE, 0xAD, 0xBE, 0xEF])
assert ints.hex() == 'deadbeef'
assert bytes.fromhex('deadbeef') == ints

# Slicing returns bytes (not arrays)
head = greeting[:2]                     # b'He'
assert isinstance(head, bytes)

# bytearray is the mutable variant
buf = bytearray(b'\x00\x00\x00\x00')
buf[0] = 0x7F
buf.append(0xFF)
buf.extend([1, 2, 3])
assert len(buf) == 8
```
