import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../harness.js";

/**
 * What a request that fails its input check gets, by where the input is: the
 * code names the place (`INVALID_QUERY`, `INVALID_BODY`), and the message names
 * the field. The message's wording is zod's, so these tests only ask that it
 * names the field. An id in the path is a plain string: an unknown one is a
 * 404 from the handler, never a 400, so the path has no failing case.
 */
describe("input validation replies", () => {
  let t: TestApp;
  let admin: string;
  let user: string;

  beforeAll(async () => {
    t = await buildTestApp();
    admin = (await t.signIn("admin")).cookie;
    user = (await t.signIn("user")).cookie;
  });

  afterAll(async () => {
    await t.close();
  });

  it("a bad query is INVALID_QUERY, naming the field", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/places?lat=north" });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ code: string; message: string }>();
    expect(body.code).toBe("INVALID_QUERY");
    expect(body.message).toContain("lat");
  });

  it("a bad body is INVALID_BODY, naming the field", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/api/events",
      headers: { cookie: admin },
      payload: { placeId: "p1", title: "Show", category: "concert", startDate: "tomorrow" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json<{ code: string; message: string }>();
    expect(body.code).toBe("INVALID_BODY");
    expect(body.message).toContain("startDate");
  });

  it("any id in the path reaches the handler: an unknown one is a 404, not a 400", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/places/not%20a%20uuid" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ code: "NOT_FOUND", message: "Place not found" });
  });

  it("the admin check runs before the body check: a plain user with a bad body gets 403", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/api/places",
      headers: { cookie: user },
      payload: { name: "" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("a signed-out caller with a bad body gets 401", async () => {
    const res = await t.app.inject({ method: "POST", url: "/api/events", payload: { title: 1 } });
    expect(res.statusCode).toBe(401);
  });
});
