// compiler.d.ts — Type declarations for the RapydScript-N compiler

// -- Token & Position ---------------------------------------------------

export interface AST_Position {
  line: number;
  col: number;
  pos: number;
}

export interface AST_Token {
  type: string;
  value: string;
  line: number;
  col: number;
  pos: number;
  nlb: boolean;
}

// -- AST Nodes ----------------------------------------------------------

export interface AST_Node {
  start: AST_Token;
  end: AST_Token;
  print(output: OutputStream): void;
  walk(visitor: TreeWalker): boolean | undefined;
  _walk(visitor: TreeWalker): boolean | undefined;
  clone(): this;
  _dump(depth?: number, omit?: string[], offset?: number, include_name?: boolean): void;
}

export interface TreeWalker {
  _visit(node: AST_Node): boolean | undefined;
}

export interface AST_Toplevel extends AST_Node {
  body: AST_Node[];
  globals: Record<string, unknown>;
  baselib: Record<string, boolean>;
  imports: Record<string, AST_ImportedModule>;
  imported_module_ids: string[];
  nonlocalvars: string[];
  localvars: string[];
  shebang: string | null;
  import_order: number;
  module_id: string;
  exports: unknown[];
  classes: Record<string, unknown>;
  scoped_flags: Record<string, boolean>;
  filename: string;
  srchash: string;
}

export interface AST_ImportedModule {
  filename: string;
  body: AST_Node[] | null;
  src_code: string | null;
  localvars: string[];
  nonlocalvars: string[];
  needed_names: Set<string> | null;
}

// -- Errors -------------------------------------------------------------

export interface RapydScriptSyntaxError extends Error {
  message: string;
  filename: string;
  line: number;
  col: number;
  pos: number;
  is_eof: boolean;
  toString(): string;
}

export interface RapydScriptSyntaxErrorConstructor {
  new (message: string, filename: string, line: number, col: number, pos: number, is_eof?: boolean): RapydScriptSyntaxError;
  (message: string, filename: string, line: number, col: number, pos: number, is_eof?: boolean): RapydScriptSyntaxError;
}

export type ImportError = RapydScriptSyntaxError;
export interface ImportErrorConstructor extends RapydScriptSyntaxErrorConstructor {}

export interface DefaultsError extends Error {
  message: string;
}

export interface DefaultsErrorConstructor {
  new (name: string, defs: Record<string, unknown>): DefaultsError;
  (name: string, defs: Record<string, unknown>): DefaultsError;
}

// -- Parse Options ------------------------------------------------------

export interface ParseOptions {
  filename?: string | null;
  module_id?: string;
  toplevel?: AST_Toplevel | null;
  for_linting?: boolean;
  import_dirs?: string[];
  classes?: Record<string, unknown>;
  scoped_flags?: ScopedFlags;
  discard_asserts?: boolean;
  module_cache_dir?: string;
  basedir?: string;
  libdir?: string;
  imported_modules?: Record<string, unknown>;
  importing_modules?: Record<string, unknown>;
}

export interface ScopedFlags {
  dict_literals?: boolean;
  overload_getitem?: boolean;
  bound_methods?: boolean;
  hash_literals?: boolean;
  overload_operators?: boolean;
  truthiness?: boolean;
  jsx?: boolean;
  strict_arithmetic?: boolean;
  [flag: string]: boolean | undefined;
}

// -- Output Stream Options ----------------------------------------------

export interface OutputStreamOptions {
  indent_start?: number;
  indent_level?: number;
  quote_keys?: boolean;
  space_colon?: boolean;
  ascii_only?: boolean;
  width?: number;
  max_line_len?: number;
  ie_proof?: boolean;
  beautify?: boolean;
  source_map?: unknown | null;
  bracketize?: boolean;
  semicolons?: boolean;
  comments?: boolean | ((node: AST_Node) => boolean);
  preserve_line?: boolean;
  omit_baselib?: boolean;
  baselib_plain?: string | null;
  private_scope?: boolean;
  keep_docstrings?: boolean;
  discard_asserts?: boolean;
  module_cache_dir?: string;
  js_version?: number;
  write_name?: boolean;
  omit_function_metadata?: boolean;
  pythonize_strings?: boolean;
  repl_mode?: boolean;
}

