// Defines a changed symbol resolved to a stable graph node id (Phase 4+).
export type ResolvedSymbol = {
  readonly nodeId: string;
  readonly filePath: string;
  readonly displayName: string;
};

export type MvpQueryType = "CALLERS" | "DEPENDENCIES" | "IMPACT" | "PATH";
