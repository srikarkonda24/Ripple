// Validates GitHub App JWT creation and installation token exchange.
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { describe, it } from "node:test";
import {
  createGitHubAppJwt,
  createInstallationAccessToken,
} from "../github/appAuth";
import { GitHubAuthenticationError } from "../github/GitHubErrors";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privateKeyPem = privateKey.export({ type: "pkcs1", format: "pem" });
const appConfig = {
  appId: "12345",
  privateKeyPem: privateKeyPem.toString(),
};

describe("GitHub App authentication", () => {
  it("creates a three-segment RS256 JWT for the app id", () => {
    const jwt = createGitHubAppJwt(appConfig, 1_700_000_000);
    const segments = jwt.split(".");
    assert.equal(segments.length, 3);
    const payload = JSON.parse(
      Buffer.from(segments[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    ) as { iss: string; iat: number; exp: number };
    assert.equal(payload.iss, "12345");
    assert.equal(payload.iat, 1_700_000_000 - 60);
    assert.equal(payload.exp, 1_700_000_000 + 600);
  });

  it("exchanges JWT for an installation access token via GitHub API", async () => {
    const fetchFn = async (input: string, init?: RequestInit): Promise<Response> => {
      assert.match(input, /\/app\/installations\/99\/access_tokens$/);
      const headers = init?.headers as Record<string, string> | undefined;
      assert.match(headers?.Authorization ?? "", /^Bearer /);
      return new Response(
        JSON.stringify({
          token: "ghs_installation_token",
          expires_at: "2030-01-01T00:00:00Z",
        }),
        { status: 201 },
      );
    };

    const token = await createInstallationAccessToken(appConfig, 99, {
      nowSeconds: 1_700_000_000,
      fetchFn,
    });
    assert.equal(token.token, "ghs_installation_token");
    assert.equal(token.expiresAt, "2030-01-01T00:00:00Z");
  });

  it("throws when installation token exchange fails", async () => {
    const fetchFn = async (): Promise<Response> =>
      new Response("error", { status: 401 });

    await assert.rejects(
      () =>
        createInstallationAccessToken(appConfig, 99, {
          nowSeconds: 1_700_000_000,
          fetchFn,
        }),
      GitHubAuthenticationError,
    );
  });
});
