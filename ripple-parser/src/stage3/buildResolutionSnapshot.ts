// Assembles the Stage 3 resolution snapshot consumed by the Stage 4 overlay pass.
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import type { FileAnalysis } from "./types";
import type { Stage3Indexes } from "./indexes";

/** Builds a deterministic resolution snapshot from Stage 3 internal artifacts. */
export function buildResolutionSnapshot(
  analyses: FileAnalysis[],
  indexes: Stage3Indexes
): ResolutionSnapshot {
  const sortedAnalyses = [...analyses].sort((left, right) =>
    left.file.path.localeCompare(right.file.path)
  );

  const imports: Array<{ filePath: string; bindings: SnapshotImportBinding[] }> = [];
  const exports: Array<{ filePath: string; entries: SnapshotExportEntry[] }> = [];
  const reExports: Array<{ filePath: string; bindings: SnapshotReExportBinding[] }> = [];

  for (const analysis of sortedAnalyses) {
    imports.push({
      filePath: analysis.file.path,
      bindings: analysis.surface.imports.map((binding) => ({ ...binding })),
    });

    reExports.push({
      filePath: analysis.file.path,
      bindings: analysis.surface.reExports.map((binding) => ({ ...binding })),
    });

    const exportEntries = indexes.exportIndex.get(analysis.file.path);
    const entries = exportEntries
      ? Array.from(exportEntries.values())
          .sort((left, right) => left.exportKey.localeCompare(right.exportKey))
          .map((entry) => ({
            filePath: entry.filePath,
            exportKey: entry.exportKey,
            symbolId: entry.symbolId,
            source: entry.source,
            reExport: entry.reExport ? { ...entry.reExport } : undefined,
          }))
      : [];

    exports.push({ filePath: analysis.file.path, entries });
  }

  const moduleSymbolIds: Array<{ filePath: string; symbolId: string }> = [];
  for (const [filePath, symbolId] of indexes.moduleSymbolIdByPath.entries()) {
    moduleSymbolIds.push({ filePath, symbolId });
  }
  moduleSymbolIds.sort((left, right) => left.filePath.localeCompare(right.filePath));

  return { imports, exports, reExports, moduleSymbolIds };
}
