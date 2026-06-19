// Validates Stage 3 output invariants before returning a graph result.
/// <reference path="../../../ripple-core/schema.ts" />

function assertSorted(values: string[], label: string): void {
  for (let index = 1; index < values.length; index++) {
    if (values[index - 1].localeCompare(values[index]) > 0) {
      throw new Error(`${label} is not sorted`);
    }
  }
}

export function validateStage3Output(
  files: FileNode[],
  symbols: CodeSymbol[],
  edges: Edge[],
  stage2Edges: Edge[]
): void {
  assertSorted(files.map((file) => file.path), "files");
  assertSorted(
    edges.map((edge) => `${edge.fromId}:${edge.toId}:${edge.type}:${edge.context ?? ""}`),
    "edges"
  );

  const edgeIds = new Set(edges.map((edge) => edge.id));
  for (const edge of stage2Edges) {
    if (!edgeIds.has(edge.id)) {
      throw new Error(`Stage 3 output dropped Stage 2 edge: ${edge.id}`);
    }
  }

  const symbolIdsByPath = new Map<string, string[]>();
  for (const symbol of symbols) {
    if (!symbolIdsByPath.has(symbol.filePath)) {
      symbolIdsByPath.set(symbol.filePath, []);
    }
    symbolIdsByPath.get(symbol.filePath)?.push(symbol.id);
    assertSorted(symbol.calls, `calls for ${symbol.id}`);
    assertSorted(symbol.referencedBy, `referencedBy for ${symbol.id}`);
  }

  for (const file of files) {
    const expected = (symbolIdsByPath.get(file.path) ?? []).sort((left, right) =>
      left.localeCompare(right)
    );
    if (expected.join("\n") !== file.symbols.join("\n")) {
      throw new Error(`File symbols do not match symbols for ${file.path}`);
    }
  }
}
