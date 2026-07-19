// Defines the evidence builder contract that derives Evidence only from ExecutionTrace input.
import type { Evidence } from "../core/Evidence";
import type { ExecutionTrace } from "../core/ExecutionTrace";
import type { GSID } from "../core/GSID";

export interface EvidenceBuilder {
  build(trace: ExecutionTrace, gsid: GSID): Evidence;
}
