// Structural semantic compiler — emits intent-only ExecutionDAG with no graph traversal.
import type { CompilerInput } from "../core/CompilerInput";
import type { ExecutionDAG } from "../graph/GraphTypes";
import { structuralCompile } from "./compiler/structuralCompile";
import type { QueryCompiler } from "./QueryCompiler";

/** Compiles Query + SnapshotMaterial into a declarative dependency-constraint DAG. */
export class StructuralQueryCompiler implements QueryCompiler {
  compile(input: CompilerInput): ExecutionDAG {
    return structuralCompile(input);
  }
}

export const structuralQueryCompiler: QueryCompiler = new StructuralQueryCompiler();
