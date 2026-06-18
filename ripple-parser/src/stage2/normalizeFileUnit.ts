// Converts per-file extraction output into a uniform NormalizedFileUnit consumed by the edge builder.
/// <reference path="../../../ripple-core/schema.ts" />

import * as path from "path";
import { buildModuleSymbolId, buildSymbolId } from "./symbolId";
import type {
  FileExtractionResult,
  ImportParseResult,
  NormalizedFileUnit,
} from "./types";

function moduleNameFromPath(filePath: string): string {
  const base = path.posix.basename(filePath);
  const extension = path.posix.extname(base);
  return extension.length > 0 ? base.slice(0, base.length - extension.length) : base;
}

export function normalizeFileUnit(
  file: FileNode,
  extraction: FileExtractionResult,
  importResult: ImportParseResult
): NormalizedFileUnit {
  const moduleSymbolId = buildModuleSymbolId(file.path, file.contentHash);
  const symbols: CodeSymbol[] = [];
  const bodyTextBySymbolId: Record<string, string> = {};
  const parentClassNameBySymbolId: Record<string, string> = {};
  const syntheticSymbolIds = new Set<string>();
  const seenIds = new Set<string>();
  let syntheticCount = 0;

  if (extraction.symbols.length === 0) {
    symbols.push({
      id: moduleSymbolId,
      projectId: file.projectId,
      name: moduleNameFromPath(file.path),
      type: "module",
      filePath: file.path,
      startLine: 1,
      calls: [],
      referencedBy: [],
    });
    bodyTextBySymbolId[moduleSymbolId] = "";
  } else {
    for (const extracted of extraction.symbols) {
      const id = buildSymbolId(
        file.path,
        extracted.name,
        extracted.type,
        extracted.anchorSliceHash
      );
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);

      symbols.push({
        id,
        projectId: file.projectId,
        name: extracted.name,
        type: extracted.type,
        filePath: file.path,
        startLine: extracted.startLine,
        endLine: extracted.endLine,
        calls: [],
        referencedBy: [],
      });
      bodyTextBySymbolId[id] = extracted.bodyText ?? "";

      if (extracted.parentClassName) {
        parentClassNameBySymbolId[id] = extracted.parentClassName;
      }
      if (extracted.synthetic) {
        syntheticSymbolIds.add(id);
        syntheticCount++;
      }
    }
  }

  return {
    fileId: file.id,
    filePath: file.path,
    projectId: file.projectId,
    moduleSymbolId,
    symbols,
    imports: importResult.imports,
    importedNames: importResult.importedNames,
    bodyTextBySymbolId,
    syntheticSymbolIds,
    parentClassNameBySymbolId,
    metadata: {
      language: file.language,
      syntheticCount,
      fallbackLevelUsed: extraction.fallbackLevelUsed,
      originReason: extraction.originReason,
    },
  };
}
