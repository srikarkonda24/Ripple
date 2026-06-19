// Finalizes Stage 3 graph output by sorting, enriching adjacency arrays, and linking files to symbols.
/// <reference path="../../../ripple-core/schema.ts" />

import { sortEdges, sortFileNodes, sortSymbols } from "../stage2/sorter";

function sortIds(ids: Iterable<string>): string[] {
  return Array.from(ids).sort((left, right) => left.localeCompare(right));
}

export function populateFileSymbols(
  files: FileNode[],
  symbols: CodeSymbol[]
): FileNode[] {
  const symbolsByFilePath = new Map<string, Set<string>>();
  for (const symbol of symbols) {
    if (!symbolsByFilePath.has(symbol.filePath)) {
      symbolsByFilePath.set(symbol.filePath, new Set());
    }
    symbolsByFilePath.get(symbol.filePath)?.add(symbol.id);
  }

  return sortFileNodes(files).map((file) => ({
    ...file,
    symbols: sortIds(symbolsByFilePath.get(file.path) ?? []),
  }));
}

export function enrichSymbolsWithEdges(
  symbols: CodeSymbol[],
  edges: Edge[]
): CodeSymbol[] {
  const callsBySymbol = new Map<string, Set<string>>();
  const referencedBySymbol = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (edge.type === "CALLS") {
      if (!callsBySymbol.has(edge.fromId)) {
        callsBySymbol.set(edge.fromId, new Set());
      }
      callsBySymbol.get(edge.fromId)?.add(edge.toId);
      if (!referencedBySymbol.has(edge.toId)) {
        referencedBySymbol.set(edge.toId, new Set());
      }
      referencedBySymbol.get(edge.toId)?.add(edge.fromId);
    }
    if (edge.type === "REFERENCES") {
      if (!referencedBySymbol.has(edge.toId)) {
        referencedBySymbol.set(edge.toId, new Set());
      }
      referencedBySymbol.get(edge.toId)?.add(edge.fromId);
    }
  }

  return sortSymbols(
    symbols.map((symbol) => ({
      ...symbol,
      calls: sortIds(callsBySymbol.get(symbol.id) ?? []),
      referencedBy: sortIds(referencedBySymbol.get(symbol.id) ?? []),
    }))
  );
}

export function finalizeEdges(edges: Iterable<Edge>): Edge[] {
  return sortEdges(Array.from(edges));
}
