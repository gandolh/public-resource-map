import { afterEach, describe, expect, it } from "vitest";
import { buildTestApp, TEST_ORIGIN, type TestApp } from "../test/harness.js";
import { createFakeWard, WARD_ISSUER, type FakeWard } from "../test/fake-ward.js";

/**
 * Brief 24 (Ward's corpus): prm's own accounts through the shared library.
 * Local sign-in and registration, the guard over a mostly public app, and
 * "Sign in with Ward" wired to a Ward client.
 */

let t: TestApp;
afterEach(async () => {
  await t.close();
});

/** A browser `POST` from prm's own pages: the plugin refuses other origins. */
const post = (url: string, payload?: object, cookie?: string) =>
  t.app.inject({
    method: "POST",
    url,
    payload,
    headers: { origin: TEST_ORIGIN, ...(cookie ? { cookie } : {}) },
  });

/** `prm_session=<token>` from a response's `Set-Cookie`. */
function sessionCookie(res: { headers: Record<string, unknown> }): string {
  const header = [res.headers["set-cookie"]].flat().find((c) => String(c).startsWith("prm_session="));
  expect(header, "a prm_session cookie").toBeDefined();
  return String(header).split(";")[0]!;
}

const get = (url: string, cookie?: string) =>
  t.app.inject({ method: "GET", url, headers: cookie ? { cookie } : {} });

describe("local sign-in", () => {
  it("a seeded user signs in with their password, and the cookie is scoped to /prm-api", async () => {
    t = await buildTestApp();
    await t.app.auth.accounts.createUser({ username: "ana", password: "a long enough password", role: "user" });

    const res = await post("/auth/login", { username: "ana", password: "a long enough password" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ user: { username: "ana", role: "user" }, ward: { enabled: false } });
    const raw = String([res.headers["set-cookie"]].flat()[0]);
    expect(raw).toMatch(/Path=\/prm-api/);
    expect(raw).toMatch(/HttpOnly/);

    expect((await get("/api/favorites", sessionCookie(res))).statusCode).toBe(200);
  });

  it("a wrong password is invalid_credentials, the same answer as an unknown name", async () => {
    t = await buildTestApp();
    await t.app.auth.accounts.createUser({ username: "ana", password: "a long enough password", role: "user" });
    for (const body of [
      { username: "ana", password: "not the password" },
      { username: "nobody", password: "a long enough password" },
    ]) {
      const res = await post("/auth/login", body);
      expect(res.statusCode).toBe(401);
      expect(res.json()).toEqual({ error: "invalid_credentials" });
    }
  });
});

describe("local registration", () => {
  it("creates a user with the user role, signed in", async () => {
    t = await buildTestApp();
    const res = await post("/auth/register", { username: "dan", password: "a long enough password" });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ user: { username: "dan", role: "user", hasPassword: true } });

    const cookie = sessionCookie(res);
    expect((await get("/api/favorites", cookie)).statusCode).toBe(200);
    // A registered user is not an admin.
    expect((await get("/api/admin/sources", cookie)).statusCode).toBe(403);
  });

  it("refuses a taken name, whatever its case", async () => {
    t = await buildTestApp();
    await post("/auth/register", { username: "dan", password: "a long enough password" });
    const res = await post("/auth/register", { username: "DAN", password: "another long password" });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: "username_taken" });
  });

  it("refuses a request another origin's page sent", async () => {
    t = await buildTestApp();
    const res = await t.app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { username: "eve", password: "a long enough password" },
      headers: { origin: "https://evil.example" },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json()).toEqual({ error: "cross_site" });
  });
});

