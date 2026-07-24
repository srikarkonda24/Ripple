// Builds deterministic ImpactReport values from verified claims only.
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { ImpactClaim, ImpactReport } from "../core/ImpactReport";
import type { GsidRef } from "../core/GsidRef";
import type { ImpactEmptyReason } from "../core/PRChange";
import type { ResolvedSymbol } from "../core/ResolvedSymbol";

export type ImpactReportBuildInput = {
  readonly identity: AnalysisIdentity;
  readonly gsid: GsidRef;
  readonly changedSymbols: readonly ResolvedSymbol[];
  readonly claims: readonly ImpactClaim[];
  readonly emptyReason?: ImpactEmptyReason;
};

/** Sorts claims deterministically for stable reports and GitHub output. */
function compareClaims(left: ImpactClaim, right: ImpactClaim): number {
  if (left.evidenceId < right.evidenceId) {
    return -1;
  }
  if (left.evidenceId > right.evidenceId) {
    return 1;
  }
  if (left.queryType < right.queryType) {
    return -1;
  }
  if (left.queryType > right.queryType) {
    return 1;
  }
  if (left.changedSymbol.nodeId < right.changedSymbol.nodeId) {
    return -1;
  }
  if (left.changedSymbol.nodeId > right.changedSymbol.nodeId) {
    return 1;
  }
  return 0;
}

/** Sorts changed symbols by nodeId ascending. */
function sortChangedSymbols(
  symbols: readonly ResolvedSymbol[],
): readonly ResolvedSymbol[] {
  return [...symbols].sort((left, right) => {
    if (left.nodeId < right.nodeId) {
      return -1;
    }
    if (left.nodeId > right.nodeId) {
      return 1;
    }
    return 0;
  });
}

/**
 * Populates a final ImpactReport from interpreter output without adding authority.
 */
export function buildImpactReport(input: ImpactReportBuildInput): ImpactReport {
  const sortedClaims = [...input.claims].sort(compareClaims);
  const report: ImpactReport = {
    identity: input.identity,
    gsid: input.gsid,
    changedSymbols: sortChangedSymbols(input.changedSymbols),
    claims: sortedClaims,
  };

  if (input.emptyReason !== undefined) {
    return { ...report, emptyReason: input.emptyReason };
  }

  if (sortedClaims.length === 0 && input.changedSymbols.length === 0) {
    return { ...report, emptyReason: "NO_RESOLVED_SYMBOLS" };
  }

  return report;
}

/** Serializes ImpactReport for golden determinism tests. */
export function serializeImpactReportForTest(report: ImpactReport): string {
  return JSON.stringify(report);
}
