import { beforeAll, describe, expect, it } from "vitest";
import { SignJWT, UnsecuredJWT, base64url } from "jose";
import { createWardClient } from "./ward.client.js";
import {
  WardAuthenticationError,
  WardConfigurationError,
  WardUnavailableError,
} from "./ward.types.js";
import { BASE, ORIGIN, json, makeKeys, signToken, wardFetch, type Keys } from "../test/real-ward.js";

function client(fetchImpl: typeof fetch) {
  return createWardClient({ publicOrigin: ORIGIN, apiBasePath: BASE, appKey: "k", fetch: fetchImpl });
}

const ACTIVE = { active: true, subject: "subject-1", username: "ana", grants: { prm: ["user"] } };

// Brief 21: a key set Ward cannot serve was read as "this token is invalid", so
// a Ward outage told signed-in people they were signed out.
describe("Ward client: key-set failures", () => {
  let keys: Keys;

  beforeAll(async () => {
    keys = await makeKeys("ward-key-1");
  });

  it("a JWKS fetch that throws is Ward unavailable", async () => {
    const ward = client(wardFetch({ jwks: () => { throw new TypeError("fetch failed"); } }));
    const token = await signToken(keys);
    await expect(ward.authenticate(`ward_session=${token}`)).rejects.toBeInstanceOf(WardUnavailableError);
  });

  it("a JWKS answering 500 is Ward unavailable", async () => {
    const ward = client(wardFetch({ jwks: () => new Response("boom", { status: 500 }) }));
    const token = await signToken(keys);
    await expect(ward.authenticate(`ward_session=${token}`)).rejects.toBeInstanceOf(WardUnavailableError);
  });

  it("a valid token with a live session resolves the caller", async () => {
    const ward = client(
      wardFetch({ jwks: () => json({ keys: [keys.jwk] }), introspect: () => json(ACTIVE) }),
    );
    const token = await signToken(keys);
    await expect(ward.authenticate(`ward_session=${token}`)).resolves.toMatchObject({
      subject: "subject-1",
      username: "ana",
      sid: "device-1",
    });
  });

  it("a token signed by a key Ward does not publish is still an authentication error", async () => {
    const stranger = await makeKeys("not-wards");
    const ward = client(
      wardFetch({ jwks: () => json({ keys: [keys.jwk] }), introspect: () => json(ACTIVE) }),
    );
    const token = await signToken(stranger);
    const err = await ward.authenticate(`ward_session=${token}`).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WardAuthenticationError);
    expect(err).not.toBeInstanceOf(WardUnavailableError);
  });
});

// Brief 26: the real client is security code and had no tests; every API test
// swaps it for `fake-ward.ts`. Ported from Ward's reference suites
// (`wzd_auth/client/src/*.test.ts`), adapted to prm's single client.

/** Ward-shaped claims, with whatever a case needs to change. */
function claims(keys: Keys, edit: (jwt: SignJWT) => SignJWT = (j) => j): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const base = new SignJWT({ sid: "device-1" })
    .setProtectedHeader({ alg: "EdDSA", kid: keys.jwk.kid!, typ: "JWT" })
    .setSubject("subject-1")
    .setJti("jti-1")
    .setIssuer(ORIGIN)
    .setAudience("ward-estate")
    .setIssuedAt(now)
    .setExpirationTime(now + 300);
  return edit(base).sign(keys.privateKey);
}

