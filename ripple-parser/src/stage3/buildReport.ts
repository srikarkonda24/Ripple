// Builds and sorts the deterministic Stage 3 build report.
/// <reference path="../../../ripple-core/schema.ts" />

import type { AmbiguityEntry, BuildReport, UnresolvedEntry } from "./types";

function sortEntries<T extends { filePath: string; specifier?: string; reason?: string }>(
  entries: T[]
): T[] {
  return [...entries].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);
    if (fileCompare !== 0) {
      return fileCompare;
    }
    const specifierCompare = (left.specifier ?? "").localeCompare(
      right.specifier ?? ""
    );
    if (specifierCompare !== 0) {
      return specifierCompare;
    }
    return (left.reason ?? "").localeCompare(right.reason ?? "");
  });
}

function sortAmbiguities(entries: AmbiguityEntry[]): AmbiguityEntry[] {
  return [...entries].sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);
    if (fileCompare !== 0) {
      return fileCompare;
    }
    return left.exportName.localeCompare(right.exportName);
  });
}

export function createBuildReport(
  projectId: string,
  filesTotal: number,
  symbolsTotal: number,
  edgesStage2: number
): BuildReport {
  return {
    version: "stage3-v1",
    projectId,
    generatedAt: 0,
    summary: {
      filesTotal,
      filesProcessed: 0,
      filesSkipped: 0,
      symbolsTotal,
      edgesStage2,
      edgesStage3Added: 0,
      edgesTotal: edgesStage2,
      importsResolved: 0,
      importsUnresolved: 0,
      externalImports: 0,
      reExportsProcessed: 0,
      crossFileCalls: 0,
      references: 0,
    },
    unresolvedExports: [],
    unresolvedPaths: [],
    unresolvedAliases: [],
    circularChains: [],
    surfaceParseFallback: [],
    exportAmbiguities: [],
    orphanExports: [],
    filesSkipped: [],
  };
}

export function addUnresolved(
  entries: UnresolvedEntry[],
  filePath: string,
  specifier: string,
  reason: string
): void {
  entries.push({ filePath, specifier, reason });
}

export function finalizeBuildReport(report: BuildReport): BuildReport {
  return {
    ...report,
    unresolvedExports: sortEntries(report.unresolvedExports),
    unresolvedPaths: sortEntries(report.unresolvedPaths),
    unresolvedAliases: sortEntries(report.unresolvedAliases),
    circularChains: [...report.circularChains].sort((left, right) =>
      left.localeCompare(right)
    ),
    surfaceParseFallback: [...report.surfaceParseFallback].sort((left, right) =>
      left.localeCompare(right)
    ),
    exportAmbiguities: sortAmbiguities(report.exportAmbiguities),
    orphanExports: sortEntries(report.orphanExports),
    filesSkipped: sortEntries(report.filesSkipped),
  };
}
