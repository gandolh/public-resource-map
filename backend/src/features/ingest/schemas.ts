import { z } from "zod";
import {
  matchStatuses,
  sourceHealthSchema,
  sourceMechanismSchema,
  stagedStatusSchema,
  type AcceptResultDto,
  type EventSourceDto,
  type RefreshSummary,
  type StagedEventDto,
} from "@public-resource-map/shared";

/*
 * The admin ingest routes' replies. Only the server uses these schemas, so they live here; each
 * is typed against the DTO the admin pages read from `shared/`, so the two can't drift.
 */

export const sourceSchema: z.ZodType<EventSourceDto> = z.object({
  id: z.string(),
  name: z.string(),
  adapterKey: z.string(),
  mechanism: sourceMechanismSchema,
  url: z.string().nullable(),
  city: z.string().nullable(),
  enabled: z.boolean(),
  lastStatus: sourceHealthSchema.nullable(),
  lastEventCount: z.number().nullable(),
  lastSuccessfulAt: z.string().nullable(),
  lastRunAt: z.string().nullable(),
});

export const refreshSummarySchema: z.ZodType<RefreshSummary> = z.object({
  sourceId: z.string(),
  status: sourceHealthSchema,
  fetched: z.number(),
  new: z.number(),
  changed: z.number(),
  unchanged: z.number(),
  duplicates: z.number(),
  needsAttention: z.number(),
  ambiguous: z.number(),
  unmatched: z.number(),
  stale: z.number(),
  silentUpdates: z.number(),
  error: z.string().optional(),
});

/** One source of a refresh-all: its summary, or the refusal that stopped it. */
export const refreshAllSchema = z.object({
  data: z.array(
    z.union([refreshSummarySchema, z.object({ sourceId: z.string(), status: z.literal("error"), error: z.string() })]),
  ),
});

/** Keys in the order the pipeline builds them, so the reply's bytes stay as they were. */
export const stagedEventSchema: z.ZodType<StagedEventDto> = z.object({
  id: z.string(),
  sourceId: z.string(),
  placeId: z.string().nullable(),
  eventId: z.string().nullable(),
  matchStatus: z.enum(matchStatuses),
  status: stagedStatusSchema,
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  venueName: z.string().nullable(),
  rawAddress: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  buyUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  sourcePlatform: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  candidates: z.array(z.object({ placeId: z.string(), name: z.string(), score: z.number() })),
  issues: z.string().nullable(),
  cancelled: z.boolean(),
});

export const acceptResultSchema: z.ZodType<AcceptResultDto> = z.object({
  accepted: z.array(z.object({ stagedId: z.string(), eventId: z.string() })),
  skipped: z.array(z.object({ id: z.string(), reason: z.string() })),
  notified: z.number(),
});

export const rejectResultSchema = z.object({ rejected: z.number() });

/** `PATCH /api/admin/sources/:id`: switch a source on or off. */
export const patchSourceSchema = z.object({ enabled: z.boolean({ error: "must be a boolean" }) });
