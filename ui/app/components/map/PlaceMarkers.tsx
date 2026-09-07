import { useCallback, useEffect, useMemo, useState } from "react";
import { Marker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Coordinates, Place } from "@public-resource-map/shared";
import { categoryColor, categoryIconMarkup } from "~/lib/categories";
import { clusterPlaces, type PlaceCluster } from "~/lib/cluster";

const PIN = 30;
const PIN_SELECTED = 38;

function pinIcon(place: Place, selected: boolean): L.DivIcon {
  const size = selected ? PIN_SELECTED : PIN;
  const glyph = Math.round(size * 0.46);
  const count = place.upcomingEventCount ?? 0;
  const html =
    `<div class="cmp${selected ? " is-selected" : ""}" ` +
    `style="width:${size}px;height:${size}px;--c:${categoryColor(place.category)}">` +
    `<div class="cmp-drop"><span class="cmp-ico">` +
    categoryIconMarkup(place.category, glyph, "currentColor") +
    `</span></div>` +
    (count > 0 ? `<span class="cmp-badge">${count > 99 ? "99+" : count}</span>` : "") +
    `</div>`;

  return L.divIcon({
    html,
    className: "cm-pin",
    iconSize: [size, size],
    // A teardrop points at its location; anchor the tip, not the middle.
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function clusterIcon(cluster: PlaceCluster): L.DivIcon {
  const n = cluster.places.length;
  // Radius tracks the count, so density is legible before you read the number.
  const size = n < 5 ? 32 : n < 10 ? 37 : n < 25 ? 42 : n < 50 ? 47 : 52;
  const font = n < 10 ? 13 : n < 100 ? 13.5 : 12.5;
  const events = cluster.eventCount;
  const html =
    `<div style="position:relative;width:${size}px;height:${size}px">` +
    `<div class="cmc" style="width:${size}px;height:${size}px;font-size:${font}px">${n}</div>` +
    (events > 0
      ? `<span class="cmc-badge">${events > 99 ? "99+" : events}</span>`
      : "") +
    `</div>`;
  return L.divIcon({
    html,
    className: "cm-cluster",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface PlaceMarkersProps {
  places: Place[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
  clusterLabel: (n: number) => string;
}

/**
 * Pins, clustered. The grid is computed in projected pixels at the current
 * zoom, so it only has to be rebuilt when the zoom changes — panning reuses it,
 * which is what stops markers churning while the user drags.
 */
export function PlaceMarkers({ places, selectedId, onSelect, clusterLabel }: PlaceMarkersProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());

  useEffect(() => {
    const onZoom = () => setZoom(map.getZoom());
    map.on("zoomend", onZoom);
    return () => {
      map.off("zoomend", onZoom);
    };
  }, [map]);

  const project = useCallback(
    (coords: Coordinates) => map.project([coords.lat, coords.lng], zoom),
    [map, zoom],
  );

  const clusters = useMemo(
    // Past zoom 16 the city is spread out enough that pins no longer collide,
    // and clustering only gets in the way of picking one.
    () => (zoom >= 16 ? clusterPlaces(places, project, 1) : clusterPlaces(places, project)),
    [places, project, zoom],
  );

  return (
    <>
      {clusters.map((cluster) => {
        if (cluster.places.length === 1) {
          const place = cluster.places[0]!;
          const selected = place.id === selectedId;
          return (
            <Marker
              key={place.id}
              position={[place.coordinates.lat, place.coordinates.lng]}
              icon={pinIcon(place, selected)}
              zIndexOffset={selected ? 1000 : 0}
              alt={place.name}
              keyboard
              eventHandlers={{ click: () => onSelect(place) }}
            />
          );
        }

        return (
          <Marker
            key={cluster.id}
            position={[cluster.center.lat, cluster.center.lng]}
            icon={clusterIcon(cluster)}
            alt={clusterLabel(cluster.places.length)}
            title={clusterLabel(cluster.places.length)}
            keyboard
            eventHandlers={{
              click: () => {
                const bounds = L.latLngBounds(
                  cluster.places.map((p) => [p.coordinates.lat, p.coordinates.lng] as [number, number]),
                );
                map.flyToBounds(bounds, { padding: [72, 72], maxZoom: 17, duration: 0.45 });
              },
            }}
          />
        );
      })}
    </>
  );
}
