import type { FastifyError, FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { ApiError } from "../lib/api-error.js";

/** The one error body, the shape every handler already sends: the UI reads `message`. */
interface ErrorBody {
  code: string;
  message: string;
}

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
 * - A 4xx that Fastify or a plugin raised (bad JSON, a body too large, an unsupported media type)
 *   keeps its status, its code and its message, which Fastify wrote for clients.
 * - Anything else is a 500 with a fixed message, logged with the request. A thrown message never
 *   reaches the client: Fastify's default handler sent it, a 500's included.
 */
const errorHandling: FastifyPluginAsync = async (app) => {
  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send({ code: error.code, message: error.message } satisfies ErrorBody);
    }

    const status = statusOf(error);
    if (status !== undefined && status >= 400 && status < 500) {
      const { code, message } = error as FastifyError;
      return reply.status(status).send({ code: code || "BAD_REQUEST", message } satisfies ErrorBody);
    }

    request.log.error({ err: error }, `${request.method} ${request.url}: unhandled error`);
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
