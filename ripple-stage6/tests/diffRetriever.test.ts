// Validates read-only GitHub pull request diff retrieval.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GitHubPullRequestDiffRetriever,
} from "../prchange/DiffRetriever";
import { DiffRetrievalError } from "../prchange/PRChangeErrors";

describe("GitHubPullRequestDiffRetriever", () => {
  it("retrieves raw file patches using read-only GET", async () => {
    const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
      assert.match(
        input,
        /\/repos\/acme\/checkout-web\/pulls\/2847\/files/,
      );
      assert.equal(init?.method ?? "GET", "GET");
      const headers = init?.headers as Record<string, string> | undefined;
      assert.match(headers?.Authorization ?? "", /^Bearer ghs_test/);
      return new Response(
        JSON.stringify([
          {
            filename: "src/a.ts",
            patch: "@@ -1,1 +1,2 @@\n a\n+b\n",
          },
        ]),
        { status: 200 },
      );
    };

    const retriever = new GitHubPullRequestDiffRetriever({ fetchFn });
    const raw = await retriever.fetchPullRequestDiff(
      {
        repository: "acme/checkout-web",
        pullRequestNumber: 2847,
        baseSha: "base",
        headSha: "head",
      },
      "ghs_test",
    );

    assert.equal(raw.baseSha, "base");
    assert.equal(raw.headSha, "head");
    assert.equal(raw.files.length, 1);
    assert.equal(raw.files[0]?.path, "src/a.ts");
  });

  it("throws when GitHub returns a non-success status", async () => {
    const retriever = new GitHubPullRequestDiffRetriever({
      fetchFn: async () => new Response("nope", { status: 404 }),
    });
    await assert.rejects(
      () =>
        retriever.fetchPullRequestDiff(
          {
            repository: "acme/repo",
            pullRequestNumber: 1,
            baseSha: "a",
            headSha: "b",
          },
          "token",
        ),
      DiffRetrievalError,
    );
  });
});
