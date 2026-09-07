import type { Coordinates, Place } from "@public-resource-map/shared";

export interface PlaceCluster {
  /** Stable across renders at the same zoom so Leaflet can reuse markers. */
  id: string;
  center: Coordinates;
  places: Place[];
  /** Upcoming events across the whole cluster — event presence must survive clustering. */
  eventCount: number;
}

export interface Point {
  x: number;
  y: number;
}

/**
 * Grid clustering in screen space, not in degrees: two pins overlap because
 * they are close *on screen*, and a fixed-degree grid gets that wrong at every
 * zoom but one.
 *
 * Clustering is a day-one legibility requirement rather than a performance
 * optimisation — a city's worth of OSM pins at city zoom is an unreadable mat
 * of dots. Hand-rolled because the job is one pass over a few hundred already
 * loaded points; a clustering plugin would be a dependency, a Leaflet-version
 * risk and a second styling system for the sake of thirty lines.
 */
export function clusterPlaces(
  places: Place[],
  project: (coords: Coordinates) => Point,
  cellPx = 72,
): PlaceCluster[] {
  const cells = new Map<string, Place[]>();

  for (const place of places) {
    const { x, y } = project(place.coordinates);
    const key = `${Math.floor(x / cellPx)}:${Math.floor(y / cellPx)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(place);
    else cells.set(key, [place]);
  }

  const clusters: PlaceCluster[] = [];
  for (const [key, members] of cells) {
    if (members.length === 1) {
      const only = members[0]!;
      clusters.push({
        id: only.id,
        center: only.coordinates,
        places: members,
        eventCount: only.upcomingEventCount ?? 0,
      });
      continue;
    }
    let lat = 0;
    let lng = 0;
    let eventCount = 0;
    for (const m of members) {
      lat += m.coordinates.lat;
      lng += m.coordinates.lng;
      eventCount += m.upcomingEventCount ?? 0;
    }
    clusters.push({
      id: `c${key}:${members.length}`,
      center: { lat: lat / members.length, lng: lng / members.length },
      places: members,
      eventCount,
    });
  }
  return clusters;
}
