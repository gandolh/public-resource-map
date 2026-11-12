import { hasZodFastifySchemaValidationErrors, ResponseSerializationError } from "@fastify/type-provider-zod";
import type { FastifyError, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ApiError } from "../lib/api-error.js";

/** The one error body, the shape every handler already sends: the UI reads `message`. */
interface ErrorBody {
  code: string;
  message: string;
}

/** The code a schema failure answers with, by where the input was. */
const INVALID: Record<string, string> = {
  querystring: "INVALID_QUERY",
  body: "INVALID_BODY",
  params: "INVALID_PARAMS",
  headers: "INVALID_HEADERS",
};

/** The status a thrown value carries, if it carries one (Fastify's own errors and its plugins' do). */
function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) return undefined;
  return typeof error.statusCode === "number" ? error.statusCode : undefined;
}

/**
 * The one error handler, and the not-found handler. Wrapped in fastify-plugin, so they are set on
 * the root and every route inherits them.
 *
 * - An `ApiError` answers its code's status with its message.
 * - A request that fails its route schema answers 400, coded by where the input was
 *   (`INVALID_QUERY`, `INVALID_BODY`, `INVALID_PARAMS`), with the first issue's path and message.
 * - A 4xx that Fastify or a plugin raised (bad JSON, a body too large, an unsupported media type)
 *   keeps its status, its code and its message, which Fastify wrote for clients.
 * - A reply that doesn't match its response schema is a bug, never the client's fault: a 500.
 * - Anything else is a 5xx with a fixed message, logged with the request: the 503 an error such as
 *   Ward's `WardUnavailableError` carries keeps its status, everything else is a 500. A thrown
 *   message never reaches the client: Fastify's default handler sent it, a 500's included.
 */
const errorHandling: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send({ code: error.code, message: error.message } satisfies ErrorBody);
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
      const where = error.validationContext ?? "body";
      const first = error.validation[0];
      const path = first?.instancePath.slice(1).replaceAll("/", ".") ?? "";
      const message = first?.message ?? "is not valid";
      return reply.status(400).send({
        code: INVALID[where] ?? "INVALID_BODY",
        message: path ? `${path}: ${message}` : message,
      } satisfies ErrorBody);
    }

    const status = statusOf(error);
    if (status !== undefined && status >= 400 && status < 500) {
      const { code, message } = error as FastifyError;
      return reply.status(status).send({ code: code || "BAD_REQUEST", message } satisfies ErrorBody);
    }

    if (error instanceof ResponseSerializationError) {
      // The issues stay out of the log: they quote the reply, which can be a person's inbox.
      request.log.error(
        { code: error.code, name: error.name },
        `${error.method} ${error.url}: the reply doesn't match its schema`,
      );
    } else {
      request.log.error({ err: error }, `${request.method} ${request.url}: unhandled error`);
    }
    if (status === 503) {
      return reply.status(503).send({
        code: "UNAVAILABLE",
        message: "A service prm relies on is not answering. Try again later.",
      } satisfies ErrorBody);
    }
    return reply
      .status(500)
      .send({ code: "INTERNAL", message: "Something went wrong on the server." } satisfies ErrorBody);
  });

  app.setNotFoundHandler((request, reply) =>
    reply
      .status(404)
      .send({ code: "NOT_FOUND", message: `Route ${request.method}:${request.url} not found` } satisfies ErrorBody),
  );
};

export const errors = fp(errorHandling, { name: "errors" });
