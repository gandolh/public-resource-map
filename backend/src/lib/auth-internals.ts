import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { PublicUser } from "@public-resource-map/shared";
import type { DB } from "../db/index.js";
import {
  resetToken,
  session,
  user,
  verificationToken,
} from "../db/schema.js";

// Token / session lifetimes.
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const VERIFY_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
export const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

const nowIso = () => new Date().toISOString();
const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

/** Opaque, unguessable token — used for session ids, verify + reset tokens. */
export function opaqueToken(): string {
  return randomBytes(32).toString("hex");
}

// --- Password hashing (argon2id) -------------------------------------------

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

export async function verifyPassword(
  hash: string,
  password: string,
): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

// --- User projection -------------------------------------------------------

export function toPublicUser(row: typeof user.$inferSelect): PublicUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role as PublicUser["role"],
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// --- Sessions (opaque server-side id in an httpOnly cookie) -----------------

export async function createSession(
  db: DB,
  userId: string,
): Promise<{ id: string; expiresAt: string }> {
  const id = opaqueToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.insert(session).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

/**
 * Resolve a session id to its user, or null if the session is unknown or
 * expired. Expired sessions are deleted on access (lazy sweep).
 */
export async function resolveSessionUser(
  db: DB,
  sessionId: string,
): Promise<typeof user.$inferSelect | null> {
  const row = await db
    .select()
    .from(session)
    .where(eq(session.id, sessionId))
    .get();
  if (!row) return null;
  if (isPast(row.expiresAt)) {
    await db.delete(session).where(eq(session.id, sessionId));
    return null;
  }
  const u = await db
    .select()
    .from(user)
    .where(eq(user.id, row.userId))
    .get();
  return u ?? null;
}

export async function deleteSession(db: DB, sessionId: string): Promise<void> {
  await db.delete(session).where(eq(session.id, sessionId));
}

// --- Verification tokens (single-use via deletion) --------------------------

export async function createVerificationToken(
  db: DB,
  userId: string,
): Promise<string> {
  const token = opaqueToken();
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS).toISOString();
  await db.insert(verificationToken).values({ userId, token, expiresAt });
  return token;
}

/**
 * Consume a verification token: mark the user verified and delete the token so
 * it cannot be reused. Returns the userId, or null if the token is unknown or
 * expired (expired tokens are cleaned up).
 */
export async function consumeVerificationToken(
  db: DB,
  token: string,
): Promise<{ userId: string } | null> {
  const row = await db
    .select()
    .from(verificationToken)
    .where(eq(verificationToken.token, token))
    .get();
  if (!row) return null;
  if (isPast(row.expiresAt)) {
    await db
      .delete(verificationToken)
      .where(eq(verificationToken.id, row.id));
    return null;
  }
  await db
    .delete(verificationToken)
    .where(eq(verificationToken.id, row.id));
  await db
    .update(user)
    .set({ emailVerified: true, updatedAt: nowIso() })
    .where(eq(user.id, row.userId));
  return { userId: row.userId };
}

// --- Reset tokens (single-use via usedAt) -----------------------------------

export async function createResetToken(
  db: DB,
  userId: string,
): Promise<string> {
  const token = opaqueToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  await db.insert(resetToken).values({ userId, token, expiresAt });
  return token;
}

/**
 * Consume a reset token: stamp `usedAt` (single-use) and return the userId.
 * Returns null if the token is unknown, already used, or expired.
 */
export async function consumeResetToken(
  db: DB,
  token: string,
): Promise<{ userId: string } | null> {
  const row = await db
    .select()
    .from(resetToken)
    .where(eq(resetToken.token, token))
    .get();
  if (!row) return null;
  if (row.usedAt) return null;
  if (isPast(row.expiresAt)) return null;
  await db
    .update(resetToken)
    .set({ usedAt: nowIso() })
    .where(eq(resetToken.id, row.id));
  return { userId: row.userId };
}
