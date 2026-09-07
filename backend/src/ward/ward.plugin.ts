import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { createWardClient, type WardClient } from "./ward.client.js";
import {
  PRM_ADMIN_ROLE,
  PRM_APP_SLUG,
  PRM_USER_ROLE,
  WardAuthenticationError,
  WardUnavailableError,
  hasGrant,
  type WardCaller,
} from "./ward.types.js";

/**
 * Ward wiring for prm, applied to the ROOT app instance in `buildApp()` (not
 * via `app.register`) so the `request.ward` decorator and the two guards are
 * inherited by every route plugin registered afterwards. Same shape the old
 * `plugins/auth.ts` had — the shape was right, only what is behind it changed.
 *
 * ## prm is the app where anonymous is normal, so nothing is gated by default
 *
 * Every other app in the estate gates the whole surface and allowlists a
 * handful of routes. prm is the opposite and must stay that way: **it is a
 * public resource map**. Browsing places and events needs no session, no
 * cookie and no Ward call at all, and the easiest way to break this app is to
 * put a gate in front of everything and then discover which parts were supposed
 * to be public.
 *
 * So the root hook only *resolves* a session when a cookie is present and
 * leaves `request.ward` null otherwise. `requireAuth` and `requireAdmin` are
 * opt-in, exactly as before.
 *
 * ## The two guards, and what each one now means
 *
 * The role check moved from `user.role` — a column prm owned — to a Ward grant.
 * Ward stores the triple `(subject, "prm", role)` and never interprets it; the
 * meaning below is prm's.
 *
 * - `requireAuth` → holds **`prm:user`**. This is what registering confers, and
 *   it is prm's "is signed in". Note that it is a grant check, not merely
 *   "has a session": a person with a live Ward account and no prm grant is
 *   **not** signed in as far as prm is concerned, which is the whole reason the
 *   estate can leave registration open here without exposing atrium.
 * - `requireAdmin` → holds **`prm:admin`**. Issued by hand from Ward's console;
 *   there is no path by which registering produces it.
 *
 * `prm:admin` does **not** imply `prm:user`. Grants are a set, not a ladder, and
 * Ward has no hierarchy to consult — so `requireAuth` accepts either, spelled
 * out below rather than assumed, because the alternative is an admin who cannot
 * open their own favourites.
 *
 * ## Failing closed on a public app still means failing closed
 *
 * If Ward cannot be reached, a guarded route answers **503** and is refused.
 * It does not fall back to anonymous. The public half of prm keeps working
 * throughout, because it never asks Ward anything — which is a genuinely good
 * property of this app's shape and worth not losing.
 */

/** Ward's cookie. Presence is the only hint prm uses to decide whether to ask. */
const WARD_COOKIE = "ward_session";

export type Guard = (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;

declare module "fastify" {
  interface FastifyRequest {
    /** The Ward session, or null for an anonymous request. */
    ward: WardCaller | null;
    /**
     * True when the root hook could not reach Ward for **this** request.
     *
     * Distinct from `ward === null`, and the distinction is what stops a guard
     * from telling somebody they are signed out when the truth is that the
     * identity service is down. Only the guards read it; public routes never
     * do, which is why an unreachable Ward leaves the map working.
     */
    wardUnavailable?: boolean;
  }
  interface FastifyInstance {
    /** preHandler: 401 unless the caller holds a prm grant. */
    requireAuth: Guard;
    /** preHandler: 401 anonymous, 403 without `prm:admin`. */
    requireAdmin: Guard;
  }
}

export interface WardPluginOptions {
  publicOrigin: string;
  apiBasePath: string;
  appKey: string;
  /** Injected by tests. */
  client?: WardClient;
}

export async function registerWard(
  app: FastifyInstance,
  options: WardPluginOptions,
): Promise<void> {
  const ward =
    options.client ??
    createWardClient({
      publicOrigin: options.publicOrigin,
      apiBasePath: options.apiBasePath,
      appKey: options.appKey,
    });

  app.decorateRequest("ward", null);

  /**
   * Resolve the session when there is a cookie to resolve, and only then.
   *
   * The cheap presence check is what keeps the public map free of Ward traffic:
   * without it, every anonymous request to every public route would call
   * `authenticate`, which would throw immediately — correct, but a wasted
   * allocation on the app's hottest path.
   *
   * **A failure here is swallowed and the request continues as anonymous.**
   * That is safe because this hook grants nothing: the guards below are what
   * refuse, and they re-derive their answer from `request.ward` being null. A
   * throwing root hook, by contrast, would turn Ward being down into a 500 on
   * the *public* map, which is the one part of prm that has no business
   * depending on the identity service at all.
   */
  app.addHook("preHandler", async (req) => {
    if (!req.headers.cookie?.includes(`${WARD_COOKIE}=`)) {
      req.ward = null;
      return;
    }

    try {
      req.ward = await ward.authenticate(req.headers.cookie);
    } catch (error) {
      req.ward = null;
      // Logged at two levels on purpose: a dead or absent session is ordinary
      // and must not fill the log, but Ward being unreachable is an operator's
      // problem and the guards below will be answering 503 because of it.
      if (error instanceof WardUnavailableError) {
        req.log.error({ err: error }, "ward is not answering");
        req.wardUnavailable = true;
      } else if (!(error instanceof WardAuthenticationError)) {
        throw error;
      }
    }
  });

  app.decorate("requireAuth", async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.wardUnavailable === true) {
      return reply
        .status(503)
        .send({ code: "IDENTITY_UNAVAILABLE", message: "Sign-in is temporarily unavailable" });
    }
    if (!req.ward) {
      return reply
        .status(401)
        .send({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
    // Either grant counts as "signed in" — see the header on why `prm:admin`
    // does not imply `prm:user`.
    const roles = req.ward.grants[PRM_APP_SLUG] ?? [];
    if (!roles.includes(PRM_USER_ROLE) && !roles.includes(PRM_ADMIN_ROLE)) {
      return reply
        .status(403)
        .send({ code: "FORBIDDEN", message: "This account has no access to this app" });
    }
  });

  app.decorate("requireAdmin", async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.wardUnavailable === true) {
      return reply
        .status(503)
        .send({ code: "IDENTITY_UNAVAILABLE", message: "Sign-in is temporarily unavailable" });
    }
    if (!req.ward) {
      return reply
        .status(401)
        .send({ code: "UNAUTHENTICATED", message: "Authentication required" });
    }
    if (!hasGrant(req.ward.grants, PRM_APP_SLUG, PRM_ADMIN_ROLE)) {
      return reply.status(403).send({ code: "FORBIDDEN", message: "Admin access required" });
    }
  });
}
