// Defines the immutable graph snapshot identifier used to bind execution to a single snapshot.
export type GSID = {
  id: string;
  commitHash: string;
  schemaVersion: string;
  timestamp: number;
};
