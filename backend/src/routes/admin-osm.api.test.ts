import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../test/harness.js";
import type { OverpassFetcher, OverpassResponse } from "../lib/osm-sync.js";

let t: TestApp;

/**
 * A signed-in local user with exactly `role`, as a cookie header. The role is
 * prm's own (`auth_users.role`), so the `user` case below is a genuine
 * non-admin rather than an admin with a flag turned off.
 */
async function loginAs(role: "user" | "admin"): Promise<string> {
  return (await t.signIn(role)).cookie;
}

describe("POST /api/admin/osm/sync — admin gate", () => {
  beforeEach(async () => {
    t = await buildTestApp();
  });
  afterEach(async () => {
    await t.close();
  });

  it("401s an anonymous request", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/osm/sync",
      payload: { city: "timisoara" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("403s a non-admin user", async () => {
    const cookie = await loginAs("user");
    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/osm/sync",
      headers: { cookie },
      payload: { city: "timisoara" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("400s an admin on an unknown city (gate passed, validation reached)", async () => {
    const cookie = await loginAs("admin");
    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/osm/sync",
      headers: { cookie },
      payload: { city: "atlantis" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().code).toBe("UNKNOWN_CITY");
  });
});

describe("POST /api/admin/osm/sync — Overpass trouble (brief 33)", () => {
  afterEach(async () => {
    await t.close();
  });

  const sync = (cookie: string) =>
    t.app.inject({ method: "POST", url: "/api/admin/osm/sync", headers: { cookie }, payload: { city: "timisoara" } });

  it("answers 409 to a second sync of a city that is still syncing", async () => {
    let answer!: (r: OverpassResponse) => void;
    let reached!: () => void;
    const reachedOverpass = new Promise<void>((r) => (reached = r));
    const held: OverpassFetcher = () => {
      reached();
      return new Promise((resolve) => (answer = resolve));
    };
    t = await buildTestApp({ osm: { fetchOverpass: held } });
    const cookie = await loginAs("admin");

    const first = sync(cookie);
    await reachedOverpass;
    const second = await sync(cookie);
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: "SYNC_IN_PROGRESS" });
    expect(second.json().message).toMatch(/already running/);

    answer({ elements: [] });
    expect((await first).statusCode).toBe(200);
  });

  it("answers 504 with a clear message when Overpass does not answer in time", async () => {
    const hung: OverpassFetcher = (_q, signal) =>
      new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(signal.reason)));
    t = await buildTestApp({ osm: { fetchOverpass: hung, timeoutMs: 20 } });

    const res = await sync(await loginAs("admin"));
    expect(res.statusCode).toBe(504);
    expect(res.json()).toMatchObject({ code: "OVERPASS_TIMEOUT" });
    expect(res.json().message).toMatch(/did not answer/);
  });
});
