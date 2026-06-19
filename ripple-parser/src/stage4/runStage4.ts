// Stage 4 orchestrator: pure rewrite pass over Stage 3 edge targets via ResolverAdapter.
/// <reference path="../../../ripple-core/schema.ts" />

import { buildSymbolIndex } from "../../../ripple-core/resolution/buildSymbolIndex";
import { applyEdgeRewrites } from "./applyEdgeRewrites";
import { buildGraphMetrics } from "./buildGraphMetrics";
import { createStage4Report, finalizeStage4Report } from "./buildReport";
import { resolveGraph } from "./resolveGraph";
import type { Stage4Input, Stage4Result } from "./types";
import { validateStage4Output } from "./validator";

/** Runs the Stage 4 resolution overlay without mutating Stage 3 structural IR objects. */
export function runStage4(input: Stage4Input): Stage4Result {
  const { stage3, resolver } = input;
  const projectId = stage3.files[0]?.projectId ?? stage3.symbols[0]?.projectId ?? "";
  const report = createStage4Report(projectId, stage3.edges.length);
  const repoFilePaths = new Set(stage3.files.map((file) => file.path));

  const symbolIndex = buildSymbolIndex({
    symbols: stage3.symbols,
    files: stage3.files,
    resolutionSnapshot: stage3.resolutionSnapshot,
  });

  const resolverReport: ResolverReport = {
    unresolvedPaths: [],
    unresolvedAliases: [],
    importsResolved: 0,
    importsUnresolved: 0,
    externalImports: 0,
    aliasesResolved: 0,
  };

  const resolverContext: ResolverContext = {
    projectId,
    repoPath: input.repoPath,
    repoFilePaths,
    symbolIndex,
    config: input.config ?? {},
    report: resolverReport,
  };

  const rewriteMap = resolveGraph({
    stage3,
    resolver,
    resolverContext,
    report,
  });

  const edges = applyEdgeRewrites(stage3.edges, rewriteMap);
  const finalReport = finalizeStage4Report(report, rewriteMap);
  finalReport.metrics = buildGraphMetrics({
    stage3,
    edges,
    symbolIndex,
    report: finalReport,
  });

  const result: Stage4Result = {
    files: stage3.files.map((file) => ({ ...file })),
    symbols: stage3.symbols.map((symbol) => ({ ...symbol })),
    edges,
    report: finalReport,
    stage3Report: stage3.report,
    rewriteMap,
  };

  validateStage4Output(stage3, result);
  return result;
}
