import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { user } from "../db/schema.js";
import { createSession } from "../lib/auth-internals.js";
import { SESSION_COOKIE } from "../plugins/auth.js";

let t: TestApp;
beforeEach(async () => {
  t = await buildTestApp();
});
afterEach(async () => {
  await t.close();
});

/** Create a user with the given role and return a session cookie header for it. */
async function loginAs(role: "user" | "admin"): Promise<string> {
  const id = randomUUID();
  await t.db.insert(user).values({
    id,
    email: `${role}-${id}@example.com`,
    passwordHash: "x",
    role,
  });
  const sess = await createSession(t.db, id);
  return `${SESSION_COOKIE}=${sess.id}`;
}

describe("POST /api/admin/osm/sync — admin gate", () => {
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
