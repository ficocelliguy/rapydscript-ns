# RapydScript Monaco Language Service — Implementation Plan

## Overview

Build a lightweight, browser-native **Monaco Language Service** for RapydScript.
This is *not* a full LSP server — Monaco has its own internal completion/hover API that runs synchronously in the browser. We target that directly, which eliminates all server and WebSocket complexity.

---

## Goals

| Goal | Approach |
|---|---|
| Runs in browser, no backend | Monaco Language API + compiled rapydscript.js |
| Type hints & intellisense | Scope analysis via AST walk + .d.ts type registry |
| TypeScript global types | Parse `.d.ts` files with a lightweight d.ts parser |
| Easy to update | Language features derived from AST — changes propagate automatically |
| Lightweight | No language server process, no JSON-RPC, no worker required (optional worker) |

---

## Architecture

```
monaco-editor
    │
    ├── registerCompletionItemProvider('rapydscript', provider)
    ├── registerHoverProvider('rapydscript', provider)
    ├── registerSignatureHelpProvider('rapydscript', provider)
    └── setModelMarkers(model, 'rapydscript', markers)   ← diagnostics
            │
            ▼
    RapydScriptLanguageService
    ├── SourceAnalyzer          ← parses file on change (debounced)
    │   ├── uses RapydScript.parse() with for_linting:true
    │   └── walks resulting AST to build ScopeMap
    │
    ├── ScopeMap                ← symbol table with type annotations
    │   ├── globals (from built-ins + .d.ts registry)
    │   ├── module-level symbols
    │   └── per-function scopes (chained)
    │
    ├── DtsRegistry             ← parsed TypeScript declaration files
    │   ├── parseDeclaration(dtsText) → TypeInfo[]
    │   └── provides global symbol completions
    │
    └── CompletionEngine        ← answers Monaco provider queries
        ├── getCompletions(model, position) → CompletionItem[]
        ├── getHover(model, position) → Hover | null
        └── getSignatureHelp(model, position) → SignatureHelp | null
```

---

## File Layout

```
src/monaco-language-service/
├── index.js          ← public API; call registerRapydScript(monaco, options)
├── analyzer.js       ← SourceAnalyzer: parse → AST → ScopeMap
├── scope.js          ← ScopeMap + TypeInfo data structures
├── dts.js            ← DtsRegistry: .d.ts parser + type lookup
├── completions.js    ← CompletionEngine: builds Monaco completion items
├── diagnostics.js    ← Diagnostics: converts lint errors to markers
└── builtins.js       ← Hard-coded RapydScript built-ins with type stubs
```

All files are plain ES modules. Zero dependencies beyond Monaco and the existing `rapydscript.js` bundle.

---

## Phase 1 — Diagnostics (Syntax Errors + Lint)

**Goal:** Show red squiggles for syntax errors and undefined symbols.

### How

1. On `model.onDidChangeContent` (debounced ~300 ms), call `RapydScript.parse(text, { for_linting: true, filename: 'editor.pyj' })`.
2. Catch `RapydScript.SyntaxError` → convert to `monaco.editor.IMarkerData`.
3. After successful parse, run the same undefined-symbol checks as `tools/lint.js`.
4. Push markers via `monaco.editor.setModelMarkers`.

### Key existing asset

`tools/lint.js` already does steps 1–3 in Node — we port/inline its logic.
The linter already returns `{ start_line, start_col, end_line, end_col, msg }` objects.

---

## Phase 2 — Scope Analysis & ScopeMap

**Goal:** Know what symbols are in scope at every position.

### ScopeMap construction (AST walk)

Walk the AST after a successful parse. For each scope boundary (module, function, class, comprehension), push a new frame.

Track per symbol:
```js
{
  name: 'foo',
  kind: 'function' | 'class' | 'variable' | 'parameter' | 'import',
  type: TypeInfo | null,         // null until annotated
  defined_at: { line, col },
  scope_depth: number,
  doc: string | null             // from leading string literal
}
```

