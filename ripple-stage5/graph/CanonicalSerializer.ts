// Serializes ExecutionDAG into a UTF-8 byte-identical canonical form per Phase 2 contract.
import { CompilerContractViolation } from "../core/Stage5ExecutionError";
import type { OperatorParams } from "../core/OperatorType";
import type { ExecutionDAG, ExecutionDAGEdge, ExecutionDAGNode } from "./GraphTypes";

/** Deterministic string comparator using code-unit ordering. */
export function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/** Sorts DAG nodes by id using deterministic string compare. */
function sortNodes(nodes: readonly ExecutionDAGNode[]): ExecutionDAGNode[] {
  return [...nodes].sort((left, right) => compareStrings(left.id, right.id));
}

/** Sorts DAG edges by id, then from, then to. */
function sortEdges(edges: readonly ExecutionDAGEdge[]): ExecutionDAGEdge[] {
  return [...edges].sort((left, right) => {
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
}

/** Normalizes a param value for canonical JSON encoding; rejects non-finite numbers. */
function normalizeParamValue(value: string | number | boolean): string | number | boolean {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CompilerContractViolation(
        "Canonical serialization rejects NaN and Infinity",
      );
    }
    return value;
  }
  return value;
}

/** Builds a params object with lexicographically sorted keys. */
function canonicalizeParams(params: OperatorParams): Record<string, string | number | boolean> {
  const keys = Object.keys(params).sort(compareStrings);
  const result: Record<string, string | number | boolean> = {};
  for (const key of keys) {
    const value = params[key];
    if (value === undefined) {
      throw new CompilerContractViolation(
        "Canonical serialization rejects missing param values",
      );
    }
    result[key] = normalizeParamValue(value);
  }
  return result;
}

/** Escapes a string for JSON UTF-8 output. */
function escapeJsonString(value: string): string {
  return JSON.stringify(value);
}

/** Serializes a primitive or nested object with encoding rules. */
function serializePrimitive(value: string | number | boolean): string {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new CompilerContractViolation(
        "Canonical serialization rejects NaN and Infinity",
      );
    }
    return String(value);
  }
  return escapeJsonString(value);
}

/** Serializes an object with keys in the provided order (not runtime insertion order). */
function serializeObjectInOrder(
  keys: readonly string[],
  values: Record<string, string | number | boolean | Record<string, string | number | boolean>>,
): string {
  const parts: string[] = [];
  for (const key of keys) {
    const entry = values[key];
    if (entry === undefined) {
      throw new CompilerContractViolation("Canonical serialization rejects missing fields");
    }
    if (typeof entry === "object") {
      const nestedKeys = Object.keys(entry).sort(compareStrings);
      const nested: Record<string, string | number | boolean> = {};
      for (const nestedKey of nestedKeys) {
        const nestedValue = entry[nestedKey];
        if (nestedValue === undefined) {
          throw new CompilerContractViolation(
            "Canonical serialization rejects missing nested fields",
          );
        }
        nested[nestedKey] = nestedValue;
      }
      const nestedParts = nestedKeys.map(
        (nestedKey) =>
          `${escapeJsonString(nestedKey)}:${serializePrimitive(nested[nestedKey] as string | number | boolean)}`,
      );
      parts.push(`${escapeJsonString(key)}:{${nestedParts.join(",")}}`);
    } else {
      parts.push(`${escapeJsonString(key)}:${serializePrimitive(entry)}`);
    }
  }
  return `{${parts.join(",")}}`;
}

/** Produces a UTF-8 canonical JSON string for an ExecutionDAG. */
export function serializeExecutionDAG(dag: ExecutionDAG): string {
  const sortedNodes = sortNodes(dag.nodes);
  const sortedEdges = sortEdges(dag.edges);

  const gsidObject = serializeObjectInOrder(
    ["commitHash", "id", "schemaVersion", "timestamp"],
    {
      commitHash: dag.gsid.commitHash,
      id: dag.gsid.id,
      schemaVersion: dag.gsid.schemaVersion,
      timestamp: dag.gsid.timestamp,
    },
  );

  const edgeObjects = sortedEdges.map((edge) =>
    serializeObjectInOrder(["from", "id", "to"], {
      from: edge.from,
      id: edge.id,
      to: edge.to,
    }),
  );

  const nodeObjects = sortedNodes.map((node) => {
    const params = canonicalizeParams(node.params);
    const paramKeys = Object.keys(params).sort(compareStrings);
    const paramParts = paramKeys.map(
      (key) => `${escapeJsonString(key)}:${serializePrimitive(params[key] as string | number | boolean)}`,
    );
    return `{"id":${escapeJsonString(node.id)},"operation":${escapeJsonString(node.operation)},"params":{${paramParts.join(",")}}}`;
  });

  return `{"gsid":${gsidObject},"edges":[${edgeObjects.join(",")}],"nodes":[${nodeObjects.join(",")}]}`;
}

/** Returns UTF-8 bytes of the canonical DAG serialization for byte-identity comparison. */
export function serializeExecutionDAGBytes(dag: ExecutionDAG): Buffer {
  return Buffer.from(serializeExecutionDAG(dag), "utf8");
}
