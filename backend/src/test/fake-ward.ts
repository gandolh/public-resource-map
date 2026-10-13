import { generateKeyPairSync } from "node:crypto";
import { createWardClient, type WardClient } from "../../vendor/ward/ward-auth.js";
import { TEST_ORIGIN } from "./harness.js";

/**
 * A stand-in Ward behind an injected `fetch`, for tests that need "Sign in
 * with Ward" turned on. The client is the library's **real** one, with a
 * real Ed25519 client key; only the network is fake. It serves discovery,
 * `/session-status` and `/notify`, which is what prm's own code reaches: the
 * code exchange is the library's to test, against a real Ward.
 */

export const WARD_ISSUER = "https://ward.test/ward-api/oidc";
export const REDIRECT_URI = `${TEST_ORIGIN}/prm-api/auth/ward/callback`;

export interface FakeWard {
  client: WardClient;
  /** Every `/notify` body Ward accepted, in order (`client_assertion` left out). */
  mails: { subject: string; mailSubject: string; text: string }[];
  /** `/session-status` answers active for these Ward session ids only. */
  liveSessions: Set<string>;
  /** Make every request fail the way a stopped Ward does. */
  stop(): void;
}

function clientKey(): string {
  const { privateKey } = generateKeyPairSync("ed25519");
  const jwk = { ...privateKey.export({ format: "jwk" }), kid: "prm-test" };
  return Buffer.from(JSON.stringify(jwk), "utf8").toString("base64url");
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function createFakeWard(): Promise<FakeWard> {
  const mails: FakeWard["mails"] = [];
  const liveSessions = new Set<string>();
  let stopped = false;

  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    if (stopped) throw new TypeError("fetch failed");
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const body = typeof init?.body === "string" ? (JSON.parse(init.body) as Record<string, unknown>) : {};
    switch (url.pathname) {
      case "/ward-api/oidc/.well-known/openid-configuration":
        return json({
          issuer: WARD_ISSUER,
          authorization_endpoint: `${WARD_ISSUER}/auth`,
          token_endpoint: `${WARD_ISSUER}/token`,
          jwks_uri: `${WARD_ISSUER}/jwks`,
          end_session_endpoint: `${WARD_ISSUER}/session/end`,
          response_types_supported: ["code"],
          code_challenge_methods_supported: ["S256"],
          id_token_signing_alg_values_supported: ["EdDSA"],
          token_endpoint_auth_methods_supported: ["private_key_jwt"],
        });
      case "/ward-api/session-status":
        return json(
          liveSessions.has(String(body.wardSid)) ? { active: true, role: "user" } : { active: false },
        );
      case "/ward-api/notify":
        mails.push({
          subject: String(body.subject),
          mailSubject: String(body.mailSubject),
          text: String(body.text),
        });
        return json({ sent: true });
      default:
        return new Response("not found", { status: 404 });
    }
  }) as typeof fetch;

  const client = await createWardClient({
    issuer: WARD_ISSUER,
    clientId: "prm",
    clientKey: clientKey(),
    redirectUri: REDIRECT_URI,
    fetch: fetchImpl,
  });
  return {
    client,
    mails,
    liveSessions,
    stop() {
      stopped = true;
    },
  };
}
