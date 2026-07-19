// Defines the deterministic executor contract for realizing an ExecutionDAG.
import type { ExecutionInput, ExecutionResult } from "../graph/GraphTypes";

export interface ExecutionEngine {
  execute(input: ExecutionInput): ExecutionResult;
}
