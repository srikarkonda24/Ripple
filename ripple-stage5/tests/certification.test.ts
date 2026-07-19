// Certification tests: result set identity and restart replay (verification infrastructure).
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GSID } from "../core/GSID";
import { REGISTERED_EVID } from "../engine/compiler/compilerEvid";
import { createSnapshotMaterial } from "../snapshot/SnapshotResolver";
import {
  assertReplayIdentity,
  collectCertificationArtifacts,
} from "../verification/certificationArtifacts";
import { resultSetFromTrace } from "../verification/ResultSet";

const testGsid: GSID = {
  id: "gsid-cert-001",
  commitHash: "commit-cert",
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

const query = {
  type: "DEPENDENCIES" as const,
  target: "root",
  gsid: testGsid,
  evid: REGISTERED_EVID,
};

describe("certification", () => {
  it("identical inputs produce identical DAG bytes, trace, evidence, and result set", () => {
    const a = collectCertificationArtifacts(query, snapshot);
    const b = collectCertificationArtifacts(query, snapshot);

    assert.deepEqual(a.dagBytes, b.dagBytes);
    assert.deepEqual(a.trace, b.trace);
    assert.deepEqual(a.evidence, b.evidence);
    assert.deepEqual(a.resultSet, b.resultSet);
    assertReplayIdentity(a, b);
  });

  it("result set is derived from ExecutionTrace visited nodes and edges", () => {
    const artifacts = collectCertificationArtifacts(query, snapshot);
    assert.deepEqual(
      artifacts.resultSet,
      resultSetFromTrace(artifacts.trace),
    );
    assert.deepEqual(artifacts.resultSet.nodes, artifacts.trace.visitedNodes);
    assert.deepEqual(artifacts.resultSet.edges, artifacts.trace.visitedEdges);
  });

  it("restart replay: fresh engine instances produce identical artifacts", () => {
    // Execution A — first process-equivalent cycle
    const executionA = collectCertificationArtifacts(query, snapshot);

    // Execution B — fresh compiler + engine initialization (no shared instance state)
    const executionB = collectCertificationArtifacts(query, snapshot);

    assert.deepEqual(executionA.dagBytes, executionB.dagBytes);
    assert.deepEqual(executionA.trace, executionB.trace);
    assert.deepEqual(executionA.evidence, executionB.evidence);
    assert.deepEqual(executionA.resultSet, executionB.resultSet);
    assertReplayIdentity(executionA, executionB);
  });

  it("PATH restart replay remains identity-stable", () => {
    const pathQuery = {
      type: "PATH" as const,
      source: "root",
      target: "child-b",
      gsid: testGsid,
      evid: REGISTERED_EVID,
    };

    const a = collectCertificationArtifacts(pathQuery, snapshot);
    const b = collectCertificationArtifacts(pathQuery, snapshot);

    assertReplayIdentity(a, b);
    assert.deepEqual(a.resultSet.nodes, ["root", "child-a", "child-b"]);
  });
});
