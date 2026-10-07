import { z } from "zod";
import { httpUrlSchema } from "./common.js";
import { eventCategorySchema } from "./event.js";

/**
 * Event ingestion (brief 04). An adapter turns one source into `RawEvent`s;
 * everything after that (validation, venue matching, geocoding, dedup,
 * reconcile, the diff) is the shared pipeline's.
 */

/** How a source is read, in the API-first order decisions.md fixes. */
export const sourceMechanisms = ["api", "ical", "rss", "jsonld", "html"] as const;
export const sourceMechanismSchema = z.enum(sourceMechanisms);
export type SourceMechanism = z.infer<typeof sourceMechanismSchema>;

/**
 * One listing as an adapter read it. Sanity validation: a row that fails this
 * goes to the needs-attention quarantine, never to the clean diff.
 */
export const rawEventSchema = z.object({
  /** The source's stable id for the listing (an iCal UID). Optional: URL + start stands in. */
  externalId: z.string().min(1).optional(),
  title: z.string().trim().min(1),
  /** ISO 8601 instant. */
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }).optional(),
  /** The venue as the source names it ("Sala Mare, Casa de Cultură"). */
  venue: z.string().trim().min(1),
  address: z.string().trim().min(1).optional(),
  description: z.string().optional(),
  category: eventCategorySchema.optional(),
  /** Only when the source itself provides one; we never manufacture a ticket link. */
  buyUrl: httpUrlSchema.optional(),
  sourceUrl: httpUrlSchema.optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  cancelled: z.boolean().optional(),
});
export type RawEvent = z.infer<typeof rawEventSchema>;

export const stagedStatuses = [
  "new",
  "changed",
  "accepted",
  "rejected",
  "needs-attention",
] as const;
export const stagedStatusSchema = z.enum(stagedStatuses);
export type StagedStatus = z.infer<typeof stagedStatusSchema>;

export const matchStatuses = ["auto-matched", "ambiguous", "unmatched", "manual"] as const;
export type MatchStatus = (typeof matchStatuses)[number];

export const sourceHealthSchema = z.enum(["ok", "suspect", "error"]);
export type SourceHealth = z.infer<typeof sourceHealthSchema>;

export interface EventSourceDto {
  id: string;
  name: string;
  adapterKey: string;
  mechanism: SourceMechanism;
  url: string | null;
  city: string | null;
  enabled: boolean;
  lastStatus: SourceHealth | null;
  lastEventCount: number | null;
  lastSuccessfulAt: string | null;
  lastRunAt: string | null;
}

export const createSourceSchema = z.object({
  name: z.string().trim().min(1),
  /** `<adapter>:<slug>`, e.g. `ical:centrul-de-proiecte`; the part before ":" picks the adapter. */
  adapterKey: z.string().regex(/^[a-z0-9-]+(:[a-z0-9-]+)?$/),
  mechanism: sourceMechanismSchema,
  url: httpUrlSchema.optional(),
  city: z.string().trim().min(1),
  enabled: z.boolean().optional(),
});
export type CreateSourceInput = z.infer<typeof createSourceSchema>;

/** What one refresh of one source did: the diff's shape, before anything is live. */
export interface RefreshSummary {
  sourceId: string;
  status: SourceHealth;
  fetched: number;
  new: number;
  changed: number;
  unchanged: number;
  duplicates: number;
  needsAttention: number;
  ambiguous: number;
  unmatched: number;
  /** Accepted events the source stopped listing, marked stale past the grace window. */
  stale: number;
  /** Fields silently updated on live events (price, description, links). */
  silentUpdates: number;
  error?: string;
}

export const stagedIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});
export type StagedIdsInput = z.infer<typeof stagedIdsSchema>;

/** Resolve a staged event's place: pick an existing place, or drop a manual pin. */
export const resolvePlaceSchema = z.union([
  z.object({ placeId: z.string().min(1) }),
  z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
]);
export type ResolvePlaceInput = z.infer<typeof resolvePlaceSchema>;

export const stagedQuerySchema = z.object({
  sourceId: z.string().optional(),
  status: stagedStatusSchema.optional(),
});

export interface MatchCandidateDto {
  placeId: string;
  name: string;
  score: number;
}

/** One row of the review queue, as `GET /api/admin/staged-events` returns it. */
export interface StagedEventDto {
  id: string;
  sourceId: string;
  placeId: string | null;
  eventId: string | null;
  matchStatus: MatchStatus;
  status: StagedStatus;
  title: string;
  description: string | null;
  category: string | null;
  venueName: string | null;
  rawAddress: string | null;
  startDate: string;
  endDate: string | null;
  buyUrl: string | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  price: number | null;
  currency: string | null;
  lat: number | null;
  lng: number | null;
  candidates: MatchCandidateDto[];
  /** Why a needs-attention row was quarantined. */
  issues: string | null;
  cancelled: boolean;
}

export interface AcceptResultDto {
  accepted: { stagedId: string; eventId: string }[];
  skipped: { id: string; reason: string }[];
  notified: number;
}
