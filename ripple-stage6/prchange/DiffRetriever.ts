// Retrieves pull request file diffs from GitHub using read-only API access.
import type { FetchLike } from "../github/appAuth";
import { DiffRetrievalError } from "./PRChangeErrors";
import type { PullRequestDiffRequest, RawPullRequestDiff } from "./rawDiff";

export interface DiffRetriever {
  fetchPullRequestDiff(
    request: PullRequestDiffRequest,
    accessToken: string,
  ): Promise<RawPullRequestDiff>;
}

export type GitHubPullRequestDiffRetrieverOptions = {
  readonly fetchFn?: FetchLike;
};

type GitHubPullFileResponse = {
  readonly filename?: string;
  readonly patch?: string | null;
};

/** Splits owner/repo from the normalized repository string. */
function splitRepository(repository: string): { owner: string; repo: string } {
  const parts = repository.split("/");
  if (parts.length !== 2 || parts[0] === undefined || parts[1] === undefined) {
    throw new DiffRetrievalError(
      `Repository must be owner/repo, received "${repository}"`,
    );
  }
  return { owner: parts[0], repo: parts[1] };
}

/**
 * Read-only GitHub diff retriever using the pull request files endpoint.
 */
export class GitHubPullRequestDiffRetriever implements DiffRetriever {
  private readonly fetchFn: FetchLike;

  constructor(options?: GitHubPullRequestDiffRetrieverOptions) {
    this.fetchFn = options?.fetchFn ?? ((input, init) => fetch(input, init));
  }

  async fetchPullRequestDiff(
    request: PullRequestDiffRequest,
    accessToken: string,
  ): Promise<RawPullRequestDiff> {
    if (accessToken.trim().length === 0) {
      throw new DiffRetrievalError("GitHub access token must not be empty");
    }

    const { owner, repo } = splitRepository(request.repository);
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${request.pullRequestNumber}/files?per_page=100`;

    const response = await this.fetchFn(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      throw new DiffRetrievalError(
        `GitHub diff retrieval failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as GitHubPullFileResponse[];
    if (!Array.isArray(body)) {
      throw new DiffRetrievalError("GitHub diff response was not an array");
    }

    const files = body.map((entry) => {
      if (typeof entry.filename !== "string" || entry.filename.length === 0) {
        throw new DiffRetrievalError("GitHub diff entry missing filename");
      }
      const patch =
        entry.patch === undefined || entry.patch === null
          ? null
          : String(entry.patch);
      return {
        path: entry.filename,
        patch,
      };
    });

    return {
      baseSha: request.baseSha,
      headSha: request.headSha,
      files,
    };
  }
}
