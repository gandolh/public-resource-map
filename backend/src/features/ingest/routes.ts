import { Socket } from "node:net";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
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

/**
 * The admin side of event ingestion. Every route is behind
 * `requireRole("admin")` (401 anonymous, 403 for a `user`). A refresh
 * stages a diff; only `accept` puts anything in front of the public.
 *
 * A refresh answers when it is done: geocoding at Nominatim's one request a
 * second makes a cold refresh slow, which is acceptable for an admin pressing
 * a button and not for anything a visitor waits on.
 */
/** What this feature takes from the app's context. */
export interface Options {
  db: DB;
  /** The sources, geocoder and clock; a test passes fakes. */
  ingest: IngestDeps;
  /** Kicked after an accept that wrote inbox rows, so their mail goes out. */
  notifyMail: MailSweeper;
}

export async function adminIngestRoutes(app: FastifyInstance, { db, ingest: deps, notifyMail }: Options) {
  const guard = { preHandler: requireRole(ROLES.admin) };
  /*
   * A refresh can outlast the server's 180 s `connectionTimeout`: sources run one after
   * another, each fetch may take 15 s, and the geocoder asks once a second. Its socket waits
   * as long as it takes. (`inject()` has no socket.)
   */
  const slow = {
    ...guard,
    onRequest: async (req: FastifyRequest) => {
      if (req.raw.socket instanceof Socket) req.raw.socket.setTimeout(0);
    },
  };

  const invalid = (reply: FastifyReply, message: string) => reply.status(400).send({ code: "INVALID_BODY", message });

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
    const rows = db.select().from(eventSource).orderBy(eventSource.name).all();
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
    const taken = db.select().from(eventSource).where(eq(eventSource.adapterKey, input.adapterKey)).get();
    if (taken) {
      return reply.status(409).send({ code: "ADAPTER_KEY_TAKEN", message: `${input.adapterKey} is already a source` });
    }
    const row = db
      .insert(eventSource)
      .values({ ...input, url: input.url ?? null, city: city.name, enabled: input.enabled ?? true })
      .returning()
      .get();
    return reply.status(201).send(toDto(row));
  });

  app.patch<{ Params: { id: string } }>("/admin/sources/:id", guard, async (req, reply) => {
    const enabled = (req.body as { enabled?: unknown } | undefined)?.enabled;
    if (typeof enabled !== "boolean") return invalid(reply, "enabled must be a boolean");
    const row = db
      .update(eventSource)
      .set({ enabled, updatedAt: new Date().toISOString() })
      .where(eq(eventSource.id, req.params.id))
      .returning()
      .get();
    if (!row) return reply.status(404).send({ code: "SOURCE_NOT_FOUND", message: "No such source" });
    return toDto(row);
  });

  app.post<{ Params: { id: string } }>("/admin/sources/:id/refresh", slow, async (req) => {
    return refreshSource(db, req.params.id, deps);
  });

  // One after another, not in parallel: the geocoder's rate limit is shared,
  // and a failing source must not stop the rest.
  app.post("/admin/sources/refresh-all", slow, async () => {
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
    // New inbox rows also go out as mail, after this response.
    if (result.notified > 0) notifyMail.kick();
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
    return resolveStagedPlace(db, req.params.id, parsed.data, deps.now());
  });
}