export interface OutputStream {
  options: Required<OutputStreamOptions>;
  current_col: number;
  current_line: number;
  current_pos: number;

  print(str: string): void;
  get(): string;
  toString(): string;
  space(): void;
  indent(half?: boolean): void;
  with_indent(col: number, proceed: () => void): void;
  indentation(): string;
  set_indentation(val: number): void;
  newline(): void;
  semicolon(): void;
  force_semicolon(): void;
  next_indent(): number;
  end_statement(): void;
  with_block(cont: () => void): void;
  with_parens(cont: () => void): void;
  with_square(cont: () => void): void;
  comma(): void;
  colon(): void;
  assign(name: string | AST_Node): void;
  current_width(): number;
  should_break(): boolean;
  last(): string;
  print_string(str: string): void;
  print_name(name: string): void;
  make_name(name: string): string;
  make_indent(back?: number): string;
  last_char(): string;
  push_node(node: AST_Node): void;
  pop_node(): AST_Node;
  stack(): AST_Node[];
  parent(n?: number): AST_Node | undefined;
  line(): number;
  col(): number;
  pos(): number;
}

export interface OutputStreamConstructor {
  new (options?: OutputStreamOptions): OutputStream;
  (options?: OutputStreamOptions): OutputStream;
}

// -- Tree Shake Context -------------------------------------------------

export interface TreeShakeContext {
  parse: CompilerExports["parse"];
  import_dirs?: string[];
  basedir?: string;
  libdir?: string;
  discard_asserts?: boolean;
  module_cache_dir?: string;
}

// -- Tokenizer ----------------------------------------------------------

export interface Tokenizer {
  next(): AST_Token;
  peek(): AST_Token;
}

// -- Compiler Exports (from create_compiler) ----------------------------

export interface CompilerExports {
  parse(code: string, options?: ParseOptions): AST_Toplevel;
  OutputStream: OutputStreamConstructor;
  tree_shake(ast: AST_Toplevel, context: TreeShakeContext): void;
  tokenizer(code: string, filename?: string): Tokenizer;
  string_template(template: string, vars: Record<string, unknown>): string;

  DefaultsError: DefaultsErrorConstructor;
  SyntaxError: RapydScriptSyntaxErrorConstructor;
  ImportError: ImportErrorConstructor;

  ALL_KEYWORDS: string[];
  IDENTIFIER_PAT: RegExp;
  NATIVE_CLASSES: Record<string, Record<string, unknown>>;
  compile_time_decorators: Record<string, unknown>;

