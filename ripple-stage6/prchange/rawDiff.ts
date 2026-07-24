// Raw pull request diff material returned by read-only GitHub diff retrieval.
export type RawChangedFileDiff = {
  readonly path: string;
  readonly patch: string | null;
};

export type RawPullRequestDiff = {
  readonly baseSha: string;
  readonly headSha: string;
  readonly files: readonly RawChangedFileDiff[];
};

export type PullRequestDiffRequest = {
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly baseSha: string;
  readonly headSha: string;
};
