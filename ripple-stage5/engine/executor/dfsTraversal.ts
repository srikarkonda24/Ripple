// Performs deterministic DFS traversal over filtered snapshot edges (executor-only).
import type { Edge } from "../../snapshot/Edge";
import type { RuntimeAdjacency } from "./adjacency";
import { sortEdgesCanonical } from "./adjacency";

export type TraversalResult = {
  readonly visitedNodes: string[];
  readonly visitedEdges: string[];
};

/** Collects candidate edges from adjacency for a node given direction of walk. */
function candidateEdges(
  adjacency: RuntimeAdjacency,
  nodeId: string,
  walkDirection: "OUT" | "IN" | "BOTH",
  allowedTypes: ReadonlySet<string> | null,
): Edge[] {
  const collected: Edge[] = [];

  if (walkDirection === "OUT" || walkDirection === "BOTH") {
    for (const edge of adjacency.outgoing.get(nodeId) ?? []) {
      if (allowedTypes === null || allowedTypes.has(edge.type)) {
        collected.push(edge);
      }
    }
  }
  if (walkDirection === "IN" || walkDirection === "BOTH") {
    for (const edge of adjacency.incoming.get(nodeId) ?? []) {
      if (allowedTypes === null || allowedTypes.has(edge.type)) {
        collected.push(edge);
      }
    }
  }

  return sortEdgesCanonical(collected);
}

/** Neighbor node reached by following an edge from the current node. */
function neighborOf(edge: Edge, currentNodeId: string): string {
  if (edge.from === currentNodeId) {
    return edge.to;
  }
  return edge.from;
}

/**
 * Deterministic DFS from startNodeId.
 * Visited nodes use Set; multi-edges preserved; maxDepth hops from start.
 */
export function dfsTraverse(
  adjacency: RuntimeAdjacency,
  startNodeId: string,
  maxDepth: number,
  walkDirection: "OUT" | "IN" | "BOTH",
  allowedTypes: ReadonlySet<string> | null,
): TraversalResult {
  const visitedNodes: string[] = [];
  const visitedEdges: string[] = [];
  const seenNodes = new Set<string>();
  const seenEdges = new Set<string>();

  function visit(nodeId: string, depth: number): void {
    if (seenNodes.has(nodeId)) {
      return;
    }
    seenNodes.add(nodeId);
    visitedNodes.push(nodeId);

    if (depth >= maxDepth) {
      return;
    }

    for (const edge of candidateEdges(adjacency, nodeId, walkDirection, allowedTypes)) {
      if (seenEdges.has(edge.id)) {
        continue;
      }
      seenEdges.add(edge.id);
      visitedEdges.push(edge.id);
      visit(neighborOf(edge, nodeId), depth + 1);
    }
  }

  visit(startNodeId, 0);

  return { visitedNodes, visitedEdges };
}
