// Defines normalized pull request change material produced from Git diffs (Phase 3+).
import type { AnalysisIdentity } from "./AnalysisIdentity";

export type LineRange = {
  readonly startLine: number;
  readonly endLine: number;
};

export type ChangedFileHunk = {
  readonly ranges: readonly LineRange[];
};

export type ChangedFile = {
  readonly path: string;
  readonly language?: string;
  readonly hunks: readonly ChangedFileHunk[];
};

export type PRChange = {
  readonly identity: AnalysisIdentity;
  readonly baseSha: string;
  readonly headSha: string;
  readonly files: readonly ChangedFile[];
};

export type ImpactEmptyReason =
  | "NO_RESOLVED_SYMBOLS"
  | "NO_EVIDENCE"
  | "SNAPSHOT_UNAVAILABLE";
