import { CircleMarker } from "react-leaflet";
import type { Coordinates } from "@public-resource-map/shared";

interface UserLocationMarkerProps {
  coords: Coordinates;
}

export function UserLocationMarker({ coords }: UserLocationMarkerProps) {
  return (
    <>
      {/* Pulse ring */}
      <CircleMarker
        center={[coords.lat, coords.lng]}
        radius={14}
        pathOptions={{
          color: "#1c6090",
          fillColor: "#1c6090",
          fillOpacity: 0.15,
          weight: 0,
        }}
      />
      {/* Inner dot */}
      <CircleMarker
        center={[coords.lat, coords.lng]}
        radius={7}
        pathOptions={{
          color: "#ffffff",
          fillColor: "#206393",
          fillOpacity: 1,
          weight: 2,
        }}
      />
    </>
  );
}
