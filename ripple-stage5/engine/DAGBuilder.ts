// Structural DAG builder entry used by the compiler path — delegates to structuralCompile.
import type { CompilerInput } from "../core/CompilerInput";
import type { ExecutionDAG } from "../graph/GraphTypes";
import { structuralCompile } from "./compiler/structuralCompile";

/** Builds an ExecutionDAG from compiler input without performing graph computation. */
export function buildExecutionDAG(input: CompilerInput): ExecutionDAG {
  return structuralCompile(input);
}
