// Builds the Stage 4 EdgeRewriteMap via two-pass resolver adapter calls over Stage 3 snapshot data.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import { resolveImportBindingWithDiagnostics } from "../../../adapters/typescript/resolver/symbolRules";
import type { Stage3Result } from "../stage3/types";
import type { Stage4Report } from "./types";

function importContext(binding: SnapshotImportBinding): string {
  if (binding.kind === "side-effect") {
    return "side-effect";
  }
  if (binding.kind === "namespace") {
    return `namespace:${binding.localName}`;
  }
  if (binding.kind === "default") {
    return "default";
  }
  return `named:${binding.localName}`;
}

function resolutionRank(kind: ResolutionKind): number {
  if (kind === "resolved") {
    return 3;
  }
  if (kind === "external") {
    return 2;
  }
  return 1;
}

function isTargetUpgrade(
  currentKind: ResolutionKind,
  nextKind: ResolutionKind,
  currentToId: ID,
  nextToId: ID,
  symbolIndex: SymbolIndex
): boolean {
  if (currentToId === nextToId) {
    return false;
  }

  const nextInferredKind = inferResolutionKind(nextToId, symbolIndex);
  const effectiveNextKind =
    resolutionRank(nextInferredKind) < resolutionRank(nextKind)
      ? nextInferredKind
      : nextKind;

  if (resolutionRank(effectiveNextKind) <= resolutionRank(currentKind)) {
    return false;
  }

  return true;
}

function inferResolutionKind(toId: ID, symbolIndex: SymbolIndex): ResolutionKind {
  if (symbolIndex.symbolsById.has(toId)) {
    return "resolved";
  }
  for (const moduleId of symbolIndex.moduleSymbolIdByPath.values()) {
    if (moduleId === toId) {
      return "resolved";
    }
  }
  return "unresolved";
}

function findImportsEdgeToId(
  stage3: Stage3Result,
  filePath: string,
  binding: SnapshotImportBinding
): ID | null {
  const fileNode = stage3.files.find((file) => file.path === filePath);
  if (!fileNode) {
    return null;
  }
  const context = importContext(binding);
  const edge = stage3.edges.find(
    (candidate) =>
      candidate.fromId === fileNode.id &&
      candidate.type === "IMPORTS" &&
      (candidate.context ?? "") === context
  );
  return edge?.toId ?? null;
}

function buildTargetUpgrades(input: {
  stage3: Stage3Result;
  resolverContext: ResolverContext;
  report: Stage4Report;
}): Map<ID, ID> {
  const targetUpgrades = new Map<ID, ID>();

  for (const importGroup of input.stage3.resolutionSnapshot.imports) {
    for (const binding of importGroup.bindings) {
      const currentToId = findImportsEdgeToId(input.stage3, importGroup.filePath, binding);
      const { result: resolved, diagnostics } = resolveImportBindingWithDiagnostics(
        importGroup.filePath,
        binding,
        input.resolverContext
      );

      const traceEntry: ResolutionDecisionTrace = {
        ...diagnostics,
        currentToId: currentToId ?? "",
        resolvedToId: resolved.toId,
        resolvedKind: resolved.kind,
        upgradeApplied: false,
      };

      if (!currentToId) {
        traceEntry.skipReason = "no_imports_edge";
        input.report.resolutionTrace.push(traceEntry);
        continue;
      }

      const currentKind = inferResolutionKind(
        currentToId,
        input.resolverContext.symbolIndex
      );

      if (
        !isTargetUpgrade(
          currentKind,
          resolved.kind,
          currentToId,
          resolved.toId,
          input.resolverContext.symbolIndex
        )
      ) {
        traceEntry.skipReason =
          currentToId === resolved.toId ? "same_target" : "not_an_upgrade";
        input.report.resolutionTrace.push(traceEntry);
        continue;
      }

      targetUpgrades.set(currentToId, resolved.toId);
      traceEntry.upgradeApplied = true;
      input.report.resolutionTrace.push(traceEntry);

      input.report.summary.importsUpgraded++;
      input.report.upgradedTargets.push({
        fromToId: currentToId,
        toToId: resolved.toId,
        filePath: importGroup.filePath,
        specifier: binding.specifier,
      });

      if (binding.specifier.startsWith("@/")) {
        input.report.summary.aliasesResolved++;
      }
      if (resolved.kind === "external") {
        input.report.summary.externalClassified++;
      }
      if (resolved.kind === "unresolved") {
        input.report.summary.stillUnresolved++;
      }
    }
  }

  return targetUpgrades;
}

function applyTransitiveTargetUpgrades(targetUpgrades: Map<ID, ID>): Map<ID, ID> {
  let changed = true;
  while (changed) {
    changed = false;
    for (const [oldToId, newToId] of targetUpgrades.entries()) {
      const chained = targetUpgrades.get(newToId);
      if (chained && chained !== newToId) {
        targetUpgrades.set(oldToId, chained);
        changed = true;
      }
    }
  }
  return targetUpgrades;
}

function buildRewriteTrace(input: {
  stage3: Stage3Result;
  rewriteMap: EdgeRewriteMap;
  report: Stage4Report;
}): EdgeRewriteTrace[] {
  const upgradeByFromToId = new Map(
    input.report.upgradedTargets.map((target) => [
      target.fromToId,
      { filePath: target.filePath, specifier: target.specifier },
    ])
  );

  const traces: EdgeRewriteTrace[] = [];
  for (const [edgeId, afterToId] of input.rewriteMap.entries()) {
    const edge = input.stage3.edges.find((candidate) => candidate.id === edgeId);
    if (!edge) {
      continue;
    }
    const upgradeMeta = upgradeByFromToId.get(edge.toId);
    traces.push({
      edgeId,
      edgeType: edge.type,
      fromId: edge.fromId,
      before: edge.toId,
      after: afterToId,
      filePath: upgradeMeta?.filePath,
      specifier: upgradeMeta?.specifier,
      rule: upgradeMeta ? "target_upgrade" : "transitive_target_upgrade",
    });
  }

  traces.sort((left, right) => left.edgeId.localeCompare(right.edgeId));
  return traces;
}

/** Produces the Stage 4 rewrite map by comparing adapter resolution against Stage 3 edge targets. */
export function resolveGraph(input: {
  stage3: Stage3Result;
  resolver: ResolverAdapter;
  resolverContext: ResolverContext;
  report: Stage4Report;
}): EdgeRewriteMap {
  const targetUpgrades = applyTransitiveTargetUpgrades(
    buildTargetUpgrades(input)
  );
  const rewriteMap: EdgeRewriteMap = new Map();

  for (const edge of input.stage3.edges) {
    const upgradedToId = targetUpgrades.get(edge.toId);
    if (upgradedToId && upgradedToId !== edge.toId) {
      rewriteMap.set(edge.id, upgradedToId);
    }
  }

  input.report.rewriteTrace = buildRewriteTrace({
    stage3: input.stage3,
    rewriteMap,
    report: input.report,
  });
  input.report.resolutionTrace.sort((left, right) => {
    const fileCompare = left.filePath.localeCompare(right.filePath);
    if (fileCompare !== 0) {
      return fileCompare;
    }
    return left.specifier.localeCompare(right.specifier);
  });

  return rewriteMap;
}
