// Validates GitHub webhook HMAC signatures on raw request bodies.
import { createHmac, timingSafeEqual } from "node:crypto";
import { WebhookSignatureError } from "./GitHubErrors";

const SIGNATURE_PREFIX = "sha256=";

/** Builds the X-Hub-Signature-256 header value for tests and outbound tooling. */
export function buildWebhookSignature(
  rawBody: string,
  webhookSecret: string,
): string {
  const digest = createHmac("sha256", webhookSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  return `${SIGNATURE_PREFIX}${digest}`;
}

/**
 * Verifies GitHub webhook signature; throws WebhookSignatureError when invalid.
 */
export function assertValidWebhookSignature(
  rawBody: string,
  webhookSecret: string,
  signatureHeader: string | undefined,
): void {
  if (signatureHeader === undefined || signatureHeader.trim().length === 0) {
    throw new WebhookSignatureError();
  }
  const expected = buildWebhookSignature(rawBody, webhookSecret);
  const received = signatureHeader.trim();
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new WebhookSignatureError();
  }
}
