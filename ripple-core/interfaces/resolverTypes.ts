// Defines input and output types for language-specific resolver adapters and Stage 4 resolution.
/// <reference path="../schema.ts" />

type ResolutionKind = "resolved" | "external" | "unresolved";

/** One import binding captured in a Stage 3 resolution snapshot. */
interface SnapshotImportBinding {
  specifier: string;
  kind: "default" | "named" | "namespace" | "side-effect";
  localName: string;
  importedName?: string;
  typeOnly: boolean;
  line: number;
}

/** One re-export binding referenced by a snapshot export entry. */
interface SnapshotReExportBinding {
  specifier: string;
  kind: "named" | "all" | "default";
  exportedName?: string;
  importedName?: string;
  localAlias?: string;
}

/** One export catalog entry captured in a Stage 3 resolution snapshot. */
interface SnapshotExportEntry {
  filePath: string;
  exportKey: string;
  symbolId?: string;
  source: "local" | "reexport";
  reExport?: SnapshotReExportBinding;
}

/** Stable resolution input assembled by Stage 3 for Stage 4 overlay passes. */
interface ResolutionSnapshot {
  imports: ReadonlyArray<{
    filePath: string;
    bindings: SnapshotImportBinding[];
  }>;
  exports: ReadonlyArray<{
    filePath: string;
    entries: SnapshotExportEntry[];
  }>;
  reExports: ReadonlyArray<{
    filePath: string;
    bindings: SnapshotReExportBinding[];
  }>;
  moduleSymbolIds: ReadonlyArray<{
    filePath: string;
    symbolId: ID;
  }>;
}

/** One unresolved import or symbol lookup recorded during resolution. */
interface ResolverUnresolvedEntry {
  filePath: string;
  specifier: string;
  reason: string;
}

/** Mutable counters and unresolved lists collected during a resolution pass. */
interface ResolverReport {
  unresolvedPaths: ResolverUnresolvedEntry[];
  unresolvedAliases: ResolverUnresolvedEntry[];
  importsResolved: number;
  importsUnresolved: number;
  externalImports: number;
  aliasesResolved: number;
}

/** Language-neutral symbol lookup indexes built from Stage 3 output. */
interface SymbolIndex {
  symbolsById: ReadonlyMap<ID, CodeSymbol>;
  exportIndex: ReadonlyMap<string, ReadonlyMap<string, SnapshotExportEntry>>;
  reExportsByFilePath: ReadonlyMap<string, readonly SnapshotReExportBinding[]>;
  moduleSymbolIdByPath: ReadonlyMap<string, ID>;
  symbolsByFilePath: ReadonlyMap<string, readonly CodeSymbol[]>;
}

/** Score breakdown for one resolver ranking decision (optional per rule). */
interface ResolutionScoreBreakdown {
  aliasMatch?: number;
  relativeMatch?: number;
  exportMatch?: number;
  rankUpgrade?: number;
}

/** One rejected candidate considered during import path resolution. */
interface ResolutionRejectedCandidate {
  candidate: string;
  reason: string;
}

/** Full decision trace for one import binding resolution attempt. */
interface ResolutionDecisionTrace {
  filePath: string;
  specifier: string;
  bindingKind: SnapshotImportBinding["kind"];
  requestedName?: string;
  candidates: string[];
  rejected: ResolutionRejectedCandidate[];
  selected: string | null;
  selectedToId: ID | null;
  rule: string;
  scoreBreakdown: ResolutionScoreBreakdown;
  currentToId: ID;
  resolvedToId: ID;
  resolvedKind: ResolutionKind;
  upgradeApplied: boolean;
  skipReason?: string;
}

/** Edge-level before/after record for one Stage 4 rewrite. */
interface EdgeRewriteTrace {
  edgeId: ID;
  edgeType: EdgeType;
  fromId: ID;
  before: ID;
  after: ID;
  filePath?: string;
  specifier?: string;
  rule?: string;
}

/** Aggregate graph health counters after Stage 4 completes. */
interface Stage4GraphMetrics {
  resolvedEdges: number;
  unresolvedEdges: number;
  externalEdges: number;
  aliasBindings: number;
  aliasUpgraded: number;
  aliasSuccessRate: number;
}

/** Shared context passed to every resolver call in one repository run. */
interface ResolverContext {
  projectId: ID;
  repoPath: string;
  repoFilePaths: ReadonlySet<string>;
  symbolIndex: SymbolIndex;
  config: Record<string, unknown>;
  report?: ResolverReport;
}

/** Resolves one import specifier from a source file to a target graph ID. */
interface ResolveImportInput {
  fromFilePath: string;
  specifier: string;
  context: ResolverContext;
}

/** Result of resolving an import specifier to an in-repo, external, or unresolved target. */
interface ResolveImportOutput {
  kind: ResolutionKind;
  toId: ID;
  filePath?: string;
  reason?: string;
}

/** Resolves one named binding from an adapter-internal import or export shape. */
interface ResolveSymbolInput {
  fromFilePath: string;
  binding: SnapshotImportBinding;
  requestedName: string;
  context: ResolverContext;
}

/** Result of resolving a named binding to a symbol or virtual target ID. */
interface ResolveSymbolOutput {
  kind: ResolutionKind;
  toId: ID;
  filePath?: string;
  symbolId?: ID;
}

/** Maps Stage 3 edge IDs to upgraded target IDs for the Stage 4 rewrite pass. */
type EdgeRewriteMap = Map<ID, ID>;
