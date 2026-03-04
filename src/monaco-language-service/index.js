// index.js — RapydScript Monaco Language Service
// Public API: registerRapydScript(monaco, options) → service
//
// Usage:
//   import { registerRapydScript } from './monaco-language-service/index.js';
//
//   const service = registerRapydScript(monaco, {
//     compiler:     window.RapydScript,   // compiled rapydscript bundle
//     virtualFiles: { 'mymod': 'def f(): pass' },  // optional
//     dtsFiles:     [{ name: 'dom', content: '...' }],  // optional (Phase 6)
//     parseDelay:   300,  // ms debounce (default: 300)
//   });
//
//   service.setVirtualFiles({ 'mymod': newSource });
//   service.addDts('name', dtsText);   // Phase 6 stub for now
//   service.dispose();                 // remove all Monaco providers

import { Diagnostics, BASE_BUILTINS } from './diagnostics.js';
import { SourceAnalyzer }             from './analyzer.js';
import { CompletionEngine }           from './completions.js';

const LANGUAGE_ID = 'rapydscript';

// ---------------------------------------------------------------------------
// Per-model state
// ---------------------------------------------------------------------------

class ModelState {
    constructor(model, service) {
        this._model    = model;
        this._service  = service;
        this._timer    = null;
        this._scopeMap = null;  // most recent ScopeMap for this model

        // Run immediately on first attach
        this._schedule(0);

        // Re-run on every edit
        this._subscription = model.onDidChangeContent(() => {
            this._schedule(service._parseDelay);
        });
    }

    _schedule(delay) {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => this._run(), delay);
    }

    _run() {
        const service = this._service;
        const code    = this._model.getValue();
        const opts    = { virtualFiles: service._virtualFiles };

        // Diagnostics (syntax errors + lint markers)
        const markers = service._diagnostics.check(code, {
            ...opts,
            markerSeverity: service._monaco.MarkerSeverity,
        });
        service._monaco.editor.setModelMarkers(this._model, LANGUAGE_ID, markers);

        // Scope analysis (feeds Phase 3 completions and Phase 5 hover)
        this._scopeMap = service._analyzer.analyze(code, opts);
    }

    dispose() {
        clearTimeout(this._timer);
        this._subscription.dispose();
        // Clear markers when detaching
        this._service._monaco.editor.setModelMarkers(this._model, LANGUAGE_ID, []);
    }
}

// ---------------------------------------------------------------------------
// RapydScriptLanguageService
// ---------------------------------------------------------------------------

