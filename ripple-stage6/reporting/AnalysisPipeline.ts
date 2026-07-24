// Wires Phase 2–5 outputs into a final ImpactReport for Phase 6 publishing.
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { ImpactReport } from "../core/ImpactReport";
import type { GsidRef } from "../core/GsidRef";
import type { PRChange } from "../core/PRChange";
import type { ImpactEmptyReason } from "../core/PRChange";
import {
  interpretImpactClaims,
  type InterpretBatchInput,
} from "../integration/ImpactInterpreter";
import { stage5Gateway } from "../integration/Stage5Gateway";
import type { SnapshotProvider } from "../integration/SnapshotProvider";
import type { ImpactQuery } from "../queries/ImpactQuery";
import { buildImpactQueries } from "../queries/ImpactQueryBuilder";
import type { WorkflowCatalog } from "../queries/WorkflowCatalog";
import type { ResolvedSymbol } from "../core/ResolvedSymbol";
import { resolveSymbols } from "../resolution/SymbolResolver";
import type { SymbolIndex } from "../resolution/SymbolIndex";
import { buildImpactReport } from "./ImpactReportBuilder";

/** Finds the changed symbol associated with a generated query. */
function changedSymbolForQuery(
  query: ImpactQuery,
  symbols: readonly ResolvedSymbol[],
): ResolvedSymbol | undefined {
  if (query.type === "PATH") {
    return symbols.find((symbol) => symbol.nodeId === query.source);
  }
  return symbols.find((symbol) => symbol.nodeId === query.target);
}

export type AnalysisPipelineInput = {
  readonly identity: AnalysisIdentity;
  readonly gsid: GsidRef;
  readonly prChange: PRChange;
  readonly symbolIndex: SymbolIndex;
  readonly snapshotProvider: SnapshotProvider;
  readonly workflowCatalog: WorkflowCatalog;
};

export type AnalysisPipelineResult = {
  readonly report: ImpactReport;
  readonly publishedClaimsCount: number;
};

/**
 * Runs the deterministic analysis chain up to ImpactReport (no GitHub publish).
 */
export function runAnalysisToImpactReport(
  input: AnalysisPipelineInput,
): AnalysisPipelineResult {
  const resolution = resolveSymbols({
    prChange: input.prChange,
    gsid: input.gsid,
    symbolIndex: input.symbolIndex,
  });

  if (resolution.symbols.length === 0) {
    return {
      report: buildImpactReport({
        identity: input.identity,
        gsid: input.gsid,
        changedSymbols: [],
        claims: [],
        emptyReason: resolution.emptyReason ?? "NO_RESOLVED_SYMBOLS",
      }),
      publishedClaimsCount: 0,
    };
  }

  const queries = buildImpactQueries({
    gsid: input.gsid,
    symbols: resolution.symbols,
    workflowCatalog: input.workflowCatalog,
  });

  const executions: InterpretBatchInput[] = [];
  for (const query of queries) {
    const changedSymbol = changedSymbolForQuery(query, resolution.symbols);
    if (changedSymbol === undefined) {
      continue;
    }
    const evidence = stage5Gateway.execute(query, input.snapshotProvider);
    executions.push({ changedSymbol, query, evidence });
  }

  const claims = interpretImpactClaims(executions);
  const emptyReason: ImpactEmptyReason | undefined =
    claims.length === 0 ? "NO_EVIDENCE" : undefined;

  return {
    report: buildImpactReport({
      identity: input.identity,
      gsid: input.gsid,
      changedSymbols: resolution.symbols,
      claims,
      emptyReason,
    }),
    publishedClaimsCount: claims.length,
  };
}
