// Defines the contract for language-specific file parsing adapters.
/// <reference path="../schema.ts" />
/// <reference path="./parserTypes.ts" />

/** Parses source files into canonical graph primitives for one language. */
interface ParserAdapter {
  /** Language this adapter handles, such as "typescript" or "python". */
  readonly language: string;

  /**
   * Parses one file into symbols, intra-file edges, and a module surface
   * that the matching ResolverAdapter uses for cross-file resolution.
   */
  parseFile(input: ParseFileInput): ParseFileOutput;
}
