// Defines ExecutionDAG structure types — the complete semantic program representation.
import type { ExecutionTrace } from "../core/ExecutionTrace";
import type { GSID } from "../core/GSID";
import type { OperatorParams, OperatorType } from "../core/OperatorType";
import type { SnapshotMaterial } from "../core/CompilerInput";

export type ExecutionDAGNode = {
  readonly id: string;
  readonly operation: OperatorType;
  readonly params: OperatorParams;
};

export type ExecutionDAGEdge = {
  readonly id: string;
  readonly from: string;
  readonly to: string;
};

export type ExecutionDAG = {
  readonly gsid: GSID;
  readonly nodes: readonly ExecutionDAGNode[];
  readonly edges: readonly ExecutionDAGEdge[];
};

export type ExecutionResult = {
  readonly trace: ExecutionTrace;
};

/** Explicit execution input — snapshot is provided by CLI, not SnapshotResolver. */
export type ExecutionInput = {
  readonly dag: ExecutionDAG;
  readonly gsid: GSID;
  readonly snapshot: SnapshotMaterial;
};
