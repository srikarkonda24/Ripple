// Validates GSID field equality for the engine-bound consistency invariant.
import type { GSID } from "../core/GSID";
import { GSIDValidationFailure } from "../core/Stage5ExecutionError";

/** Returns true when every GSID field matches between the two values. */
export function gsidFieldsEqual(left: GSID, right: GSID): boolean {
  return (
    left.id === right.id &&
    left.commitHash === right.commitHash &&
    left.schemaVersion === right.schemaVersion &&
    left.timestamp === right.timestamp
  );
}

/** Throws GSIDValidationFailure when the compile-bound GSID and execute GSID differ. */
export function assertGsidConsistency(dagGsid: GSID, executeGsid: GSID): void {
  if (!gsidFieldsEqual(dagGsid, executeGsid)) {
    throw new GSIDValidationFailure(
      "GSID consistency invariant violated: Query-bound GSID does not equal execute GSID",
    );
  }
}
