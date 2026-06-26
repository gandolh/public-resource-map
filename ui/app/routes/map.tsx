import { useState, useCallback } from "react";
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
import type { Resource, ResourceCategory } from "@public-resource-map/shared";

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

const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const DARK_TILES  = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const CARTO_ATTR  = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

function isDarkMode() {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

export default function MapPage() {
  const { coords, loading: locLoading } = useUserLocation();
  const [radius, setRadius] = useState(5);
  const [activeCategories, setActiveCategories] = useState<Set<ResourceCategory>>(new Set());
  const [selectedItem, setSelectedItem] = useState<Resource | null>(null);
  const [search, setSearch] = useState("");

  const center = coords ?? { lat: 44.4268, lng: 26.1025 }; // Bucharest default

  const { resources, loading: resLoading } = useNearbyResources({
    lat: center.lat,
    lng: center.lng,
    radiusKm: radius,
    categories: activeCategories.size > 0 ? [...activeCategories] : undefined,
  });

  const toggleCategory = useCallback((cat: ResourceCategory) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const dark = isDarkMode();

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
          selectedId={selectedItem?.id ?? null}
          onSelect={setSelectedItem}
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
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden -mx-1 px-1">
            {RESOURCE_CATEGORIES.map((cat) => (
              <FilterChip
                key={cat.value}
                pressed={activeCategories.has(cat.value)}
                onPressedChange={() => toggleCategory(cat.value)}
                className="flex-shrink-0"
              >
                {cat.label}
              </FilterChip>
            ))}
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
      {selectedItem && (
        <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

function MapRecenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  map.setView([center.lat, center.lng]);
  return null;
}
