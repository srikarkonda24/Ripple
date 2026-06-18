// Deterministic ordering helpers for files, symbols, edges, and imports.
/// <reference path="../../../ripple-core/schema.ts" />

export function sortFileNodes<T extends { path: string }>(files: T[]): T[] {
  return [...files].sort((left, right) => left.path.localeCompare(right.path));
}

export function sortSymbols(symbols: CodeSymbol[]): CodeSymbol[] {
  return [...symbols].sort((left, right) => {
    const pathCompare = left.filePath.localeCompare(right.filePath);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    const lineCompare = (left.startLine ?? 0) - (right.startLine ?? 0);
    if (lineCompare !== 0) {
      return lineCompare;
    }
    const nameCompare = left.name.localeCompare(right.name);
    if (nameCompare !== 0) {
      return nameCompare;
    }
    return left.type.localeCompare(right.type);
  });
}

export function sortEdges(edges: Edge[]): Edge[] {
  return [...edges].sort((left, right) => {
    const fromCompare = left.fromId.localeCompare(right.fromId);
    if (fromCompare !== 0) {
      return fromCompare;
    }
    const toCompare = left.toId.localeCompare(right.toId);
    if (toCompare !== 0) {
      return toCompare;
    }
    const typeCompare = left.type.localeCompare(right.type);
    if (typeCompare !== 0) {
      return typeCompare;
    }
    return (left.context ?? "").localeCompare(right.context ?? "");
  });
}

export function sortImports<T extends { normalizedSpecifier: string }>(items: T[]): T[] {
  return [...items].sort((left, right) =>
    left.normalizedSpecifier.localeCompare(right.normalizedSpecifier)
  );
}
