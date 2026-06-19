// Computes Stage 4 graph health metrics from final edges and resolution traces.
/// <reference path="../../../ripple-core/schema.ts" />
/// <reference path="../../../ripple-core/interfaces/resolverTypes.ts" />

import type { Stage3Result } from "../stage3/types";
import type { Stage4Report } from "./types";

function isResolvedInternal(toId: ID, symbolIndex: SymbolIndex): boolean {
  if (symbolIndex.symbolsById.has(toId)) {
    return true;
  }
  for (const moduleId of symbolIndex.moduleSymbolIdByPath.values()) {
    if (moduleId === toId) {
      return true;
    }
  }
  return false;
}

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

function findSpecifierForImportsEdge(
  edge: Edge,
  stage3: Stage3Result
): string | null {
  if (edge.type !== "IMPORTS") {
    return null;
  }
  const fileNode = stage3.files.find((file) => file.id === edge.fromId);
  if (!fileNode) {
    return null;
  }
  const importGroup = stage3.resolutionSnapshot.imports.find(
    (group) => group.filePath === fileNode.path
  );
  if (!importGroup) {
    return null;
  }
  const context = edge.context ?? "";
  for (const binding of importGroup.bindings) {
    if (importContext(binding) === context) {
      return binding.specifier;
    }
  }
  return null;
}

function isExternalSpecifier(specifier: string): boolean {
  return !specifier.startsWith(".") && !specifier.startsWith("@/");
}

/** Builds aggregate edge health metrics for one Stage 4 run. */
export function buildGraphMetrics(input: {
  stage3: Stage3Result;
  edges: readonly Edge[];
  symbolIndex: SymbolIndex;
  report: Stage4Report;
}): Stage4GraphMetrics {
  let resolvedEdges = 0;
  let unresolvedEdges = 0;
  let externalEdges = 0;

  for (const edge of input.edges) {
    if (isResolvedInternal(edge.toId, input.symbolIndex)) {
      resolvedEdges++;
      continue;
    }

    const specifier = findSpecifierForImportsEdge(edge, input.stage3);
    if (specifier && isExternalSpecifier(specifier)) {
      externalEdges++;
      continue;
    }

    unresolvedEdges++;
  }

  const aliasTraces = input.report.resolutionTrace.filter((trace) =>
    trace.specifier.startsWith("@/")
  );
  const aliasBindings = aliasTraces.length;
  const aliasUpgraded = aliasTraces.filter((trace) => trace.upgradeApplied).length;

  return {
    resolvedEdges,
    unresolvedEdges,
    externalEdges,
    aliasBindings,
    aliasUpgraded,
    aliasSuccessRate: aliasBindings === 0 ? 1 : aliasUpgraded / aliasBindings,
  };
}
