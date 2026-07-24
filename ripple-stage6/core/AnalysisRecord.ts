// Defines the persisted analysis record bound to an AnalysisIdentity.
import type { AnalysisIdentity } from "./AnalysisIdentity";
import type { AnalysisStatus } from "./AnalysisStatus";
import type { ImpactReport } from "./ImpactReport";

export type AnalysisRecord = {
  readonly identity: AnalysisIdentity;
  readonly status: AnalysisStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly failureReason?: string;
  readonly report?: ImpactReport;
};
