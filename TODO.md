
### libraries


- remove repl_mode and make repl make a new context for each "run" press

- vscode plugin based on language service?


I would like you to add support for [python html library ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Make sure it works in the web-repl. Update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report. Add a simple example to the bottom of the TODO document using this feature (make no other changes to that file).

---

### proposed changelog (next release)

version 0.9.3
=======================
  * Added the `base64` standard library module
  * Added the `string` standard library module (character constants, `Template`, `Formatter`)
  * Added support for `float("inf")` and `float("-inf")`
  * Added `long()` type and improved pretty-printing of `type()` return values
  * Language service: bare imports now correctly provide type hints

---

### html example

```python
from html import escape, unescape, HTMLParser

# Escape user input for safe HTML insertion
user_input = '<script>alert("xss")</script>'
safe = escape(user_input)
# → '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'

# Decode HTML entities from a web response
raw = '&lt;b&gt;Hello &amp; World&lt;/b&gt;'
decoded = unescape(raw)
# → '<b>Hello & World</b>'

# Parse HTML with HTMLParser
class TagCollector(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.tags = []
    def handle_starttag(self, tag, attrs):
        self.tags.append(tag)

p = TagCollector()
p.feed('<html><body><h1>Title</h1><p>Paragraph</p></body></html>')
print(p.tags)  # → ['html', 'body', 'h1', 'p']
```
