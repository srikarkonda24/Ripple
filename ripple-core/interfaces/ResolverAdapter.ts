// Defines the contract for language-specific import and symbol resolution adapters.
/// <reference path="../schema.ts" />
/// <reference path="./resolverTypes.ts" />

/** Resolves imports and symbol bindings for one language during cross-file graph building. */
interface ResolverAdapter {
  /** Language this resolver handles, such as "typescript" or "python". */
  readonly language: string;

  /**
   * Resolves an import specifier from a source file to a stable target ID.
   * Stage 4 alias and package rules extend this method inside each adapter.
   */
  resolveImport(input: ResolveImportInput): ResolveImportOutput;

  resolveSymbol(input: ResolveSymbolInput): ResolveSymbolOutput;
}
