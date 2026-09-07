import type { FastifyInstance } from "fastify";

import { PRM_ADMIN_ROLE, PRM_APP_SLUG, PRM_USER_ROLE } from "../ward/ward.types.js";

/**
 * `GET /api/me` — who the browser is, as **prm** sees it.
 *
 * ## Why prm has this rather than the UI calling Ward directly
 *
 * Ward publishes `GET /ward-api/session`, and the UI could call it. It should
 * not, for two reasons. Ward answers with the **whole estate's** grant map, so
 * the browser would receive this person's atrium and newspapper roles on every
 * page load of a public map — information prm has no business handing out. And
 * the question the UI actually asks is "am I a prm admin", which is prm's
 * interpretation of a grant, not a fact Ward holds: Ward stores the triple and
 * never interprets it.
 *
 * So this route answers narrowly and translates. The grant map does not leave
 * the server.
 *
 * ## Never 401
 *
 * Anonymous is the ordinary case on a public map, so this answers
 * `{ user: null }` with a `200` rather than refusing. A `401` here would make
 * every first page load of an unauthenticated visitor an error in the browser
 * console, and would tempt the UI into treating "not signed in" as a failure —
 * which on this app it emphatically is not.
 *
 * It is deliberately **not** behind `requireAuth`. That guard exists for routes
 * that need a session; this one exists to find out whether there is one.
 */
export async function meRoutes(app: FastifyInstance): Promise<void> {
  app.get("/me", async (req, reply) => {
    // Per-person and must not be cached anywhere in the chain — one person's
    // answer served to the next caller is the failure mode.
    reply.header("cache-control", "no-store");

    if (req.wardUnavailable === true) {
      // Distinct from anonymous: telling somebody they are signed out when the
      // identity service is down sends them to a login page that also cannot
      // work. The UI shows "sign-in is unavailable" for this.
      return reply
        .status(503)
        .send({ code: "IDENTITY_UNAVAILABLE", message: "Sign-in is temporarily unavailable" });
    }

    if (!req.ward) return { user: null };

    const roles = req.ward.grants[PRM_APP_SLUG] ?? [];
    const isAdmin = roles.includes(PRM_ADMIN_ROLE);

    // A live Ward session holding no prm grant is not signed in *here*. Saying
    // so as `null` rather than as a user object is what keeps the UI's "is
    // signed in" check honest — the alternative is a header greeting somebody
    // by name above a page that refuses every action they take.
    if (!isAdmin && !roles.includes(PRM_USER_ROLE)) return { user: null };

    return {
      user: {
        subject: req.ward.subject,
        username: req.ward.username,
        isAdmin,
      },
    };
  });
}
