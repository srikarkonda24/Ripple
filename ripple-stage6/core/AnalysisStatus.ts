// Defines allowed analysis lifecycle states for Stage 6 PR Intelligence MVP.

export type AnalysisStatus = "Queued" | "Running" | "Completed" | "Failed";

/** All statuses in stable order for tests and logging. */
export const ANALYSIS_STATUSES: readonly AnalysisStatus[] = [
  "Queued",
  "Running",
  "Completed",
  "Failed",
] as const;
