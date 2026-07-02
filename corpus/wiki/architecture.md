# Architecture

## Workspace layout

npm workspaces with three packages; dependency direction is strictly:

```
ui  ──►  shared  ◄──  backend
```

`shared` has no runtime dependencies and compiles to ESM with declaration files. `ui` and `backend` each depend on it via the npm workspace link (`"*"` version — resolved locally by npm).

## UI (`ui/`)

- **Framework**: React Router 8 (SPA mode — `ssr: false`)
- **Build**: Vite 7 + `@react-router/dev`
- **Styling**: Tailwind CSS 4 (Vite plugin), `tw-animate-css`, CSS custom properties for theming
- **Components**: `@base-ui/react` primitives + lucide-react icons (the original Stitch brief specified shadcn/ui; replaced during brief 01 — see [decisions.md → Code conventions](decisions.md))
- **Theme**: dark/light/system — persisted to localStorage as `"vite-ui-theme"`, toggled via `ThemeProvider` context
- **Route config** (`app/routes.ts`): layout wrapper wrapping four routes — index (`/`), `map`, `events`, `resources/:id`. Home redirects to `/map`.
- **Alias**: `~/*` and `@/*` both resolve to `./app/*`

### Current UI file map

```
app/
  root.tsx               HTML shell, error boundary, font preload (Inter)
  routes.ts              route config (index, map, events, resources/:id)
  app.css                Tailwind + OKLCH theme tokens
  components/
    Layout.tsx           QueryClientProvider + flex column: Navbar + main outlet
    Navbar.tsx           Map / Events links, theme toggle, profile dropdown (decorative)
    ThemeProvider.tsx    context + localStorage persistence
    ThemeToggle.tsx      Sun/Moon dropdown
    map/
      ResourceMarkers.tsx    Leaflet markers for resources
      UserLocationMarker.tsx user-location pin
    ui/                  Base UI primitives + CivicMap components
      Avatar, Button, DropdownMenu, CategoryBadge, FilterChip,
      EventCard, MapPin, DetailDrawer, SearchInput, Pagination, RadiusSlider
  hooks/
    useEvents.ts             TanStack Query — events list
    useNearbyResources.ts    TanStack Query — nearby resources
    useUserLocation.ts       geolocation hook
  lib/
    api.ts               typed fetch wrapper for backend
    map.ts               Leaflet/tile helpers
    queryClient.ts       TanStack Query client
    LocalStorage.ts      type-safe get/set/has/remove/clear wrapper
    utils.ts             cn() = clsx + tailwind-merge
  stores/
    locationStore.ts     Zustand — shared geolocation state
    mapFilterStore.ts    Zustand — category/radius/search/selection
  routes/
    home.tsx             redirects to /map
    map.tsx              Leaflet map + filter overlay + detail drawer
    events.tsx           events grid + category chips + pagination
    resources.$id.tsx    resource detail page
```

## Backend (`backend/`)

