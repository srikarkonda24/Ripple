// Creates the initial Stage 4 build report before resolution upgrades are applied.
/// <reference path="../../../ripple-core/schema.ts" />

import type { Stage4Report } from "./types";

/** Creates an empty Stage 4 report shell for one repository run. */
export function createStage4Report(projectId: ID, edgesTotal: number): Stage4Report {
  return {
    version: "stage4-v1",
    projectId,
    generatedAt: 0,
    summary: {
      edgesTotal,
      edgesRewritten: 0,
      importsUpgraded: 0,
      aliasesResolved: 0,
      externalClassified: 0,
      stillUnresolved: 0,
    },
    upgradedTargets: [],
    rewriteTrace: [],
    resolutionTrace: [],
    metrics: {
      resolvedEdges: 0,
      unresolvedEdges: 0,
      externalEdges: 0,
      aliasBindings: 0,
      aliasUpgraded: 0,
      aliasSuccessRate: 1,
    },
  };
}

/** Finalizes Stage 4 report counters after the rewrite pass completes. */
export function finalizeStage4Report(
  report: Stage4Report,
  rewriteMap: Map<string, string>
): Stage4Report {
  report.summary.edgesRewritten = rewriteMap.size;
  report.upgradedTargets.sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);
    if (fileCompare !== 0) {
      return fileCompare;
    }
    return left.specifier.localeCompare(right.specifier);
  });
  return report;
}
