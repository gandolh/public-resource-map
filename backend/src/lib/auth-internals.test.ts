import { describe, it, expect, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { buildTestApp, type TestApp } from "../test/harness.js";
import { resetToken, session, user } from "../db/schema.js";
import {
  consumeResetToken,
  consumeVerificationToken,
  createResetToken,
  createSession,
  createVerificationToken,
  hashPassword,
  resolveSessionUser,
  verifyPassword,
} from "./auth-internals.js";

/**
 * Auth-internals unit tests (locked in decisions.md → Testing; owned by brief
 * 02). These breach-risk behaviours are invisible to e2e — hashing, single-use
 * tokens, and session expiry — so per the locked decision they live here.
 */

let ctx: TestApp;
afterEach(async () => {
  await ctx?.close();
});

async function seedUser(db: TestApp["db"]) {
  return db
    .insert(user)
    .values({ email: "u@example.com", passwordHash: "x" })
    .returning()
    .get();
}

describe("password hashing (argon2id)", () => {
  it("round-trips: a hash verifies its own password and rejects a wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$/); // argon2id, not plaintext/sha
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
    expect(await verifyPassword(hash, "wrong password")).toBe(false);
  });

  it("does not throw on a malformed hash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});

describe("verification token", () => {
  it("is single-use — a second use is rejected", async () => {
    ctx = await buildTestApp();
    const u = await seedUser(ctx.db);

    const token = await createVerificationToken(ctx.db, u.id);
    const first = await consumeVerificationToken(ctx.db, token);
    expect(first?.userId).toBe(u.id);

    // user is now verified
    const after = await ctx.db
      .select()
      .from(user)
      .where(eq(user.id, u.id))
      .get();
    expect(after?.emailVerified).toBe(true);

    // replay rejected
    expect(await consumeVerificationToken(ctx.db, token)).toBeNull();
  });
});

describe("reset token", () => {
  it("is single-use — usedAt is set on consume, replay rejected", async () => {
    ctx = await buildTestApp();
    const u = await seedUser(ctx.db);

    const token = await createResetToken(ctx.db, u.id);
    const first = await consumeResetToken(ctx.db, token);
    expect(first?.userId).toBe(u.id);

    // replay rejected
    expect(await consumeResetToken(ctx.db, token)).toBeNull();
  });

  it("rejects an expired reset token", async () => {
    ctx = await buildTestApp();
    const u = await seedUser(ctx.db);

    const token = await createResetToken(ctx.db, u.id);
    // Force expiry into the past directly in the DB.
    await ctx.db
      .update(resetToken)
      .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .where(eq(resetToken.token, token));

    expect(await consumeResetToken(ctx.db, token)).toBeNull();
  });
});

describe("session expiry", () => {
  it("resolves a live session and rejects an expired one", async () => {
    ctx = await buildTestApp();
    const u = await seedUser(ctx.db);

    const sess = await createSession(ctx.db, u.id);
    const live = await resolveSessionUser(ctx.db, sess.id);
    expect(live?.id).toBe(u.id);

    // Expire it.
    await ctx.db
      .update(session)
      .set({ expiresAt: new Date(Date.now() - 1000).toISOString() })
      .where(eq(session.id, sess.id));

    expect(await resolveSessionUser(ctx.db, sess.id)).toBeNull();
    // expired session is swept
    const gone = await ctx.db
      .select()
      .from(session)
      .where(eq(session.id, sess.id))
      .get();
    expect(gone).toBeUndefined();
  });

  it("rejects an unknown session id", async () => {
    ctx = await buildTestApp();
    expect(await resolveSessionUser(ctx.db, "nope")).toBeNull();
  });
});
