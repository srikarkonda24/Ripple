// Executes frozen Query-type edge filters against snapshot edges at runtime.
import type { Query } from "../../core/Query";
import type { Edge } from "../../snapshot/Edge";
import { ExecutorFidelityFailure } from "../../core/Stage5ExecutionError";
import { sortEdgesCanonical } from "./adjacency";

export type EdgeFilterSpec = {
  readonly allowedTypes: ReadonlySet<string>;
  readonly direction: "IN" | "OUT" | "BOTH" | "ALL";
};

/** Returns the frozen 1A edge filter specification for a query type. */
export function edgeFilterForQueryType(queryType: Query["type"]): EdgeFilterSpec {
  switch (queryType) {
    case "CALLERS":
      return { allowedTypes: new Set(["CALLS"]), direction: "IN" };
    case "DEPENDENCIES":
      return {
        allowedTypes: new Set(["IMPORTS", "CALLS", "DEPENDS_ON"]),
        direction: "OUT",
      };
    case "REFERENCES":
      return { allowedTypes: new Set(["REFERENCES"]), direction: "BOTH" };
    case "IMPACT":
      return {
        allowedTypes: new Set(["CALLS", "DEPENDS_ON", "REFERENCES"]),
        direction: "OUT",
      };
    case "PATH":
      return { allowedTypes: new Set(), direction: "ALL" };
    default: {
      const exhaustive: never = queryType;
      throw new ExecutorFidelityFailure(`Unknown query type: ${String(exhaustive)}`);
    }
  }
}

/** Filters edges by type and direction relative to a focus node. */
export function filterEdges(
  edges: readonly Edge[],
  focusNodeId: string,
  queryType: Query["type"],
): Edge[] {
  const spec = edgeFilterForQueryType(queryType);
  const matched: Edge[] = [];

  for (const edge of edges) {
    if (spec.direction === "ALL") {
      matched.push(edge);
      continue;
    }
    if (!spec.allowedTypes.has(edge.type)) {
      continue;
    }
    if (spec.direction === "OUT" && edge.from === focusNodeId) {
      matched.push(edge);
    } else if (spec.direction === "IN" && edge.to === focusNodeId) {
      matched.push(edge);
    } else if (
      spec.direction === "BOTH" &&
      (edge.from === focusNodeId || edge.to === focusNodeId)
    ) {
      matched.push(edge);
    }
  }

  return sortEdgesCanonical(matched);
}
