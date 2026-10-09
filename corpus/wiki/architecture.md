---
summary: How the code is put together: the ui → shared ← backend workspaces, the UI file map, backend routes and services, and what lives in shared.
updated: 2026-10-09
---

# Architecture

## Workspace layout

npm workspaces with three code packages, plus `docs/` (the Starlight site); dependency direction is strictly:

```
ui  ──►  shared  ◄──  backend
```

`shared`'s one runtime dependency is Zod, and it compiles to ESM with declaration files. `ui` and `backend` each depend on it via the npm workspace link (`"*"` version — resolved locally by npm).

## UI (`ui/`)

- **Framework**: React Router 8 (SPA mode — `ssr: false`), `basename` from `PRM_BASE` (`/prm/` in the deploy, `/` in dev)
- **Build**: Vite 7 + `@react-router/dev`
- **Styling**: Tailwind CSS 4 (Vite plugin) over hex tokens in `app.css`, mapped to `--color-*`; Archivo from Google Fonts
- **Components**: `@base-ui/react` primitives + lucide-react icons (the original Stitch brief specified shadcn/ui; replaced during brief 01 — see [decisions-engineering.md → Code conventions](decisions-engineering.md))
- **Map**: Leaflet 1.9 + react-leaflet 5; the whole city is loaded once and clustered client-side
- **Data**: TanStack Query for server state, Zustand for city/filter/auth state
- **Language**: Romanian by default, English switch, in `lib/i18n.tsx` (no framework)
- **Theme**: dark/light/system — persisted to localStorage as `"vite-ui-theme"`, toggled via `ThemeProvider` context
- **Sign-in**: none in this app. Login, register and account are full navigations to Ward (`/ward/login`, `/ward/register?app=prm`, `/ward/account`), built in `lib/authApi.ts`
- **Alias**: `~/*` and `@/*` both resolve to `./app/*`

### Routes (`app/routes.ts`)

| Path | Module | What |
|---|---|---|
| `/` | `routes/map.tsx` | the map; home |
| `/places/:id` | `routes/place.tsx` | child of `/`, so the map stays mounted under the place panel |
| `/whats-on` | `routes/whats-on.tsx` | the city's upcoming events, on the map's filters |
| `/archive` | `routes/archive.tsx` | past events, citywide or mine |
| `/about-data` | `routes/about-data.tsx` | sources, licences, takedown contact |
| `/map`, `/events`, `/resources/:id` | `routes/legacy.*.tsx` | old URLs; a `clientLoader` redirects to `/`, `/whats-on`, `/places/:id` |
| `/admin`, `/admin/sources` | `routes/admin/` | own shell (`AdminLayout`), code-split from the public pages |

### Current UI file map

