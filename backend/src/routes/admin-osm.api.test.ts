import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";


let t: TestApp;
beforeEach(async () => {
  t = await buildTestApp();
});
afterEach(async () => {
  await t.close();
});

/**
 * A signed-in caller holding exactly `prm:<role>`, as a cookie header.
 *
 * The grant is the whole point: prm no longer has a `user.role` column, so
 * "is this person an admin" is a question about Ward's `(subject, "prm", role)`
 * triple and nothing else. `signIn` writes only the grant asked for, so the
 * `prm:user` case below is a genuine non-admin rather than an admin with a
 * flag turned off.
 */
function loginAs(role: "user" | "admin"): string {
  const token = randomUUID();
  t.ward.signIn(token, `subject_${token}`, { prm: [role] });
  return `ward_session=${token}`;
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
    const cookie = loginAs("user");
    const res = await t.app.inject({
      method: "POST",
      url: "/api/admin/osm/sync",
      headers: { cookie },
      payload: { city: "timisoara" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("400s an admin on an unknown city (gate passed, validation reached)", async () => {
    const cookie = loginAs("admin");
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
