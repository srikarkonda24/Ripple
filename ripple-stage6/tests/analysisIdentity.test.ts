// Validates AnalysisIdentity normalization and canonical keys.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analysisIdentityKey,
  createAnalysisIdentity,
} from "../core/AnalysisIdentity";
import { AnalysisIdentityValidationError } from "../core/Stage6Error";
import {
  sampleIdentity,
  sampleIdentityDifferentSha,
  sampleIdentitySameShaDifferentCasing,
} from "../fixtures/sampleIdentity";

describe("AnalysisIdentity", () => {
  it("produces the same identity for the same repository, PR, and SHA", () => {
    const first = createAnalysisIdentity({
      repository: "acme/checkout-web",
      pullRequestNumber: 2847,
      headCommitSha: "abc123",
    });
    const second = createAnalysisIdentity({
      repository: "Acme/Checkout-Web",
      pullRequestNumber: 2847,
      headCommitSha: "ABC123",
    });
    assert.equal(analysisIdentityKey(first), analysisIdentityKey(second));
  });

  it("normalizes repository casing and .git suffix into one canonical key", () => {
    const identity = createAnalysisIdentity({
      repository: "  Acme/Checkout-Web.git  ",
      pullRequestNumber: 1,
      headCommitSha: "ff",
    });
    assert.equal(identity.repository, "acme/checkout-web");
    assert.equal(analysisIdentityKey(identity), "acme/checkout-web#1@ff");
  });

  it("uses different keys when head commit SHA differs", () => {
    assert.notEqual(
      analysisIdentityKey(sampleIdentity),
      analysisIdentityKey(sampleIdentityDifferentSha),
    );
  });

  it("matches fixture identities that differ only by input casing", () => {
    assert.equal(
      analysisIdentityKey(sampleIdentity),
      analysisIdentityKey(sampleIdentitySameShaDifferentCasing),
    );
  });

  it("rejects invalid repository shape", () => {
    assert.throws(
      () =>
        createAnalysisIdentity({
          repository: "not-a-valid-repo",
          pullRequestNumber: 1,
          headCommitSha: "aa",
        }),
      AnalysisIdentityValidationError,
    );
  });

  it("rejects non-positive pull request numbers", () => {
    assert.throws(
      () =>
        createAnalysisIdentity({
          repository: "acme/repo",
          pullRequestNumber: 0,
          headCommitSha: "aa",
        }),
      AnalysisIdentityValidationError,
    );
  });
});
