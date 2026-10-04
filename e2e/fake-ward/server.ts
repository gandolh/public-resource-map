import http from "node:http";
import { randomUUID } from "node:crypto";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

/**
 * A stand-in Ward for the e2e suite (decided 2026-10-04: signed-in e2e runs
 * against a fake Ward, not the local container).
 *
 * The backend under test talks to it exactly as it talks to Ward: it verifies
 * the `ward_session` token against this JWKS (EdDSA, issuer, audience, `sid`)
 * and introspects it with prm's app key. Only sign-in is fake: a spec asks
 * `POST /ward-api/test/sign-in` for a token and sets it as the cookie, instead
 * of walking Ward's login page.
 *
 * Never part of the app. Playwright starts it (playwright.config.ts) on a port
 * of its own, and it holds nothing but in-memory sessions.
 */

const PORT = Number(process.env.FAKE_WARD_PORT ?? 3102);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const BASE = "/ward-api";
const APP_KEY = process.env.FAKE_WARD_APP_KEY ?? "e2e-app-key";
const AUDIENCE = "ward-estate";
const KID = "e2e-key";

interface Session {
  active: boolean;
  subject: string;
  username: string;
  grants: Record<string, string[]>;
}

const sessions = new Map<string, Session>(); // by token

async function body(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
}

function send(res: http.ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

async function main() {
  const { publicKey, privateKey } = await generateKeyPair("EdDSA", { crv: "Ed25519" });
  const jwk = { ...(await exportJWK(publicKey)), kid: KID, alg: "EdDSA", use: "sig" };

  const server = http.createServer(async (req, res) => {
    const path = req.url?.split("?")[0] ?? "";
    try {
      if (req.method === "GET" && path === `${BASE}/.well-known/jwks.json`) {
        return send(res, 200, { keys: [jwk] });
      }

      if (req.method === "POST" && path === `${BASE}/introspect`) {
        if (req.headers["x-ward-app-key"] !== APP_KEY) return send(res, 401, { error: "bad app key" });
        const { accessToken } = await body(req);
        const session = typeof accessToken === "string" ? sessions.get(accessToken) : undefined;
        if (!session?.active) return send(res, 200, { active: false });
        const { subject, username, grants } = session;
        return send(res, 200, { active: true, subject, username, grants });
      }

      // Test-only: mint a session the way Ward's login would.
      if (req.method === "POST" && path === `${BASE}/test/sign-in`) {
        const input = await body(req);
        const subject = String(input.subject ?? `e2e-${randomUUID()}`);
        const username = String(input.username ?? subject);
        const grants = (input.grants as Record<string, string[]>) ?? { prm: ["user"] };
        const now = Math.floor(Date.now() / 1000);
        const token = await new SignJWT({ sid: `sid-${randomUUID()}` })
          .setProtectedHeader({ alg: "EdDSA", kid: KID, typ: "JWT" })
          .setSubject(subject)
          .setJti(randomUUID())
          .setIssuer(ORIGIN)
          .setAudience(AUDIENCE)
          .setIssuedAt(now)
          .setExpirationTime(now + 15 * 60)
          .sign(privateKey);
        sessions.set(token, { active: true, subject, username, grants });
        return send(res, 200, { token, subject });
      }

      if (req.method === "GET" && path === `${BASE}/health`) return send(res, 200, { ok: true });
      send(res, 404, { error: "not found" });
    } catch (err) {
      send(res, 500, { error: String(err) });
    }
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`fake Ward on ${ORIGIN}${BASE}`);
  });
}

// Not top-level await: the repo root is not an ES module package.
void main();
