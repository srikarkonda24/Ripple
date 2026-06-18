// Sole producer of Stage 2 edges; consumes NormalizedFileUnit data only and never parses source.
/// <reference path="../../../ripple-core/schema.ts" />

import { findCalledNames } from "./callsMatcher";
import { resolveImportTarget } from "./resolveImport";
import { buildEdgeId } from "./symbolId";
import type { NormalizedFileUnit } from "./types";

const ZERO_CREATED_AT = 0;

interface EdgeAccumulator {
  edgesByKey: Map<string, Edge>;
  callsBySymbol: Map<string, Set<string>>;
  referencedBySymbol: Map<string, Set<string>>;
}

function addEdge(
  accumulator: EdgeAccumulator,
  projectId: string,
  fromId: string,
  toId: string,
  type: EdgeType,
  context: string
): void {
  const key = `${fromId}:${toId}:${type}:${context}`;
  if (accumulator.edgesByKey.has(key)) {
    return;
  }
  const edge: Edge = {
    id: buildEdgeId(fromId, toId, type, context),
    projectId,
    fromId,
    toId,
    type,
    createdAt: ZERO_CREATED_AT,
  };
  if (context.length > 0) {
    edge.context = context;
  }
  accumulator.edgesByKey.set(key, edge);
}

function buildContainsEdges(
  unit: NormalizedFileUnit,
  accumulator: EdgeAccumulator
): void {
  const classNameToId = new Map<string, string>();
  for (const symbol of unit.symbols) {
    if (symbol.type === "class") {
      if (!classNameToId.has(symbol.name)) {
        classNameToId.set(symbol.name, symbol.id);
      }
    }
  }

  for (const symbol of unit.symbols) {
    const parentClassName = unit.parentClassNameBySymbolId[symbol.id];
    const parentClassId = parentClassName
      ? classNameToId.get(parentClassName)
      : undefined;

    if (parentClassId && parentClassId !== symbol.id) {
      addEdge(accumulator, unit.projectId, parentClassId, symbol.id, "CONTAINS", "");
    } else {
      addEdge(accumulator, unit.projectId, unit.fileId, symbol.id, "CONTAINS", "");
    }
  }
}

function buildDependsOnEdges(
  unit: NormalizedFileUnit,
  repoFilePaths: Set<string>,
  contentHashByPath: Map<string, string>,
  accumulator: EdgeAccumulator
): void {
  for (const parsedImport of unit.imports) {
    const resolution = resolveImportTarget(
      unit.filePath,
      parsedImport.normalizedSpecifier,
      repoFilePaths,
      contentHashByPath
    );
    addEdge(
      accumulator,
      unit.projectId,
      unit.fileId,
      resolution.toId,
      "DEPENDS_ON",
      parsedImport.normalizedSpecifier
    );
  }
}

function buildCallsEdges(
  unit: NormalizedFileUnit,
  accumulator: EdgeAccumulator
): void {
  const importedNames = new Set(unit.importedNames);
  const eligible = unit.symbols
    .filter(
      (symbol) =>
        !unit.syntheticSymbolIds.has(symbol.id) && symbol.type !== "module"
    )
    .sort((left, right) => left.id.localeCompare(right.id));

  const nameToId = new Map<string, string>();
  for (const symbol of eligible) {
    if (importedNames.has(symbol.name)) {
      continue;
    }
    if (!nameToId.has(symbol.name)) {
      nameToId.set(symbol.name, symbol.id);
    }
  }

  const candidateNames = Array.from(nameToId.keys());
  if (candidateNames.length === 0) {
    return;
  }

  for (const caller of eligible) {
    const body = unit.bodyTextBySymbolId[caller.id] ?? "";
    if (body.length === 0) {
      continue;
    }
    const calledNames = findCalledNames(body, candidateNames);
    for (const name of calledNames) {
      const calleeId = nameToId.get(name);
      if (!calleeId || calleeId === caller.id) {
        continue;
      }
      addEdge(accumulator, unit.projectId, caller.id, calleeId, "CALLS", "");

      if (!accumulator.callsBySymbol.has(caller.id)) {
        accumulator.callsBySymbol.set(caller.id, new Set());
      }
      accumulator.callsBySymbol.get(caller.id)?.add(calleeId);

      if (!accumulator.referencedBySymbol.has(calleeId)) {
        accumulator.referencedBySymbol.set(calleeId, new Set());
      }
      accumulator.referencedBySymbol.get(calleeId)?.add(caller.id);
    }
  }
}

export function buildEdges(
  units: NormalizedFileUnit[],
  repoFilePaths: Set<string>,
  contentHashByPath: Map<string, string>
): Edge[] {
  const accumulator: EdgeAccumulator = {
    edgesByKey: new Map(),
    callsBySymbol: new Map(),
    referencedBySymbol: new Map(),
  };

  for (const unit of units) {
    buildContainsEdges(unit, accumulator);
    buildDependsOnEdges(unit, repoFilePaths, contentHashByPath, accumulator);
    buildCallsEdges(unit, accumulator);
  }

  for (const unit of units) {
    for (const symbol of unit.symbols) {
      const calls = accumulator.callsBySymbol.get(symbol.id);
      const referencedBy = accumulator.referencedBySymbol.get(symbol.id);
      if (calls) {
        symbol.calls = Array.from(calls).sort((left, right) =>
          left.localeCompare(right)
        );
      }
      if (referencedBy) {
        symbol.referencedBy = Array.from(referencedBy).sort((left, right) =>
          left.localeCompare(right)
        );
      }
    }
  }

  return Array.from(accumulator.edgesByKey.values());
}
