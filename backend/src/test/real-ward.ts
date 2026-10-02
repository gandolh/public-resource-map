import { SignJWT, exportJWK, generateKeyPair, type JWK } from "jose";

/**
 * A real-crypto stand-in for Ward, for tests of prm's **real** Ward client
 * (`fake-ward.ts` replaces the client instead). Real EdDSA keys, real signed
 * tokens, and Ward's two endpoints served from an injected `fetch`.
 */

export const ORIGIN = "http://ward.test";
export const BASE = "/ward-api";

export interface Keys {
  privateKey: CryptoKey;
  jwk: JWK;
}

export async function makeKeys(kid: string): Promise<Keys> {
  const { privateKey, publicKey } = await generateKeyPair("EdDSA", { extractable: true });
  return { privateKey, jwk: { ...(await exportJWK(publicKey)), kid, alg: "EdDSA", use: "sig" } };
}

/** A token shaped like Ward's: EdDSA, `ward-estate` audience, every required claim. */
export function signToken(keys: Keys, kid = keys.jwk.kid!): Promise<string> {
  return new SignJWT({ sid: "device-1" })
    .setProtectedHeader({ alg: "EdDSA", kid, typ: "JWT" })
    .setSubject("subject-1")
    .setJti("jti-1")
    .setIssuer(ORIGIN)
    .setAudience("ward-estate")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(keys.privateKey);
}

type Handler = (url: URL) => Response | Promise<Response>;

/** A fake Ward behind the injected fetch: one handler per endpoint. */
export function wardFetch(routes: { jwks: Handler; introspect?: Handler }): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    if (url.pathname === `${BASE}/.well-known/jwks.json`) return routes.jwks(url);
    if (url.pathname === `${BASE}/introspect` && routes.introspect) return routes.introspect(url);
    return new Response("not found", { status: 404 });
  }) as typeof fetch;
}

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
