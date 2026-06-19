// Defines Stage 4 data contracts for the deterministic edge-target rewrite pass.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import type { Stage3Result } from "../stage3/types";

export interface Stage4Input {
  repoPath: string;
  stage3: Stage3Result;
  resolver: ResolverAdapter;
  config?: Record<string, unknown>;
}

export interface Stage4Report {
  version: "stage4-v1";
  projectId: ID;
  generatedAt: 0;
  summary: {
    edgesTotal: number;
    edgesRewritten: number;
    importsUpgraded: number;
    aliasesResolved: number;
    externalClassified: number;
    stillUnresolved: number;
  };
  upgradedTargets: Array<{
    fromToId: ID;
    toToId: ID;
    filePath: string;
    specifier: string;
  }>;
  rewriteTrace: EdgeRewriteTrace[];
  resolutionTrace: ResolutionDecisionTrace[];
  metrics: Stage4GraphMetrics;
}

export interface Stage4Result {
  files: FileNode[];
  symbols: CodeSymbol[];
  edges: Edge[];
  report: Stage4Report;
  stage3Report: Stage3Result["report"];
  rewriteMap: EdgeRewriteMap;
}

export type { EdgeRewriteMap, ResolutionSnapshot, SnapshotImportBinding };
