
### libraries

- jsx support -needs testing & integration
- json parse dictionaries

- omit_function_metadata breaks imports - it needs to be changed to only affect imported modules, maybe?

- vscode plugin based on language service

- examples of using js libraries in rapydscript in readme


I would like you to add support for [ [List Concatenation (+) Without overload_operators]() ] to rapydscript. It should have the same syntax as the Python implementation, and be transpiled into equivalent javascript. Please ensure with unit tests that it transpiles and the output JS runs correctly, and that the language service correctly handles it in parsed code. Please make sure it works in the web-repl too. Please also update the README if it has any outdated info about this, and the PYTHON_FEATURE_COVERAGE report.

## JSX Example

```python
from __python__ import jsx

name = "World"
items = ["Apple", "Banana", "Cherry"]

def App():
    return (
        <div className="app">
            <h1>Hello, {name}!</h1>
            <ul>
                {[<li key={i}>{item}</li> for i, item in enumerate(items)]}
            </ul>
        </div>
    )

element = <App />
```

Compiles to `React.createElement(...)` calls (plain JS, no JSX transform needed):

```js
React.createElement("div", {className: "app"},
    React.createElement("h1", null, "Hello, ", name),
    React.createElement("ul", null,
        items.map((item, i) => React.createElement("li", {key: i}, item))
    )
)
```

Save as `example.pyj` and compile with:

```bash
node bin/rapydscript example.pyj --output example.js
```
