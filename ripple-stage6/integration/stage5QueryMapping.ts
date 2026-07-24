// Converts Stage 6 impact queries into Stage 5 query tuples.
import type { ImpactQuery } from "../queries/ImpactQuery";
import type { Query } from "../../ripple-stage5/core/Query";
import { gsidRefToStage5Gsid } from "./GsidFactory";

/** Maps an ImpactQuery to the frozen Stage 5 Query contract. */
export function impactQueryToStage5Query(query: ImpactQuery): Query {
  return {
    type: query.type,
    target: query.target,
    source: query.source,
    gsid: gsidRefToStage5Gsid(query.gsid),
    evid: {
      version: query.evid.version,
      compilerHash: query.evid.compilerHash,
    },
  };
}
