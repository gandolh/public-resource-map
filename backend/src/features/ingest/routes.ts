import { Socket } from "node:net";
import type { FastifyPluginAsyncZod } from "@fastify/type-provider-zod";
import type { FastifyRequest } from "fastify";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {
  createSourceSchema,
  resolvePlaceSchema,
  stagedIdsSchema,
  stagedQuerySchema,
  type EventSourceDto,
  type SourceHealth,
  type SourceMechanism,
} from "@public-resource-map/shared";
import { eventSource } from "../../db/schema.js";
import type { DB } from "../../db/index.js";
import type { MailSweeper } from "../reminders/index.js";
import { resolveCity } from "../osm/index.js";
import { adapterFor } from "./adapters.js";
import {
  acceptStaged,
  IngestError,
  listStaged,
  refreshSource,
  rejectStaged,
  resolveStagedPlace,
  type IngestDeps,
} from "./pipeline.js";
import { requireRole, ROLES } from "../../plugins/auth/index.js";
import { errorBodySchema } from "../../lib/api-error.js";
import { idParamsSchema } from "../../lib/params.js";
import {
  acceptResultSchema,
  patchSourceSchema,
  refreshAllSchema,
  refreshSummarySchema,
  rejectResultSchema,
  sourceSchema,
  stagedEventSchema,
} from "./schemas.js";

/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  /** The sources, geocoder and clock; a test passes fakes. */
  ingest: IngestDeps;
  /** Kicked after an accept that wrote inbox rows, so their mail goes out. */
  notifyMail: MailSweeper;
}

/**
 * The admin side of event ingestion. Every route is behind
 * `requireRole("admin")` (401 anonymous, 403 for a `user`). A refresh
 * stages a diff; only `accept` puts anything in front of the public.
 *
 * A refresh answers when it is done: geocoding at Nominatim's one request a
 * second makes a cold refresh slow, which is acceptable for an admin pressing
 * a button and not for anything a visitor waits on.
 */
