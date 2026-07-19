// Realizes an ExecutionDAG with computational fidelity after GSID consistency validation.
import type { ExecutionEngine } from "./ExecutionEngine";
import { assertGsidConsistency } from "./gsidValidation";
import { dispatchOperators } from "./executor/operatorDispatch";
import type { ExecutionInput, ExecutionResult } from "../graph/GraphTypes";

/** Pure computational interpreter — no semantic authority beyond the DAG. */
export class DeterministicExecutionEngine implements ExecutionEngine {
  execute(input: ExecutionInput): ExecutionResult {
    assertGsidConsistency(input.dag.gsid, input.gsid);

    const trace = dispatchOperators(input.dag, input.snapshot);

    return { trace };
  }
}

export const deterministicExecutionEngine: ExecutionEngine =
  new DeterministicExecutionEngine();
