// Validates Phase 6 reporting formatters and ImpactReport builder behavior.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { sampleIdentity } from "../fixtures/sampleIdentity";
import {
  integrationGsid,
  changedSymbolB,
} from "../fixtures/stage5SnapshotFixtures";
import type { ImpactClaim } from "../core/ImpactReport";
import { buildImpactReport, serializeImpactReportForTest } from "../reporting/ImpactReportBuilder";
import {
  formatCheckRunOutput,
  serializeCheckRunOutputForTest,
} from "../reporting/formatCheckOutput";
import {
  formatPullRequestCommentBody,
  serializeCommentBodyForTest,
} from "../reporting/formatCommentBody";
import { isSupportedImpactClaim } from "../reporting/validateClaims";

const sampleClaim: ImpactClaim = {
  changedSymbol: changedSymbolB,
  queryType: "CALLERS",
  affectedNodeIds: ["X-caller"],
  graphPath: ["X-caller", "B"],
  evidenceId: "evidence-001",
  relationshipSummary:
    "Symbol functionB has CALLERS relationship to X-caller through path X-caller → B.",
};

describe("ImpactReportBuilder", () => {
  it("produces identical reports for identical inputs", () => {
    const first = buildImpactReport({
      identity: sampleIdentity,
      gsid: integrationGsid,
      changedSymbols: [changedSymbolB],
      claims: [sampleClaim],
    });
    const second = buildImpactReport({
      identity: sampleIdentity,
      gsid: integrationGsid,
      changedSymbols: [changedSymbolB],
      claims: [sampleClaim],
    });
    assert.equal(
      serializeImpactReportForTest(first),
      serializeImpactReportForTest(second),
    );
  });
});

describe("Reporting formatters", () => {
  it("formats deterministic check output with evidence linkage", () => {
    const report = buildImpactReport({
      identity: sampleIdentity,
      gsid: integrationGsid,
      changedSymbols: [changedSymbolB],
      claims: [sampleClaim],
    });
    const first = formatCheckRunOutput(report);
    const second = formatCheckRunOutput(report);
    assert.equal(
      serializeCheckRunOutputForTest(first),
      serializeCheckRunOutputForTest(second),
    );
    assert.match(first.text, /evidenceId: evidence-001/);
  });

  it("formats deterministic PR comment output with evidence section", () => {
    const report = buildImpactReport({
      identity: sampleIdentity,
      gsid: integrationGsid,
      changedSymbols: [changedSymbolB],
      claims: [sampleClaim],
    });
    const body = formatPullRequestCommentBody(report);
    assert.match(body, /## Ripple Impact Analysis/);
    assert.match(body, /evidence-001/);
    assert.equal(serializeCommentBodyForTest(body), body);
  });

  it("rejects unsupported claims missing affected nodes", () => {
    assert.equal(
      isSupportedImpactClaim({
        ...sampleClaim,
        affectedNodeIds: [],
      }),
      false,
    );
  });
});
