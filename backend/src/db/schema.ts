import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID());

const createdAt = () =>
  text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`);

const updatedAt = () =>
  text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`);

// ---------------------------------------------------------------------------
// Places (was `resource`) — the map's unit. OSM-sourced or event-venue-derived.
// ---------------------------------------------------------------------------
export const place = sqliteTable(
  "place",
  {
    id: id(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // PlaceCategory
    source: text("source").notNull().default("osm"), // 'osm' | 'event-venue'
    osmType: text("osm_type"), // node | way | relation, null unless source='osm'
    osmId: text("osm_id"), // null unless source='osm'
    isManualPin: integer("is_manual_pin", { mode: "boolean" })
      .notNull()
      .default(false),
    address: text("address"),
    city: text("city").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    website: text("website"),
    phone: text("phone"),
    openingHours: text("opening_hours"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("place_osm_unique")
      .on(t.osmType, t.osmId)
      .where(sql`${t.source} = 'osm'`),
    index("place_lat_lng_idx").on(t.lat, t.lng),
    index("place_city_idx").on(t.city),
  ],
);

// ---------------------------------------------------------------------------
// Events — always attached to a place; lifecycle via `status`.
// ---------------------------------------------------------------------------
export const event = sqliteTable(
  "event",
  {
    id: id(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id),
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title"), // dedup key (title + startDate + place)
    description: text("description"),
    category: text("category").notNull(), // EventCategory
    status: text("status").notNull().default("live"), // live | stale | ended | past
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    buyUrl: text("buy_url"), // only if the source itself provided it
    sourceUrl: text("source_url"),
    sourcePlatform: text("source_platform"),
    imageUrl: text("image_url"),
    price: real("price"),
    currency: text("currency"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("event_place_idx").on(t.placeId),
    index("event_status_idx").on(t.status),
    index("event_dedup_idx").on(t.normalizedTitle, t.startDate, t.placeId),
  ],
);

// ---------------------------------------------------------------------------
// Auth (brief 02) — users, server-side sessions, verify + reset tokens.
// ---------------------------------------------------------------------------
export const user = sqliteTable(
  "user",
  {
    id: id(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name"),
    role: text("role").notNull().default("user"), // 'user' | 'admin'
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("user_email_unique").on(t.email)],
);

export const session = sqliteTable(
  "session",
  {
    id: id(), // opaque session id stored in the httpOnly cookie
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    expiresAt: text("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const verificationToken = sqliteTable(
  "verification_token",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    token: text("token").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("verification_token_unique").on(t.token),
    index("verification_token_user_idx").on(t.userId),
  ],
);

export const resetToken = sqliteTable(
  "reset_token",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    token: text("token").notNull(),
    expiresAt: text("expires_at").notNull(),
    usedAt: text("used_at"), // single-use: set once consumed
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("reset_token_unique").on(t.token),
    index("reset_token_user_idx").on(t.userId),
  ],
);

// ---------------------------------------------------------------------------
// Ingestion (brief 04) — sources, staged (diff/accept) events, geocode cache.
// ---------------------------------------------------------------------------
export const eventSource = sqliteTable(
  "event_source",
  {
    id: id(),
    name: text("name").notNull(),
    adapterKey: text("adapter_key").notNull(),
    mechanism: text("mechanism").notNull(), // api | ical | rss | jsonld | html
    url: text("url"),
    city: text("city"),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    lastStatus: text("last_status"), // ok | suspect | error
    lastEventCount: integer("last_event_count"),
    lastSuccessfulAt: text("last_successful_at"),
    lastRunAt: text("last_run_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("event_source_adapter_key_unique").on(t.adapterKey)],
);

export const stagedEvent = sqliteTable(
  "staged_event",
  {
    id: id(),
    sourceId: text("source_id")
      .notNull()
      .references(() => eventSource.id),
    placeId: text("place_id").references(() => place.id), // null until resolved
    eventId: text("event_id").references(() => event.id), // set once accepted/linked
    matchStatus: text("match_status").notNull(), // auto-matched | ambiguous | unmatched | manual
    status: text("status").notNull().default("new"), // new | changed | accepted | rejected | needs-attention
    title: text("title").notNull(),
    normalizedTitle: text("normalized_title"),
    description: text("description"),
    category: text("category"),
    venueName: text("venue_name"), // raw venue string from the source
    rawAddress: text("raw_address"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    buyUrl: text("buy_url"),
    sourceUrl: text("source_url"),
    sourcePlatform: text("source_platform"),
    imageUrl: text("image_url"),
    price: real("price"),
    currency: text("currency"),
    candidates: text("candidates"), // JSON: ambiguous match candidates
    payload: text("payload"), // JSON: raw parsed row (audit / re-parse)
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("staged_event_source_idx").on(t.sourceId),
    index("staged_event_place_idx").on(t.placeId),
    index("staged_event_event_idx").on(t.eventId),
    index("staged_event_status_idx").on(t.status),
  ],
);

export const geocodeCache = sqliteTable(
  "geocode_cache",
  {
    id: id(),
    normalizedAddress: text("normalized_address").notNull(),
    city: text("city"),
    lat: real("lat"), // null = cached miss
    lng: real("lng"),
    importance: real("importance"),
    granularity: text("granularity"),
    raw: text("raw"), // JSON: raw Nominatim response
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("geocode_cache_address_unique").on(t.normalizedAddress),
  ],
);

// ---------------------------------------------------------------------------
// Favorites & notifications (brief 05).
// ---------------------------------------------------------------------------
export const favoritePlace = sqliteTable(
  "favorite_place",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("favorite_place_unique").on(t.userId, t.placeId),
    index("favorite_place_user_idx").on(t.userId),
    index("favorite_place_place_idx").on(t.placeId),
  ],
);

export const favoriteEvent = sqliteTable(
  "favorite_event",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("favorite_event_unique").on(t.userId, t.eventId),
    index("favorite_event_user_idx").on(t.userId),
    index("favorite_event_event_idx").on(t.eventId),
  ],
);

export const notification = sqliteTable(
  "notification",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    kind: text("kind").notNull(), // 'new-event' | 'reminder'
    // new-event notifications are coalesced per (place, accept-batch) and link
    // to their events via `notification_event`; reminders are per-event.
    placeId: text("place_id").references(() => place.id),
    eventId: text("event_id").references(() => event.id),
    batchId: text("batch_id"), // groups a coalesced new-event notification
    title: text("title"),
    body: text("body"),
    readAt: text("read_at"),
    emailedAt: text("emailed_at"), // best-effort email delivery marker
    createdAt: createdAt(),
  },
  (t) => [
    // idempotency for per-event reminders; new-event rows have null eventId
    // (SQLite treats NULLs as distinct) so they are not collapsed here.
    uniqueIndex("notification_user_event_kind_unique").on(
      t.userId,
      t.eventId,
      t.kind,
    ),
    index("notification_user_idx").on(t.userId),
    index("notification_place_idx").on(t.placeId),
    index("notification_event_idx").on(t.eventId),
  ],
);

export const notificationEvent = sqliteTable(
  "notification_event",
  {
    id: id(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notification.id),
    eventId: text("event_id")
      .notNull()
      .references(() => event.id),
  },
  (t) => [
    uniqueIndex("notification_event_unique").on(
      t.notificationId,
      t.eventId,
    ),
    index("notification_event_notification_idx").on(t.notificationId),
    index("notification_event_event_idx").on(t.eventId),
  ],
);
