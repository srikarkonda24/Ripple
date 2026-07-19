// Stores GSID-bound adjacency list input material without execution semantics.
import type { Edge } from "./Edge";

export type AdjacencyList = {
  readonly outgoing: Readonly<Record<string, readonly Edge[]>>;
};

/** Builds an adjacency list from snapshot edges grouped by source node id. */
export function buildAdjacencyList(edges: readonly Edge[]): AdjacencyList {
  const outgoing: Record<string, Edge[]> = {};

  const sortedEdges = [...edges].sort((left, right) => {
    const byType = left.type.localeCompare(right.type);
    if (byType !== 0) {
      return byType;
    }
    return left.id.localeCompare(right.id);
  });

  for (const edge of sortedEdges) {
    if (!outgoing[edge.from]) {
      outgoing[edge.from] = [];
    }
    outgoing[edge.from].push(edge);
  }

  return { outgoing };
}
