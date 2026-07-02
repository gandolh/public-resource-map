import type { FastifyInstance, FastifyReply } from "fastify";
import { eq } from "drizzle-orm";
import {
  loginSchema,
  registerSchema,
  requestResetSchema,
  resetPasswordSchema,
  verifyTokenSchema,
} from "@public-resource-map/shared";
import { session, user } from "../db/schema.js";
import { SESSION_COOKIE } from "../plugins/auth.js";
import {
  SESSION_TTL_MS,
  consumeResetToken,
  consumeVerificationToken,
  createResetToken,
  createSession,
  createVerificationToken,
  deleteSession,
  hashPassword,
  toPublicUser,
  verifyPassword,
} from "../lib/auth-internals.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../lib/mailer.js";

// Secure only in production — local dev runs over http, where a Secure cookie
// would never be sent. Prod (Caddy, automatic HTTPS) always sets it. SameSite
// + httpOnly are always on.
const cookieOpts = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
});

function setSessionCookie(reply: FastifyReply, sid: string): void {
  reply.setCookie(SESSION_COOKIE, sid, {
    ...cookieOpts(),
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const db = app.db;

  app.post("/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_BODY", message: parsed.error.message });
    }
    const { email, password, displayName } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .get();
    if (existing) {
      return reply
        .status(409)
        .send({ code: "EMAIL_TAKEN", message: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);
    const row = await db
      .insert(user)
      .values({ email: normalizedEmail, passwordHash, displayName })
      .returning()
      .get();

    const token = await createVerificationToken(db, row.id);
    sendVerificationEmail(normalizedEmail, token);

    return reply.status(201).send({ user: toPublicUser(row) });
  });

  app.post("/auth/verify", async (req, reply) => {
    const parsed = verifyTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_BODY", message: parsed.error.message });
    }
    const result = await consumeVerificationToken(db, parsed.data.token);
    if (!result) {
      return reply.status(400).send({
        code: "INVALID_TOKEN",
        message: "Verification token is invalid or expired",
      });
    }
    return { ok: true };
  });

  app.post("/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_BODY", message: parsed.error.message });
    }
    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const row = await db
      .select()
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .get();

    const ok = row
      ? await verifyPassword(row.passwordHash, parsed.data.password)
      : false;
    if (!row || !ok) {
      return reply.status(401).send({
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      });
    }

    const sess = await createSession(db, row.id);
    setSessionCookie(reply, sess.id);
    return { user: toPublicUser(row) };
  });

  app.post("/auth/logout", async (req, reply) => {
    const sid = req.cookies[SESSION_COOKIE];
    if (sid) await deleteSession(db, sid);
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    return { ok: true };
  });

  app.get("/auth/me", async (req, reply) => {
    if (!req.user) {
      return reply
        .status(401)
        .send({ code: "UNAUTHENTICATED", message: "Not signed in" });
    }
    return { user: req.user };
  });

  app.post("/auth/request-reset", async (req, reply) => {
    const parsed = requestResetSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_BODY", message: parsed.error.message });
    }
    const normalizedEmail = parsed.data.email.trim().toLowerCase();
    const row = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, normalizedEmail))
      .get();

    // Only email an existing user, but always return the same response so the
    // endpoint doesn't leak which emails are registered.
    if (row) {
      const token = await createResetToken(db, row.id);
      sendPasswordResetEmail(normalizedEmail, token);
    }
    return { ok: true };
  });

  app.post("/auth/reset", async (req, reply) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ code: "INVALID_BODY", message: parsed.error.message });
    }
    const result = await consumeResetToken(db, parsed.data.token);
    if (!result) {
      return reply.status(400).send({
        code: "INVALID_TOKEN",
        message: "Reset token is invalid, used, or expired",
      });
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await db
      .update(user)
      .set({ passwordHash, updatedAt: new Date().toISOString() })
      .where(eq(user.id, result.userId));

    // Invalidate all existing sessions after a password reset.
    await db.delete(session).where(eq(session.userId, result.userId));
    return { ok: true };
  });
}
