// Verifies Stage 5 Evidence is returned without mutation through the gateway boundary.
import type { Evidence } from "../../ripple-stage5/core/Evidence";
import { EvidencePreservationError } from "./IntegrationErrors";

/** Returns a copied snapshot used to detect post-gateway mutation. */
export function snapshotEvidence(evidence: Evidence): Evidence {
  return {
    evidenceId: evidence.evidenceId,
    gsid: { ...evidence.gsid },
    commitId: evidence.commitId,
    schemaVersion: evidence.schemaVersion,
    graphPath: [...evidence.graphPath],
    executionSteps: [...evidence.executionSteps],
  };
}

/** Asserts two evidence values are identical field-for-field. */
export function assertEvidenceIdentical(left: Evidence, right: Evidence): void {
  if (left.evidenceId !== right.evidenceId) {
    throw new EvidencePreservationError("evidenceId changed across gateway boundary");
  }
  if (left.commitId !== right.commitId) {
    throw new EvidencePreservationError("commitId changed across gateway boundary");
  }
  if (left.schemaVersion !== right.schemaVersion) {
    throw new EvidencePreservationError("schemaVersion changed across gateway boundary");
  }
  if (JSON.stringify(left.graphPath) !== JSON.stringify(right.graphPath)) {
    throw new EvidencePreservationError("graphPath changed across gateway boundary");
  }
  if (JSON.stringify(left.executionSteps) !== JSON.stringify(right.executionSteps)) {
    throw new EvidencePreservationError("executionSteps changed across gateway boundary");
  }
  if (JSON.stringify(left.gsid) !== JSON.stringify(right.gsid)) {
    throw new EvidencePreservationError("gsid changed across gateway boundary");
  }
}
