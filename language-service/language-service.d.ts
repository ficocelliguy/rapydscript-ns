// language-service.d.ts — Ambient type declarations for language-service.js
// The actual implementation lives in language-service.js (bundled, do not edit directly).

export interface WebReplInstance {
  in_block_mode: boolean;
  compile(code: string, opts?: Record<string, unknown>): string;
  compile_mapped(code: string, opts?: Record<string, unknown>): { code: string; sourceMap: string };
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
  extraBuiltins?: Record<string, true>;
  pythonFlags?: string;
  pythonize_strings?: boolean;
  loadDts?: (name: string) => string | Promise<string>;
}

export declare class RapydScriptLanguageService {
  constructor(monaco: unknown, options: RapydScriptOptions);

  setVirtualFiles(files: Record<string, string>): void;
  removeVirtualFile(name: string): void;
  addGlobals(names: string[]): void;
  getScopeMap(model: unknown): unknown | null;
  addDts(name: string, dtsText: string): void;
  loadDts(name: string): Promise<void>;
  dispose(): void;
}

export declare function registerRapydScript(monaco: unknown, options?: RapydScriptOptions): RapydScriptLanguageService;
export declare function web_repl(): WebReplInstance;
