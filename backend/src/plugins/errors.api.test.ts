import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Fastify from "fastify";
import { WardUnavailableError } from "./auth/index.js";
import { errors } from "./errors.js";
import { buildTestApp, type TestApp } from "../test/harness.js";

describe("the error and not-found handlers", () => {
  let t: TestApp;

  beforeEach(async () => {
    t = await buildTestApp();
  });

  afterEach(async () => {
    await t.close();
  });

  it("answers a thrown error with a fixed 500, never its message", async () => {
    // The database closed under the app: better-sqlite3 throws "The database connection is not open".
    t.sqlite.close();
    const res = await t.app.inject({ method: "GET", url: "/api/places" });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ code: "INTERNAL", message: "Something went wrong on the server." });
    expect(res.body).not.toMatch(/database|connection|not open/i);
  });

  it("keeps a 4xx Fastify raised itself: malformed JSON stays a 400 with Fastify's code", async () => {
    const { cookie } = await t.signIn("admin");
    const res = await t.app.inject({
      method: "POST",
      url: "/api/places",
      headers: { cookie, "content-type": "application/json" },
      payload: "{{{",
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ code: "FST_ERR_CTP_INVALID_JSON_BODY" });
  });

  it("answers an unknown route with the repo's body, once signed in", async () => {
    const { cookie } = await t.signIn("user");
    const res = await t.app.inject({ method: "GET", url: "/api/nothing", headers: { cookie } });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ code: "NOT_FOUND", message: "Route GET:/api/nothing not found" });
  });

  it("still refuses a signed-out caller on an unknown route, as on any route not listed as public", async () => {
    const res = await t.app.inject({ method: "GET", url: "/api/nothing" });
    expect(res.statusCode).toBe(401);
  });
});

describe("a 5xx that carries its status", () => {
  it("keeps a 503 (Ward unreachable) with a fixed message, never the thrown one", async () => {
    const app = Fastify();
    await app.register(errors);
    app.get("/down", async () => {
      throw new WardUnavailableError("session-status answered 502 from ward.internal");
    });
    const res = await app.inject({ method: "GET", url: "/down" });
    await app.close();
    expect(res.statusCode).toBe(503);
    expect(res.json()).toEqual({
      code: "UNAVAILABLE",
      message: "A service prm relies on is not answering. Try again later.",
    });
  });
});
