// Adversarial checks ensuring resolver output never creates invalid internal mappings.
/// <reference path="../../../../ripple-core/schema.ts" />

import { buildExternalTargetId } from "../../../src/stage2/symbolId";
import type { Stage3Result } from "../../../src/stage3/types";
import type { Stage4Result } from "../../../src/stage4/types";
import type { InvariantViolation } from "./invariants";

function isInternalSymbolId(
  toId: string,
  symbolIds: Set<string>,
  moduleIds: Set<string>
): boolean {
  return symbolIds.has(toId) || moduleIds.has(toId);
}

/** Ensures external package imports are never incorrectly mapped to in-repo symbols. */
export function assertNoInvalidInternalResolution(
  stage3: Stage3Result,
  stage4: Stage4Result
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const symbolIds = new Set(stage3.symbols.map((symbol) => symbol.id));
  const moduleIds = new Set(
    stage3.resolutionSnapshot.moduleSymbolIds.map((entry) => entry.symbolId)
  );
  const stage3ById = new Map(stage3.edges.map((edge) => [edge.id, edge]));

  for (const edge of stage4.edges) {
    const original = stage3ById.get(edge.id);
    if (!original || edge.type !== "IMPORTS") {
      continue;
    }

    const knownExternalIds = new Set([
      buildExternalTargetId("react"),
      buildExternalTargetId("express"),
    ]);

    if (
      knownExternalIds.has(original.toId) &&
      isInternalSymbolId(edge.toId, symbolIds, moduleIds)
    ) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `external IMPORTS edge ${edge.id} incorrectly resolved to internal symbol ${edge.toId}`,
      });
    }
  }

  return violations;
}

/** Parity fixtures must produce an empty rewrite map. */
export function assertParityNoRewrite(stage4: Stage4Result): InvariantViolation[] {
  if (stage4.rewriteMap.size === 0) {
    return [];
  }
  return [
    {
      oracle: "RewriteCorrect",
      message: `parity fixture produced ${stage4.rewriteMap.size} rewrites (expected 0)`,
    },
  ];
}

/** Rewrite fixtures must upgrade at least one edge target. */
export function assertRewriteExpected(stage4: Stage4Result, minRewrites: number): InvariantViolation[] {
  if (stage4.rewriteMap.size >= minRewrites) {
    return [];
  }
  return [
    {
      oracle: "RewriteCorrect",
      message: `expected at least ${minRewrites} rewrites, got ${stage4.rewriteMap.size}`,
    },
  ];
}
