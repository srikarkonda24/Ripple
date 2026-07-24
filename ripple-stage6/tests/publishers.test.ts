// Validates GitHub Check and comment publishers with mocked API calls.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GitHubCheckPublisher } from "../github/checkPublisher";
import { GitHubCommentPublisher } from "../github/commentPublisher";
import { sampleIdentity } from "../fixtures/sampleIdentity";
import { changedSymbolB, integrationGsid } from "../fixtures/stage5SnapshotFixtures";
import { buildImpactReport } from "../reporting/ImpactReportBuilder";
import type { ImpactClaim } from "../core/ImpactReport";
import { commentMarkerForIdentity } from "../reporting/formatCommentBody";

const claim: ImpactClaim = {
  changedSymbol: changedSymbolB,
  queryType: "CALLERS",
  affectedNodeIds: ["X-caller"],
  graphPath: ["X-caller", "B"],
  evidenceId: "evidence-001",
  relationshipSummary:
    "Symbol functionB has CALLERS relationship to X-caller through path X-caller → B.",
};

const report = buildImpactReport({
  identity: sampleIdentity,
  gsid: integrationGsid,
  changedSymbols: [changedSymbolB],
  claims: [claim],
});

describe("GitHubCheckPublisher", () => {
  it("posts a completed check run using Checks API only", async () => {
    let method = "";
    const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
      method = init?.method ?? "GET";
      assert.match(input, /\/repos\/acme\/checkout-web\/check-runs$/);
      return new Response(JSON.stringify({ id: 99, html_url: "https://example.com/check/99" }), {
        status: 201,
      });
    };

    const publisher = new GitHubCheckPublisher({ fetchFn });
    const result = await publisher.publish({
      repository: sampleIdentity.repository,
      headSha: sampleIdentity.headCommitSha,
      report,
      accessToken: "ghs_test",
    });

    assert.equal(method, "POST");
    assert.equal(result.checkRunId, 99);
  });
});

describe("GitHubCommentPublisher", () => {
  it("updates an existing sticky comment instead of creating duplicates", async () => {
    const marker = commentMarkerForIdentity(report);
    const calls: string[] = [];

    const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push(`${init?.method ?? "GET"} ${input}`);
      if (input.includes("/comments?")) {
        return new Response(
          JSON.stringify([{ id: 501, body: `${marker}\nold body` }]),
          { status: 200 },
        );
      }
      if (init?.method === "PATCH") {
        return new Response(JSON.stringify({ id: 501 }), { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    };

    const publisher = new GitHubCommentPublisher({ fetchFn });
    const result = await publisher.publishOrUpdate({
      repository: sampleIdentity.repository,
      pullRequestNumber: sampleIdentity.pullRequestNumber,
      report,
      accessToken: "ghs_test",
    });

    assert.equal(result.updated, true);
    assert.equal(result.commentId, 501);
    assert.equal(calls.some((call) => call.startsWith("PATCH")), true);
    assert.equal(calls.some((call) => call.startsWith("POST")), false);
  });
});
