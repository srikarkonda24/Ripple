// Dispatches ExecutionDAG operators and realizes graph computation into an ExecutionTrace.
import type { SnapshotMaterial } from "../../core/CompilerInput";
import type { ExecutionTrace } from "../../core/ExecutionTrace";
import type { Query } from "../../core/Query";
import { ExecutorFidelityFailure } from "../../core/Stage5ExecutionError";
import type { ExecutionDAG, ExecutionDAGNode } from "../../graph/GraphTypes";
import { computeHops, topologicalNodeOrder } from "../dagOrdering";
import { buildRuntimeAdjacency } from "./adjacency";
import { edgeFilterForQueryType, filterEdges } from "./edgeFilters";
import { dfsTraverse } from "./dfsTraversal";
import { findFirstCanonicalPath } from "./pathResolution";

type DispatchState = {
  focusNodeId: string;
  queryType: Query["type"] | null;
  visitedNodes: string[];
  visitedEdges: string[];
};

/** Reads a required string param from an operator node. */
function requireStringParam(node: ExecutionDAGNode, key: string): string {
  const value = node.params[key];
  if (typeof value !== "string") {
    throw new ExecutorFidelityFailure(
      `Operator ${node.id} missing string param "${key}"`,
    );
  }
  return value;
}

/** Reads a required number param from an operator node. */
function requireNumberParam(node: ExecutionDAGNode, key: string): number {
  const value = node.params[key];
  if (typeof value !== "number") {
    throw new ExecutorFidelityFailure(
      `Operator ${node.id} missing number param "${key}"`,
    );
  }
  return value;
}

/** Parses queryType param into a Query type. */
function parseQueryType(value: string): Query["type"] {
  if (
    value === "CALLERS" ||
    value === "DEPENDENCIES" ||
    value === "PATH" ||
    value === "REFERENCES" ||
    value === "IMPACT"
  ) {
    return value;
  }
  throw new ExecutorFidelityFailure(`Invalid queryType param: ${value}`);
}

/** Realizes all operators in topological order against the immutable snapshot. */
export function dispatchOperators(
  dag: ExecutionDAG,
  snapshot: SnapshotMaterial,
): ExecutionTrace {
  const adjacency = buildRuntimeAdjacency(snapshot);
  const order = topologicalNodeOrder(dag);
  const nodeById = new Map(dag.nodes.map((node) => [node.id, node]));

  const state: DispatchState = {
    focusNodeId: "",
    queryType: null,
    visitedNodes: [],
    visitedEdges: [],
  };

  for (const nodeId of order) {
    const node = nodeById.get(nodeId);
    if (node === undefined) {
      throw new ExecutorFidelityFailure(`Missing DAG node: ${nodeId}`);
    }

    switch (node.operation) {
      case "RESOLVE_TARGET": {
        const targetId = requireStringParam(node, "targetId");
        const exists = snapshot.nodes.some((n) => n.id === targetId);
        if (!exists) {
          throw new ExecutorFidelityFailure(
            `RESOLVE_TARGET failed: node "${targetId}" not in snapshot`,
          );
        }
        state.focusNodeId = targetId;
        if (!state.visitedNodes.includes(targetId)) {
          state.visitedNodes.push(targetId);
        }
        break;
      }
      case "FILTER_EDGES": {
        const queryType = parseQueryType(requireStringParam(node, "queryType"));
        state.queryType = queryType;
        if (queryType !== "PATH") {
          const filtered = filterEdges(snapshot.edges, state.focusNodeId, queryType);
          for (const edge of filtered) {
            if (!state.visitedEdges.includes(edge.id)) {
              state.visitedEdges.push(edge.id);
            }
          }
        }
        break;
      }
      case "TRAVERSE": {
        const startNodeId = requireStringParam(node, "startNodeId");
        const maxDepth = requireNumberParam(node, "maxDepth");
        const queryType = state.queryType;
        if (queryType === null) {
          throw new ExecutorFidelityFailure("TRAVERSE requires prior FILTER_EDGES");
        }
        const spec = edgeFilterForQueryType(queryType);
        const walkDirection =
          spec.direction === "IN" ? "IN" : spec.direction === "BOTH" ? "BOTH" : "OUT";
        const allowedTypes =
          spec.direction === "ALL" ? null : spec.allowedTypes;

        const result = dfsTraverse(
          adjacency,
          startNodeId,
          maxDepth,
          walkDirection,
          allowedTypes,
        );

        state.visitedNodes = result.visitedNodes;
        state.visitedEdges = result.visitedEdges;
        break;
      }
      case "SELECT_PATH": {
        const sourceId = requireStringParam(node, "sourceId");
        const targetId = requireStringParam(node, "targetId");
        const path = findFirstCanonicalPath(adjacency, sourceId, targetId, 15);
        state.visitedNodes = path.pathNodes;
        state.visitedEdges = path.pathEdges;
        break;
      }
      case "EMIT": {
        break;
      }
      default: {
        const exhaustive: never = node.operation;
        throw new ExecutorFidelityFailure(
          `Unknown operator: ${String(exhaustive)}`,
        );
      }
    }
  }

  return {
    visitedNodes: state.visitedNodes,
    visitedEdges: state.visitedEdges,
    hops: computeHops(state.visitedNodes.length),
  };
}
