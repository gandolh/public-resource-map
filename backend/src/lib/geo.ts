/**
 * Approximate lat/lng bounds for a radius (km) around a point. Good enough for
 * a cheap indexed BETWEEN filter; callers can refine with an exact distance if
 * needed. ~111 km per degree of latitude; longitude scales by cos(lat).
 */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.0;
  const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
