// Generates GitHub App JWTs and exchanges them for installation access tokens.
import { createSign } from "node:crypto";
import type { GitHubAppConfig } from "./config";
import { GitHubAuthenticationError } from "./GitHubErrors";

export type InstallationAccessToken = {
  readonly token: string;
  readonly expiresAt: string;
};

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

/** Encodes bytes as a JWT base64url segment without padding. */
function base64UrlEncode(value: Buffer | string): string {
  const buffer = typeof value === "string" ? Buffer.from(value, "utf8") : value;
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

/**
 * Creates a short-lived GitHub App JWT signed with the app private key.
 */
export function createGitHubAppJwt(
  config: Pick<GitHubAppConfig, "appId" | "privateKeyPem">,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iat: nowSeconds - 60,
      exp: nowSeconds + 600,
      iss: config.appId,
    }),
  );
  const signingInput = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256")
    .update(signingInput)
    .sign(config.privateKeyPem);
  return `${signingInput}.${base64UrlEncode(signature)}`;
}

/**
 * Exchanges a GitHub App JWT for an installation access token (read-only boundary).
 */
export async function createInstallationAccessToken(
  config: Pick<GitHubAppConfig, "appId" | "privateKeyPem">,
  installationId: number,
  options?: {
    readonly nowSeconds?: number;
    readonly fetchFn?: FetchLike;
  },
): Promise<InstallationAccessToken> {
  if (!Number.isInteger(installationId) || installationId <= 0) {
    throw new GitHubAuthenticationError("Installation id must be a positive integer");
  }

  const fetchFn = options?.fetchFn ?? defaultFetch;
  const jwt = createGitHubAppJwt(config, options?.nowSeconds);
  const response = await fetchFn(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new GitHubAuthenticationError(
      `Installation token exchange failed with status ${response.status}`,
    );
  }

  const body = (await response.json()) as {
    token?: string;
    expires_at?: string;
  };
  if (body.token === undefined || body.expires_at === undefined) {
    throw new GitHubAuthenticationError(
      "Installation token response missing required fields",
    );
  }

  return { token: body.token, expiresAt: body.expires_at };
}
