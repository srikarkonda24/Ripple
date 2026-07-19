// Defines the ordered record of nodes and edges visited during deterministic execution.
export type ExecutionTrace = {
  visitedNodes: string[];
  visitedEdges: string[];
  hops: number;
};
