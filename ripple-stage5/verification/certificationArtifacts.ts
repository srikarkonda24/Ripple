// Collects and compares Stage 5 certification artifacts from independent executions.
import type { SnapshotMaterial } from "../core/CompilerInput";
import type { Evidence } from "../core/Evidence";
import type { ExecutionTrace } from "../core/ExecutionTrace";
import type { Query } from "../core/Query";
import { DeterministicExecutionEngine } from "../engine/ExecutionEngineImpl";
import { StructuralQueryCompiler } from "../engine/QueryCompilerImpl";
import {
  serializeExecutionDAG,
  serializeExecutionDAGBytes,
} from "../graph/CanonicalSerializer";
import { traceEvidenceBuilder } from "../evidence/EvidenceBuilderImpl";
import { ReplayViolation } from "./ReplayViolation";
import { resultSetFromTrace, type ResultSet } from "./ResultSet";

/** Full artifact package for replay certification. */
export type CertificationArtifacts = {
  readonly dagCanonical: string;
  readonly dagBytes: Buffer;
  readonly trace: ExecutionTrace;
  readonly evidence: Evidence;
  readonly resultSet: ResultSet;
};

/**
 * Runs compile → execute → evidence → result set using freshly constructed engine instances.
 * Does not use module singleton state — supports restart-style certification.
 */
export function collectCertificationArtifacts(
  query: Query,
  snapshot: SnapshotMaterial,
): CertificationArtifacts {
  const compiler = new StructuralQueryCompiler();
  const engine = new DeterministicExecutionEngine();

  const dag = compiler.compile({ query, snapshot });
  const execution = engine.execute({
    dag,
    gsid: query.gsid,
    snapshot,
  });
  const evidence = traceEvidenceBuilder.build(execution.trace, query.gsid);
  const resultSet = resultSetFromTrace(execution.trace);

  return {
    dagCanonical: serializeExecutionDAG(dag),
    dagBytes: serializeExecutionDAGBytes(dag),
    trace: execution.trace,
    evidence,
    resultSet,
  };
}

/** Asserts byte/structural identity across two certification artifact packages. */
export function assertReplayIdentity(
  left: CertificationArtifacts,
  right: CertificationArtifacts,
): void {
  if (!left.dagBytes.equals(right.dagBytes)) {
    throw new ReplayViolation(
      "Replay identity failure: canonical DAG bytes diverge",
    );
  }

  if (left.dagCanonical !== right.dagCanonical) {
    throw new ReplayViolation(
      "Replay identity failure: canonical DAG strings diverge",
    );
  }

  if (JSON.stringify(left.trace) !== JSON.stringify(right.trace)) {
    throw new ReplayViolation(
      "Replay identity failure: ExecutionTrace contents diverge",
    );
  }

  if (JSON.stringify(left.evidence) !== JSON.stringify(right.evidence)) {
    throw new ReplayViolation(
      "Replay identity failure: Evidence package diverges",
    );
  }

  if (JSON.stringify(left.resultSet) !== JSON.stringify(right.resultSet)) {
    throw new ReplayViolation(
      "Replay identity failure: Result Set diverges",
    );
  }
}
