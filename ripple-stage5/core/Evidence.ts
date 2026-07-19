// Defines the evidence artifact derived deterministically from an execution trace.
import type { GSID } from "./GSID";

export type Evidence = {
  evidenceId: string;
  gsid: GSID;
  commitId: string;
  schemaVersion: string;
  graphPath: string[];
  executionSteps: string[];
};
