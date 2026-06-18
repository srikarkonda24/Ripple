// Internal Stage 2 data shapes that sit alongside (never replace) the canonical schema.
/// <reference path="../../../ripple-core/schema.ts" />

export type Stage2SymbolType = "function" | "class" | "component" | "module";

export type OriginReason =
  | "ast"
  | "heuristic"
  | "module_fallback"
  | "parse_failed"
  | "empty"
  | "unreadable";

export type SymbolOrigin = "source" | "markdown";

export interface ExtractedSymbol {
  name: string;
  type: Stage2SymbolType;
  startLine: number;
  endLine?: number;
  bodyText?: string;
  parentClassName?: string;
  synthetic: boolean;
  origin: SymbolOrigin;
  originReason: OriginReason;
  anchorSliceHash: string;
}

export interface ParsedImport {
  normalizedSpecifier: string;
  rawSpecifier: string;
}

export interface ImportParseResult {
  imports: ParsedImport[];
  importedNames: string[];
}

export interface FileExtractionResult {
  symbols: ExtractedSymbol[];
  fallbackLevelUsed: 1 | 2 | 3;
  originReason: OriginReason;
}

export interface NormalizedFileUnit {
  fileId: string;
  filePath: string;
  projectId: string;
  moduleSymbolId: string;
  symbols: CodeSymbol[];
  imports: ParsedImport[];
  importedNames: string[];
  bodyTextBySymbolId: Record<string, string>;
  syntheticSymbolIds: Set<string>;
  parentClassNameBySymbolId: Record<string, string>;
  metadata: {
    language: string;
    syntheticCount: number;
    fallbackLevelUsed: 1 | 2 | 3;
    originReason: OriginReason;
  };
}

export interface Stage2Result {
  symbols: CodeSymbol[];
  edges: Edge[];
}
