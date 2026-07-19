// Verification-only error for replay identity divergence — not used by the execution kernel.
import { Stage5ExecutionError } from "../core/Stage5ExecutionError";

/**
 * Thrown by verification infrastructure when independent executions diverge.
 * Must not be thrown by engine/, compiler/, or evidence/ kernel paths.
 */
export class ReplayViolation extends Stage5ExecutionError {
  constructor(message: string) {
    super(message);
    this.name = "ReplayViolation";
  }
}
