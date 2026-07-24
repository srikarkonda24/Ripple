// Defines GitHub integration errors for webhook and authentication boundaries.
import { Stage6Error } from "../core/Stage6Error";

/** Thrown when a webhook HMAC signature does not match the payload. */
export class WebhookSignatureError extends Stage6Error {
  constructor() {
    super("Webhook signature validation failed");
    this.name = "WebhookSignatureError";
  }
}

/** Thrown when an event or action is outside the MVP webhook allowlist. */
export class UnsupportedWebhookEventError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedWebhookEventError";
  }
}

/** Thrown when GitHub App configuration from the environment is invalid. */
export class GitHubConfigError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubConfigError";
  }
}

/** Thrown when GitHub App authentication or token exchange fails. */
export class GitHubAuthenticationError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubAuthenticationError";
  }
}

/** Thrown when GitHub Check or comment publishing fails. */
export class GitHubPublishError extends Stage6Error {
  constructor(message: string) {
    super(message);
    this.name = "GitHubPublishError";
  }
}