```
app/
  root.tsx               HTML shell (lang="ro"), font links, error boundary
  routes.ts              route config (table above)
  app.css                Tailwind + design tokens, both themes
  components/
    Layout.tsx           AppProviders (Query, i18n, theme) + Navbar + main outlet + NoticeToast
    Navbar.tsx           top links / phone bottom tabs, city picker, bell, account menu (Ward links)
    FavoriteStar.tsx     follow a place / remind me of an event; signed out, offers Ward sign-in
    ThemeProvider.tsx    context + localStorage persistence
    ThemeToggle.tsx      light / dark / system
    map/                 PlaceMarkers (pins + clusters), FilterBar (chips, lens, draw entry),
                         AreaDraw (freehand + polygon, brief 15), UserLocationMarker
    place/               PlaceDetail (the one place view), PlacePanel (desktop), PlaceSheet (phone),
                         EventList, EventPlaceRow (what's-on and archive rows)
    shell/               Bell (inbox), BrandMark, CityPicker, LangToggle, NoticeToast
    ui/                  Avatar, Button, CategoryBadge, Chip, DropdownMenu, SearchInput,
                         Segmented (timing lens), Skeleton, StateBlock (empty / zero results / error)
  hooks/                 usePlaces (+ usePlace, usePlaceEvents), useFavorites (+ inbox),
                         useArchive, useAdmin, useIsMobile, useUserLocation
  lib/
    api.ts               typed fetch for the public API (whole-city places, what's-on, archive)
    adminApi.ts          admin routes
    meApi.ts             favourites + inbox
    authApi.ts           fetchMe (/api/me) and the Ward URLs
    i18n.tsx             RO/EN strings, Intl plurals and dates
    cities.ts            the two cities: id, name (= place.city), centre, zoom
    categories.tsx       category icon paths + hues, shared by the panel and the Leaflet pins
    cluster.ts           screen-space grid clustering
    area.ts              point-in-drawn-area
    dates.ts             Bucharest calendar days and the day groups
    map.ts               basemap tiles (CARTO with a key, filtered OSM without)
    queryClient.ts, LocalStorage.ts, utils.ts (cn, normalizeText)
  stores/
    appStore.ts          Zustand — city, chips, lens, drawn area: one store for map + what's-on
    authStore.ts         Zustand — who is signed in, from /api/me
    locationStore.ts     Zustand — geolocation, default centre
  routes/
    map.tsx              full-bleed map, filter bar, zero-results chips; outlet for places/:id
    place.tsx            place panel/sheet over the live map; a cold visit centres on the place
    whats-on.tsx         citywide, day-grouped list
    archive.tsx          month-grouped past events, paged
    about-data.tsx       attribution and the data posture
    redirects.tsx        the redirects behind legacy.map / legacy.events / legacy.resource
    admin/               AdminLayout, review.tsx (staged-event queue), sources.tsx
```

## Backend (`backend/`)

