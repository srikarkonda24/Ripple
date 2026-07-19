// Emits a structural intent-only ExecutionDAG from Query and SnapshotMaterial.
import type { CompilerInput } from "../../core/CompilerInput";
import { CompilerContractViolation } from "../../core/Stage5ExecutionError";
import type {
  ExecutionDAG,
  ExecutionDAGEdge,
  ExecutionDAGNode,
} from "../../graph/GraphTypes";
import { assertEvidMatches } from "./evidValidation";
import { assertNodeExists } from "./referenceResolution";

/** Builds a dependency-constraint DAG for the given query type. */
export function structuralCompile(input: CompilerInput): ExecutionDAG {
  const { query, snapshot } = input;

  assertEvidMatches(query.evid);
  assertNodeExists(snapshot, query.target, "target");

  if (query.type === "PATH") {
    if (query.source === undefined || query.source === "") {
      throw new CompilerContractViolation(
        "PATH query requires query.source",
      );
    }
    assertNodeExists(snapshot, query.source, "source");
  }

  const nodes: ExecutionDAGNode[] = [];
  const edges: ExecutionDAGEdge[] = [];

  const resolveId = "op-resolve";
  const filterId = "op-filter";
  const graphOpId = "op-graph";
  const emitId = "op-emit";

  nodes.push({
    id: resolveId,
    operation: "RESOLVE_TARGET",
    params: { targetId: query.target },
  });

  nodes.push({
    id: filterId,
    operation: "FILTER_EDGES",
    params: { queryType: query.type },
  });

  if (query.type === "PATH") {
    nodes.push({
      id: graphOpId,
      operation: "SELECT_PATH",
      params: {
        sourceId: query.source as string,
        targetId: query.target,
      },
    });
  } else {
    nodes.push({
      id: graphOpId,
      operation: "TRAVERSE",
      params: {
        startNodeId: query.target,
        maxDepth: 15,
      },
    });
  }

  nodes.push({
    id: emitId,
    operation: "EMIT",
    params: { queryType: query.type },
  });

  edges.push({ id: "dep-resolve-filter", from: resolveId, to: filterId });
  edges.push({ id: "dep-filter-graph", from: filterId, to: graphOpId });
  edges.push({ id: "dep-graph-emit", from: graphOpId, to: emitId });

  return {
    gsid: query.gsid,
    nodes,
    edges,
  };
}
