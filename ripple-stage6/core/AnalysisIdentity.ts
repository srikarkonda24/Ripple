// Defines immutable analysis identity for a pull request at a specific head commit.
import { AnalysisIdentityValidationError } from "./Stage6Error";

export type AnalysisIdentity = {
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly headCommitSha: string;
};

/** Input before normalization; callers may pass raw GitHub strings. */
export type AnalysisIdentityInput = {
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly headCommitSha: string;
};

/**
 * Normalizes repository to owner/repo with lowercase owner and repo segments.
 * Strips whitespace, removes optional .git suffix, rejects empty segments.
 */
export function normalizeRepository(repository: string): string {
  const trimmed = repository.trim();
  if (trimmed.length === 0) {
    throw new AnalysisIdentityValidationError("Repository must not be empty");
  }
  const withoutGit = trimmed.replace(/\.git$/i, "");
  const parts = withoutGit.split("/").filter((segment) => segment.length > 0);
  if (parts.length !== 2) {
    throw new AnalysisIdentityValidationError(
      `Repository must be owner/repo, received "${repository}"`,
    );
  }
  const owner = parts[0]!.trim().toLowerCase();
  const repo = parts[1]!.trim().toLowerCase();
  if (owner.length === 0 || repo.length === 0) {
    throw new AnalysisIdentityValidationError("Repository owner and name must not be empty");
  }
  return `${owner}/${repo}`;
}

/** Normalizes commit SHA to lowercase hex without surrounding whitespace. */
export function normalizeHeadCommitSha(headCommitSha: string): string {
  const trimmed = headCommitSha.trim().toLowerCase();
  if (trimmed.length === 0) {
    throw new AnalysisIdentityValidationError("Head commit SHA must not be empty");
  }
  if (!/^[0-9a-f]+$/.test(trimmed)) {
    throw new AnalysisIdentityValidationError(
      "Head commit SHA must contain only hexadecimal characters",
    );
  }
  return trimmed;
}

/** Validates pull request number is a positive integer. */
export function normalizePullRequestNumber(pullRequestNumber: number): number {
  if (!Number.isInteger(pullRequestNumber) || pullRequestNumber <= 0) {
    throw new AnalysisIdentityValidationError(
      "Pull request number must be a positive integer",
    );
  }
  return pullRequestNumber;
}

/**
 * Builds a canonical AnalysisIdentity from raw inputs using frozen normalization rules.
 */
export function createAnalysisIdentity(input: AnalysisIdentityInput): AnalysisIdentity {
  return {
    repository: normalizeRepository(input.repository),
    pullRequestNumber: normalizePullRequestNumber(input.pullRequestNumber),
    headCommitSha: normalizeHeadCommitSha(input.headCommitSha),
  };
}

/**
 * Canonical stable key: repository#pullRequestNumber@headCommitSha
 * Identity must already be normalized via createAnalysisIdentity.
 */
export function analysisIdentityKey(identity: AnalysisIdentity): string {
  return `${identity.repository}#${identity.pullRequestNumber}@${identity.headCommitSha}`;
}