- **Server**: Fastify 5 with `@fastify/cors` (`credentials: true`, so Ward's cookie arrives)
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM
- **Validation**: Zod (request bodies and query strings)
- **Identity**: Ward; `jose` verifies its tokens locally (`ward/`)
- **DB file**: `backend/data/app.db` (gitignored), or `DATABASE_PATH`, which the deploy points outside the rsynced tree
- **Migrations**: Drizzle Kit → `backend/drizzle/`, applied with `npm run db:migrate` (`drizzle-orm`'s migrator via tsx). Five: `0000` the consolidated place-centric schema (brief 07), `0001` the Ward cutover (hand-written: drops the user tables, rebuilds the per-person ones empty and keyed on `subject`), `0002` ingestion keys on `staged_event` (brief 04), `0003` reconciles 0001 with `schema.ts` (brief 29), `0004` `place.retired_at` (brief 34). `migrations.test.ts` fails when the migrated database drifts from `schema.ts`.

### Backend modules (`src/`)

```
index.ts       listen on PORT (3001); start the daily reminder sweep
app.ts         buildApp(): CORS, Ward wiring, the mail sweeper, the route plugins under /api
routes/        places, events, whats-on, archive, favorites (+ inbox), me, admin-osm,
               admin-ingest; event-mapper + event-window shared by the read routes
ward/          client (JWT verify + introspection, 30 s cache), plugin (request.ward,
               requireAuth, requireAdmin), config, wire types
ingest/        pipeline (fetch → dedup → match → geocode → reconcile → staged diff),
               adapters, iCal reader, venue matching, Nominatim geocoder
lib/           osm-sync (Overpass, city registry, retiring), osm-categories, notify (new-event
               items at accept), notify-mail (mail via Ward), geo, time, fk
jobs/          reminder-sweep: day-before reminders at 09:00 Bucharest
db/            schema, index (createDb), migrate, seed (+ seed-data, seed-ids), capture-osm, fixtures/
test/          harness (in-memory DB + injected Ward), fake-ward, real-ward
```

### API routes

| Method | Path | Description |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/api/places` | a city's places (or a bbox), category chips + timing lens, each with `upcomingEventCount` (public) |
| GET | `/api/places/:id` | single place (public) |
| GET | `/api/places/:id/events` | what is on at a place in the lens window (public) |
| POST · DELETE | `/api/places`, `/api/places/:id` | create / delete a place — **admin only** (`requireAdmin`, brief 18); 409 `PLACE_IN_USE` while anything references it |
| GET | `/api/events` | events near a point (+ from/to date filters) (public) |
| GET | `/api/events/:id` | single event (public) |
| POST · DELETE | `/api/events`, `/api/events/:id` | create (publishes straight to `live`) / delete an event — **admin only**; 409 `EVENT_IN_USE` while referenced |
| GET | `/api/whats-on` | the city's upcoming events with their places, on the map's filters (public) |
| GET | `/api/archive` | past events citywide, newest first (public) |
| GET | `/api/archive/mine` | past events you saved or at places you follow — **signed in** |
| GET | `/api/me` | the signed-in Ward caller, narrowed |
| GET | `/api/favorites` | your followed places and saved events — **signed in** |
| POST · DELETE | `/api/favorites/places/:placeId`, `/api/favorites/events/:eventId` | follow / unfollow, idempotent — **signed in** |
| GET · POST | `/api/notifications`, `/api/notifications/read` | the inbox; mark items (or all) read — **signed in** |
| POST | `/api/admin/osm/sync` | OSM import for a city — **admin only**; 409 while that city is syncing, 504 when Overpass does not answer in 100 s (brief 33) |
| GET · POST · PATCH | `/api/admin/sources`, `/api/admin/sources/:id` | list / add / enable-disable event sources — **admin only** |
| POST | `/api/admin/sources/:id/refresh`, `/api/admin/sources/refresh-all` | run one source, or every enabled one in turn, into a staged diff — **admin only** |
| GET | `/api/admin/staged-events` | the review queue — **admin only** |
| POST | `/api/admin/staged-events/accept`, `…/reject`, `…/:id/place` | accept (goes live, notifies followers, kicks mail), reject, or set a staged event's place by hand — **admin only** |

"Signed in" is `requireAuth`; "admin only" is `requireAdmin` (401 anonymous, 403 without `prm:admin`).
Ward is asked only by those two guards and `/api/me`, through `resolveWard`, at most once per
request. A public route never asks, even when a `ward_session` cookie comes in (brief 30).

Public place reads skip retired places. Proximity filtering uses a bounding-box approximation (not Haversine). Good enough for city-scale use.

### Data layer — place-centric schema (brief 07, then Ward)

One Drizzle schema (`backend/src/db/schema.ts`). Brief 07 consolidated it; the Ward cutover (2026-09-06) then dropped `user`, `session`, `verification_token` and `reset_token`. prm holds no credential, and the per-person rows are keyed on Ward's opaque **`subject`** with no foreign key. The table it would point at does not exist here. Conventions: **`text` PK defaulting to `randomUUID()`** (except `notification_event`, keyed on its pair); **UTC ISO 8601 string** dates (created/updated default to `datetime('now')`); **no universal soft-delete** — lifecycle via status enums and `place.retiredAt`; **two category taxonomies** (`PlaceCategory`, `EventCategory`); an **index on every FK** plus the spatial/natural-key indexes below.

**9 tables:**

| Table | Owner brief | Key columns | Natural-key uniques / notable indexes | FKs |
|---|---|---|---|---|
| `place` | 03 | `source` (`osm`\|`event-venue`), `osmType`/`osmId`, `isManualPin`, `category` (PlaceCategory), `city`, `lat`/`lng`, address/website/phone/openingHours, `retiredAt` (brief 34) | **unique `(osmType,osmId)` where `source='osm'`** (partial); index `(lat,lng)`; index `city` | — |
| `event` | 04 | `placeId`, `title`, `normalizedTitle`, `category` (EventCategory), `status` (`live`\|`stale`\|`ended`\|`past`), `startDate`/`endDate`, `buyUrl`, source/price fields | index `placeId`; index `status`; dedup index `(normalizedTitle,startDate,placeId)` | `place` |
| `event_source` | 04 | `adapterKey`, `mechanism`, `url`, `city`, `enabled`, health fields (`lastStatus`/`lastEventCount`/`lastSuccessfulAt`/`lastRunAt`) | unique `adapterKey` | — |
| `staged_event` | 04 | `sourceId`, nullable `placeId`, nullable `eventId`, `matchStatus` (auto-matched\|ambiguous\|unmatched\|manual), `status` (new\|changed\|accepted\|rejected\|needs-attention), `venueName`, `rawAddress`, `candidates` (JSON), `payload` (JSON), `externalKey`, geocoded `lat`/`lng`, `lastSeenAt` | index sourceId, `(sourceId,externalKey)`, placeId, eventId, status | `event_source`, `place`, `event` |
| `geocode_cache` | 04 | `normalizedAddress`, `city`, nullable `lat`/`lng` (null = cached miss), `importance`, `granularity`, `raw` (JSON) | **unique `normalizedAddress`** | — |
| `favorite_place` | 05 | `subject`, `placeId` | **unique `(subject,placeId)`**; indexes on both | `place` |
| `favorite_event` | 05 | `subject`, `eventId` | **unique `(subject,eventId)`**; indexes on both | `event` |
| `notification` | 05 | `subject`, `kind` (`new-event`\|`reminder`), nullable `placeId`/`eventId`, `batchId` (coalesces a new-event batch), `readAt`, `emailedAt` | **unique `(subject,eventId,kind)`** (reminder idempotency; new-event rows have null `eventId`) | `place`, `event` |
| `notification_event` | 05, 29 | join: `notificationId`, `eventId` | **PK `(notificationId,eventId)`**; index `eventId`; deleted with its notification | `notification`, `event` |

**Lifecycle:** an `event` is never hard-deleted when it ends — it flips `status` to `past` (powers brief 14 archive); OSM re-sync upserts only `source='osm'` places (never clobbers `event-venue` or manual pins) and sets `retiredAt` on the ones OSM no longer has (brief 34); new-event notifications are coalesced per `(place, batch)` and fan out via `notification_event`, reminders are per-event. Each row is mailed once through Ward's `POST /notify` by `lib/notify-mail.ts`, kicked after an accept and after the daily reminder run; `emailedAt` marks it (brief 32).

## Shared (`shared/`)

**Zod schemas + types derived via `z.infer`** (not pure types — it has runtime code: the Zod schemas; backend imports them so shape + validation share one source of truth). Seven modules, re-exported from `src/index.ts`:

- `types/common.ts` — `coordinatesSchema`/`Coordinates`, `httpUrlSchema` (http(s) only, brief 33), `PaginatedResponse<T>`, `ApiError`, `nearbyQuerySchema`/`NearbyQuery`, the timing lens (`eventLenses`: today/weekend/all), `parseCsv`, and the query schemas for `/api/places`, `/api/places/:id/events` and `/api/whats-on`
- `types/place.ts` — `placeSchema`/`Place`, `placeCategorySchema`/`PlaceCategory` (park/library/clinic/museum/townhall/community_center/education/theater/sports/cultural_center/other), `placeSourceSchema`/`PlaceSource` (`osm`\|`event-venue`), `createPlaceSchema`/`CreatePlaceInput`. `Place` carries `source`, `osmType`/`osmId`, `isManualPin`, nullable `address`, `city`, `coordinates`.
- `types/event.ts` — `eventSchema`/`Event`, `eventCategorySchema`/`EventCategory` (concert/theater/sport/community/festival/exhibition/workshop/other), `eventStatusSchema`/`EventStatus` (live/stale/ended/past), `createEventSchema`/`CreateEventInput`. `Event` has `placeId`, `status`, nullable `buyUrl`; **no standalone address/coordinates** (they live on the `Place`).
- `types/whats-on.ts` — `WhatsOnItem` (an event with its place), `archiveQuerySchema`
- `types/ingest.ts` — sources (`SourceMechanism`, `createSourceSchema`, health), `RawEvent`, staged-event statuses and match statuses, the admin DTOs
- `types/osm.ts` — `osmSyncRequestSchema`/`osmSyncResultSchema`
- `types/notifications.ts` — `FavoritesDto`, `NotificationDto`/`InboxDto`, `markReadSchema`

Imports use `.js` suffixes (Node ESM). Compiled with `composite: true` so downstream packages can use TypeScript project references.
