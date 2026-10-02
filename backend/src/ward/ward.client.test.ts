import { beforeAll, describe, expect, it } from "vitest";
import { createWardClient } from "./ward.client.js";
import { WardAuthenticationError, WardUnavailableError } from "./ward.types.js";
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
