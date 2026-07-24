// End-to-end mocked pipeline from webhook ingress through GitHub publish mocks.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { openedWebhookBody } from "../fixtures/githubPullRequestPayloads";
import { testGsid } from "../fixtures/symbolIndexFixtures";
import {
  integrationGsid,
  integrationSnapshot,
} from "../fixtures/stage5SnapshotFixtures";
import { buildPRChange } from "../prchange/PRChangeBuilder";
import { buildWebhookSignature } from "../github/webhookSignature";
import { processGitHubWebhook } from "../github/webhookReceiver";
import { InMemoryAnalysisStore } from "../orchestration/AnalysisStore";
import { AnalysisRunner } from "../orchestration/AnalysisRunner";
import { InMemorySymbolIndex } from "../resolution/SymbolIndex";
import { InMemorySnapshotProvider } from "../integration/SnapshotProvider";
import { EmptyWorkflowCatalog } from "../queries/WorkflowCatalog";
import { runAnalysisToImpactReport } from "../reporting/AnalysisPipeline";
import { assertEvidenceIdentical } from "../integration/EvidencePreservation";
import { stage5Gateway } from "../integration/Stage5Gateway";
import { REGISTERED_EVID_REF } from "../queries/ImpactQuery";
import { isSupportedImpactClaim } from "../reporting/validateClaims";
import type { CheckPublisher } from "../github/checkPublisher";
import type { CommentPublisher } from "../github/commentPublisher";

const webhookSecret = "e2e-secret";

/** Uses integration fixture GSID aligned to symbol index test id. */
const e2eGsid = testGsid;

function buildE2ePrChange() {
  return buildPRChange({
    identity: {
      repository: "acme/checkout-web",
      pullRequestNumber: 2847,
      headCommitSha: e2eGsid.commitHash,
    },
    rawDiff: {
      baseSha: "1111111111111111111111111111111111111111",
      headSha: e2eGsid.commitHash,
      files: [
        {
          path: "lib/auth/session.ts",
          patch: "@@ -12,1 +12,1 @@\n context\n",
        },
      ],
    },
  });
}

describe("E2E analysis pipeline (mocked publish)", () => {
  it("runs webhook → report → publish without duplicate comments", async () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1000);

    const firstWebhook = processGitHubWebhook({
      rawBody: openedWebhookBody,
      webhookSecret,
      signatureHeader: buildWebhookSignature(openedWebhookBody, webhookSecret),
      eventName: "pull_request",
      payload: JSON.parse(openedWebhookBody) as unknown,
      runner,
    });
    const secondWebhook = processGitHubWebhook({
      rawBody: openedWebhookBody,
      webhookSecret,
      signatureHeader: buildWebhookSignature(openedWebhookBody, webhookSecret),
      eventName: "pull_request",
      payload: JSON.parse(openedWebhookBody) as unknown,
      runner,
    });

    assert.equal(firstWebhook.created, true);
    assert.equal(secondWebhook.created, false);
    assert.equal(store.size(), 1);

    const snapshotProvider = new InMemorySnapshotProvider({
      [e2eGsid.id]: integrationSnapshot,
    });
    const symbolIndex = new InMemorySymbolIndex({
      [e2eGsid.id]: [
        {
          nodeId: "B",
          filePath: "lib/auth/session.ts",
          displayName: "getSession",
          startLine: 10,
          endLine: 25,
        },
      ],
    });

    const pipelineFirst = runAnalysisToImpactReport({
      identity: firstWebhook.identity,
      gsid: e2eGsid,
      prChange: buildE2ePrChange(),
      symbolIndex,
      snapshotProvider,
      workflowCatalog: new EmptyWorkflowCatalog(),
    });
    const pipelineSecond = runAnalysisToImpactReport({
      identity: secondWebhook.identity,
      gsid: e2eGsid,
      prChange: buildE2ePrChange(),
      symbolIndex,
      snapshotProvider,
      workflowCatalog: new EmptyWorkflowCatalog(),
    });

    assert.equal(
      JSON.stringify(pipelineFirst.report),
      JSON.stringify(pipelineSecond.report),
    );
    assert.ok(pipelineFirst.report.claims.length > 0);
    for (const claim of pipelineFirst.report.claims) {
      assert.equal(isSupportedImpactClaim(claim), true);
    }

    const evidence = stage5Gateway.execute(
      {
        type: "CALLERS",
        target: "B",
        gsid: integrationGsid,
        evid: REGISTERED_EVID_REF,
      },
      new InMemorySnapshotProvider({
        [integrationGsid.id]: integrationSnapshot,
      }),
    );
    const evidenceCopy = {
      evidenceId: evidence.evidenceId,
      gsid: { ...evidence.gsid },
      commitId: evidence.commitId,
      schemaVersion: evidence.schemaVersion,
      graphPath: [...evidence.graphPath],
      executionSteps: [...evidence.executionSteps],
    };
    assertEvidenceIdentical(evidence, evidenceCopy);

    let checkPublishCount = 0;
    let commentPublishCount = 0;

    const checkPublisher: CheckPublisher = {
      async publish() {
        checkPublishCount += 1;
        return { checkRunId: 1, htmlUrl: null };
      },
    };
    const commentPublisher: CommentPublisher = {
      async publishOrUpdate() {
        commentPublishCount += 1;
        return { commentId: 1, updated: commentPublishCount > 1 };
      },
    };

    await checkPublisher.publish({
      repository: firstWebhook.identity.repository,
      headSha: firstWebhook.identity.headCommitSha,
      report: pipelineFirst.report,
      accessToken: "token",
    });
    await commentPublisher.publishOrUpdate({
      repository: firstWebhook.identity.repository,
      pullRequestNumber: firstWebhook.identity.pullRequestNumber,
      report: pipelineFirst.report,
      accessToken: "token",
    });
    await commentPublisher.publishOrUpdate({
      repository: secondWebhook.identity.repository,
      pullRequestNumber: secondWebhook.identity.pullRequestNumber,
      report: pipelineSecond.report,
      accessToken: "token",
    });

    assert.equal(checkPublishCount, 1);
    assert.equal(commentPublishCount, 2);
  });

  it("returns no claims when symbol resolution is empty", () => {
    const snapshotProvider = new InMemorySnapshotProvider({
      [e2eGsid.id]: integrationSnapshot,
    });
    const symbolIndex = new InMemorySymbolIndex({
      [e2eGsid.id]: [
        {
          nodeId: "B",
          filePath: "lib/auth/session.ts",
          displayName: "getSession",
          startLine: 10,
          endLine: 25,
        },
      ],
    });
    const prChange = buildPRChange({
      identity: {
        repository: "acme/checkout-web",
        pullRequestNumber: 2847,
        headCommitSha: e2eGsid.commitHash,
      },
      rawDiff: {
        baseSha: "1111111111111111111111111111111111111111",
        headSha: e2eGsid.commitHash,
        files: [
          {
            path: "unknown.ts",
            patch: "@@ -1,1 +1,1 @@\n x\n",
          },
        ],
      },
    });

    const result = runAnalysisToImpactReport({
      identity: {
        repository: "acme/checkout-web",
        pullRequestNumber: 2847,
        headCommitSha: e2eGsid.commitHash,
      },
      gsid: e2eGsid,
      prChange,
      symbolIndex,
      snapshotProvider,
      workflowCatalog: new EmptyWorkflowCatalog(),
    });

    assert.deepEqual(result.report.claims, []);
    assert.equal(result.report.emptyReason, "NO_RESOLVED_SYMBOLS");
  });
});
