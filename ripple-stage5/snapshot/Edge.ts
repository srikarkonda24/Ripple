// Defines snapshot graph edge input material bound to a GSID snapshot.
export type Edge = {
  id: string;
  from: string;
  to: string;
  type: string;
  direction: "IN" | "OUT";
};
