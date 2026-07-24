// Formats deterministic GitHub Check Run output from ImpactReport.
import { analysisIdentityKey } from "../core/AnalysisIdentity";
import type { ImpactReport } from "../core/ImpactReport";
import { assertSupportedClaims } from "./validateClaims";

export type CheckRunOutput = {
  readonly title: string;
  readonly summary: string;
  readonly text: string;
};

/** Builds deterministic Check Run text from a verified ImpactReport. */
export function formatCheckRunOutput(report: ImpactReport): CheckRunOutput {
  if (report.claims.length > 0) {
    assertSupportedClaims(report.claims);
  }

  const identityKey = analysisIdentityKey(report.identity);
  const changedSymbolCount = report.changedSymbols.length;
  const claimCount = report.claims.length;

  const title =
    claimCount === 0
      ? "Ripple Impact Analysis — no verified claims"
      : `Ripple Impact Analysis — ${claimCount} verified claim(s)`;

  const summaryLines = [
    `Analysis: ${identityKey}`,
    `Changed symbols: ${changedSymbolCount}`,
    `Verified impact claims: ${claimCount}`,
  ];
  if (report.emptyReason !== undefined) {
    summaryLines.push(`Empty reason: ${report.emptyReason}`);
  }

  const findingLines = report.claims.map(
    (claim) =>
      `- ${claim.relationshipSummary} (evidenceId: ${claim.evidenceId}, path: ${claim.graphPath.join(" → ")})`,
  );

  const textSections = [
    "## Ripple Impact Analysis",
    "",
    "### Analysis Identity",
    identityKey,
    "",
    "### Changed Symbols",
    ...(report.changedSymbols.length === 0
      ? ["- none"]
      : report.changedSymbols.map(
          (symbol) => `- ${symbol.displayName} (${symbol.filePath}) [${symbol.nodeId}]`,
        )),
    "",
    "### Verified Findings",
    ...(findingLines.length === 0 ? ["- none"] : findingLines),
  ];

  return {
    title,
    summary: summaryLines.join("\n"),
    text: textSections.join("\n"),
  };
}

/** Serializes check output for determinism tests. */
export function serializeCheckRunOutputForTest(output: CheckRunOutput): string {
  return JSON.stringify(output);
}
