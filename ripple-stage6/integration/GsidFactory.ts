// Maps Stage 6 GSID references to Stage 5 GSID values without inventing identity fields.
import type { GsidRef } from "../core/GsidRef";
import type { GSID } from "../../ripple-stage5/core/GSID";

/** Converts a frozen GsidRef into the Stage 5 GSID shape (field-compatible). */
export function gsidRefToStage5Gsid(ref: GsidRef): GSID {
  return {
    id: ref.id,
    commitHash: ref.commitHash,
    schemaVersion: ref.schemaVersion,
    timestamp: ref.timestamp,
  };
}

export type GsidFactoryInput = {
  readonly gsidId: string;
  readonly commitHash: string;
  readonly schemaVersion: string;
  readonly timestamp: number;
};

/**
 * Builds a GSID from explicit snapshot binding inputs — no derivation from PR metadata alone.
 */
export function createGsidFromBinding(input: GsidFactoryInput): GsidRef {
  return {
    id: input.gsidId,
    commitHash: input.commitHash,
    schemaVersion: input.schemaVersion,
    timestamp: input.timestamp,
  };
}
