// Defines developer-visible impact output bound to Stage 5 evidence (Phase 6+).
import type { AnalysisIdentity } from "./AnalysisIdentity";
import type { GsidRef } from "./GsidRef";
import type { ImpactEmptyReason } from "./PRChange";
import type { MvpQueryType, ResolvedSymbol } from "./ResolvedSymbol";

export type ImpactClaim = {
  readonly changedSymbol: ResolvedSymbol;
  readonly queryType: MvpQueryType;
  readonly affectedNodeIds: readonly string[];
  readonly graphPath: readonly string[];
  readonly evidenceId: string;
  readonly relationshipSummary: string;
};

export type ImpactReport = {
  readonly identity: AnalysisIdentity;
  readonly gsid: GsidRef;
  readonly changedSymbols: readonly ResolvedSymbol[];
  readonly claims: readonly ImpactClaim[];
  readonly emptyReason?: ImpactEmptyReason;
};
