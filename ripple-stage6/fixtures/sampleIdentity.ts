// Sample AnalysisIdentity inputs for tests and local fixtures.
import { createAnalysisIdentity } from "../core/AnalysisIdentity";

export const sampleIdentityInput = {
  repository: "Acme/Checkout-Web",
  pullRequestNumber: 2847,
  headCommitSha: "A1B2C3D4E5F6789012345678901234567890ABCD",
} as const;

export const sampleIdentity = createAnalysisIdentity(sampleIdentityInput);

export const sampleIdentitySameShaDifferentCasing = createAnalysisIdentity({
  repository: "acme/checkout-web",
  pullRequestNumber: 2847,
  headCommitSha: "a1b2c3d4e5f6789012345678901234567890abcd",
});

export const sampleIdentityDifferentSha = createAnalysisIdentity({
  repository: "acme/checkout-web",
  pullRequestNumber: 2847,
  headCommitSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
});
