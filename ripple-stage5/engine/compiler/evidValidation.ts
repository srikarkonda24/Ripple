// Validates query EVID against the registered Phase 2 compiler EVID (rule 5A).
import type { EVID } from "../../core/EVID";
import { CompilerContractViolation } from "../../core/Stage5ExecutionError";
import { REGISTERED_EVID } from "./compilerEvid";

/** Throws CompilerContractViolation when query EVID does not exactly match REGISTERED_EVID. */
export function assertEvidMatches(queryEvid: EVID): void {
  if (
    queryEvid.version !== REGISTERED_EVID.version ||
    queryEvid.compilerHash !== REGISTERED_EVID.compilerHash
  ) {
    throw new CompilerContractViolation(
      "EVID validation failed: query.evid must equal REGISTERED_EVID",
    );
  }
}
