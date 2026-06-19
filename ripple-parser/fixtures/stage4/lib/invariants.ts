// Two core oracles for Stage 4: IR immutability and edge rewrite correctness.
/// <reference path="../../../../ripple-core/schema.ts" />

import type { Stage3Result } from "../../../src/stage3/types";
import type { Stage4Result } from "../../../src/stage4/types";

export interface InvariantViolation {
  oracle: "IRFrozen" | "RewriteCorrect" | "Deterministic";
  message: string;
}

interface EdgeStructure {
  id: string;
  fromId: string;
  type: EdgeType;
  context: string;
}

function edgeStructure(edge: Edge): EdgeStructure {
  return {
    id: edge.id,
    fromId: edge.fromId,
    type: edge.type,
    context: edge.context ?? "",
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function resolutionRank(toId: string, symbolIds: Set<string>, moduleIds: Set<string>): number {
  if (symbolIds.has(toId) || moduleIds.has(toId)) {
    return 3;
  }
  return 1;
}

/** ORACLE 1 — structural IR must be unchanged except edge.toId semantics. */
export function assertIRFrozen(
  stage3: Stage3Result,
  stage4: Stage4Result,
  snapshotBeforeStage4: string
): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  if (stableJson(stage3.files) !== stableJson(stage4.files)) {
    violations.push({ oracle: "IRFrozen", message: "files mutated" });
  }

  if (stableJson(stage3.symbols) !== stableJson(stage4.symbols)) {
    violations.push({ oracle: "IRFrozen", message: "symbols mutated" });
  }

  if (stableJson(stage3.resolutionSnapshot) !== snapshotBeforeStage4) {
    violations.push({ oracle: "IRFrozen", message: "resolutionSnapshot mutated on input" });
  }

  if (stage3.edges.length !== stage4.edges.length) {
    violations.push({
      oracle: "IRFrozen",
      message: `edge count changed: ${stage3.edges.length} -> ${stage4.edges.length}`,
    });
    return violations;
  }

  const stage3ById = new Map(stage3.edges.map((edge) => [edge.id, edge]));
  const stage3Structures = stage3.edges.map(edgeStructure).sort((left, right) =>
    left.id.localeCompare(right.id)
  );
  const stage4Structures = stage4.edges.map(edgeStructure).sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  if (stableJson(stage3Structures) !== stableJson(stage4Structures)) {
    violations.push({ oracle: "IRFrozen", message: "edge structure (id/fromId/type/context) changed" });
  }

  const edgeIds = new Set<string>();
  for (const edge of stage4.edges) {
    if (edgeIds.has(edge.id)) {
      violations.push({ oracle: "IRFrozen", message: `duplicate edge id: ${edge.id}` });
    }
    edgeIds.add(edge.id);
    if (!stage3ById.has(edge.id)) {
      violations.push({ oracle: "IRFrozen", message: `unknown edge id introduced: ${edge.id}` });
    }
  }

  return violations;
}

/** ORACLE 2 — edge.toId must match rewriteMap rules exactly. */
export function assertRewriteCorrect(stage3: Stage3Result, stage4: Stage4Result): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const stage3ById = new Map(stage3.edges.map((edge) => [edge.id, edge]));
  const symbolIds = new Set(stage3.symbols.map((symbol) => symbol.id));
  const moduleIds = new Set(
    stage3.resolutionSnapshot.moduleSymbolIds.map((entry) => entry.symbolId)
  );

  for (const edge of stage4.edges) {
    const original = stage3ById.get(edge.id);
    if (!original) {
      continue;
    }

    const mappedToId = stage4.rewriteMap.get(edge.id);
    if (mappedToId !== undefined) {
      if (edge.toId !== mappedToId) {
        violations.push({
          oracle: "RewriteCorrect",
          message: `edge ${edge.id} toId ${edge.toId} !== rewriteMap ${mappedToId}`,
        });
      }
      continue;
    }

    if (edge.toId !== original.toId) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `edge ${edge.id} toId changed without rewriteMap entry`,
      });
    }
  }

  for (const [edgeId, newToId] of stage4.rewriteMap.entries()) {
    const edge = stage4.edges.find((candidate) => candidate.id === edgeId);
    if (!edge) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `rewriteMap references missing edge id ${edgeId}`,
      });
      continue;
    }
    if (edge.toId !== newToId) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `rewriteMap entry for ${edgeId} does not match edge.toId`,
      });
    }
  }

  for (const edge of stage4.edges) {
    const original = stage3ById.get(edge.id);
    if (!original) {
      continue;
    }
    const beforeRank = resolutionRank(original.toId, symbolIds, moduleIds);
    const afterRank = resolutionRank(edge.toId, symbolIds, moduleIds);
    if (afterRank < beforeRank) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `downgrade on edge ${edge.id}: ${original.toId} -> ${edge.toId}`,
      });
    }
  }

  const oldToNew = new Map<string, string>();
  for (const edge of stage4.edges) {
    const original = stage3ById.get(edge.id);
    if (!original || original.toId === edge.toId) {
      continue;
    }
    const existing = oldToNew.get(original.toId);
    if (existing && existing !== edge.toId) {
      violations.push({
        oracle: "RewriteCorrect",
        message: `inconsistent rewrite for shared toId ${original.toId}`,
      });
    }
    oldToNew.set(original.toId, edge.toId);
  }

  return violations;
}

/** ORACLE D — Stage 4 output must be byte-identical across repeated runs. */
export function assertDeterministic(first: Stage4Result, second: Stage4Result): InvariantViolation[] {
  const violations: InvariantViolation[] = [];

  const firstJson = stableJson({
    edges: first.edges,
    rewriteMap: [...first.rewriteMap.entries()].sort((left, right) => left[0].localeCompare(right[0])),
    report: first.report,
  });
  const secondJson = stableJson({
    edges: second.edges,
    rewriteMap: [...second.rewriteMap.entries()].sort((left, right) => left[0].localeCompare(right[0])),
    report: second.report,
  });

  if (firstJson !== secondJson) {
    violations.push({ oracle: "Deterministic", message: "Stage 4 output differed between two runs" });
  }

  return violations;
}

/** Runs both core oracles and returns all violations. */
export function runCoreOracles(
  stage3: Stage3Result,
  stage4: Stage4Result,
  snapshotBeforeStage4: string
): InvariantViolation[] {
  return [
    ...assertIRFrozen(stage3, stage4, snapshotBeforeStage4),
    ...assertRewriteCorrect(stage3, stage4),
  ];
}
