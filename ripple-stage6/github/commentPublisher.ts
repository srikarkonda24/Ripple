// Publishes or updates sticky PR comments keyed by AnalysisIdentity (Issues API only).
import type { FetchLike } from "./appAuth";
import { GitHubPublishError } from "./GitHubErrors";
import type { ImpactReport } from "../core/ImpactReport";
import {
  commentMarkerForIdentity,
  formatPullRequestCommentBody,
} from "../reporting/formatCommentBody";

export type CommentPublishInput = {
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly report: ImpactReport;
  readonly accessToken: string;
  readonly body?: string;
};

export type CommentPublishResult = {
  readonly commentId: number;
  readonly updated: boolean;
};

export interface CommentPublisher {
  publishOrUpdate(input: CommentPublishInput): Promise<CommentPublishResult>;
}

type GitHubComment = {
  readonly id: number;
  readonly body?: string;
};

/** Splits owner/repo for GitHub REST paths. */
function splitRepository(repository: string): { owner: string; repo: string } {
  const parts = repository.split("/");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    throw new GitHubPublishError(
      `Repository must be owner/repo, received "${repository}"`,
    );
  }
  return { owner: parts[0], repo: parts[1] };
}

export type GitHubCommentPublisherOptions = {
  readonly fetchFn?: FetchLike;
};

/**
 * Creates or updates a single PR comment per AnalysisIdentity marker.
 */
export class GitHubCommentPublisher implements CommentPublisher {
  private readonly fetchFn: FetchLike;

  constructor(options?: GitHubCommentPublisherOptions) {
    this.fetchFn = options?.fetchFn ?? ((input, init) => fetch(input, init));
  }

  async publishOrUpdate(input: CommentPublishInput): Promise<CommentPublishResult> {
    if (input.accessToken.trim().length === 0) {
      throw new GitHubPublishError("GitHub access token must not be empty");
    }

    const { owner, repo } = splitRepository(input.repository);
    const body = input.body ?? formatPullRequestCommentBody(input.report);
    const marker = commentMarkerForIdentity(input.report);

    const existing = await this.findExistingComment(
      owner,
      repo,
      input.pullRequestNumber,
      marker,
      input.accessToken,
    );

    if (existing !== undefined) {
      const response = await this.fetchFn(
        `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${input.accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ body }),
        },
      );
      if (!response.ok) {
        throw new GitHubPublishError(
          `GitHub comment update failed with status ${response.status}`,
        );
      }
      return { commentId: existing.id, updated: true };
    }

    const response = await this.fetchFn(
      `https://api.github.com/repos/${owner}/${repo}/issues/${input.pullRequestNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      },
    );

    if (!response.ok) {
      throw new GitHubPublishError(
        `GitHub comment create failed with status ${response.status}`,
      );
    }

    const created = (await response.json()) as { id?: number };
    if (created.id === undefined) {
      throw new GitHubPublishError("GitHub comment response missing id");
    }

    return { commentId: created.id, updated: false };
  }

  private async findExistingComment(
    owner: string,
    repo: string,
    pullRequestNumber: number,
    marker: string,
    accessToken: string,
  ): Promise<GitHubComment | undefined> {
    const response = await this.fetchFn(
      `https://api.github.com/repos/${owner}/${repo}/issues/${pullRequestNumber}/comments?per_page=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      },
    );

    if (!response.ok) {
      throw new GitHubPublishError(
        `GitHub comment list failed with status ${response.status}`,
      );
    }

    const comments = (await response.json()) as GitHubComment[];
    if (!Array.isArray(comments)) {
      return undefined;
    }

    return comments.find((comment) => (comment.body ?? "").includes(marker));
  }
}
