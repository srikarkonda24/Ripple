// Defines Stage 5 execution error taxonomy for deterministic certification.
export class Stage5ExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Stage5ExecutionError";
  }
}

/** Thrown when compiler contract rules are violated (EVID, query shape, serialization). */
export class CompilerContractViolation extends Stage5ExecutionError {
  constructor(message: string) {
    super(message);
    this.name = "CompilerContractViolation";
  }
}

/** Thrown when GSID consistency or stable identity resolution fails. */
export class GSIDValidationFailure extends Stage5ExecutionError {
  constructor(message: string) {
    super(message);
    this.name = "GSIDValidationFailure";
  }
}

/** Thrown when executor cannot faithfully realize the ExecutionDAG. */
export class ExecutorFidelityFailure extends Stage5ExecutionError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutorFidelityFailure";
  }
}

/** Thrown when evidence cannot be derived strictly from an execution trace. */
export class EvidenceIntegrityFailure extends Stage5ExecutionError {
  constructor(message: string) {
    super(message);
    this.name = "EvidenceIntegrityFailure";
  }
}
