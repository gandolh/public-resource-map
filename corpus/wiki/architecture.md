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
- **Route config** (`app/routes.ts`): layout wrapper → home (`/`). `/events` referenced in Navbar but not yet a route.
- **Alias**: `~/*` and `@/*` both resolve to `./app/*`

### Current UI file map

```
app/
  root.tsx               HTML shell, error boundary, font preload (Inter)
  routes.ts              route config
  app.css                Tailwind + OKLCH theme tokens
  components/
    Layout.tsx           flex column: Navbar + main outlet
    Navbar.tsx           Home / Events links, theme toggle, profile dropdown
    ThemeProvider.tsx    context + localStorage persistence
    ThemeToggle.tsx      Sun/Moon dropdown
    ui/
      Avatar.tsx         Radix Avatar
      Button.tsx         CVA button (6 variants, 4 sizes)
      DropdownMenu.tsx   Radix DropdownMenu (full system)
  lib/
    LocalStorage.ts      type-safe get/set/has/remove/clear wrapper
    utils.ts             cn() = clsx + tailwind-merge
  routes/
    home.tsx             placeholder only
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
