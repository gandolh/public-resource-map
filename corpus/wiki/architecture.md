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
- **Components**: shadcn/ui (new-york style, Radix UI primitives, lucide-react icons)
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
- **Migrations**: Drizzle Kit → `backend/drizzle/` folder

### API routes

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

Proximity filtering uses a bounding-box approximation (not Haversine). Good enough for city-scale use; see [open-questions.md](open-questions.md) for spatial index considerations.

## Shared (`shared/`)

Pure TypeScript types, no runtime code. Three modules:

- `types/common.ts` — `Coordinates`, `PaginatedResponse<T>`, `ApiError`
- `types/resource.ts` — `Resource`, `ResourceCategory`, `CreateResourceInput`
- `types/event.ts` — `Event`, `EventCategory`, `CreateEventInput`

Compiled with `composite: true` so downstream packages can use TypeScript project references.
