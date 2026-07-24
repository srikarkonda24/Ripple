// Builds deterministic PRChange objects from raw pull request diff material.
import type { AnalysisIdentity } from "../core/AnalysisIdentity";
import type { ChangedFile, PRChange } from "../core/PRChange";
import { normalizeCommitSha, normalizeChangedFilePath } from "./pathNormalize";
import { PRChangeValidationError } from "./PRChangeErrors";
import type { RawChangedFileDiff, RawPullRequestDiff } from "./rawDiff";
import {
  assertValidUnifiedPatch,
  lineRangesFromUnifiedPatch,
} from "./unifiedDiffParser";

export type PRChangeBuildInput = {
  readonly identity: AnalysisIdentity;
  readonly rawDiff: RawPullRequestDiff;
};

/** Compares changed files by normalized path for deterministic ordering. */
function compareChangedFilePaths(left: string, right: string): number {
  if (left < right) {
    return -1;
  }
  if (left > right) {
    return 1;
  }
  return 0;
}

/** Converts one raw file diff entry into a normalized ChangedFile. */
function changedFileFromRaw(rawFile: RawChangedFileDiff): ChangedFile {
  const path = normalizeChangedFilePath(rawFile.path);
  if (rawFile.patch === null) {
    return { path, hunks: [] };
  }

  assertValidUnifiedPatch(rawFile.patch);
  const ranges = lineRangesFromUnifiedPatch(rawFile.patch);
  if (ranges.length === 0) {
    return { path, hunks: [] };
  }

  return {
    path,
    hunks: [{ ranges }],
  };
}

/**
 * Builds an immutable PRChange with deterministic file order and line ranges.
 */
export function buildPRChange(input: PRChangeBuildInput): PRChange {
  if (input.rawDiff.files.length === 0) {
    return {
      identity: input.identity,
      baseSha: normalizeCommitSha(input.rawDiff.baseSha),
      headSha: normalizeCommitSha(input.rawDiff.headSha),
      files: [],
    };
  }

  const filesByPath = new Map<string, ChangedFile>();

  for (const rawFile of input.rawDiff.files) {
    const normalized = changedFileFromRaw(rawFile);
    const existing = filesByPath.get(normalized.path);
    if (existing !== undefined) {
      throw new PRChangeValidationError(
        `Duplicate changed file path after normalization: "${normalized.path}"`,
      );
    }
    filesByPath.set(normalized.path, normalized);
  }

  const files = [...filesByPath.values()].sort((left, right) =>
    compareChangedFilePaths(left.path, right.path),
  );

  return {
    identity: input.identity,
    baseSha: normalizeCommitSha(input.rawDiff.baseSha),
    headSha: normalizeCommitSha(input.rawDiff.headSha),
    files,
  };
}

/** Serializes PRChange for golden determinism tests (stable key order). */
export function serializePRChangeForTest(prChange: PRChange): string {
  return JSON.stringify(prChange);
}
