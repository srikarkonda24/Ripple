// Receives GitHub webhooks, validates signatures, and enqueues analysis by identity.
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { AnalysisRecord } from "../core/AnalysisRecord";
import type { AnalysisRunner } from "../orchestration/AnalysisRunner";
import {
  isMvpPullRequestAction,
  isMvpPullRequestEvent,
} from "./eventTypes";
import { UnsupportedWebhookEventError } from "./GitHubErrors";
import {
  analysisIdentityFromPullRequestPayload,
  isGitHubPullRequestWebhookPayload,
} from "./pullRequestPayload";
import { assertValidWebhookSignature } from "./webhookSignature";

export type WebhookProcessInput = {
  readonly rawBody: string;
  readonly webhookSecret: string;
  readonly signatureHeader: string | undefined;
  readonly eventName: string | undefined;
  readonly payload: unknown;
  readonly runner: AnalysisRunner;
};

export type WebhookProcessResult = {
  readonly identity: AnalysisIdentity;
  readonly record: AnalysisRecord;
  readonly created: boolean;
};

/**
 * Validates and processes an MVP pull_request webhook, enqueueing analysis by identity.
 */
export function processGitHubWebhook(input: WebhookProcessInput): WebhookProcessResult {
  assertValidWebhookSignature(
    input.rawBody,
    input.webhookSecret,
    input.signatureHeader,
  );

  const eventName = input.eventName?.trim();
  if (eventName === undefined || eventName.length === 0) {
    throw new UnsupportedWebhookEventError("Missing X-GitHub-Event header");
  }
  if (!isMvpPullRequestEvent(eventName)) {
    throw new UnsupportedWebhookEventError(
      `Unsupported GitHub event "${eventName}"`,
    );
  }
  if (!isGitHubPullRequestWebhookPayload(input.payload)) {
    throw new UnsupportedWebhookEventError("Invalid pull_request webhook payload");
  }

  const action = input.payload.action;
  if (!isMvpPullRequestAction(action)) {
    throw new UnsupportedWebhookEventError(
      `Unsupported pull_request action "${action}"`,
    );
  }

  const identity = analysisIdentityFromPullRequestPayload(input.payload);
  const enqueue = input.runner.receiveRequest(identity);
  return {
    identity,
    record: enqueue.record,
    created: enqueue.created,
  };
}
