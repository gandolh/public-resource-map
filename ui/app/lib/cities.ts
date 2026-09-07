import type { Coordinates } from "@public-resource-map/shared";

/**
 * POC scope is two cities, but the city is configuration rather than a
 * hardcoded branch — adding Cluj is a new entry here plus an OSM sync run.
 * `name` must match the `place.city` column exactly; it is the query key.
 */
export interface City {
  id: string;
  name: string;
  center: Coordinates;
  zoom: number;
}

export const CITIES: City[] = [
  { id: "timisoara", name: "Timișoara", center: { lat: 45.7539, lng: 21.2257 }, zoom: 14 },
  { id: "bucuresti", name: "București", center: { lat: 44.4353, lng: 26.1025 }, zoom: 13 },
];

export const DEFAULT_CITY = CITIES[0]!;

export function cityById(id: string | undefined): City {
  return CITIES.find((c) => c.id === id) ?? DEFAULT_CITY;
}

export function cityByName(name: string | undefined): City | undefined {
  return CITIES.find((c) => c.name === name);
}

/** Straight-line km between two points — good enough to pick the nearer city. */
function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * The nearer of the supported cities, but only if the user is plausibly in one
 * of them. Someone opening this from Berlin gets the default rather than being
 * told they are in București.
 */
export function nearestCity(coords: Coordinates, maxKm = 60): City | undefined {
  let best: City | undefined;
  let bestKm = Infinity;
  for (const city of CITIES) {
    const km = haversineKm(coords, city.center);
    if (km < bestKm) { bestKm = km; best = city; }
  }
  return bestKm <= maxKm ? best : undefined;
}
