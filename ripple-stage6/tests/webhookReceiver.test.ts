// Validates GitHub webhook signature verification and MVP event handling.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analysisIdentityKey } from "../core/AnalysisIdentity";
import {
  closedWebhookBody,
  openedWebhookBody,
  synchronizeWebhookBody,
} from "../fixtures/githubPullRequestPayloads";
import { UnsupportedWebhookEventError, WebhookSignatureError } from "../github/GitHubErrors";
import { processGitHubWebhook } from "../github/webhookReceiver";
import {
  buildWebhookSignature,
} from "../github/webhookSignature";
import { InMemoryAnalysisStore } from "../orchestration/AnalysisStore";
import { AnalysisRunner } from "../orchestration/AnalysisRunner";

const webhookSecret = "test-webhook-secret";

function processWithRunner(
  rawBody: string,
  eventName: string,
  runner: AnalysisRunner,
): ReturnType<typeof processGitHubWebhook> {
  return processGitHubWebhook({
    rawBody,
    webhookSecret,
    signatureHeader: buildWebhookSignature(rawBody, webhookSecret),
    eventName,
    payload: JSON.parse(rawBody) as unknown,
    runner,
  });
}

describe("GitHub webhook receiver", () => {
  it("accepts a valid webhook signature", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);
    assert.doesNotThrow(() =>
      processWithRunner(openedWebhookBody, "pull_request", runner),
    );
  });

  it("rejects an invalid webhook signature", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);
    assert.throws(
      () =>
        processGitHubWebhook({
          rawBody: openedWebhookBody,
          webhookSecret,
          signatureHeader: "sha256=invalid",
          eventName: "pull_request",
          payload: JSON.parse(openedWebhookBody) as unknown,
          runner,
        }),
      WebhookSignatureError,
    );
  });

  it("rejects unsupported GitHub events", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);
    assert.throws(
      () => processWithRunner(openedWebhookBody, "issues", runner),
      UnsupportedWebhookEventError,
    );
  });

  it("rejects unsupported pull_request actions such as closed", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);
    assert.throws(
      () => processWithRunner(closedWebhookBody, "pull_request", runner),
      UnsupportedWebhookEventError,
    );
  });

  it("creates analysis for pull_request opened", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 1);
    const result = processWithRunner(openedWebhookBody, "pull_request", runner);
    assert.equal(result.created, true);
    assert.equal(result.record.status, "Queued");
    assert.equal(
      analysisIdentityKey(result.identity),
      "acme/checkout-web#2847@a1b2c3d4e5f6789012345678901234567890abcd",
    );
    assert.equal(store.size(), 1);
  });

  it("creates analysis for pull_request synchronize", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 2);
    const result = processWithRunner(
      synchronizeWebhookBody,
      "pull_request",
      runner,
    );
    assert.equal(result.created, true);
    assert.equal(result.record.status, "Queued");
    assert.equal(store.size(), 1);
  });

  it("preserves identity idempotency on duplicate delivery", () => {
    const store = new InMemoryAnalysisStore();
    const runner = new AnalysisRunner(store, () => 3);
    const first = processWithRunner(openedWebhookBody, "pull_request", runner);
    const second = processWithRunner(openedWebhookBody, "pull_request", runner);
    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(store.size(), 1);
    assert.equal(first.record.createdAt, second.record.createdAt);
  });
});
