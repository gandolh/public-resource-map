import type { Coordinates } from "@public-resource-map/shared";

/**
 * A drawn area (brief 15): one closed ring of `[lat, lng]` vertices, the shape
 * Leaflet's `Polygon` takes. The closing edge is implied; the first vertex is
 * not repeated.
 */
export type AreaRing = [number, number][];

/** Fewer vertices than this is a line or a dot, not an area. */
export const MIN_AREA_VERTICES = 3;

/**
 * Is `point` inside `ring`? Even-odd ray casting over lat/lng treated as a
 * plane, which is exact enough at city scale: the shape was drawn by hand on a
 * Web Mercator map, and nobody draws to the metre. A self-intersecting
 * freehand loop follows the even-odd rule, so a figure eight's two lobes both
 * count and its crossing does not swallow the outside.
 *
 * A point exactly on an edge may land on either side.
 */
export function pointInRing(point: Coordinates, ring: AreaRing): boolean {
  if (ring.length < MIN_AREA_VERTICES) return false;
  const { lat: y, lng: x } = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i];
    const [yj, xj] = ring[j];
    const crosses = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

/** The area filter: with no area drawn, everything passes. */
export function inArea(point: Coordinates, area: AreaRing | null): boolean {
  return area === null || pointInRing(point, area);
}
