---
name: string.pyj Implementation
description: string module (character constants, Template, Formatter) — pitfalls and design decisions
type: project
---

## string.pyj Implementation (added 2026-05-02)
- `src/lib/string.pyj` — character constants, `Template`, `Formatter`
- `test/string.pyj` — unit tests; `test/unit/web-repl.js` — 3 bundle tests (bundle_string_*)
- Language service: `'string'` added to `STDLIB_MODULES` in `src/monaco-language-service/diagnostics.js`

## Character Constants
- Built via simple Python assignments; `chr(39)` = `'`, `chr(92)` = `\`, `chr(96)` = `` ` `` avoid escaping issues in string literals
- `whitespace = ' \t\n\r' + chr(11) + chr(12)` — chr(11)=VT, chr(12)=FF

## Template
- `substitute(mapping=None)` / `safe_substitute(mapping=None)` — accepts plain dict or ρσ_dict
- `_tmpl_to_plain(mapping)` converts ρσ_dict (via `.jsmap`) to a plain JS object
- `_tmpl_re` regex: `/\$(?:(\$)|\{([_a-zA-Z][_a-zA-Z0-9]*)\}|([_a-zA-Z][_a-zA-Z0-9]*)|([^]?))/g`
- Uses `[^]?` (zero-or-one of any char) to match trailing lone `$` so substitute raises ValueError
- `ρσ_str(val)` used for substituted values (gives 'None' for null, matching Python behavior)

## Formatter
- `format(format_string, *args)` — positional args ONLY (no **kwargs in RapydScript)
- Named fields: use `vformat(fmt, [], {'key': val})` directly
- `vformat` delegates to `_fmt_vformat(fmt_str, args, kwargs, self)` JS helper
- `_fmt_get_kwarg(kwargs, key)` handles both plain objects and ρσ_dict (.jsmap)
- `format_field` calls `format(value, format_spec)` (= `ρσ_format`) for specs; `str(value)` when empty
- Subclassing works: override `format_field`, `convert_field`, `get_value`, `get_field`

## Critical v-block Pitfall Discovered
**v-blocks are TRULY VERBATIM — Python does NOT process escape sequences.**
- `\n` in v-block → `\n` in JS output (which in a JS string = newline char)
- `\\n` in v-block → `\\n` in JS output (which in a JS string = backslash+n)
- For regex literals in v-blocks: write exactly the JS you want — `\$` → `\$` in JS regex (literal $)
- NEVER double backslashes in v-block regex literals (unlike what an older MEMORY note implies)
- The MEMORY note about doubling (`\\n`/`\\t`) applies when you WANT literal `\n` text in JS, not actual newlines

## String.prototype .upper() in Tests
- `String.prototype.upper` (and other Python str methods) is NOT added in the test runner context unless `from pythonize import strings` is used
- Subclass tests that operate on string return values must use `.toUpperCase()` (native JS) not `.upper()` (Python) unless pythonize is imported

**Why:** How to apply: When testing Formatter/string subclasses in .pyj test files that don't import pythonize, use `v'result.toUpperCase()'` not `result.upper()`.