- **Server**: Fastify 5 with `@fastify/cors`
- **Database**: SQLite via `better-sqlite3` + Drizzle ORM
- **Validation**: Zod (request bodies and query strings)
- **DB file**: `backend/data/app.db` (gitignored)
- **Migrations**: Drizzle Kit → `backend/drizzle/` folder. One consolidated migration (`0000_*.sql`) expresses the full place-centric model (brief 07). Regenerate with `npx drizzle-kit generate` after editing `src/db/schema.ts`; apply with `npm run db:migrate` (runs `drizzle-orm`'s migrator via tsx from an empty DB up). POC stance: DB is gitignored with no prod data, so a clean reset + fresh migration is preferred over incremental ALTERs.

### API routes (CURRENT — event-centric; reshaped by briefs 03/04/05/14)

| Method | Path | Description |
|---|---|---|
| GET | `/health` | liveness check |
| GET | `/api/resources` | list nearby resources (lat/lng/radiusKm/category/page/pageSize) |
| GET | `/api/resources/:id` | single resource |
| POST | `/api/resources` | create resource |
| DELETE | `/api/resources/:id` | delete resource |
| GET | `/api/events` | list nearby events (+ from/to date filters) |
| GET | `/api/events/:id` | single event |
| POST | `/api/events` | create event |
| DELETE | `/api/events/:id` | delete event |

Proximity filtering uses a bounding-box approximation (not Haversine). Good enough for city-scale use.

> **Target API (after the reframe):** `/api/places` + `/api/places/:id` (brief 03), `/api/admin/*` ingestion + OSM sync behind the admin gate (briefs 03/04), `/api/auth/*` (brief 02), `/api/favorites/*` + `/api/notifications` (brief 05), `/archive` data (brief 14). The `resources`/`events` routes above are replaced. Spatial index question is **closed for POC** (bbox + `(lat,lng)`+city index — see decisions.md).
>
> _Transitional (brief 07): the `/api/resources*` route now operates on the `place` table and returns `Place`; `/api/events` joins `event → place` for proximity. Paths get renamed to `/api/places` in brief 03._

### Data layer — consolidated place-centric schema (brief 07)

One Drizzle schema (`backend/src/db/schema.ts`) owns the **full table set** so briefs 02/03/04/05/14 build only data + logic on top (no further structural migrations). Conventions: **`text` PK defaulting to `randomUUID()` on every table**; **UTC ISO 8601 string** dates (created/updated default to `datetime('now')`); **no universal soft-delete** — lifecycle via status enums; **two category taxonomies** (`PlaceCategory`, `EventCategory`); an **index on every FK** plus the spatial/natural-key indexes below.

**13 tables:**

| Table | Owner brief | Key columns | Natural-key uniques / notable indexes | FKs |
|---|---|---|---|---|
| `place` | 03 | `source` (`osm`\|`event-venue`), `osmType`/`osmId`, `isManualPin`, `category` (PlaceCategory), `city`, `lat`/`lng`, address/website/phone/openingHours | **unique `(osmType,osmId)` where `source='osm'`** (partial); index `(lat,lng)`; index `city` | — |
| `event` | 04 | `placeId`, `title`, `normalizedTitle`, `category` (EventCategory), `status` (`live`\|`stale`\|`ended`\|`past`), `startDate`/`endDate`, `buyUrl`, source/price fields | index `placeId`; index `status`; dedup index `(normalizedTitle,startDate,placeId)` | `place` |
| `user` | 02 | `email`, `passwordHash`, `displayName`, `role`, `emailVerified` | **unique `email`** | — |
| `session` | 02 | opaque `id` (cookie value), `expiresAt` | index `userId` | `user` |
| `verification_token` | 02 | `token`, `expiresAt` | unique `token`; index `userId` | `user` |
| `reset_token` | 02 | `token`, `expiresAt`, `usedAt` (single-use) | unique `token`; index `userId` | `user` |
| `event_source` | 04 | `adapterKey`, `mechanism`, `enabled`, health fields (`lastStatus`/`lastEventCount`/`lastSuccessfulAt`/`lastRunAt`) | unique `adapterKey` | — |
| `staged_event` | 04 | `sourceId`, nullable `placeId`, nullable `eventId`, `matchStatus` (auto-matched\|ambiguous\|unmatched\|manual), `status` (new\|changed\|accepted\|rejected\|needs-attention), `venueName`, `rawAddress`, `candidates` (JSON), `payload` (JSON) | index sourceId/placeId/eventId/status | `event_source`, `place`, `event` |
| `geocode_cache` | 04 | `normalizedAddress`, `city`, nullable `lat`/`lng` (null = cached miss), `importance`, `granularity`, `raw` (JSON) | **unique `normalizedAddress`** | — |
| `favorite_place` | 05 | `userId`, `placeId` | **unique `(userId,placeId)`**; FK indexes | `user`, `place` |
| `favorite_event` | 05 | `userId`, `eventId` | **unique `(userId,eventId)`**; FK indexes | `user`, `event` |
| `notification` | 05 | `kind` (`new-event`\|`reminder`), nullable `placeId`/`eventId`, `batchId` (coalesces a new-event batch), `readAt`, `emailedAt` | **unique `(userId,eventId,kind)`** (reminder idempotency; new-event rows have null `eventId`) | `user`, `place`, `event` |
| `notification_event` | 05 | join: `notificationId`, `eventId` | unique `(notificationId,eventId)`; FK indexes | `notification`, `event` |

**Lifecycle:** an `event` is never hard-deleted when it ends — it flips `status` to `past` (powers brief 14 archive); OSM re-sync upserts only `source='osm'` places (never clobbers `event-venue` or manual pins); new-event notifications are coalesced per `(place, batch)` and fan out via `notification_event`, reminders are per-event.

## Shared (`shared/`)

**Zod schemas + types derived via `z.infer`** (not pure types — it has runtime code: the Zod schemas; backend imports them so shape + validation share one source of truth). Three modules (place-centric after brief 07):

- `types/common.ts` — `coordinatesSchema`/`Coordinates`, `PaginatedResponse<T>`, `ApiError`, `nearbyQuerySchema`/`NearbyQuery`
- `types/place.ts` — `placeSchema`/`Place`, `placeCategorySchema`/`PlaceCategory` (park/library/clinic/museum/townhall/community_center/education/theater/sports/cultural_center/other), `placeSourceSchema`/`PlaceSource` (`osm`\|`event-venue`), `createPlaceSchema`/`CreatePlaceInput`. `Place` carries `source`, `osmType`/`osmId`, `isManualPin`, nullable `address`, `city`, `coordinates`.
- `types/event.ts` — `eventSchema`/`Event`, `eventCategorySchema`/`EventCategory` (concert/theater/sport/community/festival/exhibition/workshop/other), `eventStatusSchema`/`EventStatus` (live/stale/ended/past), `createEventSchema`/`CreateEventInput`. `Event` gains `placeId`, `status`, nullable `buyUrl`; **no standalone address/coordinates** (they live on the `Place`).

Imports use `.js` suffixes (Node ESM). Compiled with `composite: true` so downstream packages can use TypeScript project references. Reshaping these was a breaking change threaded through `backend/` (routes/seed) and `ui/` (api/store/map/detail/card/marker components) in one pass — all three workspaces typecheck.
