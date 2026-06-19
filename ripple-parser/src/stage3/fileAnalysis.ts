// Creates the per-file Stage 3 artifact that can later be cached by content hash.
/// <reference path="../../../ripple-core/schema.ts" />

import { readRepoFile } from "../stage2/readFile";
import { sortSymbols } from "../stage2/sorter";
import { parseModuleSurface } from "./parseModuleSurface";
import type { FileAnalysis } from "./types";

const IMPORT_PARSED_LANGUAGES = new Set(["typescript", "javascript"]);

function emptySourceBodyMap(symbols: CodeSymbol[]): Record<string, string> {
  const bodyTextBySymbolId: Record<string, string> = {};
  for (const symbol of symbols) {
    bodyTextBySymbolId[symbol.id] = "";
  }
  return bodyTextBySymbolId;
}

function sliceLines(source: string, startLine: number, endLine: number): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  return lines.slice(Math.max(startLine - 1, 0), Math.max(endLine, startLine)).join("\n");
}

function deriveBodyTextBySymbolId(
  source: string,
  symbols: CodeSymbol[]
): Record<string, string> {
  const sortedSymbols = sortSymbols(symbols);
  const bodyTextBySymbolId: Record<string, string> = {};

  for (let index = 0; index < sortedSymbols.length; index++) {
    const symbol = sortedSymbols[index];
    const next = sortedSymbols[index + 1];
    const startLine = symbol.startLine ?? 1;
    const inferredEndLine =
      symbol.endLine ?? (next?.startLine ? next.startLine - 1 : source.split(/\r?\n/).length);
    bodyTextBySymbolId[symbol.id] = sliceLines(source, startLine, inferredEndLine);
  }

  return bodyTextBySymbolId;
}

export function buildFileAnalysis(
  repoPath: string,
  file: FileNode,
  symbols: CodeSymbol[]
): FileAnalysis | null {
  const source = readRepoFile(repoPath, file.path);
  if (source === null) {
    return null;
  }

  const surface = IMPORT_PARSED_LANGUAGES.has(file.language)
    ? parseModuleSurface(file.path, source)
    : {
        filePath: file.path,
        imports: [],
        exports: [],
        reExports: [],
        usedFallback: false,
      };

  return {
    file,
    symbols,
    surface,
    bodyTextBySymbolId: source.length > 0 ? deriveBodyTextBySymbolId(source, symbols) : emptySourceBodyMap(symbols),
  };
}
