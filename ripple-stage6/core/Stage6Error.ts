// Defines Stage 6 error taxonomy for lifecycle and contract violations.

/** Base error for Stage 6 orchestration and contract failures. */
export class Stage6Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Stage6Error";
  }
}

/** Thrown when an analysis lifecycle transition is not allowed in MVP. */
export class InvalidLifecycleTransitionError extends Stage6Error {
  constructor(from: string, to: string) {
    super(`Invalid lifecycle transition: ${from} → ${to}`);
    this.name = "InvalidLifecycleTransitionError";
  }
}

/** Thrown when AnalysisIdentity input fails normalization or validation. */
export class AnalysisIdentityValidationError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisIdentityValidationError";
  }
}
