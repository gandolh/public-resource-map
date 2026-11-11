import type { FastifyRequest } from "fastify";

/**
 * The signed-in user's id. The library's guard has already run on every route that calls this, so a
 * missing session is a wiring mistake, not a client error.
 */
export function subjectOf(req: FastifyRequest): string {
  if (!req.auth) throw new Error("Route reached without a session: it must not be on the public allowlist");
  return req.auth.user.id;
}
