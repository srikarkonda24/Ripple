// Publishes GitHub Check Runs from deterministic ImpactReport output (Checks API only).
import type { FetchLike } from "./appAuth";
import { GitHubPublishError } from "./GitHubErrors";
import type { ImpactReport } from "../core/ImpactReport";
import { formatCheckRunOutput, type CheckRunOutput } from "../reporting/formatCheckOutput";

export type CheckPublishInput = {
  readonly repository: string;
  readonly headSha: string;
  readonly report: ImpactReport;
  readonly accessToken: string;
  readonly checkOutput?: CheckRunOutput;
};

export type CheckPublishResult = {
  readonly checkRunId: number;
  readonly htmlUrl: string | null;
};

export interface CheckPublisher {
  publish(input: CheckPublishInput): Promise<CheckPublishResult>;
}

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

export type GitHubCheckPublisherOptions = {
  readonly fetchFn?: FetchLike;
  readonly checkName?: string;
};

/**
 * Creates a completed GitHub Check Run using read-only repo access except Checks writes.
 */
export class GitHubCheckPublisher implements CheckPublisher {
  private readonly fetchFn: FetchLike;
  private readonly checkName: string;

  constructor(options?: GitHubCheckPublisherOptions) {
    this.fetchFn = options?.fetchFn ?? ((input, init) => fetch(input, init));
    this.checkName = options?.checkName ?? "Ripple Impact Analysis";
  }

  async publish(input: CheckPublishInput): Promise<CheckPublishResult> {
    if (input.accessToken.trim().length === 0) {
      throw new GitHubPublishError("GitHub access token must not be empty");
    }

    const { owner, repo } = splitRepository(input.repository);
    const output = input.checkOutput ?? formatCheckRunOutput(input.report);
    const conclusion = input.report.claims.length === 0 ? "neutral" : "success";

    const response = await this.fetchFn(
      `https://api.github.com/repos/${owner}/${repo}/check-runs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: this.checkName,
          head_sha: input.headSha,
          status: "completed",
          conclusion,
          output: {
            title: output.title,
            summary: output.summary,
            text: output.text,
          },
        }),
      },
    );

    if (!response.ok) {
      throw new GitHubPublishError(
        `GitHub check publish failed with status ${response.status}`,
      );
    }

    const body = (await response.json()) as { id?: number; html_url?: string | null };
    if (body.id === undefined) {
      throw new GitHubPublishError("GitHub check response missing id");
    }

    return { checkRunId: body.id, htmlUrl: body.html_url ?? null };
  }
}
