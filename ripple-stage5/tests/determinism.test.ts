// Validates deterministic serialization and full-pipeline determinism for Phase 2.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GSID } from "../core/GSID";
import { GSIDValidationFailure } from "../core/Stage5ExecutionError";
import { REGISTERED_EVID } from "../engine/compiler/compilerEvid";
import { structuralQueryCompiler } from "../engine/QueryCompilerImpl";
import { deterministicExecutionEngine } from "../engine/ExecutionEngineImpl";
import {
  serializeExecutionDAG,
  serializeExecutionDAGBytes,
} from "../graph/CanonicalSerializer";
import type { ExecutionDAG } from "../graph/GraphTypes";
import { createSnapshotMaterial } from "../snapshot/SnapshotResolver";

const testGsid: GSID = {
  id: "gsid-test-001",
  commitHash: "commit-abc",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

const snapshot = createSnapshotMaterial(
  [{ id: "n-a" }, { id: "n-b" }, { id: "n-c" }],
  [
    { id: "e-1", from: "n-a", to: "n-b", type: "CALLS", direction: "OUT" },
    { id: "e-2", from: "n-b", to: "n-c", type: "CALLS", direction: "OUT" },
  ],
);

/** Builds a structural fixture DAG with declarative params. */
function buildFixtureDag(): ExecutionDAG {
  return {
    gsid: testGsid,
    nodes: [
      {
        id: "n-a",
        operation: "RESOLVE_TARGET",
        params: { targetId: "n-a" },
      },
      {
        id: "n-b",
        operation: "FILTER_EDGES",
        params: { queryType: "DEPENDENCIES" },
      },
      {
        id: "n-c",
        operation: "TRAVERSE",
        params: { startNodeId: "n-a", maxDepth: 15 },
      },
      {
        id: "n-d",
        operation: "EMIT",
        params: { queryType: "DEPENDENCIES" },
      },
    ],
    edges: [
      { id: "e-1", from: "n-a", to: "n-b" },
      { id: "e-2", from: "n-b", to: "n-c" },
      { id: "e-3", from: "n-c", to: "n-d" },
    ],
  };
}

describe("determinism", () => {
  it("produces byte-identical serialized DAG for identical ExecutionDAG", () => {
    const dagA = buildFixtureDag();
    const dagB = buildFixtureDag();

    assert.deepEqual(
      serializeExecutionDAGBytes(dagA),
      serializeExecutionDAGBytes(dagB),
    );
  });

  it("produces byte-identical serialized DAG regardless of input node order", () => {
    const dagUnsorted: ExecutionDAG = {
      gsid: testGsid,
      nodes: [
        {
          id: "n-c",
          operation: "TRAVERSE",
          params: { startNodeId: "n-a", maxDepth: 15 },
        },
        {
          id: "n-a",
          operation: "RESOLVE_TARGET",
          params: { targetId: "n-a" },
        },
        {
          id: "n-d",
          operation: "EMIT",
          params: { queryType: "DEPENDENCIES" },
        },
        {
          id: "n-b",
          operation: "FILTER_EDGES",
          params: { queryType: "DEPENDENCIES" },
        },
      ],
      edges: [
        { id: "e-3", from: "n-c", to: "n-d" },
        { id: "e-1", from: "n-a", to: "n-b" },
        { id: "e-2", from: "n-b", to: "n-c" },
      ],
    };

    assert.equal(
      serializeExecutionDAG(dagUnsorted),
      serializeExecutionDAG(buildFixtureDag()),
    );
  });

  it("throws GSIDValidationFailure on GSID consistency mismatch", () => {
    const dag = buildFixtureDag();
    const mismatchedGsid: GSID = {
      id: "gsid-mismatch",
      commitHash: testGsid.commitHash,
      schemaVersion: testGsid.schemaVersion,
      timestamp: testGsid.timestamp,
    };

    assert.throws(
      () =>
        deterministicExecutionEngine.execute({
          dag,
          gsid: mismatchedGsid,
          snapshot,
        }),
      (error: unknown) =>
        error instanceof GSIDValidationFailure &&
        error.message.includes("GSID consistency invariant violated"),
    );
  });

  it("produces identical traversal order across repeated executions", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "n-a",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const first = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });
    const second = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });

    assert.deepEqual(first.trace, second.trace);
  });

  it("uses stable object and param key ordering in serialization", () => {
    const dag = buildFixtureDag();
    const serialized = serializeExecutionDAG(dag);
    assert.ok(serialized.startsWith('{"gsid":'));
    assert.ok(serialized.includes('"params":{"maxDepth":15,"startNodeId":"n-a"}'));
  });
});
