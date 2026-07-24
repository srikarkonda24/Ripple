// GitHub pull_request webhook JSON fixtures for Phase 2 tests.
export function buildPullRequestWebhookBody(input: {
  readonly action: string;
  readonly repository: string;
  readonly number: number;
  readonly headSha: string;
}): string {
  return JSON.stringify({
    action: input.action,
    pull_request: {
      number: input.number,
      head: { sha: input.headSha },
    },
    repository: { full_name: input.repository },
  });
}

export const openedWebhookBody = buildPullRequestWebhookBody({
  action: "opened",
  repository: "Acme/Checkout-Web",
  number: 2847,
  headSha: "a1b2c3d4e5f6789012345678901234567890abcd",
});

export const synchronizeWebhookBody = buildPullRequestWebhookBody({
  action: "synchronize",
  repository: "acme/checkout-web",
  number: 2847,
  headSha: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
});

export const closedWebhookBody = buildPullRequestWebhookBody({
  action: "closed",
  repository: "acme/checkout-web",
  number: 2847,
  headSha: "a1b2c3d4e5f6789012345678901234567890abcd",
});
