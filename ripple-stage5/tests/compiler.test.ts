// Validates structural compiler: intent-only DAG, EVID, G2 identity, byte-identical serialization.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GSID } from "../core/GSID";
import type { Query } from "../core/Query";
import {
  CompilerContractViolation,
  GSIDValidationFailure,
} from "../core/Stage5ExecutionError";
import { REGISTERED_EVID } from "../engine/compiler/compilerEvid";
import { structuralQueryCompiler } from "../engine/QueryCompilerImpl";
import {
  serializeExecutionDAG,
  serializeExecutionDAGBytes,
} from "../graph/CanonicalSerializer";
import { createSnapshotMaterial } from "../snapshot/SnapshotResolver";

const testGsid: GSID = {
  id: "gsid-compiler-001",
  commitHash: "commit-c",
  schemaVersion: "stage5-v1",
  timestamp: 0,
};

const snapshot = createSnapshotMaterial(
  [{ id: "login" }, { id: "auth" }, { id: "db" }],
  [
    {
      id: "e-auth-login",
      from: "auth",
      to: "login",
      type: "CALLS",
      direction: "OUT",
    },
    {
      id: "e-login-db",
      from: "login",
      to: "db",
      type: "CALLS",
      direction: "OUT",
    },
  ],
);

/** Builds a valid Phase 2 query. */
function makeQuery(overrides: Partial<Query> = {}): Query {
  return {
    type: "CALLERS",
    target: "login",
    gsid: testGsid,
    evid: REGISTERED_EVID,
    ...overrides,
  };
}

describe("compiler", () => {
  it("emits structural operator chain without computed visit params", () => {
    const dag = structuralQueryCompiler.compile({
      query: makeQuery(),
      snapshot,
    });

    assert.equal(dag.nodes.length, 4);
    assert.deepEqual(
      dag.nodes.map((n) => n.operation),
      ["RESOLVE_TARGET", "FILTER_EDGES", "TRAVERSE", "EMIT"],
    );

    for (const node of dag.nodes) {
      assert.equal("visitedNodeIds" in node.params, false);
      assert.equal("visitedEdgeIds" in node.params, false);
      assert.equal("pathNodeIds" in node.params, false);
      assert.equal("pathEdgeIds" in node.params, false);
    }
  });

  it("emits SELECT_PATH for PATH queries", () => {
    const dag = structuralQueryCompiler.compile({
      query: makeQuery({ type: "PATH", source: "auth", target: "db" }),
      snapshot,
    });

    const graphOp = dag.nodes.find((n) => n.id === "op-graph");
    assert.equal(graphOp?.operation, "SELECT_PATH");
    assert.equal(graphOp?.params["sourceId"], "auth");
    assert.equal(graphOp?.params["targetId"], "db");
  });

  it("binds GSID from query into ExecutionDAG", () => {
    const dag = structuralQueryCompiler.compile({
      query: makeQuery(),
      snapshot,
    });
    assert.deepEqual(dag.gsid, testGsid);
  });

  it("throws CompilerContractViolation on EVID mismatch", () => {
    assert.throws(
      () =>
        structuralQueryCompiler.compile({
          query: makeQuery({
            evid: { version: "wrong", compilerHash: "wrong" },
          }),
          snapshot,
        }),
      (error: unknown) => error instanceof CompilerContractViolation,
    );
  });

  it("throws CompilerContractViolation when PATH lacks source", () => {
    assert.throws(
      () =>
        structuralQueryCompiler.compile({
          query: makeQuery({ type: "PATH", source: undefined }),
          snapshot,
        }),
      (error: unknown) => error instanceof CompilerContractViolation,
    );
  });

  it("throws GSIDValidationFailure when target missing from snapshot", () => {
    assert.throws(
      () =>
        structuralQueryCompiler.compile({
          query: makeQuery({ target: "missing" }),
          snapshot,
        }),
      (error: unknown) => error instanceof GSIDValidationFailure,
    );
  });

  it("produces byte-identical UTF-8 serialization for identical inputs", () => {
    const input = { query: makeQuery(), snapshot };
    const dagA = structuralQueryCompiler.compile(input);
    const dagB = structuralQueryCompiler.compile(input);

    assert.deepEqual(
      serializeExecutionDAGBytes(dagA),
      serializeExecutionDAGBytes(dagB),
    );
    assert.equal(serializeExecutionDAG(dagA), serializeExecutionDAG(dagB));
  });

  it("dependency edges encode constraints only (G3)", () => {
    const dag = structuralQueryCompiler.compile({
      query: makeQuery(),
      snapshot,
    });
    assert.equal(dag.edges.length, 3);
    assert.ok(dag.edges.every((e) => e.id.startsWith("dep-")));
  });
});
