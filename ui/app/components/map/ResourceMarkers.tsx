import { Marker } from "react-leaflet";
import L from "leaflet";
import { categoryConfig } from "~/components/ui/CategoryBadge";
import type { Resource } from "@public-resource-map/shared";

function makePinIcon(color: string, size: number, selected: boolean) {
  const shadow = selected ? `box-shadow:0 10px 15px rgba(0,0,0,.2);` : "";
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid white;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;${shadow}
    ">
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface ResourceMarkersProps {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (r: Resource) => void;
}

export function ResourceMarkers({ resources, selectedId, onSelect }: ResourceMarkersProps) {
  return (
    <>
      {resources.map((r) => {
        const config = categoryConfig[r.category] ?? { color: "var(--cm-cat-other)" };
        const selected = r.id === selectedId;
        const size = selected ? 40 : 32;
        const icon = makePinIcon(config.color, size, selected);

        return (
          <Marker
            key={r.id}
            position={[r.coordinates.lat, r.coordinates.lng]}
            icon={icon}
            zIndexOffset={selected ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(r) }}
          />
        );
      })}
    </>
  );
}
