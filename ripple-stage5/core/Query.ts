// Defines the frozen query input tuple bound to a GSID snapshot and EVID semantics version.
import type { EVID } from "./EVID";
import type { GSID } from "./GSID";

export type Query = {
  type: "CALLERS" | "DEPENDENCIES" | "PATH" | "REFERENCES" | "IMPACT";
  target: string;
  source?: string;
  gsid: GSID;
  evid: EVID;
};
