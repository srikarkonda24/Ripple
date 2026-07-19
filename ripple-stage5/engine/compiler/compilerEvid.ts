// Defines the registered EVID constant for Phase 2 compiler version binding.
import type { EVID } from "../../core/EVID";

/** Registered EVID for stage5-phase2-v1 — any query must match exactly. */
export const REGISTERED_EVID: EVID = {
  version: "stage5-phase2-v1",
  compilerHash: "stage5-phase2-compiler-v1",
};
