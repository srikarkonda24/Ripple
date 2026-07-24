// Validates deterministic PRChange construction from unified diffs.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAnalysisIdentity } from "../core/AnalysisIdentity";
import {
  malformedPatchBadHunkHeader,
  malformedPatchMissingHunk,
  samplePatchTwoFiles,
  samplePatchUnorderedPaths,
} from "../fixtures/unifiedDiffSamples";
import { sampleIdentity } from "../fixtures/sampleIdentity";
import {
  buildPRChange,
  serializePRChangeForTest,
} from "../prchange/PRChangeBuilder";
import { PRChangeValidationError } from "../prchange/PRChangeErrors";
import type { RawPullRequestDiff } from "../prchange/rawDiff";
import { mergeLineRanges } from "../prchange/unifiedDiffParser";

const baseSha = "1111111111111111111111111111111111111111";
const headSha = "a1b2c3d4e5f6789012345678901234567890abcd";

function rawDiffFromFixtures(
  files: readonly { path: string; patch: string | null }[],
): RawPullRequestDiff {
  return { baseSha, headSha, files };
}

describe("PRChangeBuilder", () => {
  it("produces identical PRChange for the same diff bytes", () => {
    const raw = rawDiffFromFixtures([...samplePatchTwoFiles]);
    const first = buildPRChange({ identity: sampleIdentity, rawDiff: raw });
    const second = buildPRChange({ identity: sampleIdentity, rawDiff: raw });
    assert.equal(serializePRChangeForTest(first), serializePRChangeForTest(second));
  });

  it("orders changed files by normalized path ascending", () => {
    const raw = rawDiffFromFixtures([...samplePatchUnorderedPaths]);
    const prChange = buildPRChange({ identity: sampleIdentity, rawDiff: raw });
    assert.deepEqual(
      prChange.files.map((file) => file.path),
      ["a-first.ts", "z-last.ts"],
    );
  });

  it("normalizes changed file paths deterministically", () => {
    const raw = rawDiffFromFixtures([...samplePatchTwoFiles]);
    const prChange = buildPRChange({ identity: sampleIdentity, rawDiff: raw });
    assert.deepEqual(
      prChange.files.map((file) => file.path),
      ["lib/b.ts", "src/a.ts"],
    );
  });

  it("derives stable merged line ranges from unified hunks", () => {
    const raw = rawDiffFromFixtures([...samplePatchTwoFiles]);
    const prChange = buildPRChange({ identity: sampleIdentity, rawDiff: raw });
    const srcFile = prChange.files.find((file) => file.path === "src/a.ts");
    assert.deepEqual(srcFile?.hunks[0]?.ranges, [{ startLine: 10, endLine: 12 }]);
    assert.deepEqual(mergeLineRanges([{ startLine: 10, endLine: 11 }, { startLine: 12, endLine: 13 }]), [
      { startLine: 10, endLine: 13 },
    ]);
  });

  it("handles empty diff with no changed files", () => {
    const prChange = buildPRChange({
      identity: sampleIdentity,
      rawDiff: { baseSha, headSha, files: [] },
    });
    assert.deepEqual(prChange.files, []);
    assert.equal(prChange.baseSha, baseSha);
    assert.equal(prChange.headSha, headSha);
    assert.equal(prChange.identity.repository, sampleIdentity.repository);
  });

  it("fails closed on malformed diff missing hunk headers", () => {
    assert.throws(
      () =>
        buildPRChange({
          identity: sampleIdentity,
          rawDiff: rawDiffFromFixtures([
            { path: "bad.ts", patch: malformedPatchMissingHunk },
          ]),
        }),
      PRChangeValidationError,
    );
  });

  it("fails closed on malformed hunk header syntax", () => {
    assert.throws(
      () =>
        buildPRChange({
          identity: sampleIdentity,
          rawDiff: rawDiffFromFixtures([
            { path: "bad.ts", patch: malformedPatchBadHunkHeader },
          ]),
        }),
      PRChangeValidationError,
    );
  });

  it("binds AnalysisIdentity and normalized SHAs on output", () => {
    const identity = createAnalysisIdentity({
      repository: "Acme/Repo",
      pullRequestNumber: 9,
      headCommitSha: headSha.toUpperCase(),
    });
    const prChange = buildPRChange({
      identity,
      rawDiff: rawDiffFromFixtures([]),
    });
    assert.equal(prChange.identity.repository, "acme/repo");
    assert.equal(prChange.headSha, headSha);
  });
});
