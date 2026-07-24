// Executes Stage 5 pipeline and returns Evidence without Stage 6 graph authority.
import { runPipeline } from "../../ripple-stage5/cli/index";
import type { Evidence } from "../../ripple-stage5/core/Evidence";
import type { ImpactQuery } from "../queries/ImpactQuery";
import {
  assertEvidenceIdentical,
  snapshotEvidence,
} from "./EvidencePreservation";
import type { SnapshotProvider } from "./SnapshotProvider";
import { snapshotProviderAsResolver } from "./SnapshotProvider";
import { impactQueryToStage5Query } from "./stage5QueryMapping";

export interface Stage5Gateway {
  execute(query: ImpactQuery, snapshotProvider: SnapshotProvider): Evidence;
}

/** Adapter-only gateway: compile → execute → evidence with no mutation. */
export class Stage5GatewayImpl implements Stage5Gateway {
  execute(query: ImpactQuery, snapshotProvider: SnapshotProvider): Evidence {
    const stage5Query = impactQueryToStage5Query(query);
    const resolver = snapshotProviderAsResolver(snapshotProvider);
    const evidence = runPipeline(stage5Query, resolver);
    const preserved = snapshotEvidence(evidence);
    assertEvidenceIdentical(evidence, preserved);
    return evidence;
  }
}

export const stage5Gateway: Stage5Gateway = new Stage5GatewayImpl();
