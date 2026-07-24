// Extracts AnalysisIdentity fields from GitHub pull_request webhook payloads.
import { createAnalysisIdentity } from "../core/AnalysisIdentity";
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import { Stage6Error } from "../core/Stage6Error";

export type GitHubPullRequestWebhookPayload = {
  readonly action: string;
  readonly pull_request: {
    readonly number: number;
    readonly head: { readonly sha: string };
  };
  readonly repository: {
    readonly full_name: string;
  };
};

/** Returns true when value matches the minimal pull_request webhook shape. */
export function isGitHubPullRequestWebhookPayload(
  value: unknown,
): value is GitHubPullRequestWebhookPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  const pullRequest = record.pull_request;
  const repository = record.repository;
  if (typeof record.action !== "string") {
    return false;
  }
  if (typeof pullRequest !== "object" || pullRequest === null) {
    return false;
  }
  const pr = pullRequest as Record<string, unknown>;
  if (typeof pr.number !== "number") {
    return false;
  }
  const head = pr.head;
  if (typeof head !== "object" || head === null) {
    return false;
  }
  if (typeof (head as Record<string, unknown>).sha !== "string") {
    return false;
  }
  if (typeof repository !== "object" || repository === null) {
    return false;
  }
  if (typeof (repository as Record<string, unknown>).full_name !== "string") {
    return false;
  }
  return true;
}

/** Maps a validated pull_request payload to a normalized AnalysisIdentity. */
export function analysisIdentityFromPullRequestPayload(
  payload: GitHubPullRequestWebhookPayload,
): AnalysisIdentity {
  try {
    return createAnalysisIdentity({
      repository: payload.repository.full_name,
      pullRequestNumber: payload.pull_request.number,
      headCommitSha: payload.pull_request.head.sha,
    });
  } catch (error) {
    if (error instanceof Stage6Error) {
      throw error;
    }
    throw new Stage6Error("Failed to derive AnalysisIdentity from webhook payload");
  }
}
