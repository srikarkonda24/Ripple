// Stage 3 orchestrator: builds deterministic cross-file references from Stage 2 output.
/// <reference path="../../../ripple-core/schema.ts" />

import * as fs from "fs";
import * as path from "path";
import { sortFileNodes } from "../stage2/sorter";
import { createBuildReport, finalizeBuildReport } from "./buildReport";
import { createEdgeAccumulator } from "./edgeUtils";
import {
  enrichSymbolsWithEdges,
  finalizeEdges,
  populateFileSymbols,
} from "./finalizeGraph";
import { buildFileAnalysis } from "./fileAnalysis";
import { buildResolutionSnapshot } from "./buildResolutionSnapshot";
import { buildStage3Indexes } from "./indexes";
import { buildReferenceGraph } from "./referenceGraph";
import type { FileAnalysis, Stage3Input, Stage3Result } from "./types";
import { validateStage3Output } from "./validator";

function validateRepoPath(repoPath: string): string {
  const absoluteRepoRoot = path.resolve(repoPath);
  if (!fs.existsSync(absoluteRepoRoot)) {
    throw new Error(`Repository path not found: ${absoluteRepoRoot}`);
  }
  if (!fs.statSync(absoluteRepoRoot).isDirectory()) {
    throw new Error(`Repository path is not a directory: ${absoluteRepoRoot}`);
  }
  return absoluteRepoRoot;
}

function groupSymbolsByFile(symbols: CodeSymbol[]): Map<string, CodeSymbol[]> {
  const symbolsByFilePath = new Map<string, CodeSymbol[]>();
  for (const symbol of symbols) {
    if (!symbolsByFilePath.has(symbol.filePath)) {
      symbolsByFilePath.set(symbol.filePath, []);
    }
    symbolsByFilePath.get(symbol.filePath)?.push({ ...symbol });
  }
  return symbolsByFilePath;
}

function buildAnalyses(
  repoPath: string,
  files: FileNode[],
  symbolsByFilePath: Map<string, CodeSymbol[]>,
  report: ReturnType<typeof createBuildReport>
): FileAnalysis[] {
  const analyses: FileAnalysis[] = [];
  for (const file of sortFileNodes(files)) {
    const analysis = buildFileAnalysis(repoPath, file, symbolsByFilePath.get(file.path) ?? []);
    if (!analysis) {
      report.summary.filesSkipped++;
      report.filesSkipped.push({
        filePath: file.path,
        specifier: file.path,
        reason: "unreadable",
      });
      continue;
    }
    report.summary.filesProcessed++;
    if (analysis.surface.usedFallback) {
      report.surfaceParseFallback.push(file.path);
    }
    analyses.push(analysis);
  }
  return analyses;
}

export function runStage3(input: Stage3Input): Stage3Result {
  const absoluteRepoRoot = validateRepoPath(input.repoPath);
  const files = sortFileNodes(input.files);
  const projectId = files[0]?.projectId ?? input.stage2.symbols[0]?.projectId ?? "";
  const report = createBuildReport(
    projectId,
    files.length,
    input.stage2.symbols.length,
    input.stage2.edges.length
  );
  const symbolsByFilePath = groupSymbolsByFile(input.stage2.symbols);
  const analyses = buildAnalyses(absoluteRepoRoot, files, symbolsByFilePath, report);
  const indexes = buildStage3Indexes(analyses, report);
  const accumulator = createEdgeAccumulator(input.stage2.edges);

  buildReferenceGraph(
    analyses,
    {
      repoFilePaths: new Set(files.map((file) => file.path)),
      indexes,
      report,
    },
    accumulator
  );

  const edges = finalizeEdges(accumulator.edgesByKey.values());
  const symbols = enrichSymbolsWithEdges(input.stage2.symbols, edges);
  const outputFiles = populateFileSymbols(files, symbols);

  report.summary.edgesTotal = edges.length;
  report.summary.edgesStage3Added = Math.max(0, edges.length - input.stage2.edges.length);
  const finalReport = finalizeBuildReport(report);

  validateStage3Output(outputFiles, symbols, edges, input.stage2.edges);

  const resolutionSnapshot = buildResolutionSnapshot(analyses, indexes);

  return {
    files: outputFiles,
    symbols,
    edges,
    report: finalReport,
    resolutionSnapshot,
  };
}
