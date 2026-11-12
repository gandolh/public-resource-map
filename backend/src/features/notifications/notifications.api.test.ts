import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp, type TestApp } from "../../test/harness.js";

describe("the inbox routes' schemas", () => {
  let t: TestApp;
  let cookie: string;

  beforeAll(async () => {
    t = await buildTestApp();
    cookie = (await t.signIn("user")).cookie;
  });

  afterAll(async () => {
    await t.close();
  });

  it("answers an empty inbox through its schema, never cached", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/notifications", headers: { cookie } });
    expect(res.statusCode).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.json()).toEqual({ unread: 0, data: [] });
  });

  it("refuses a body that is neither ids nor all with INVALID_BODY", async () => {
    for (const payload of [{ ids: [] }, { all: false }, { ids: "x" }]) {
      const res = await t.app.inject({ method: "POST", url: "/api/notifications/read", headers: { cookie }, payload });
      expect(res.statusCode).toBe(400);
      expect(res.json<{ code: string }>().code).toBe("INVALID_BODY");
    }
  });

  it("marks everything read", async () => {
    const res = await t.app.inject({
      method: "POST",
      url: "/api/notifications/read",
      headers: { cookie },
      payload: { all: true },
    });
    expect(res.json()).toEqual({ read: 0 });
  });
});
