import cookie from "@fastify/cookie";
import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { PublicUser } from "@public-resource-map/shared";
import { resolveSessionUser, toPublicUser } from "../lib/auth-internals.js";

/** Name of the opaque session-id cookie. */
export const SESSION_COOKIE = "prm_session";

export type Guard = (
  req: FastifyRequest,
  reply: FastifyReply,
) => Promise<unknown>;

declare module "fastify" {
  interface FastifyRequest {
    /** Current user resolved from the session cookie, or null if anonymous. */
    user: PublicUser | null;
  }
  interface FastifyInstance {
    /** preHandler that 401s anonymous requests. */
    requireAuth: Guard;
    /** preHandler that 401s anonymous and 403s non-admin requests. */
    requireAdmin: Guard;
  }
}

/**
 * Auth wiring, applied to the ROOT app instance in buildApp() (not via
 * `app.register`) so the `request.user` decorator, the session-resolving
 * preHandler, and the `requireAuth`/`requireAdmin` guards are inherited by
 * every route plugin registered afterwards.
 *
 * Later briefs guard admin routes like so:
 *
 *   app.register(async (admin) => {
 *     admin.addHook("preHandler", admin.requireAdmin);
 *     admin.get("/sources", ...);       // -> 401 anon, 403 non-admin
 *   }, { prefix: "/api/admin" });
 *
 * or per-route: `app.post("/api/admin/x", { preHandler: app.requireAdmin }, h)`.
 */
export async function registerAuth(app: FastifyInstance): Promise<void> {
  await app.register(cookie);

  app.decorateRequest("user", null);

  // Resolve the current user from the session cookie on every request.
  app.addHook("preHandler", async (req) => {
    const sid = req.cookies[SESSION_COOKIE];
    if (!sid) {
      req.user = null;
      return;
    }
    const row = await resolveSessionUser(app.db, sid);
    req.user = row ? toPublicUser(row) : null;
  });

  app.decorate("requireAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply
        .status(401)
        .send({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
  });

  app.decorate("requireAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    if (!req.user) {
      return reply
        .status(401)
        .send({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
    if (req.user.role !== "admin") {
      return reply
        .status(403)
        .send({ code: "FORBIDDEN", message: "Admin access required" });
    }
  });
}
