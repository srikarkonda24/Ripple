// Mirrors ripple-stage5/core/GSID.ts for report binding; fields must stay aligned at integration.
export type GsidRef = {
  readonly id: string;
  readonly commitHash: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
};
