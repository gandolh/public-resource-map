import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { OsmSyncResult } from "@public-resource-map/shared";
import type { DB } from "../db/index.js";
import { place } from "../db/schema.js";
import {
  OVERPASS_TAG_FILTERS,
  mapTagsToCategory,
  type OsmTags,
} from "./osm-categories.js";

// ---------------------------------------------------------------------------
// City registry — city is CONFIG, not hardcoded logic. Add a city here (key +
// display name + bounding box) to make it syncable. Bboxes are [S, W, N, E].
// ---------------------------------------------------------------------------
export interface CityConfig {
  key: string;
  name: string;
  bbox: { south: number; west: number; north: number; east: number };
}

export const CITIES: Record<string, CityConfig> = {
  timisoara: {
    key: "timisoara",
    name: "Timișoara",
    bbox: { south: 45.68, west: 21.1, north: 45.81, east: 21.31 },
  },
  bucuresti: {
    key: "bucuresti",
    name: "București",
    bbox: { south: 44.33, west: 25.96, north: 44.55, east: 26.23 },
  },
};

/** Lowercase + strip diacritics, so "Timișoara"/"timisoara"/"TIMISOARA" all resolve. */
function normalizeKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Resolve a city key or display name to its config, or null if unknown. */
export function resolveCity(input: string): CityConfig | null {
  const norm = normalizeKey(input);
  if (CITIES[norm]) return CITIES[norm];
  for (const city of Object.values(CITIES)) {
    if (normalizeKey(city.name) === norm) return city;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Overpass query
// ---------------------------------------------------------------------------
export function buildOverpassQuery(bbox: CityConfig["bbox"]): string {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses = OVERPASS_TAG_FILTERS.flatMap((filter) => [
    `  node${filter}(${b});`,
    `  way${filter}(${b});`,
    `  relation${filter}(${b});`,
  ]).join("\n");
  return `[out:json][timeout:90];\n(\n${clauses}\n);\nout center tags;`;
}

// ---------------------------------------------------------------------------
// Overpass fetch seam — the ONE network call. Tests stub this by injecting a
// `fetchOverpass` into `syncOsmForCity`, feeding a fixture Overpass JSON so the
// sync logic runs deterministically offline (never hits the real API).
// ---------------------------------------------------------------------------
export interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  geometry?: Array<{ lat: number; lon: number }>;
  tags?: OsmTags;
}

export interface OverpassResponse {
  elements: OverpassElement[];
}

export type OverpassFetcher = (query: string) => Promise<OverpassResponse>;

const OVERPASS_URL =
  process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";

export const fetchOverpass: OverpassFetcher = async (query) => {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "public-resource-map/0.1 (POC; OSM ODbL ingestion)",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) {
    throw new Error(`Overpass request failed (${res.status})`);
  }
  return (await res.json()) as OverpassResponse;
};

// ---------------------------------------------------------------------------
// Geometry — polygons/ways/relations land at their centroid.
// ---------------------------------------------------------------------------
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Centroid of a ring of points. Uses the area-weighted polygon-centroid formula
 * for 3+ points; falls back to the arithmetic mean for a degenerate ring (zero
 * area — collinear points) and for 1–2 points. x = lng, y = lat.
 */
export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) throw new Error("centroid: empty point list");
  if (points.length === 1) return points[0];

  const mean = (): LatLng => ({
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  });

  if (points.length === 2) return mean();

  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % points.length];
    const cross = p0.lng * p1.lat - p1.lng * p0.lat;
    area += cross;
    cx += (p0.lng + p1.lng) * cross;
    cy += (p0.lat + p1.lat) * cross;
  }
  area /= 2;
  if (Math.abs(area) < 1e-12) return mean();
  return { lng: cx / (6 * area), lat: cy / (6 * area) };
}

/** Extract a single coordinate for any element: node point, `center`, or centroid of `geometry`. */
export function elementCoords(el: OverpassElement): LatLng | null {
  if (typeof el.lat === "number" && typeof el.lon === "number") {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) return { lat: el.center.lat, lng: el.center.lon };
  if (el.geometry && el.geometry.length > 0) {
    return centroid(el.geometry.map((g) => ({ lat: g.lat, lng: g.lon })));
  }
  return null;
}

