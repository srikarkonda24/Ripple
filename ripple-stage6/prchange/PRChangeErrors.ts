// Defines PRChange construction and diff parsing errors.
import { Stage6Error } from "../core/Stage6Error";

/** Thrown when diff or PRChange input cannot be normalized deterministically. */
export class PRChangeValidationError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "PRChangeValidationError";
  }
}

/** Thrown when GitHub diff retrieval fails. */
export class DiffRetrievalError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "DiffRetrievalError";
  }
}