describe("Ward client: verify", () => {
  let keys: Keys;
  let ward: ReturnType<typeof client>;

  beforeAll(async () => {
    keys = await makeKeys("ward-key-1");
    ward = client(wardFetch({ jwks: () => json({ keys: [keys.jwk] }) }));
  });

  const rejects = (token: Promise<string> | string) =>
    expect(Promise.resolve(token).then((t) => ward.verify(t))).rejects.toBeInstanceOf(
      WardAuthenticationError,
    );

  it("accepts a valid token", async () => {
    await expect(ward.verify(await claims(keys))).resolves.toMatchObject({
      sub: "subject-1",
      sid: "device-1",
    });
  });

  it("rejects alg: none", async () => {
    const unsigned = new UnsecuredJWT({ sid: "device-1", jti: "jti-1" })
      .setSubject("subject-1")
      .setIssuer(ORIGIN)
      .setAudience("ward-estate")
      .setIssuedAt()
      .setExpirationTime("5m")
      .encode();
    await rejects(unsigned);
  });

  it("rejects HS256 keyed with the public key's own bytes", async () => {
    const secret = base64url.decode(keys.jwk.x!);
    const forged = new SignJWT({ sid: "device-1" })
      .setProtectedHeader({ alg: "HS256", kid: keys.jwk.kid!, typ: "JWT" })
      .setSubject("subject-1")
      .setJti("jti-1")
      .setIssuer(ORIGIN)
      .setAudience("ward-estate")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(secret);
    await rejects(forged);
  });

  it("rejects the wrong issuer", async () => {
    await rejects(claims(keys, (j) => j.setIssuer("http://evil.test")));
  });

  it("rejects the wrong audience", async () => {
    await rejects(claims(keys, (j) => j.setAudience("some-other-app")));
  });

  it("rejects a token without sid", async () => {
    const now = Math.floor(Date.now() / 1000);
    await rejects(
      new SignJWT({})
        .setProtectedHeader({ alg: "EdDSA", kid: keys.jwk.kid!, typ: "JWT" })
        .setSubject("subject-1")
        .setJti("jti-1")
        .setIssuer(ORIGIN)
        .setAudience("ward-estate")
        .setIssuedAt(now)
        .setExpirationTime(now + 300)
        .sign(keys.privateKey),
    );
  });

  it("rejects a token expired beyond the 5s tolerance", async () => {
    const now = Math.floor(Date.now() / 1000);
    await rejects(claims(keys, (j) => j.setIssuedAt(now - 600).setExpirationTime(now - 30)));
  });

  it("accepts a token expired within the tolerance", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await claims(keys, (j) => j.setIssuedAt(now - 600).setExpirationTime(now - 2));
    await expect(ward.verify(token)).resolves.toMatchObject({ sub: "subject-1" });
  });
});

describe("Ward client: introspect", () => {
  const withIntrospect = (handler: Parameters<typeof wardFetch>[0]["introspect"], extra = {}) =>
    createWardClient({
      publicOrigin: ORIGIN,
      apiBasePath: BASE,
      appKey: "k",
      fetch: wardFetch({ jwks: () => json({ keys: [] }), introspect: handler }),
      ...extra,
    });

  it("200 active is the session", async () => {
    await expect(withIntrospect(() => json(ACTIVE)).introspect("t")).resolves.toEqual({
      active: true,
      subject: "subject-1",
      username: "ana",
      grants: { prm: ["user"] },
    });
  });

  it("200 inactive is { active: false }", async () => {
    await expect(withIntrospect(() => json({ active: false })).introspect("t")).resolves.toEqual({
      active: false,
    });
  });

  it("401 is prm's own key being refused: a configuration error", async () => {
    await expect(
      withIntrospect(() => new Response("", { status: 401 })).introspect("t"),
    ).rejects.toBeInstanceOf(WardConfigurationError);
  });

  it("500 is Ward unavailable, never an inactive session", async () => {
    const err = await withIntrospect(() => new Response("", { status: 500 }))
      .introspect("t")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(WardUnavailableError);
    expect(err).not.toBeInstanceOf(WardConfigurationError);
  });

  it("a non-JSON body is Ward unavailable", async () => {
    await expect(
      withIntrospect(() => new Response("<html>", { status: 200 })).introspect("t"),
    ).rejects.toBeInstanceOf(WardUnavailableError);
  });

  it("active without a subject is Ward unavailable", async () => {
    await expect(
      withIntrospect(() => json({ active: true, username: "ana", grants: {} })).introspect("t"),
    ).rejects.toBeInstanceOf(WardUnavailableError);
  });

  it("a request that never answers times out as Ward unavailable", async () => {
    const hang = (_url: URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      });
    await expect(
      withIntrospect(hang, { introspectTimeoutMs: 20 }).introspect("t"),
    ).rejects.toBeInstanceOf(WardUnavailableError);
  });
});

