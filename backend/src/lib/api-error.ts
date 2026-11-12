import { z } from "zod";

/**
 * The status each code thrown as an `ApiError` answers with. A new code is one line here. A
 * handler that answers an expected 404 or 409 itself (`reply.status(…).send({ code, message })`)
 * needs no entry.
 */
export const ERROR_STATUS = {
  UNKNOWN_ADAPTER: 400,
  UNKNOWN_CITY: 400,
  PLACE_NOT_IN_CITY: 400,
  PIN_OUTSIDE_CITY: 400,
  ADAPTER_NOT_ALLOWED: 403,
  SOURCE_NOT_FOUND: 404,
  STAGED_NOT_FOUND: 404,
  SOURCE_DISABLED: 409,
  SOURCE_NOT_REGISTERED: 409,
  NOT_RESOLVABLE: 409,
  SYNC_IN_PROGRESS: 409,
  OVERPASS_TIMEOUT: 504,
} as const satisfies Record<string, number>;

export type ErrorCode = keyof typeof ERROR_STATUS;

/**
 * The server's one error class. Throw it from a handler, or from code a handler calls, to answer
 * `ERROR_STATUS[code]` with `{ code, message }`; the error plugin writes the body. The message is
 * written for the person reading it, so it reaches the client.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }

  get status(): number {
    return ERROR_STATUS[this.code];
  }
}

/**
 * The body of every error reply, `{ code, message }`, as a route declares it for a 4xx it sends.
 * A declared status encodes every reply on that status, the error plugin's and Fastify's own
 * included, so the code is any string, never a literal.
 */
export const errorBodySchema = z.object({ code: z.string(), message: z.string() });
