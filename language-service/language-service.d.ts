// language-service.d.ts — Ambient type declarations for language-service.js
// The actual implementation lives in language-service.js (bundled, do not edit directly).

import type { AST_Toplevel } from '../tools/compiler';

// Re-exported so consumers can name the return type of WebReplInstance.parse.
export type { AST_Toplevel, AST_Node, AST_Token, AST_Position } from '../tools/compiler';

export interface WebReplParseOptions {
  filename?: string;
  virtual_files?: Record<string, string>;
  python_flags?: string;
  discard_asserts?: boolean;
  tree_shake?: boolean;
  legacy_rapydscript?: boolean;
  [key: string]: unknown;
}

export interface WebReplCompileOptions extends WebReplParseOptions {
  keep_baselib?: boolean;
  keep_docstrings?: boolean;
  js_version?: number;
  private_scope?: boolean;
  write_name?: boolean;
  pythonize_strings?: boolean;
  export_all?: boolean;
  export_main?: boolean;
}

export interface WebReplCompileMappedResult {
  code: string;
  sourceMap: string;
}

export interface WebReplInstance {
  in_block_mode: boolean;
  parse(code: string, opts?: WebReplParseOptions): AST_Toplevel;
  compile(code: string, opts?: WebReplCompileOptions): string;
  compile_mapped(code: string, opts?: WebReplCompileOptions): WebReplCompileMappedResult;
  runjs(code: string): unknown;
  replace_print(writeLine: (...args: unknown[]) => void): void;
  is_input_complete(source: string): boolean;
  init_completions(completelib: unknown): void;
  find_completions(line: string): unknown;
}

export interface RapydScriptOptions {
  compiler?: unknown;
  virtualFiles?: Record<string, string>;
  stdlibFiles?: Record<string, string>;
  dtsFiles?: Array<{ name: string; content: string }>;
  parseDelay?: number;
  extraBuiltins?: string[];
  pythonFlags?: string;
  pythonize_strings?: boolean;
  loadDts?: (name: string) => string | Promise<string>;
  /**
   * Custom derivation of the virtualFiles key from a Monaco model URI.
   * Default is path-aware: leading slashes and the .py/.pyj/.pyjx extension are stripped,
   * so `/scripts/utils/math.pyj` → `scripts/utils/math`.  Return null to skip registering
   * that model in the shared virtualFiles pool.
   */
  moduleNameFromUri?: (uri: { path?: string; fsPath?: string } | null | undefined) => string | null;
}

export declare class RapydScriptLanguageService {
  constructor(monaco: unknown, options: RapydScriptOptions);

  setVirtualFiles(files: Record<string, string>): void;
  clearVirtualFiles(): void;
  removeVirtualFile(name: string): void;
  addGlobals(names: string[]): void;
  getScopeMap(model: unknown): unknown | null;
  addDts(name: string, dtsText: string): void;
  loadDts(name: string): Promise<void>;
  dispose(): void;
}

export declare function registerRapydScript(monaco: unknown, options?: RapydScriptOptions): RapydScriptLanguageService;
export declare function web_repl(): WebReplInstance;
