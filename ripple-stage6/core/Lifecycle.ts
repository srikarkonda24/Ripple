// Validates and applies analysis lifecycle transitions for Stage 6 MVP.
import type { AnalysisStatus } from "./AnalysisStatus";
import { InvalidLifecycleTransitionError } from "./Stage6Error";

const ALLOWED_TRANSITIONS: ReadonlyMap<AnalysisStatus, readonly AnalysisStatus[]> =
  new Map<AnalysisStatus, readonly AnalysisStatus[]>([
    ["Queued", ["Running"]],
    ["Running", ["Completed", "Failed"]],
    ["Completed", []],
    ["Failed", []],
  ]);

/** Returns true when MVP allows moving from current status to next status. */
export function canTransition(
  from: AnalysisStatus,
  to: AnalysisStatus,
): boolean {
  if (from === to) {
    return false;
  }
  const allowed = ALLOWED_TRANSITIONS.get(from);
  if (allowed === undefined) {
    return false;
  }
  return allowed.includes(to);
}

/**
 * Asserts a transition is legal; throws InvalidLifecycleTransitionError when not.
 */
export function assertValidTransition(
  from: AnalysisStatus,
  to: AnalysisStatus,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidLifecycleTransitionError(from, to);
  }
}
