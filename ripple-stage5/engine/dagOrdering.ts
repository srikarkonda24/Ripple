// Performs deterministic topological ordering of ExecutionDAG nodes with cycle detection.
import { ExecutorFidelityFailure } from "../core/Stage5ExecutionError";
import { compareStrings } from "../graph/CanonicalSerializer";
import type { ExecutionDAG } from "../graph/GraphTypes";

/** Returns node ids in deterministic topological order; throws on cycles or missing nodes. */
export function topologicalNodeOrder(dag: ExecutionDAG): string[] {
  const nodeIds = new Set(dag.nodes.map((node) => node.id));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const nodeId of nodeIds) {
    inDegree.set(nodeId, 0);
    adjacency.set(nodeId, []);
  }

  for (const edge of dag.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new ExecutorFidelityFailure(
        `ExecutionDAG edge references unknown node: ${edge.id}`,
      );
    }
    adjacency.get(edge.from)?.push(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }

  for (const [nodeId, neighbors] of adjacency.entries()) {
    neighbors.sort(compareStrings);
    adjacency.set(nodeId, neighbors);
  }

  const ready: string[] = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      ready.push(nodeId);
    }
  }
  ready.sort(compareStrings);

  const ordered: string[] = [];

  while (ready.length > 0) {
    const current = ready.shift();
    if (current === undefined) {
      break;
    }
    ordered.push(current);

    for (const neighbor of adjacency.get(current) ?? []) {
      const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        ready.push(neighbor);
        ready.sort(compareStrings);
      }
    }
  }

  if (ordered.length !== nodeIds.size) {
    throw new ExecutorFidelityFailure("ExecutionDAG contains a cycle");
  }

  return ordered;
}

/** Returns edge ids in deterministic order. */
export function orderedEdgeIds(dag: ExecutionDAG): string[] {
  const sortedEdges = [...dag.edges].sort((left, right) => {
    const byId = compareStrings(left.id, right.id);
    if (byId !== 0) {
      return byId;
    }
    const byFrom = compareStrings(left.from, right.from);
    if (byFrom !== 0) {
      return byFrom;
    }
    return compareStrings(left.to, right.to);
  });

  return sortedEdges.map((edge) => edge.id);
}

/** Computes hop count as the number of nodes visited minus one, minimum zero. */
export function computeHops(visitedNodeCount: number): number {
  if (visitedNodeCount <= 0) {
    return 0;
  }
  return visitedNodeCount - 1;
}
