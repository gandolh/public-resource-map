import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { resetToken, verificationToken, user } from "../db/schema.js";
import { SESSION_COOKIE } from "../plugins/auth.js";

let ctx: TestApp;
beforeEach(async () => {
  ctx = await buildTestApp();
});
afterEach(async () => {
  await ctx.close();
});

function sessionCookie(res: { cookies: Array<{ name: string; value: string }> }) {
  const c = res.cookies.find((x) => x.name === SESSION_COOKIE);
  return c ? `${SESSION_COOKIE}=${c.value}` : undefined;
}

type Body = Record<string, unknown>;
const register = (body: Body) =>
  ctx.app.inject({ method: "POST", url: "/api/auth/register", payload: body });
const login = (body: Body) =>
  ctx.app.inject({ method: "POST", url: "/api/auth/login", payload: body });

const CREDS = { email: "Alice@Example.com", password: "supersecret1" };

describe("auth API — register / login / me / logout", () => {
  it("registers a user, logs in, resolves /me, and logs out", async () => {
    const reg = await register({ ...CREDS, displayName: "Alice" });
    expect(reg.statusCode).toBe(201);
    const regBody = reg.json();
    expect(regBody.user.email).toBe("alice@example.com"); // normalized
    expect(regBody.user.emailVerified).toBe(false);
    expect(regBody.user.role).toBe("user");
    expect(regBody.user.passwordHash).toBeUndefined();
    // register does not open a session
    expect(sessionCookie(reg)).toBeUndefined();

    const li = await login(CREDS);
    expect(li.statusCode).toBe(200);
    const cookie = sessionCookie(li);
    expect(cookie).toBeDefined();
    // httpOnly + SameSite flags present on the Set-Cookie
    const setCookie = li.headers["set-cookie"] as string;
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");

    const me = await ctx.app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: cookie! },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json().user.email).toBe("alice@example.com");

    const meAnon = await ctx.app.inject({ method: "GET", url: "/api/auth/me" });
    expect(meAnon.statusCode).toBe(401);

    const out = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/logout",
      headers: { cookie: cookie! },
    });
    expect(out.statusCode).toBe(200);

    // session is dead server-side even reusing the old cookie
    const meAfter = await ctx.app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { cookie: cookie! },
    });
    expect(meAfter.statusCode).toBe(401);
  });

  it("rejects duplicate email (409) and bad credentials (401)", async () => {
    await register(CREDS);
    const dup = await register(CREDS);
    expect(dup.statusCode).toBe(409);

    expect((await login({ email: CREDS.email, password: "wrong" })).statusCode).toBe(401);
    expect((await login({ email: "nobody@example.com", password: "x" })).statusCode).toBe(401);
  });

  it("validates bodies (400)", async () => {
    expect((await register({ email: "bad", password: "short" })).statusCode).toBe(400);
    expect((await login({ email: "bad" })).statusCode).toBe(400);
  });
});

describe("auth API — verify flow (single-use)", () => {
  it("consumes a verify token once, marks verified, rejects replay", async () => {
    await register(CREDS);
    const tokenRow = await ctx.db.select().from(verificationToken).get();
    expect(tokenRow).toBeDefined();

    const ok = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: { token: tokenRow!.token },
    });
    expect(ok.statusCode).toBe(200);

    const u = await ctx.db
      .select()
      .from(user)
      .where(eq(user.email, "alice@example.com"))
      .get();
    expect(u?.emailVerified).toBe(true);

    // replay rejected
    const replay = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/verify",
      payload: { token: tokenRow!.token },
    });
    expect(replay.statusCode).toBe(400);
  });
});

describe("auth API — reset flow (single-use)", () => {
  it("resets password with a token, invalidates it, and rotates the credential", async () => {
    await register(CREDS);

    // request-reset always 200 (no user enumeration)
    const req1 = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/request-reset",
      payload: { email: CREDS.email },
    });
    expect(req1.statusCode).toBe(200);
    const reqUnknown = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/request-reset",
      payload: { email: "ghost@example.com" },
    });
    expect(reqUnknown.statusCode).toBe(200);
    // ...but no token was issued for the unknown email
    const tokens = await ctx.db.select().from(resetToken).all();
    expect(tokens.length).toBe(1);

    const token = tokens[0]!.token;
    const reset = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/reset",
      payload: { token, password: "brandnewpass9" },
    });
    expect(reset.statusCode).toBe(200);

    // old password no longer works; new one does
    expect((await login(CREDS)).statusCode).toBe(401);
    expect(
      (await login({ email: CREDS.email, password: "brandnewpass9" })).statusCode,
    ).toBe(200);

    // reused reset token rejected
    const replay = await ctx.app.inject({
      method: "POST",
      url: "/api/auth/reset",
      payload: { token, password: "anotherpass9" },
    });
    expect(replay.statusCode).toBe(400);
  });
});

describe("requireAdmin guard", () => {
  function mockReply() {
    const r: { code?: number; body?: unknown } = {};
    const reply = {
      status(c: number) {
        r.code = c;
        return this;
      },
      send(b: unknown) {
        r.body = b;
        return this;
      },
    };
    return { r, reply: reply as unknown as FastifyReply };
  }

  it("401s anonymous, 403s non-admin, passes admin", async () => {
    const anon = mockReply();
    await ctx.app.requireAdmin({ user: null } as FastifyRequest, anon.reply);
    expect(anon.r.code).toBe(401);

    const nonAdmin = mockReply();
    await ctx.app.requireAdmin(
      { user: { role: "user" } } as FastifyRequest,
      nonAdmin.reply,
    );
    expect(nonAdmin.r.code).toBe(403);

    const admin = mockReply();
    await ctx.app.requireAdmin(
      { user: { role: "admin" } } as FastifyRequest,
      admin.reply,
    );
    expect(admin.r.code).toBeUndefined(); // no error status set → passes through
  });

  it("requireAuth 401s anonymous and passes any user", async () => {
    const anon = mockReply();
    await ctx.app.requireAuth({ user: null } as FastifyRequest, anon.reply);
    expect(anon.r.code).toBe(401);

    const authed = mockReply();
    await ctx.app.requireAuth({ user: { role: "user" } } as FastifyRequest, authed.reply);
    expect(authed.r.code).toBeUndefined();
  });
});
