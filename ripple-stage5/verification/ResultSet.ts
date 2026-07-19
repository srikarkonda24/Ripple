// Observable result set derived from ExecutionTrace for verification only — no execution semantics.
import type { ExecutionTrace } from "../core/ExecutionTrace";

/**
 * Final observable result of a Stage 5 execution.
 * Derived strictly from ExecutionTrace; not a separate kernel computation.
 */
export type ResultSet = {
  readonly nodes: readonly string[];
  readonly edges: readonly string[];
};

/** Builds a ResultSet from an execution trace (verification / certification use). */
export function resultSetFromTrace(trace: ExecutionTrace): ResultSet {
  return {
    nodes: [...trace.visitedNodes],
    edges: [...trace.visitedEdges],
  };
}
