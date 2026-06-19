// Defines Stage 3 data contracts for deterministic cross-file reference analysis.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import type { Stage2Result } from "../stage2/types";

export type ImportKind = "default" | "named" | "namespace" | "side-effect";
export type ExportKind = "default" | "named";
export type ReExportKind = "named" | "all" | "default";
export type ResolutionKind = "resolved" | "external" | "unresolved";
export type ReferenceKind = "value" | "call" | "jsx" | "type";

export interface Stage3Input {
  repoPath: string;
  files: FileNode[];
  stage2: Stage2Result;
}

export interface Stage3Result {
  files: FileNode[];
  symbols: CodeSymbol[];
  edges: Edge[];
  report: BuildReport;
  resolutionSnapshot: ResolutionSnapshot;
}

export interface ImportBinding {
  specifier: string;
  kind: ImportKind;
  localName: string;
  importedName?: string;
  typeOnly: boolean;
  line: number;
}

export interface ExportBinding {
  kind: ExportKind;
  exportName: string;
  localName: string;
}

export interface ReExportBinding {
  specifier: string;
  kind: ReExportKind;
  exportedName?: string;
  importedName?: string;
  localAlias?: string;
}

export interface ModuleSurface {
  filePath: string;
  imports: ImportBinding[];
  exports: ExportBinding[];
  reExports: ReExportBinding[];
  usedFallback: boolean;
}

export interface FileAnalysis {
  file: FileNode;
  symbols: CodeSymbol[];
  surface: ModuleSurface;
  bodyTextBySymbolId: Record<string, string>;
}

export interface ExportEntry {
  filePath: string;
  exportKey: string;
  symbolId?: string;
  source: "local" | "reexport";
  reExport?: ReExportBinding;
}

export interface ResolutionResult {
  kind: ResolutionKind;
  toId: string;
  filePath?: string;
}

export interface UnresolvedEntry {
  filePath: string;
  specifier: string;
  reason: string;
}

export interface AmbiguityEntry {
  filePath: string;
  exportName: string;
  symbolIds: string[];
}

export interface BuildReport {
  version: "stage3-v1";
  projectId: ID;
  generatedAt: 0;
  summary: {
    filesTotal: number;
    filesProcessed: number;
    filesSkipped: number;
    symbolsTotal: number;
    edgesStage2: number;
    edgesStage3Added: number;
    edgesTotal: number;
    importsResolved: number;
    importsUnresolved: number;
    externalImports: number;
    reExportsProcessed: number;
    crossFileCalls: number;
    references: number;
  };
  unresolvedExports: UnresolvedEntry[];
  unresolvedPaths: UnresolvedEntry[];
  unresolvedAliases: UnresolvedEntry[];
  circularChains: string[];
  surfaceParseFallback: string[];
  exportAmbiguities: AmbiguityEntry[];
  orphanExports: UnresolvedEntry[];
  filesSkipped: UnresolvedEntry[];
}
