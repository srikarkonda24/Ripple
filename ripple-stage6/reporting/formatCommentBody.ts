// Formats deterministic PR comment markdown from ImpactReport.
import { analysisIdentityKey } from "../core/AnalysisIdentity";
import type { ImpactReport } from "../core/ImpactReport";
import { assertSupportedClaims } from "./validateClaims";

const COMMENT_MARKER_PREFIX = "ripple-stage6-analysis";

/** Returns the HTML comment marker used to find/update sticky PR comments. */
export function commentMarkerForIdentity(report: ImpactReport): string {
  return `<!-- ${COMMENT_MARKER_PREFIX}:${analysisIdentityKey(report.identity)} -->`;
}

/** Builds the PR comment body including the sticky identity marker. */
export function formatPullRequestCommentBody(report: ImpactReport): string {
  if (report.claims.length > 0) {
    assertSupportedClaims(report.claims);
  }

  const marker = commentMarkerForIdentity(report);
  const changedLines =
    report.changedSymbols.length === 0
      ? ["- none"]
      : report.changedSymbols.map(
          (symbol) =>
            `- **${symbol.displayName}** (\`${symbol.filePath}\`) — \`${symbol.nodeId}\``,
        );

  const affectedLines =
    report.claims.length === 0
      ? ["- none"]
      : report.claims.map((claim) => {
          const affected = claim.affectedNodeIds.join(", ");
          return `- **${claim.queryType}** from \`${claim.changedSymbol.nodeId}\` → \`${affected}\``;
        });

  const evidenceLines =
    report.claims.length === 0
      ? ["- none"]
      : report.claims.map(
          (claim) =>
            `- \`${claim.evidenceId}\` — path: ${claim.graphPath.join(" → ")} — ${claim.relationshipSummary}`,
        );

  return [
    marker,
    "",
    "## Ripple Impact Analysis",
    "",
    "### Changed Symbols",
    ...changedLines,
    "",
    "### Affected Components",
    ...affectedLines,
    "",
    "### Evidence",
    ...evidenceLines,
  ].join("\n");
}

/** Serializes PR comment body for determinism tests. */
export function serializeCommentBodyForTest(body: string): string {
  return body;
}
