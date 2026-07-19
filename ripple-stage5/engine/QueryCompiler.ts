// Defines the query compiler contract that produces exactly one ExecutionDAG per input.
import type { CompilerInput } from "../core/CompilerInput";
import type { ExecutionDAG } from "../graph/GraphTypes";

export interface QueryCompiler {
  compile(input: CompilerInput): ExecutionDAG;
}
