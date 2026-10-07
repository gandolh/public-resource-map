import type { FastifyInstance, FastifyReply } from "fastify";
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
import { eventSource } from "../db/schema.js";
import { resolveCity } from "../lib/osm-sync.js";
import { adapterFor } from "../ingest/adapters.js";
import {
  acceptStaged,
  IngestError,
  listStaged,
  refreshSource,
  rejectStaged,
  resolveStagedPlace,
  type IngestDeps,
} from "../ingest/pipeline.js";

/**
 * The admin side of event ingestion (brief 04). Every route is behind
 * `requireAdmin` (401 anonymous, 403 without the prm admin grant). A refresh
 * stages a diff; only `accept` puts anything in front of the public.
 *
 * A refresh answers when it is done: geocoding at Nominatim's one request a
 * second makes a cold refresh slow, which is acceptable for an admin pressing
 * a button and not for anything a visitor waits on.
 */
export function adminIngestRoutes(deps: IngestDeps) {
  return async function routes(app: FastifyInstance) {
    const db = app.db;
    const guard = { preHandler: app.requireAdmin };

    const fail = (reply: FastifyReply, err: unknown) => {
      if (err instanceof IngestError) {
        return reply.status(err.status).send({ code: err.code, message: err.message });
      }
      throw err;
    };
    const invalid = (reply: FastifyReply, message: string) =>
      reply.status(400).send({ code: "INVALID_BODY", message });

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

    app.get("/admin/sources", guard, async () => {
      const rows = await db.select().from(eventSource).orderBy(eventSource.name).all();
      return { data: rows.map(toDto) };
    });

    app.post("/admin/sources", guard, async (req, reply) => {
      const parsed = createSourceSchema.safeParse(req.body);
      if (!parsed.success) return invalid(reply, parsed.error.message);
      const input = parsed.data;
      if (!adapterFor(input.adapterKey, deps.adapters)) {
        return reply.status(400).send({ code: "UNKNOWN_ADAPTER", message: `No adapter for ${input.adapterKey}` });
      }
      const city = resolveCity(input.city);
      if (!city) return reply.status(400).send({ code: "UNKNOWN_CITY", message: `Unknown city: ${input.city}` });
      const taken = await db.select().from(eventSource).where(eq(eventSource.adapterKey, input.adapterKey)).get();
      if (taken) {
        return reply.status(409).send({ code: "ADAPTER_KEY_TAKEN", message: `${input.adapterKey} is already a source` });
      }
      const row = await db
        .insert(eventSource)
        .values({ ...input, url: input.url ?? null, city: city.name, enabled: input.enabled ?? true })
        .returning()
        .get();
      return reply.status(201).send(toDto(row));
    });

    app.patch<{ Params: { id: string } }>("/admin/sources/:id", guard, async (req, reply) => {
      const enabled = (req.body as { enabled?: unknown } | undefined)?.enabled;
      if (typeof enabled !== "boolean") return invalid(reply, "enabled must be a boolean");
      const row = await db
        .update(eventSource)
        .set({ enabled, updatedAt: new Date().toISOString() })
        .where(eq(eventSource.id, req.params.id))
        .returning()
        .get();
      if (!row) return reply.status(404).send({ code: "SOURCE_NOT_FOUND", message: "No such source" });
      return toDto(row);
    });

    app.post<{ Params: { id: string } }>("/admin/sources/:id/refresh", guard, async (req, reply) => {
      try {
        return await refreshSource(db, req.params.id, deps);
      } catch (err) {
        return fail(reply, err);
      }
    });

    // One after another, not in parallel: the geocoder's rate limit is shared,
    // and a failing source must not stop the rest.
    app.post("/admin/sources/refresh-all", guard, async () => {
      const sources = await db.select().from(eventSource).where(eq(eventSource.enabled, true)).all();
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
    });

    app.get("/admin/staged-events", guard, async (req, reply) => {
      const parsed = stagedQuerySchema.safeParse(req.query);
      if (!parsed.success) return invalid(reply, parsed.error.message);
      return { data: await listStaged(db, parsed.data) };
    });

    app.post("/admin/staged-events/accept", guard, async (req, reply) => {
      const parsed = stagedIdsSchema.safeParse(req.body);
      if (!parsed.success) return invalid(reply, parsed.error.message);
      const result = acceptStaged(db, parsed.data.ids, deps.now());
      // New inbox rows also go out as mail, after this response (brief 32).
      if (result.notified > 0) app.notifyMail.kick();
      return result;
    });

    app.post("/admin/staged-events/reject", guard, async (req, reply) => {
      const parsed = stagedIdsSchema.safeParse(req.body);
      if (!parsed.success) return invalid(reply, parsed.error.message);
      return rejectStaged(db, parsed.data.ids, deps.now());
    });

    app.post<{ Params: { id: string } }>("/admin/staged-events/:id/place", guard, async (req, reply) => {
      const parsed = resolvePlaceSchema.safeParse(req.body);
      if (!parsed.success) return invalid(reply, parsed.error.message);
      try {
        return await resolveStagedPlace(db, req.params.id, parsed.data, deps.now());
      } catch (err) {
        return fail(reply, err);
      }
    });
  };
}
