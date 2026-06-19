// Lists all ultimate exported symbols reachable from a file, including export* chains.
/// <reference path="../../../ripple-core/schema.ts" />

import {
  resolveExportEntry,
  resolveModuleSpecifier,
  type ResolveContext,
} from "./symbolResolver";
import type { ResolutionResult } from "./types";

export interface ResolvedExport {
  exportKey: string;
  result: ResolutionResult;
}

export function listResolvedExports(
  filePath: string,
  context: ResolveContext,
  visitedFilePaths: string[] = []
): ResolvedExport[] {
  if (visitedFilePaths.includes(filePath)) {
    return [];
  }

  const nextVisited = [...visitedFilePaths, filePath];
  const results: ResolvedExport[] = [];
  const seen = new Set<string>();
  const entries = context.indexes.exportIndex.get(filePath);

  if (entries) {
    for (const entry of Array.from(entries.values()).sort((left, right) =>
      left.exportKey.localeCompare(right.exportKey)
    )) {
      if (entry.source === "local" && entry.symbolId) {
        const dedupeKey = `${entry.exportKey}:${entry.symbolId}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        results.push({
          exportKey: entry.exportKey,
          result: { kind: "resolved", toId: entry.symbolId, filePath },
        });
        continue;
      }

      if (entry.source === "reexport" && entry.reExport) {
        const resolved = resolveExportEntry(filePath, entry.exportKey, context);
        if (resolved.kind !== "resolved") {
          continue;
        }
        const dedupeKey = `${entry.exportKey}:${resolved.toId}`;
        if (seen.has(dedupeKey)) {
          continue;
        }
        seen.add(dedupeKey);
        results.push({ exportKey: entry.exportKey, result: resolved });
      }
    }
  }

  const allReExports =
    context.indexes.analysisByPath
      .get(filePath)
      ?.surface.reExports.filter((binding) => binding.kind === "all")
      .sort((left, right) => left.specifier.localeCompare(right.specifier)) ?? [];

  for (const binding of allReExports) {
    const target = resolveModuleSpecifier(filePath, binding.specifier, context);
    if (!target.filePath) {
      continue;
    }
    for (const nested of listResolvedExports(target.filePath, context, nextVisited)) {
      const dedupeKey = `${nested.exportKey}:${nested.result.toId}`;
      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);
      results.push(nested);
    }
  }

  return results.sort((left, right) => {
    const keyCompare = left.exportKey.localeCompare(right.exportKey);
    if (keyCompare !== 0) {
      return keyCompare;
    }
    return left.result.toId.localeCompare(right.result.toId);
  });
}
