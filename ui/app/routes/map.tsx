import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { MetaFunction } from "react-router";
import { SearchInput } from "~/components/ui/SearchInput";
import { FilterChip } from "~/components/ui/FilterChip";
import { RadiusSlider } from "~/components/ui/RadiusSlider";
import { DetailDrawer } from "~/components/ui/DetailDrawer";
import { UserLocationMarker } from "~/components/map/UserLocationMarker";
import { ResourceMarkers } from "~/components/map/ResourceMarkers";
import { useUserLocation } from "~/hooks/useUserLocation";
import { useNearbyResources } from "~/hooks/useNearbyResources";
import { useMapFilterStore } from "~/stores/mapFilterStore";
import { useIsDarkMode, LIGHT_TILES, DARK_TILES, CARTO_ATTR } from "~/lib/map";
import type { Coordinates, ResourceCategory } from "@public-resource-map/shared";

export const meta: MetaFunction = () => [
  { title: "Map — CivicMap" },
  { name: "description", content: "Explore public resources and events near you" },
];

const RESOURCE_CATEGORIES: { value: ResourceCategory; label: string }[] = [
  { value: "park", label: "Parks" },
  { value: "library", label: "Libraries" },
  { value: "healthcare", label: "Healthcare" },
  { value: "community_center", label: "Community" },
  { value: "education", label: "Education" },
  { value: "food", label: "Food" },
];

export default function MapPage() {
  const { coords, center, loading: locLoading } = useUserLocation();
  const { radius, category, search, selected, setRadius, toggleCategory, setSearch, setSelected } =
    useMapFilterStore();

  const { resources, loading: resLoading } = useNearbyResources({
    lat: center.lat,
    lng: center.lng,
    radiusKm: radius,
    category,
  });

  const dark = useIsDarkMode();

  return (
    <div className="relative w-full h-[calc(100vh-64px)] md:h-[calc(100vh-64px)] flex mt-16 pb-14 md:pb-0">
      {/* Map */}
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        className="flex-1 h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          url={dark ? DARK_TILES : LIGHT_TILES}
          attribution={CARTO_ATTR}
        />
        {coords && <UserLocationMarker coords={coords} />}
        <ResourceMarkers
          resources={resources}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
        />
        <MapRecenter center={center} />
      </MapContainer>

      {/* Search & Filter overlay */}
      <div className="absolute top-4 left-4 md:left-10 z-10 w-[calc(100%-32px)] md:w-[380px] flex flex-col gap-2">
        <SearchInput
          placeholder="Search CivicMap"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="bg-cm-surface rounded-lg border border-cm-outline-variant shadow-[0_4px_6px_rgba(0,0,0,0.05)] p-4 flex flex-col gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden -mx-1 px-1">
              {RESOURCE_CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat.value}
                  pressed={category === cat.value}
                  onPressedChange={() => toggleCategory(cat.value)}
                  className="flex-shrink-0"
                >
                  {cat.label}
                </FilterChip>
              ))}
            </div>
            {/* Fade mask signals the row is scrollable on mobile */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-cm-surface to-transparent" />
          </div>
          <RadiusSlider value={radius} onChange={setRadius} min={1} max={50} />
        </div>
      </div>

      {/* Loading indicator */}
      {(locLoading || resLoading) && (
        <div className="absolute top-4 right-4 z-10 bg-cm-surface border border-cm-outline-variant rounded-full px-3 py-1.5 text-xs text-cm-on-surface-variant shadow-sm">
          Loading…
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <DetailDrawer item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function MapRecenter({ center }: { center: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng]);
  }, [map, center.lat, center.lng]);
  return null;
}
