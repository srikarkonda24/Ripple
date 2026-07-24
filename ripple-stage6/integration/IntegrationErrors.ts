// Defines Stage 5 integration boundary errors for snapshot and gateway failures.
import { Stage6Error } from "../core/Stage6Error";

/** Thrown when SnapshotProvider cannot resolve material for a GSID. */
export class SnapshotProviderError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotProviderError";
  }
}

/** Thrown when Stage 5 gateway receives invalid integration input. */
export class Stage5GatewayError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "Stage5GatewayError";
  }
}

/** Thrown when evidence would be mutated or fails integrity checks. */
export class EvidencePreservationError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "EvidencePreservationError";
  }
}