describe("Ward client: introspection cache", () => {
  function counted() {
    let calls = 0;
    let clock = 1_000_000;
    const ward = createWardClient({
      publicOrigin: ORIGIN,
      apiBasePath: BASE,
      appKey: "k",
      now: () => clock,
      fetch: wardFetch({
        jwks: () => json({ keys: [] }),
        introspect: () => {
          calls += 1;
          return json(ACTIVE);
        },
      }),
    });
    return { ward, calls: () => calls, advance: (ms: number) => (clock += ms) };
  }

  it("answers a repeat inside 30 seconds from the cache", async () => {
    const c = counted();
    await c.ward.introspect("a");
    c.advance(29_000);
    await c.ward.introspect("a");
    expect(c.calls()).toBe(1);
  });

  it("asks Ward again once 30 seconds have passed", async () => {
    const c = counted();
    await c.ward.introspect("a");
    c.advance(30_001);
    await c.ward.introspect("a");
    expect(c.calls()).toBe(2);
  });

  it("keys the cache per token, never per subject", async () => {
    // Both tokens resolve to the same subject; revoking one must not be
    // masked by the other's cached answer.
    const c = counted();
    await c.ward.introspect("a");
    await c.ward.introspect("b");
    expect(c.calls()).toBe(2);
  });

  it("collapses concurrent calls for one cold token into one request", async () => {
    const c = counted();
    await Promise.all([c.ward.introspect("a"), c.ward.introspect("a"), c.ward.introspect("a")]);
    expect(c.calls()).toBe(1);
  });
});

describe("Ward client: cookie", () => {
  const ward = client(wardFetch({ jwks: () => json({ keys: [] }) }));

  it("reads nothing from an absent header", () => {
    expect(ward.readAccessCookie(undefined)).toBeUndefined();
  });

  it("treats a cleared cookie as absent, not as an empty token", () => {
    expect(ward.readAccessCookie("ward_session=")).toBeUndefined();
  });

  it("finds it among several cookies", () => {
    expect(ward.readAccessCookie("a=1; ward_session=tok; b=2")).toBe("tok");
  });

  it("reads an array header", () => {
    expect(ward.readAccessCookie(["a=1", "ward_session=tok"])).toBe("tok");
  });

  it("does not match a name that merely contains ward_session", () => {
    expect(ward.readAccessCookie("not_ward_session=x; ward_session_old=y")).toBeUndefined();
  });
});

describe("Ward client: authenticate", () => {
  let keys: Keys;

  beforeAll(async () => {
    keys = await makeKeys("ward-key-1");
  });

  it("an inactive session is an authentication error", async () => {
    const ward = client(
      wardFetch({ jwks: () => json({ keys: [keys.jwk] }), introspect: () => json({ active: false }) }),
    );
    await expect(
      ward.authenticate(`ward_session=${await signToken(keys)}`),
    ).rejects.toBeInstanceOf(WardAuthenticationError);
  });

  it("sends prm's app key on the introspection request", async () => {
    let sent: string | null = null;
    const ward = client(
      wardFetch({
        jwks: () => json({ keys: [keys.jwk] }),
        introspect: (_url, init) => {
          sent = new Headers(init?.headers).get("x-ward-app-key");
          return json(ACTIVE);
        },
      }),
    );
    await ward.authenticate(`ward_session=${await signToken(keys)}`);
    expect(sent).toBe("k");
  });
});