class RapydScriptLanguageService {
    constructor(monaco, options) {
        this._monaco       = monaco;
        this._parseDelay   = options.parseDelay !== undefined ? options.parseDelay : 300;
        this._virtualFiles = Object.assign({}, options.virtualFiles || {});
        this._disposables  = [];
        this._modelStates  = new Map();  // model → ModelState

        // Build compiler reference — accept either the raw RapydScript global
        // or a web_repl instance (we only need the parse-level API).
        const compiler = options.compiler;
        if (!compiler) throw new Error('registerRapydScript: options.compiler is required');

        this._diagnostics = new Diagnostics(compiler, options.extraBuiltins);
        this._analyzer    = new SourceAnalyzer(compiler);

        // Merge BASE_BUILTINS with any extra globals for completions
        const builtin_names = BASE_BUILTINS.concat(
            options.extraBuiltins ? Object.keys(options.extraBuiltins) : []
        );
        this._completions = new CompletionEngine(this._analyzer, {
            virtualFiles: this._virtualFiles,
            builtinNames: builtin_names,
        });

        // Register language id if not already registered
        const existing = monaco.languages.getLanguages().find(l => l.id === LANGUAGE_ID);
        if (!existing) monaco.languages.register({ id: LANGUAGE_ID });

        // Attach to all currently open rapydscript models
        monaco.editor.getModels().forEach(model => this._maybeAttach(model));

        // Attach to future models
        this._disposables.push(
            monaco.editor.onDidCreateModel(model => this._maybeAttach(model))
        );

        // Detach when a model is disposed
        this._disposables.push(
            monaco.editor.onWillDisposeModel(model => this._detach(model))
        );

        // Register completion provider
        const self = this;
        this._disposables.push(
            monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
                triggerCharacters: ['.'],
                provideCompletionItems(model, position) {
                    if (model.getLanguageId() !== LANGUAGE_ID) return { suggestions: [] };
                    const state = self._modelStates.get(model);
                    const scopeMap = state ? state._scopeMap : null;
                    const line_content = model.getLineContent(position.lineNumber);
                    const line_prefix  = line_content.substring(0, position.column - 1);
                    return self._completions.getCompletions(
                        scopeMap,
                        position,
                        line_prefix,
                        monaco.languages.CompletionItemKind
                    );
                },
            })
        );
    }

    // ---- internal ----------------------------------------------------------

    _maybeAttach(model) {
        if (model.getLanguageId() !== LANGUAGE_ID) return;
        if (this._modelStates.has(model)) return;
        this._modelStates.set(model, new ModelState(model, this));
    }

    _detach(model) {
        const state = this._modelStates.get(model);
        if (!state) return;
        state.dispose();
        this._modelStates.delete(model);
    }

    // ---- public API --------------------------------------------------------

    /**
     * Replace / merge virtual files available to the import resolver.
     * Triggers an immediate re-check of all open models.
     * @param {Object.<string,string>} files
     */
    setVirtualFiles(files) {
        Object.assign(this._virtualFiles, files);
        this._completions.setVirtualFiles(this._virtualFiles);
        this._modelStates.forEach(state => state._schedule(0));
    }

    /**
     * Remove a virtual file by name.
     * @param {string} name
     */
    removeVirtualFile(name) {
        delete this._virtualFiles[name];
        this._completions.setVirtualFiles(this._virtualFiles);
        this._modelStates.forEach(state => state._schedule(0));
    }

    /**
     * Add additional global symbol names (e.g. from d.ts) so they are not
     * flagged as undefined.  Phase 6 will call this automatically.
     * @param {string[]} names
     */
    addGlobals(names) {
        this._diagnostics.addGlobals(names);
        this._modelStates.forEach(state => state._schedule(0));
    }

    /**
     * Return the most recently built ScopeMap for a given Monaco model.
     * Returns null if the model is not attached or has not been analysed yet.
     * Used by Phase 3 (completions) and Phase 5 (hover).
     * @param {object} model - Monaco ITextModel
     * @returns {import('./scope.js').ScopeMap|null}
     */
    getScopeMap(model) {
        const state = this._modelStates.get(model);
        return state ? state._scopeMap : null;
    }

    /**
     * Stub for Phase 6 (DtsRegistry).  Calling it is safe but has no effect yet.
     * @param {string} _name
     * @param {string} _dtsText
     */
    // eslint-disable-next-line no-unused-vars
    addDts(_name, _dtsText) {
        // Phase 6 will implement this.
        console.warn('RapydScript language service: addDts() not yet implemented (Phase 6).');
    }

    /**
     * Remove all Monaco providers and event listeners registered by this service.
     */
    dispose() {
        this._modelStates.forEach(state => state.dispose());
        this._modelStates.clear();
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}

// ---------------------------------------------------------------------------
// Exported factory
// ---------------------------------------------------------------------------

/**
 * Register the RapydScript language service with a Monaco instance.
 *
 * @param {object} monaco   - the Monaco global (window.monaco or require('monaco-editor'))
 * @param {object} options
 * @param {object} options.compiler          - window.RapydScript compiled bundle (required)
 * @param {object} [options.virtualFiles]    - map of module-name → source
 * @param {Array}  [options.dtsFiles]        - [{name, content}] d.ts files (Phase 6)
 * @param {number} [options.parseDelay=300]  - debounce ms
 * @param {object} [options.extraBuiltins]   - extra {name: true} globals to suppress undef warnings
 * @returns {RapydScriptLanguageService}
 */
export function registerRapydScript(monaco, options) {
    return new RapydScriptLanguageService(monaco, options || {});
}