export const adminIngestRoutes: FastifyPluginAsyncZod<Options> = async (app, { db, ingest: deps, notifyMail }) => {
  const guard = requireRole(ROLES.admin);
  /*
   * A refresh can outlast the server's 180 s `connectionTimeout`: sources run one after
   * another, each fetch may take 15 s, and the geocoder asks once a second. Its socket waits
   * as long as it takes. (`inject()` has no socket.)
   */
  const unbounded = async (req: FastifyRequest) => {
    if (req.raw.socket instanceof Socket) req.raw.socket.setTimeout(0);
  };
  /*
   * From the error plugin: an IngestError answers its code's status in this body. No 403: the
   * guard's own 403 body is the library's, and a declared status encodes every reply on it
   * (ADAPTER_NOT_ALLOWED's 403 goes out unchecked).
   */
  const refused = { 400: errorBodySchema, 404: errorBodySchema, 409: errorBodySchema };

  const toDto = (s: typeof eventSource.$inferSelect): EventSourceDto => ({
    id: s.id,
    name: s.name,
    adapterKey: s.adapterKey,
    mechanism: s.mechanism as SourceMechanism,
    url: s.url,
    city: s.city,
    enabled: s.enabled,
    lastStatus: s.lastStatus as SourceHealth | null,
    lastEventCount: s.lastEventCount,
    lastSuccessfulAt: s.lastSuccessfulAt,
    lastRunAt: s.lastRunAt,
  });

  app.get(
    "/admin/sources",
    { preValidation: guard, schema: { response: { 200: z.object({ data: z.array(sourceSchema) }) } } },
    async () => {
      const rows = db.select().from(eventSource).orderBy(eventSource.name).all();
      return { data: rows.map(toDto) };
    },
  );

  app.post(
    "/admin/sources",
    {
      preValidation: guard,
      schema: { body: createSourceSchema, response: { 201: sourceSchema, 400: errorBodySchema, 409: errorBodySchema } },
    },
    async (req, reply) => {
      const input = req.body;
      if (!adapterFor(input.adapterKey, deps.adapters)) {
        return reply.status(400).send({ code: "UNKNOWN_ADAPTER", message: `No adapter for ${input.adapterKey}` });
      }
      const city = resolveCity(input.city);
      if (!city) return reply.status(400).send({ code: "UNKNOWN_CITY", message: `Unknown city: ${input.city}` });
      const taken = db.select().from(eventSource).where(eq(eventSource.adapterKey, input.adapterKey)).get();
      if (taken) {
        return reply
          .status(409)
          .send({ code: "ADAPTER_KEY_TAKEN", message: `${input.adapterKey} is already a source` });
      }
      const row = db
        .insert(eventSource)
        .values({ ...input, url: input.url ?? null, city: city.name, enabled: input.enabled ?? true })
        .returning()
        .get();
      return reply.status(201).send(toDto(row));
    },
  );

  app.patch(
    "/admin/sources/:id",
    {
      preValidation: guard,
      schema: {
        params: idParamsSchema,
        body: patchSourceSchema,
        response: { 200: sourceSchema, 400: errorBodySchema, 404: errorBodySchema },
      },
    },
    async (req, reply) => {
      const row = db
        .update(eventSource)
        .set({ enabled: req.body.enabled, updatedAt: new Date().toISOString() })
        .where(eq(eventSource.id, req.params.id))
        .returning()
        .get();
      if (!row) return reply.status(404).send({ code: "SOURCE_NOT_FOUND", message: "No such source" });
      return toDto(row);
    },
  );

  app.post(
    "/admin/sources/:id/refresh",
    {
      onRequest: unbounded,
      preValidation: guard,
      schema: { params: idParamsSchema, response: { 200: refreshSummarySchema, ...refused } },
    },
    async (req) => refreshSource(db, req.params.id, deps),
  );

  // One after another, not in parallel: the geocoder's rate limit is shared,
  // and a failing source must not stop the rest.
  app.post(
    "/admin/sources/refresh-all",
    { onRequest: unbounded, preValidation: guard, schema: { response: { 200: refreshAllSchema } } },
    async () => {
      const sources = db.select().from(eventSource).where(eq(eventSource.enabled, true)).all();
      const results = [];
      for (const source of sources) {
        try {
          results.push(await refreshSource(db, source.id, deps));
        } catch (err) {
          if (!(err instanceof IngestError)) throw err;
          results.push({ sourceId: source.id, status: "error" as const, error: err.message });
        }
      }
      return { data: results };
    },
  );

  app.get(
    "/admin/staged-events",
    {
      preValidation: guard,
      schema: {
        querystring: stagedQuerySchema,
        response: { 200: z.object({ data: z.array(stagedEventSchema) }), 400: errorBodySchema },
      },
    },
    async (req) => ({ data: await listStaged(db, req.query) }),
  );

  app.post(
    "/admin/staged-events/accept",
    {
      preValidation: guard,
      schema: { body: stagedIdsSchema, response: { 200: acceptResultSchema, 400: errorBodySchema } },
    },
    async (req) => {
      const result = acceptStaged(db, req.body.ids, deps.now());
      // New inbox rows also go out as mail, after this response.
      if (result.notified > 0) notifyMail.kick();
      return result;
    },
  );

  app.post(
    "/admin/staged-events/reject",
    {
      preValidation: guard,
      schema: { body: stagedIdsSchema, response: { 200: rejectResultSchema, 400: errorBodySchema } },
    },
    async (req) => rejectStaged(db, req.body.ids, deps.now()),
  );

  app.post(
    "/admin/staged-events/:id/place",
    {
      preValidation: guard,
      schema: {
        params: idParamsSchema,
        body: resolvePlaceSchema,
        response: { 200: stagedEventSchema, ...refused },
      },
    },
    async (req) => resolveStagedPlace(db, req.params.id, req.body, deps.now()),
  );
};
