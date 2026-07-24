// Loads GitHub App and webhook configuration from environment variables only.
import { GitHubConfigError } from "./GitHubErrors";

export type GitHubAppConfig = {
  readonly appId: string;
  readonly privateKeyPem: string;
  readonly webhookSecret: string;
};

/** Reads required GitHub App settings without logging secret material. */
export function loadGitHubAppConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): GitHubAppConfig {
  const appId = env.GITHUB_APP_ID?.trim();
  if (appId === undefined || appId.length === 0) {
    throw new GitHubConfigError("GITHUB_APP_ID is required");
  }

  const privateKeyPem = normalizePrivateKey(env.GITHUB_PRIVATE_KEY);
  if (privateKeyPem.length === 0) {
    throw new GitHubConfigError("GITHUB_PRIVATE_KEY is required");
  }

  const webhookSecret = env.GITHUB_WEBHOOK_SECRET?.trim();
  if (webhookSecret === undefined || webhookSecret.length === 0) {
    throw new GitHubConfigError("GITHUB_WEBHOOK_SECRET is required");
  }

  return { appId, privateKeyPem, webhookSecret };
}

/** Converts escaped newlines in env PEM strings into real PEM line breaks. */
function normalizePrivateKey(raw: string | undefined): string {
  if (raw === undefined) {
    return "";
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "";
  }
  return trimmed.replace(/\\n/g, "\n");
}
