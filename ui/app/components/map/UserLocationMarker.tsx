import { CircleMarker } from "react-leaflet";
import type { Coordinates } from "@public-resource-map/shared";

/**
 * "You are here", in the accent — the one place on the map the accent is spent,
 * so it never competes with a category hue for meaning.
 */
export function UserLocationMarker({ coords }: { coords: Coordinates }) {
  const accent = "var(--accent)";
  return (
    <>
      <CircleMarker
        center={[coords.lat, coords.lng]}
        radius={15}
        pathOptions={{ color: accent, fillColor: accent, fillOpacity: 0.14, weight: 0 }}
        interactive={false}
      />
      <CircleMarker
        center={[coords.lat, coords.lng]}
        radius={6.5}
        pathOptions={{ color: "var(--surface)", fillColor: accent, fillOpacity: 1, weight: 2.5 }}
        interactive={false}
      />
    </>
  );
}