function composeAddress(tags: OsmTags): string | null {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  const city = tags["addr:city"];
  const parts = [
    [street, houseNumber].filter(Boolean).join(" "),
    city,
  ].filter((p) => p && p.length > 0);
  return parts.length > 0 ? parts.join(", ") : null;
}

export interface OsmPlaceInput {
  name: string;
  description: string | null;
  category: string;
  osmType: string;
  osmId: string;
  address: string | null;
  city: string;
  lat: number;
  lng: number;
  website: string | null;
  phone: string | null;
  openingHours: string | null;
}

export interface NormalizeResult {
  places: OsmPlaceInput[];
  skippedUnnamed: number;
  skippedNoGeometry: number;
}

/**
 * Turn raw Overpass elements into place-insert rows. Drops un-named features
 * (nameless pin = noise) and features Overpass returned without a resolvable
 * point; KEEPS un-addressed features (address is nullable). Pure + testable.
 */
export function elementsToPlaces(
  elements: OverpassElement[],
  cityName: string,
): NormalizeResult {
  const places: OsmPlaceInput[] = [];
  let skippedUnnamed = 0;
  let skippedNoGeometry = 0;

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name;
    if (!name || name.trim().length === 0) {
      skippedUnnamed++;
      continue;
    }
    const coords = elementCoords(el);
    if (!coords) {
      skippedNoGeometry++;
      continue;
    }
    places.push({
      name,
      description: null,
      category: mapTagsToCategory(tags),
      osmType: el.type,
      osmId: String(el.id),
      address: composeAddress(tags),
      city: cityName,
      lat: coords.lat,
      lng: coords.lng,
      website: tags.website ?? tags["contact:website"] ?? null,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      openingHours: tags.opening_hours ?? null,
    });
  }

  return { places, skippedUnnamed, skippedNoGeometry };
}

// ---------------------------------------------------------------------------
// Upsert — touches `source:osm` rows ONLY (matched on osmType+osmId+source),
// so `source:event-venue` places never match. Manual pins are also guarded
// explicitly (never clobbered). Runs infrequently (admin-triggered) so a
// per-row select+insert/update is fine and keeps the "don't clobber" rule
// obvious.
// ---------------------------------------------------------------------------
export interface UpsertResult {
  inserted: number;
  updated: number;
  skippedProtected: number;
}

export async function upsertOsmPlaces(
  db: DB,
  places: OsmPlaceInput[],
): Promise<UpsertResult> {
  let inserted = 0;
  let updated = 0;
  let skippedProtected = 0;

  for (const p of places) {
    const existing = await db
      .select()
      .from(place)
      .where(
        and(
          eq(place.source, "osm"),
          eq(place.osmType, p.osmType),
          eq(place.osmId, p.osmId),
        ),
      )
      .get();

    if (existing) {
      if (existing.isManualPin) {
        skippedProtected++;
        continue;
      }
      await db
        .update(place)
        .set({
          name: p.name,
          description: p.description,
          category: p.category,
          address: p.address,
          city: p.city,
          lat: p.lat,
          lng: p.lng,
          website: p.website,
          phone: p.phone,
          openingHours: p.openingHours,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(place.id, existing.id));
      updated++;
    } else {
      await db.insert(place).values({
        id: randomUUID(),
        source: "osm",
        isManualPin: false,
        ...p,
      });
      inserted++;
    }
  }

  return { inserted, updated, skippedProtected };
}

// ---------------------------------------------------------------------------
// Orchestrator — build query → fetch (stubbable) → normalize → upsert.
// ---------------------------------------------------------------------------
export interface SyncDeps {
  fetchOverpass?: OverpassFetcher;
}

export async function syncOsmForCity(
  db: DB,
  city: CityConfig,
  deps: SyncDeps = {},
): Promise<OsmSyncResult> {
  const fetcher = deps.fetchOverpass ?? fetchOverpass;
  const query = buildOverpassQuery(city.bbox);
  const response = await fetcher(query);
  const elements = response.elements ?? [];

  const { places, skippedUnnamed, skippedNoGeometry } = elementsToPlaces(
    elements,
    city.name,
  );
  const { inserted, updated, skippedProtected } = await upsertOsmPlaces(
    db,
    places,
  );

  return {
    city: city.name,
    fetched: elements.length,
    upserted: inserted + updated,
    inserted,
    updated,
    skippedUnnamed,
    skippedNoGeometry,
    skippedProtected,
  };
}
