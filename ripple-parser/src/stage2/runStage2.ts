// Stage 2 orchestrator: turns Stage 1 FileNode[] into deterministic CodeSymbol[] + Edge[].
/// <reference path="../../../ripple-core/schema.ts" />

import * as fs from "fs";
import * as path from "path";
import { buildEdges } from "./edgeBuilder";
import { extractSymbols } from "./fallback";
import { parseImports } from "./importParser";
import { normalizeFileUnit } from "./normalizeFileUnit";
import { readRepoFile } from "./readFile";
import { sortEdges, sortFileNodes, sortSymbols } from "./sorter";
import type {
  FileExtractionResult,
  ImportParseResult,
  NormalizedFileUnit,
  Stage2Result,
} from "./types";

const IMPORT_PARSED_LANGUAGES = new Set(["typescript", "javascript"]);

const EMPTY_IMPORTS: ImportParseResult = { imports: [], importedNames: [] };

function buildExtractionForUnreadable(): FileExtractionResult {
  return { symbols: [], fallbackLevelUsed: 3, originReason: "unreadable" };
}

export function runStage2(repoPath: string, files: FileNode[]): Stage2Result {
  const absoluteRepoRoot = path.resolve(repoPath);
  if (!fs.existsSync(absoluteRepoRoot)) {
    throw new Error(`Repository path not found: ${absoluteRepoRoot}`);
  }
  if (!fs.statSync(absoluteRepoRoot).isDirectory()) {
    throw new Error(`Repository path is not a directory: ${absoluteRepoRoot}`);
  }

  const sortedFiles = sortFileNodes(files);
  const repoFilePaths = new Set(sortedFiles.map((file) => file.path));
  const contentHashByPath = new Map(
    sortedFiles.map((file) => [file.path, file.contentHash])
  );

  const units: NormalizedFileUnit[] = [];

  for (const file of sortedFiles) {
    const source = readRepoFile(absoluteRepoRoot, file.path);

    if (source === null) {
      units.push(
        normalizeFileUnit(file, buildExtractionForUnreadable(), EMPTY_IMPORTS)
      );
      continue;
    }

    const extraction = extractSymbols(file.language, source);
    const importResult = IMPORT_PARSED_LANGUAGES.has(file.language)
      ? parseImports(source)
      : EMPTY_IMPORTS;

    units.push(normalizeFileUnit(file, extraction, importResult));
  }

  const edges = buildEdges(units, repoFilePaths, contentHashByPath);
  const symbols = units.flatMap((unit) => unit.symbols);

  return {
    symbols: sortSymbols(symbols),
    edges: sortEdges(edges),
  };
}
