// Defines Stage 5-aligned query and EVID shapes for deterministic query generation.
import type { GsidRef } from "../core/GsidRef";
import type { MvpQueryType } from "../core/ResolvedSymbol";

export type EvidRef = {
  readonly version: string;
  readonly compilerHash: string;
};

/** Registered EVID mirror — must match ripple-stage5/engine/compiler/compilerEvid.ts */
export const REGISTERED_EVID_REF: EvidRef = {
  version: "stage5-phase2-v1",
  compilerHash: "stage5-phase2-compiler-v1",
};

export type ImpactQuery = {
  readonly type: MvpQueryType;
  readonly target: string;
  readonly source?: string;
  readonly gsid: GsidRef;
  readonly evid: EvidRef;
};

export const MVP_QUERY_TYPE_ORDER: readonly MvpQueryType[] = [
  "CALLERS",
  "DEPENDENCIES",
  "IMPACT",
  "PATH",
] as const;