describe("the guard", () => {
  it("lets anonymous visitors read the public map", async () => {
    t = await buildTestApp();
    for (const url of [
      "/health",
      "/api/places",
      "/api/places/nope",
      "/api/places/nope/events",
      "/api/events",
      "/api/events/nope",
      "/api/whats-on",
      "/api/archive",
      "/auth/session",
    ]) {
      expect((await get(url)).statusCode, url).not.toBe(401);
    }
  });

  it("refuses the per-person routes to anonymous visitors", async () => {
    t = await buildTestApp();
    for (const url of ["/api/favorites", "/api/notifications", "/api/archive/mine", "/api/admin/sources"]) {
      const res = await get(url);
      expect(res.statusCode, url).toBe(401);
      expect(res.json(), url).toEqual({ error: "unauthorized" });
    }
  });

  it("an admin route is 403 for a user and open to an admin", async () => {
    t = await buildTestApp();
    expect((await get("/api/admin/sources", (await t.signIn("user")).cookie)).statusCode).toBe(403);
    expect((await get("/api/admin/sources", (await t.signIn("admin")).cookie)).statusCode).toBe(200);
  });

  it("refuses a session that began with Ward when Ward is not configured", async () => {
    t = await buildTestApp();
    const { accounts } = t.app.auth;
    const user = await accounts.createUser({ username: "ana", role: "user" });
    const { token } = await accounts.startSession(user.id, { origin: "ward", wardSid: "sid-1" });
    const res = await get("/api/favorites", `prm_session=${token}`);
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: "unauthorized", reason: "ward_unavailable" });
  });
});

describe("Sign in with Ward", () => {
  let ward: FakeWard;

  async function withWard() {
    ward = await createFakeWard();
    t = await buildTestApp({ ward: ward.client });
  }

  /** A user linked to `subject`, signed in through Ward under `wardSid`. */
  async function wardSession(subject: string, wardSid: string): Promise<string> {
    const user = await t.app.auth.identities.createLinkedUser({ subject, username: subject, role: "user" });
    const { token } = await t.app.auth.accounts.startSession(user.id, { origin: "ward", wardSid });
    return `prm_session=${token}`;
  }

  it("the session answer says Ward is on, so the login page shows the button", async () => {
    await withWard();
    expect((await get("/auth/session")).json()).toMatchObject({ user: null, ward: { enabled: true } });
  });

  it("start answers Ward's authorization URL for prm, coming back to prm's callback", async () => {
    await withWard();
    const res = await post("/auth/ward/start", { returnTo: "/prm/whats-on" });
    expect(res.statusCode).toBe(200);
    const url = new URL(res.json().url);
    expect(`${url.origin}${url.pathname}`).toBe(`${WARD_ISSUER}/auth`);
    expect(url.searchParams.get("client_id")).toBe("prm");
    expect(url.searchParams.get("redirect_uri")).toBe(`${TEST_ORIGIN}/prm-api/auth/ward/callback`);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    // The round trip's secrets ride a cookie scoped to the callback alone.
    const flow = [res.headers["set-cookie"]].flat().map(String).find((c) => c.startsWith("prm_session_ward="));
    expect(flow).toMatch(/Path=\/prm-api\/auth\/ward\/callback/);
  });

  it("start says ward_unavailable when Ward does not answer", async () => {
    await withWard();
    ward.stop();
    const res = await post("/auth/ward/start", {});
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({ error: "ward_unavailable" });
  });

  it("a Ward session lives while Ward vouches for it, and ends when Ward stops", async () => {
    await withWard();
    ward.liveSessions.add("sid-live");
    const live = await wardSession("ward-ana", "sid-live");
    expect((await get("/api/favorites", live)).statusCode).toBe(200);

    const ended = await wardSession("ward-dan", "sid-revoked");
    expect((await get("/api/favorites", ended)).json()).toEqual({ error: "unauthorized", reason: "ward_session_ended" });
  });

  it("with Ward down, a Ward session is refused and a local one keeps working", async () => {
    await withWard();
    ward.liveSessions.add("sid-live");
    const fromWard = await wardSession("ward-ana", "sid-live");
    const local = (await t.signIn("user")).cookie;
    ward.stop();

    expect((await get("/api/favorites", fromWard)).json()).toEqual({ error: "unauthorized", reason: "ward_unavailable" });
    expect((await get("/api/favorites", local)).statusCode).toBe(200);
  });

  it("settings can link from a local session (link answers a Ward URL)", async () => {
    await withWard();
    const { cookie } = await t.signIn("user");
    const res = await post("/auth/ward/link", {}, cookie);
    expect(res.statusCode).toBe(200);
    expect(res.json().url).toContain(`${WARD_ISSUER}/auth`);
  });
});
