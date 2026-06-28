# Overview

**Public Resource Map** is a **place-centric** web app for Romanian cities (POC scope: **Timișoara + București**). The map's unit is a **place** — a public resource (park, library, clinic, museum, town hall) and/or an event host. A user picks a city, sees nearby places on the map, selects a place, and sees **what's on there** (temporary exhibitions, town-hall public events, etc.), with a buy-tickets link **only when the public source itself provides one**.

It is a **proof-of-concept**, not a launch-ready business — see [decisions.md → Legal posture](decisions.md). The tech is demonstrable end-to-end; commercial/public launch of any reuse-restricted source is blocked on obtaining permission.

## Data model in one line

Pins are **places**, from two sources: **OSM** (parks/libraries/clinics/museums/town halls — ODbL, reuse-permitted, the clean anchor) and **event-venue** (created when an event's venue can't be matched to an OSM place). Events attach to places. Events come from **public primary publishers** (venue/museum/municipal calendars), **API-first, scrape-last** — never from scraping a ticketing aggregator.

## Status (as of 2026-06-28)

The existing code is functional but was built for an **earlier event-centric model** and predates the place-centric pivot: the UI has `/map` (resource markers), a standalone `/events` grid, and `/resources/:id`; the backend serves seeded **NYC** placeholder data. The 2026-06-28 grilling session re-shaped the product (legal pivot → POC, place-centric model, public-source ingestion, in-app notifications, geocoding-as-fallback, unified place UI). Those decisions are locked in [decisions.md](decisions.md); the **code and brief 02 now need to catch up** to them.

## Major components

| Package | Role |
|---|---|
| `ui/` | React 19 SPA — React Router 8, Vite 7, Tailwind 4. Data fetching via TanStack Query; UI state via Zustand. |
| `backend/` | Fastify 5 REST API — SQLite via Drizzle ORM, Zod validation. Also runs the in-process daily reminder sweep. |
| `shared/` | Zod schemas + derived TypeScript types shared between ui and backend |

## Key external dependencies

- **Mapping**: Leaflet + react-leaflet, CARTO basemaps (light/dark)
- **Resource data**: OpenStreetMap via the **Overpass API** (ODbL), ingested per-city into SQLite (admin-triggered sync)
- **Geocoding**: **Nominatim** (public server, POC) — fallback only, for event-venues not matched to an OSM place; cached per address
- **Event data**: public **primary-publisher** sources per city (API/feed preferred, scrape last). Currently still seeded NYC placeholder; real ingestion is brief 02.

## Repo layout

```
public-resource-map/
  package.json        root — npm workspaces
  shared/             @public-resource-map/shared
  backend/            @public-resource-map/backend
  ui/                 @public-resource-map/ui
  corpus/             this knowledge base
```
