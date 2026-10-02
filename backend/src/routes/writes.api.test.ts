/**
 * Brief 18. The four write routes on places and events were registered with no
 * guard, so anyone could delete places or publish unreviewed events. They are
 * admin-only now, and deleting a row something still references is a 409, not
 * a 500.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { WardUnavailableError } from "../ward/ward.types.js";

let t: TestApp;
beforeEach(async () => {
  t = await buildTestApp();
});
afterEach(async () => {
  await t.close();
});

function loginAs(role: "user" | "admin"): string {
  const token = randomUUID();
  t.ward.signIn(token, `subject_${token}`, { prm: [role] });
  return `ward_session=${token}`;
}

const placeBody = {
  name: "Test hall",
  category: "park",
  city: "timisoara",
  lat: 45.75,
  lng: 21.23,
};

async function createPlace(cookie: string): Promise<string> {
  const res = await t.app.inject({
    method: "POST",
    url: "/api/places",
    headers: { cookie },
    payload: placeBody,
  });
  expect(res.statusCode).toBe(201);
  return (res.json() as { id: string }).id;
}

async function createEvent(cookie: string, placeId: string): Promise<string> {
  const res = await t.app.inject({
    method: "POST",
    url: "/api/events",
    headers: { cookie },
    payload: {
      placeId,
      title: "Show",
      category: "concert",
      startDate: "2030-01-01T18:00:00.000Z",
    },
  });
  expect(res.statusCode).toBe(201);
  return (res.json() as { id: string }).id;
}

/** Each route, as a request builder needing whatever ids it touches. */
async function routes(admin: string) {
  const placeId = await createPlace(admin);
  const eventId = await createEvent(admin, placeId);
  return [
    {
      name: "POST /api/places",
      method: "POST" as const,
      url: "/api/places",
      payload: placeBody,
      ok: 201,
    },
    {
      name: "DELETE /api/places/:id",
      method: "DELETE" as const,
      url: `/api/places/${await createPlace(admin)}`,
      ok: 204,
    },
    {
      name: "POST /api/events",
      method: "POST" as const,
      url: "/api/events",
      payload: {
        placeId,
        title: "Another",
        category: "concert",
        startDate: "2030-02-01T18:00:00.000Z",
      },
      ok: 201,
    },
    {
      name: "DELETE /api/events/:id",
      method: "DELETE" as const,
      url: `/api/events/${eventId}`,
      ok: 204,
    },
  ];
}

describe("the place and event write routes are admin-only", () => {
  it("anonymous → 401 on every route", async () => {
    for (const r of await routes(loginAs("admin"))) {
      const res = await t.app.inject({
        method: r.method,
        url: r.url,
        payload: r.payload,
      });
      expect(res.statusCode, r.name).toBe(401);
    }
  });

  it("prm:user → 403 on every route", async () => {
    const user = loginAs("user");
    for (const r of await routes(loginAs("admin"))) {
      const res = await t.app.inject({
        method: r.method,
        url: r.url,
        headers: { cookie: user },
        payload: r.payload,
      });
      expect(res.statusCode, r.name).toBe(403);
    }
  });

  it("Ward unavailable → 503 on every route", async () => {
    const list = await routes(loginAs("admin"));
    const cookie = loginAs("admin");
    t.ward.breakWith(new WardUnavailableError("down"));
    for (const r of list) {
      const res = await t.app.inject({
        method: r.method,
        url: r.url,
        headers: { cookie },
        payload: r.payload,
      });
      expect(res.statusCode, r.name).toBe(503);
    }
  });

  it("prm:admin → 201 / 204", async () => {
    const admin = loginAs("admin");
    for (const r of await routes(admin)) {
      const res = await t.app.inject({
        method: r.method,
        url: r.url,
        headers: { cookie: admin },
        payload: r.payload,
      });
      expect(res.statusCode, r.name).toBe(r.ok);
    }
  });
});

describe("deleting a row that is still referenced", () => {
  it("a place with an event → 409 PLACE_IN_USE, and the place is still there", async () => {
    const admin = loginAs("admin");
    const placeId = await createPlace(admin);
    await createEvent(admin, placeId);
    const res = await t.app.inject({
      method: "DELETE",
      url: `/api/places/${placeId}`,
      headers: { cookie: admin },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ code: "PLACE_IN_USE" });
    const still = await t.app.inject({
      method: "GET",
      url: `/api/places/${placeId}`,
    });
    expect(still.statusCode).toBe(200);
  });
});