### AST nodes to walk

| Node | Action |
|---|---|
| `AST_Function`, `AST_Lambda` | New scope frame; record params |
| `AST_Class` | New scope frame; record methods, base classes |
| `AST_Var`, `AST_SymbolVar` | Add symbol to current frame |
| `AST_Import`, `AST_Imports` | Add module symbol; resolve if virtual |
| `AST_Assign` (first occurrence) | Add symbol if not already in frame |
| `AST_ForIn` | Add loop variable |

This is pure AST traversal — no codegen needed. Use `node.walk(visitor)` (already on all AST nodes).

---

## Phase 3 — Completions

**Goal:** Press `.` or `Ctrl+Space` and see relevant suggestions.

### Trigger cases

| Trigger | What to show |
|---|---|
| Bare identifier (empty prefix) | All symbols in current scope chain |
| Identifier prefix `fo` | Filtered scope symbols + builtins |
| `obj.` (dot access) | Members of `obj`'s type |
| `from X import ` | Exported names of module X |
| `import ` | Known module names |
| Inside function call `(` | Signature help (Phase 4) |

### Dot completion

When the cursor is after a `.`, look up the left-hand side symbol in the ScopeMap. If its `TypeInfo` has members, surface them. Type members come from:

1. **Class definitions** in the same file (auto-discovered via ScopeMap).
2. **DtsRegistry** for JS globals like `document`, `console`, `Math`, etc.
3. **numpy/standard-lib stubs** in `builtins.js`.

### Ranking

Prefer: local scope → enclosing scope → module scope → globals/builtins. Use Monaco's `sortText` field.

---

## Phase 4 — Signature Help

**Goal:** Show parameter names when cursor is inside a function call.

Walk backwards from cursor position to find the outermost unclosed `(`. Resolve the callee name → look up its `TypeInfo.params`. Determine which argument position the cursor is in by counting commas at depth 0.

This requires only text scanning (no re-parse needed) + a ScopeMap lookup.

---

## Phase 5 — Hover

**Goal:** Show type/doc info when hovering over a symbol.

Find the symbol under cursor → look up ScopeMap → render:

```
(function) my_func(x: int, y: str) -> bool
────────────────────────────────────────────
Doc string text here.
```

For `.d.ts`-sourced symbols, show the full TypeScript signature.

---

## Phase 6 — DtsRegistry (.d.ts Support)

**Goal:** Accept `.d.ts` files and expose their types as globally available symbols.

### d.ts parser

A minimal recursive-descent parser for the subset of `.d.ts` syntax we need:

```
declare var name: Type;
declare function name(params): ReturnType;
declare class Name { members }
interface Name { members }
declare namespace Name { ... }
type Alias = Type;
```

We do NOT need to handle full TypeScript generics — just enough to extract:
- Symbol name
- Kind (var / function / class / interface / namespace)
- Parameter names + types (as strings for display)
- Return type (as string)
- JSDoc comment above the declaration

### TypeInfo structure

```js
{
  name: string,
  kind: 'var' | 'function' | 'class' | 'interface' | 'namespace' | 'method' | 'property',
  params: [{ name, type, optional, rest }],  // for functions/methods
  return_type: string,
  members: Map<string, TypeInfo>,            // for classes/interfaces/namespaces
  doc: string | null,
  source: 'dts' | 'inferred' | 'builtin'
}
```

### Loading d.ts files

```js
const service = registerRapydScript(monaco, {
  dtsFiles: [
    { name: 'lib.dom', content: domDtsText },
    { name: 'myapi',   content: myApiDtsText },
  ],
  // or lazy loader:
  loadDts: async (name) => fetch(`/types/${name}.d.ts`).then(r => r.text())
});

// Also add at runtime:
service.addDts('mylib', dtsText);
```

