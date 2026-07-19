// Wires the Stage 5 kernel pipeline: resolve → compile → execute → evidence.
import type { CompilerInput, SnapshotMaterial } from "../core/CompilerInput";
import type { Evidence } from "../core/Evidence";
import type { Query } from "../core/Query";
import type { ExecutionDAG } from "../graph/GraphTypes";
import { deterministicExecutionEngine } from "../engine/ExecutionEngineImpl";
import { structuralQueryCompiler } from "../engine/QueryCompilerImpl";
import { traceEvidenceBuilder } from "../evidence/EvidenceBuilderImpl";
import type { SnapshotResolver } from "../snapshot/SnapshotResolver";

/** Compiles a query with explicit snapshot material into an ExecutionDAG. */
export function compileQuery(input: CompilerInput): ExecutionDAG {
  return structuralQueryCompiler.compile(input);
}

/** Executes an ExecutionDAG against snapshot material and derives evidence. */
export function executeQueryPipeline(
  dag: ExecutionDAG,
  snapshot: SnapshotMaterial,
): Evidence {
  const result = deterministicExecutionEngine.execute({
    dag,
    gsid: dag.gsid,
    snapshot,
  });
  return traceEvidenceBuilder.build(result.trace, dag.gsid);
}

/**
 * Full pipeline: SnapshotResolver (compile-time) → compile → execute → evidence.
 * SnapshotResolver is never called inside the executor.
 */
export function runPipeline(
  query: Query,
  snapshotResolver: SnapshotResolver,
): Evidence {
  const snapshot = snapshotResolver.resolve(query.gsid);
  const dag = compileQuery({ query, snapshot });
  return executeQueryPipeline(dag, snapshot);
}
