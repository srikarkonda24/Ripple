// Validates replay identity: DAG bytes, trace, evidence must match across runs.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GSID } from "../core/GSID";
import type { ExecutionTrace } from "../core/ExecutionTrace";
import { executeQueryPipeline, runPipeline } from "../cli/index";
import { REGISTERED_EVID } from "../engine/compiler/compilerEvid";
import { structuralQueryCompiler } from "../engine/QueryCompilerImpl";
import { serializeExecutionDAGBytes } from "../graph/CanonicalSerializer";
import { traceEvidenceBuilder } from "../evidence/EvidenceBuilderImpl";
import {
  createSnapshotMaterial,
  InMemorySnapshotResolver,
} from "../snapshot/SnapshotResolver";

const testGsid: GSID = {
  id: "gsid-replay-001",
  commitHash: "commit-replay",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

const snapshot = createSnapshotMaterial(
  [{ id: "root" }, { id: "child-a" }, { id: "child-b" }],
  [
    {
      id: "edge-root-a",
      from: "root",
      to: "child-a",
      type: "CALLS",
      direction: "OUT",
    },
    {
      id: "edge-a-b",
      from: "child-a",
      to: "child-b",
      type: "CALLS",
      direction: "OUT",
    },
  ],
);

describe("replay", () => {
  it("produces identical canonical DAG bytes across compiles", () => {
    const input = {
      query: {
        type: "DEPENDENCIES" as const,
        target: "root",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    };

    const dagA = structuralQueryCompiler.compile(input);
    const dagB = structuralQueryCompiler.compile(input);

    assert.deepEqual(
      serializeExecutionDAGBytes(dagA),
      serializeExecutionDAGBytes(dagB),
    );
  });

  it("produces reproducible execution traces across runs", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "root",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const evidenceA = executeQueryPipeline(dag, snapshot);
    const evidenceB = executeQueryPipeline(dag, snapshot);

    assert.deepEqual(evidenceA, evidenceB);
  });

  it("derives evidence graphPath exactly from trace visitedNodes", () => {
    const trace: ExecutionTrace = {
      visitedNodes: ["root", "child-a", "child-b"],
      visitedEdges: ["edge-root-a", "edge-a-b"],
      hops: 2,
    };

    const evidence = traceEvidenceBuilder.build(trace, testGsid);

    assert.deepEqual(evidence.graphPath, trace.visitedNodes);
  });

  it("derives executionSteps only from trace visitation data", () => {
    const trace: ExecutionTrace = {
      visitedNodes: ["root", "child-a"],
      visitedEdges: ["edge-root-a"],
      hops: 1,
    };

    const evidence = traceEvidenceBuilder.build(trace, testGsid);

    assert.deepEqual(evidence.executionSteps, [
      "node:root",
      "node:child-a",
      "edge:edge-root-a",
    ]);
  });

  it("runPipeline yields identical evidence across replays", () => {
    const resolver = new InMemorySnapshotResolver({
      [testGsid.id]: snapshot,
    });

    const query = {
      type: "DEPENDENCIES" as const,
      target: "root",
      gsid: testGsid,
      evid: REGISTERED_EVID,
    };

    const evidenceA = runPipeline(query, resolver);
    const evidenceB = runPipeline(query, resolver);

    assert.deepEqual(evidenceA, evidenceB);
  });

  it("binds evidence commitId and schemaVersion to GSID metadata", () => {
    const dag = structuralQueryCompiler.compile({
      query: {
        type: "DEPENDENCIES",
        target: "root",
        gsid: testGsid,
        evid: REGISTERED_EVID,
      },
      snapshot,
    });

    const evidence = executeQueryPipeline(dag, snapshot);

    assert.equal(evidence.commitId, testGsid.commitHash);
    assert.equal(evidence.schemaVersion, testGsid.schemaVersion);
    assert.deepEqual(evidence.gsid, testGsid);
  });
});
