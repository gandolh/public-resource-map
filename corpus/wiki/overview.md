# Overview

**Public Resource Map** is a web application that lets users discover nearby public resources (parks, libraries, healthcare, etc.) and local events on an interactive map. A user opens the app, the map centers on their location, and they can browse or filter pins for resources and events within a configurable radius. Clicking a pin shows details and, for events, links out to the original ticketing/listing platform (e.g. iabilet.ro).

## Status (as of 2026-06-26)

Functional. The UI shell (layout, navbar, theme system, component library) is complete. The map page renders Leaflet tiles with resource markers, category filter, radius slider, and a detail drawer; the events page lists paginated nearby events; the resource detail page is wired up. The backend serves seeded NYC resources/events over a REST API. Home redirects to `/map`.

## Major components

| Package | Role |
|---|---|
| `ui/` | React 19 SPA — React Router 8, Vite 7, Tailwind 4. Data fetching via TanStack Query; UI state via Zustand. |
| `backend/` | Fastify 5 REST API — SQLite via Drizzle ORM, Zod validation |
| `shared/` | Zod schemas + derived TypeScript types shared between ui and backend |

## Key external dependencies

- **Mapping**: Leaflet + react-leaflet, CARTO basemaps (light/dark)
- **Data sources**: seeded fixtures only; external event/resource feeds not yet integrated

## Repo layout

```
public-resource-map/
  package.json        root — npm workspaces
  shared/             @public-resource-map/shared
  backend/            @public-resource-map/backend
  ui/                 @public-resource-map/ui
  corpus/             this knowledge base
```
