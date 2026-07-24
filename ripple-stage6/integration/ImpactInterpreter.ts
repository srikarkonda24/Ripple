// Builds ImpactClaim values strictly from Stage 5 Evidence without inference.
import type { Evidence } from "../../ripple-stage5/core/Evidence";
import type { ImpactClaim } from "../core/ImpactReport";
import type { ResolvedSymbol } from "../core/ResolvedSymbol";
import type { ImpactQuery } from "../queries/ImpactQuery";
import { gsidRefToStage5Gsid } from "./GsidFactory";

/** Template-only summary text — no LLM or speculative language. */
function buildRelationshipSummary(
  changedSymbol: ResolvedSymbol,
  queryType: ImpactQuery["type"],
  affectedNodeIds: readonly string[],
  graphPath: readonly string[],
): string {
  const affectedText = affectedNodeIds.join(", ");
  const pathText = graphPath.join(" → ");
  return `Symbol ${changedSymbol.displayName} has ${queryType} relationship to ${affectedText} through path ${pathText}.`;
}

/** Derives affected node ids from evidence graphPath excluding the query target node. */
function affectedNodeIdsFromEvidence(
  evidence: Evidence,
  targetNodeId: string,
): readonly string[] {
  const affected = evidence.graphPath.filter((nodeId) => nodeId !== targetNodeId);
  return [...new Set(affected)].sort();
}

/** Returns null when evidence cannot support a developer-visible claim. */
export function interpretImpactClaim(input: {
  readonly changedSymbol: ResolvedSymbol;
  readonly query: ImpactQuery;
  readonly evidence: Evidence;
}): ImpactClaim | null {
  if (input.evidence.evidenceId.trim().length === 0) {
    return null;
  }
  if (input.evidence.graphPath.length === 0) {
    return null;
  }

  const queryGsid = gsidRefToStage5Gsid(input.query.gsid);
  if (JSON.stringify(input.evidence.gsid) !== JSON.stringify(queryGsid)) {
    return null;
  }

  const affectedNodeIds = affectedNodeIdsFromEvidence(
    input.evidence,
    input.query.target,
  );

  if (affectedNodeIds.length === 0) {
    return null;
  }

  return {
    changedSymbol: input.changedSymbol,
    queryType: input.query.type,
    affectedNodeIds,
    graphPath: [...input.evidence.graphPath],
    evidenceId: input.evidence.evidenceId,
    relationshipSummary: buildRelationshipSummary(
      input.changedSymbol,
      input.query.type,
      affectedNodeIds,
      input.evidence.graphPath,
    ),
  };
}

export type InterpretBatchInput = {
  readonly changedSymbol: ResolvedSymbol;
  readonly query: ImpactQuery;
  readonly evidence: Evidence;
};

/** Maps executed query/evidence pairs to claims, omitting unsupported results. */
export function interpretImpactClaims(
  executions: readonly InterpretBatchInput[],
): readonly ImpactClaim[] {
  const claims: ImpactClaim[] = [];
  for (const execution of executions) {
    const claim = interpretImpactClaim(execution);
    if (claim !== null) {
      claims.push(claim);
    }
  }
  return claims;
}