All `.d.ts` symbols land in a single global scope visible everywhere (same behaviour as TypeScript's `lib.d.ts`).

---

## Phase 7 — Built-in Stubs

`builtins.js` hard-codes TypeInfo for:

**RapydScript built-ins:**
- `print`, `len`, `range`, `enumerate`, `zip`, `map`, `filter`, `sorted`, `reversed`
- `int`, `float`, `str`, `bool`, `list`, `dict`, `set`, `tuple`
- `isinstance`, `issubclass`, `hasattr`, `getattr`, `setattr`, `dir`
- `type`, `repr`, `abs`, `min`, `max`, `sum`, `round`

**RapydScript standard library modules** (populated from actual `.pyj` source exports):
- `math`, `re`, `random`, `numpy`, etc.
- The stubs reference the `.pyj` exports directly — to update them, re-run a small script that walks the library ASTs and regenerates `builtins.js`.

**JS globals (as fallback if no d.ts loaded):**
- `console`, `Math`, `JSON`, `Object`, `Array`, `Promise`, etc.

---

## Public API

```js
import { registerRapydScript } from './monaco-language-service/index.js';

const service = registerRapydScript(monaco, {
  // Required: the compiled rapydscript bundle (already loaded by web-repl)
  compiler: window.RapydScript,

  // Optional: virtual files visible to import resolver
  virtualFiles: { 'mymodule': 'def hello(): return "hi"' },

  // Optional: .d.ts declarations for JS globals
  dtsFiles: [{ name: 'dom', content: domDts }],

  // Optional: debounce parse delay (ms), default 300
  parseDelay: 300,
});

// Update virtual files at runtime
service.setVirtualFiles({ 'mymodule': updatedSource });

// Add a .d.ts at runtime
service.addDts('myapi', dtsSource);

// Tear down (removes all Monaco providers)
service.dispose();
```

---

## Update Lifecycle

When the RapydScript language changes:

1. **New syntax** → reflected automatically because we use `RapydScript.parse()` directly.
   No language grammar to maintain separately.

2. **New built-in** → add one entry to `builtins.js` (or regenerate from `.pyj` source).

3. **New standard library module** → run the stub-generator script; it reads the `.pyj` and writes stubs.

4. **New compiler export/AST node** → only `analyzer.js` needs updating (new `case` in the walk).

---

## Implementation Order

```
Week 1: Phase 1 (diagnostics) + Phase 2 (ScopeMap skeleton)
Week 2: Phase 3 (completions — scope + builtins)
Week 3: Phase 6 (d.ts parser) + Phase 5 (hover)
Week 4: Phase 4 (signature help) + Phase 7 (full built-in stubs)
Polish: Web-REPL integration, demo page
```

---

## Non-Goals (kept out of scope)

- **Rename / find-all-references** — deferred; requires full cross-file analysis.
- **Auto-import** — deferred; complex and rarely critical for a single-file REPL context.
- **Semantic type inference** (e.g., inferring the return type of arbitrary expressions) — we infer only where the type is explicit (annotations, class definitions, d.ts).
- **Worker thread** — the parse is fast (<50 ms for typical files); a worker can be added later without API changes.

---

## Open Questions

1. **Resolved:** Type mismatch diagnostics are in scope. Start with **wrong argument count** (detectable as soon as a function's signature is known from ScopeMap or DtsRegistry). Expand to type-mismatch warnings (e.g. passing a string where a number is expected) once the DtsRegistry is in place in Phase 6.
2. **Resolved:** Split `builtins.js` into two parts:
   - **Hand-written** — RapydScript language intrinsics (`print`, `len`, `range`, `isinstance`, `list`, `dict`, etc.). Small, stable, not defined in any `.pyj` file.
   - **Auto-generated** — Standard library modules (`math`, `random`, `numpy`, etc.). A small Node script walks the AST of each `src/lib/*.pyj` file, extracts function signatures and leading docstrings, and writes the stubs. Run as part of `npm run build` so stubs stay in sync automatically.
3. **Resolved:** The service ships as its own separate file, independent of `rapydscript.js`. It takes the compiler as a parameter at registration time (`options.compiler`), so the two can be loaded and updated independently.
