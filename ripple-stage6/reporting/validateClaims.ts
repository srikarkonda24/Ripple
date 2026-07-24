// Validates ImpactClaim fields required before reporting or GitHub publish.
import type { ImpactClaim } from "../core/ImpactReport";
import { Stage6Error } from "../core/Stage6Error";

/** Thrown when a claim lacks evidence linkage required for developer-visible output. */
export class UnsupportedClaimError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedClaimError";
  }
}

/** Returns true when a claim satisfies Phase 6 evidence linkage requirements. */
export function isSupportedImpactClaim(claim: ImpactClaim): boolean {
  if (claim.evidenceId.trim().length === 0) {
    return false;
  }
  if (claim.graphPath.length === 0) {
    return false;
  }
  if (claim.affectedNodeIds.length === 0) {
    return false;
  }
  return true;
}

/** Asserts every claim is supported; throws when any claim would be speculative. */
export function assertSupportedClaims(claims: readonly ImpactClaim[]): void {
  for (const claim of claims) {
    if (!isSupportedImpactClaim(claim)) {
      throw new UnsupportedClaimError(
        `Claim for ${claim.changedSymbol.nodeId} lacks required evidence linkage`,
      );
    }
  }
}
