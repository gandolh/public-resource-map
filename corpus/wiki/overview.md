# Overview

**Public Resource Map** is a web application that lets users discover nearby public resources (parks, libraries, healthcare, etc.) and local events on an interactive map. A user opens the app, the map centers on their location, and they can browse or filter pins for resources and events within a configurable radius. Clicking a pin shows details and, for events, links out to the original ticketing/listing platform (e.g. iabilet.ro).

## Status (as of 2026-06-26)

Early-stage. The UI shell (layout, navbar, theme system, shadcn/ui component library) is complete. The home page is a placeholder. The backend exists as scaffolding with no data yet. No map integration has been wired up.

## Major components

| Package | Role |
|---|---|
| `ui/` | React 19 SPA — React Router 8, Vite 7, Tailwind 4, shadcn/ui |
| `backend/` | Fastify 5 REST API — SQLite via Drizzle ORM, Zod validation |
| `shared/` | TypeScript types shared between ui and backend |

## Key external dependencies

- **Mapping**: not yet chosen — likely Leaflet or Mapbox GL JS (see [open-questions.md](open-questions.md))
- **Data sources**: not yet integrated — iabilet.ro and other local event/resource feeds

## Repo layout

```
public-resource-map/
  package.json        root — npm workspaces
  shared/             @public-resource-map/shared
  backend/            @public-resource-map/backend
  ui/                 @public-resource-map/ui
  corpus/             this knowledge base
```