  // All AST node constructors are exported as AST_* properties
  AST_Node: new (...args: unknown[]) => AST_Node;
  AST_Token: new (...args: unknown[]) => AST_Token;
  AST_Toplevel: new (...args: unknown[]) => AST_Toplevel;
  AST_Statement: new (...args: unknown[]) => AST_Node;
  AST_Debugger: new (...args: unknown[]) => AST_Node;
  AST_Directive: new (...args: unknown[]) => AST_Node;
  AST_SimpleStatement: new (...args: unknown[]) => AST_Node;
  AST_AnnotatedAssign: new (...args: unknown[]) => AST_Node;
  AST_Assert: new (...args: unknown[]) => AST_Node;
  AST_Block: new (...args: unknown[]) => AST_Node;
  AST_BlockStatement: new (...args: unknown[]) => AST_Node;
  AST_EmptyStatement: new (...args: unknown[]) => AST_Node;
  AST_StatementWithBody: new (...args: unknown[]) => AST_Node;
  AST_DWLoop: new (...args: unknown[]) => AST_Node;
  AST_Do: new (...args: unknown[]) => AST_Node;
  AST_While: new (...args: unknown[]) => AST_Node;
  AST_ForIn: new (...args: unknown[]) => AST_Node;
  AST_ForJS: new (...args: unknown[]) => AST_Node;
  AST_ListComprehension: new (...args: unknown[]) => AST_Node;
  AST_SetComprehension: new (...args: unknown[]) => AST_Node;
  AST_DictComprehension: new (...args: unknown[]) => AST_Node;
  AST_GeneratorComprehension: new (...args: unknown[]) => AST_Node;
  AST_With: new (...args: unknown[]) => AST_Node;
  AST_WithClause: new (...args: unknown[]) => AST_Node;
  AST_Match: new (...args: unknown[]) => AST_Node;
  AST_MatchPattern: new (...args: unknown[]) => AST_Node;
  AST_MatchWildcard: new (...args: unknown[]) => AST_Node;
  AST_MatchCapture: new (...args: unknown[]) => AST_Node;
  AST_MatchLiteral: new (...args: unknown[]) => AST_Node;
  AST_MatchOr: new (...args: unknown[]) => AST_Node;
  AST_MatchAs: new (...args: unknown[]) => AST_Node;
  AST_MatchStar: new (...args: unknown[]) => AST_Node;
  AST_MatchSequence: new (...args: unknown[]) => AST_Node;
  AST_MatchMapping: new (...args: unknown[]) => AST_Node;
  AST_MatchClass: new (...args: unknown[]) => AST_Node;
  AST_MatchCase: new (...args: unknown[]) => AST_Node;
  AST_Scope: new (...args: unknown[]) => AST_Node;
  AST_Import: new (...args: unknown[]) => AST_Node;
  AST_Imports: new (...args: unknown[]) => AST_Node;
  AST_Decorator: new (...args: unknown[]) => AST_Node;
  AST_Lambda: new (...args: unknown[]) => AST_Node;
  AST_Function: new (...args: unknown[]) => AST_Node;
  AST_Class: new (...args: unknown[]) => AST_Node;
  AST_Method: new (...args: unknown[]) => AST_Node;
  AST_Jump: new (...args: unknown[]) => AST_Node;
  AST_Exit: new (...args: unknown[]) => AST_Node;
  AST_Return: new (...args: unknown[]) => AST_Node;
  AST_Yield: new (...args: unknown[]) => AST_Node;
  AST_Await: new (...args: unknown[]) => AST_Node;
  AST_Throw: new (...args: unknown[]) => AST_Node;
  AST_LoopControl: new (...args: unknown[]) => AST_Node;
  AST_Break: new (...args: unknown[]) => AST_Node;
  AST_Continue: new (...args: unknown[]) => AST_Node;
  AST_If: new (...args: unknown[]) => AST_Node;
  AST_Try: new (...args: unknown[]) => AST_Node;
  AST_Catch: new (...args: unknown[]) => AST_Node;
  AST_Except: new (...args: unknown[]) => AST_Node;
  AST_Finally: new (...args: unknown[]) => AST_Node;
  AST_Else: new (...args: unknown[]) => AST_Node;
  AST_Definitions: new (...args: unknown[]) => AST_Node;
  AST_Var: new (...args: unknown[]) => AST_Node;
  AST_VarDef: new (...args: unknown[]) => AST_Node;
  AST_BaseCall: new (...args: unknown[]) => AST_Node;
  AST_Call: new (...args: unknown[]) => AST_Node;
  AST_ClassCall: new (...args: unknown[]) => AST_Node;
  AST_Super: new (...args: unknown[]) => AST_Node;
  AST_New: new (...args: unknown[]) => AST_Node;
  AST_Seq: new (...args: unknown[]) => AST_Node;
  AST_PropAccess: new (...args: unknown[]) => AST_Node;
  AST_Dot: new (...args: unknown[]) => AST_Node;
  AST_Sub: new (...args: unknown[]) => AST_Node;
  AST_ItemAccess: new (...args: unknown[]) => AST_Node;
  AST_Splice: new (...args: unknown[]) => AST_Node;
  AST_Unary: new (...args: unknown[]) => AST_Node;
  AST_UnaryPrefix: new (...args: unknown[]) => AST_Node;
  AST_Binary: new (...args: unknown[]) => AST_Node;
  AST_Existential: new (...args: unknown[]) => AST_Node;
  AST_Conditional: new (...args: unknown[]) => AST_Node;
  AST_Assign: new (...args: unknown[]) => AST_Node;
  AST_NamedExpr: new (...args: unknown[]) => AST_Node;
  AST_Starred: new (...args: unknown[]) => AST_Node;
  AST_Array: new (...args: unknown[]) => AST_Node;
  AST_Object: new (...args: unknown[]) => AST_Node;
  AST_ExpressiveObject: new (...args: unknown[]) => AST_Node;
  AST_ObjectProperty: new (...args: unknown[]) => AST_Node;
  AST_ObjectKeyVal: new (...args: unknown[]) => AST_Node;
  AST_ObjectSpread: new (...args: unknown[]) => AST_Node;
  AST_Spread: new (...args: unknown[]) => AST_Node;
  AST_Set: new (...args: unknown[]) => AST_Node;
  AST_SetItem: new (...args: unknown[]) => AST_Node;
  AST_Symbol: new (...args: unknown[]) => AST_Node;
  AST_SymbolAlias: new (...args: unknown[]) => AST_Node;
  AST_SymbolDeclaration: new (...args: unknown[]) => AST_Node;
  AST_SymbolVar: new (...args: unknown[]) => AST_Node;
  AST_ImportedVar: new (...args: unknown[]) => AST_Node;
  AST_SymbolNonlocal: new (...args: unknown[]) => AST_Node;
  AST_SymbolFunarg: new (...args: unknown[]) => AST_Node;
  AST_SymbolDefun: new (...args: unknown[]) => AST_Node;
  AST_SymbolLambda: new (...args: unknown[]) => AST_Node;
  AST_SymbolCatch: new (...args: unknown[]) => AST_Node;
  AST_SymbolRef: new (...args: unknown[]) => AST_Node;
  AST_This: new (...args: unknown[]) => AST_Node;
  AST_Constant: new (...args: unknown[]) => AST_Node;
  AST_String: new (...args: unknown[]) => AST_Node;
  AST_Verbatim: new (...args: unknown[]) => AST_Node;
  AST_Number: new (...args: unknown[]) => AST_Node;
  AST_RegExp: new (...args: unknown[]) => AST_Node;
  AST_Atom: new (...args: unknown[]) => AST_Node;
  AST_Null: new (...args: unknown[]) => AST_Node;
  AST_Ellipsis: new (...args: unknown[]) => AST_Node;
  AST_NaN: new (...args: unknown[]) => AST_Node;
  AST_Undefined: new (...args: unknown[]) => AST_Node;
  AST_Hole: new (...args: unknown[]) => AST_Node;
  AST_Infinity: new (...args: unknown[]) => AST_Node;
  AST_Boolean: new (...args: unknown[]) => AST_Node;
  AST_False: new (...args: unknown[]) => AST_Node;
  AST_True: new (...args: unknown[]) => AST_Node;
  AST_JSXElement: new (...args: unknown[]) => AST_Node;
  AST_JSXFragment: new (...args: unknown[]) => AST_Node;
  AST_JSXAttribute: new (...args: unknown[]) => AST_Node;
  AST_JSXSpread: new (...args: unknown[]) => AST_Node;
  AST_JSXText: new (...args: unknown[]) => AST_Node;
  AST_JSXExprContainer: new (...args: unknown[]) => AST_Node;

  [key: `AST_${string}`]: new (...args: unknown[]) => AST_Node;
}

// -- Module Exports -----------------------------------------------------

export declare function create_compiler(): CompilerExports;
export declare function set_virtual_files(vf: Record<string, string>): void;
export declare function clear_virtual_files(): void;
