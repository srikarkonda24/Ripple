// Validates computational executor: DFS, PATH 4B, filters, G1/G4, runtime traces.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GSID } from "../core/GSID";
import {
  ExecutorFidelityFailure,
  GSIDValidationFailure,
} from "../core/Stage5ExecutionError";
import { REGISTERED_EVID } from "../engine/compiler/compilerEvid";
import { deterministicExecutionEngine } from "../engine/ExecutionEngineImpl";
import { structuralQueryCompiler } from "../engine/QueryCompilerImpl";
import { createSnapshotMaterial } from "../snapshot/SnapshotResolver";

const testGsid: GSID = {
  id: "gsid-exec-001",
  commitHash: "commit-e",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

const snapshot = createSnapshotMaterial(
  [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }],
  [
    { id: "e1", from: "A", to: "B", type: "CALLS", direction: "OUT" },
    { id: "e2", from: "B", to: "C", type: "CALLS", direction: "OUT" },
    { id: "e3", from: "A", to: "D", type: "CALLS", direction: "OUT" },
    { id: "e4", from: "B", to: "A", type: "REFERENCES", direction: "OUT" },
    { id: "e5", from: "X-caller", to: "B", type: "CALLS", direction: "OUT" },
  ],
);

const snapshotWithCaller = createSnapshotMaterial(
  [{ id: "A" }, { id: "B" }, { id: "C" }, { id: "D" }, { id: "X-caller" }],
  [
    { id: "e1", from: "A", to: "B", type: "CALLS", direction: "OUT" },
    { id: "e2", from: "B", to: "C", type: "CALLS", direction: "OUT" },
    { id: "e3", from: "A", to: "D", type: "CALLS", direction: "OUT" },
    { id: "e4", from: "B", to: "A", type: "REFERENCES", direction: "OUT" },
    { id: "e5", from: "X-caller", to: "B", type: "CALLS", direction: "OUT" },
  ],
);

describe("executor", () => {
  it("throws GSIDValidationFailure on GSID mismatch as first check", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "A",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    assert.throws(
      () =>
        deterministicExecutionEngine.execute({
          dag,
          gsid: { ...testGsid, id: "other" },
          snapshot,
        }),
      (error: unknown) => error instanceof GSIDValidationFailure,
    );
  });

  it("computes DEPENDENCIES traversal at runtime (not from DAG params)", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "A",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const result = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });

    assert.ok(result.trace.visitedNodes.includes("A"));
    assert.ok(result.trace.visitedNodes.includes("B"));
    assert.ok(result.trace.visitedEdges.length > 0);
    assert.equal("visitedNodeIds" in (dag.nodes[2]?.params ?? {}), false);
  });

  it("computes CALLERS via incoming CALLS edges", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "CALLERS",
        target: "B",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot: snapshotWithCaller,
    });

    const result = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot: snapshotWithCaller,
    });

    assert.ok(result.trace.visitedNodes.includes("B"));
    assert.ok(result.trace.visitedNodes.includes("A") || result.trace.visitedNodes.includes("X-caller"));
  });

  it("PATH 4B selects first canonical DFS path", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "PATH",
        source: "A",
        target: "C",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const result = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });

    assert.deepEqual(result.trace.visitedNodes, ["A", "B", "C"]);
    assert.deepEqual(result.trace.visitedEdges, ["e1", "e2"]);
  });

  it("PATH throws ExecutorFidelityFailure when no path exists", () => {
    const isolated = createSnapshotMaterial(
      [{ id: "A" }, { id: "Z" }],
      [],
    );
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "PATH",
        source: "A",
        target: "Z",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot: isolated,
    });

    assert.throws(
      () =>
        deterministicExecutionEngine.execute({
          dag,
          gsid: testGsid,
          snapshot: isolated,
        }),
      (error: unknown) => error instanceof ExecutorFidelityFailure,
    );
  });

  it("produces identical traces across runs (G4)", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "IMPACT",
        target: "A",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const a = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });
    const b = deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot,
    });

    assert.deepEqual(a.trace, b.trace);
  });

  it("does not mutate SnapshotMaterial during execute (G1)", () => {
    const material = createSnapshotMaterial(
      [{ id: "A" }, { id: "B" }],
      [{ id: "e1", from: "A", to: "B", type: "CALLS", direction: "OUT" }],
    );
    const edgeCount = material.edges.length;
    const nodeCount = material.nodes.length;

    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "A",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot: material,
    });

    deterministicExecutionEngine.execute({
      dag,
      gsid: testGsid,
      snapshot: material,
    });

    assert.equal(material.edges.length, edgeCount);
    assert.equal(material.nodes.length, nodeCount);
  });
});
