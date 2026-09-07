import { useEffect, useMemo, useRef, useState } from "react";
import { AttributionControl, MapContainer, TileLayer, useMap } from "react-leaflet";
import { Outlet, useNavigate } from "react-router";
import type { Map as LeafletMap } from "leaflet";
import { AlertTriangle, Crosshair, Loader2, Minus, Plus, SearchX } from "lucide-react";
import type { MetaFunction } from "react-router";
import type { Place } from "@public-resource-map/shared";
import { FilterBar } from "~/components/map/FilterBar";
import { PlaceMarkers } from "~/components/map/PlaceMarkers";
import { UserLocationMarker } from "~/components/map/UserLocationMarker";
import { StateBlock } from "~/components/ui/StateBlock";
import { Button } from "~/components/ui/Button";
import { useAppStore } from "~/stores/appStore";
import { usePlaces } from "~/hooks/usePlaces";
import { useUserLocation } from "~/hooks/useUserLocation";
import { useI18n } from "~/lib/i18n";
import { DARK_TILES, LIGHT_TILES, MAP_ATTRIBUTION, usingCarto, useIsDarkMode } from "~/lib/map";
import { normalizeText } from "~/lib/utils";
import { nearestCity } from "~/lib/cities";
import { useIsMobile } from "~/hooks/useIsMobile";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "CivicMap — locurile publice din orașul tău" },
  {
    name: "description",
    content:
      "Parcuri, biblioteci, muzee și instituții publice din Timișoara și București, cu ce se întâmplă la ele.",
  },
];

export interface MapOutletContext {
  places: Place[];
  getMap: () => LeafletMap | null;
}

/** Keeps the Leaflet instance reachable from the child (place) route. */
function MapBridge({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

function CityRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom, { animate: true });
  }, [map, lat, lng, zoom]);
  return null;
}

function MapControls() {
  const { t } = useI18n();
  const map = useMap();
  const { coords, loading, request } = useUserLocation();
  const selectedId = useAppStore((s) => s.selectedId);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [coords, map]);

  const btn =
    "grid h-9 w-9 place-items-center bg-surface text-fg transition-colors hover:bg-surface-2 disabled:opacity-50";

  return (
    <div
      className={cn(
        "pointer-events-auto absolute z-[400] flex flex-col gap-2",
        "transition-[right,bottom] duration-200 ease-[cubic-bezier(.2,.8,.2,1)]",
        // Zoom and locate are familiar affordances; another surface opening
        // must move them, never delete them.
        selectedId && !isMobile ? "right-[calc(384px+1.5rem)]" : "right-3",
        isMobile ? "bottom-[70px]" : "bottom-3",
        // On a phone the sheet owns the lower screen; the stack stands down
        // rather than fighting it, and returns when the sheet closes.
        isMobile && selectedId && "hidden",
      )}
    >
      <div className="overflow-hidden rounded-lg border border-line shadow-e2">
        <button type="button" aria-label={t("map.zoomIn")} onClick={() => map.zoomIn()} className={`${btn} border-b border-line`}>
          <Plus size={16} strokeWidth={2.2} />
        </button>
        <button type="button" aria-label={t("map.zoomOut")} onClick={() => map.zoomOut()} className={btn}>
          <Minus size={16} strokeWidth={2.2} />
        </button>
      </div>
      <button
        type="button"
        aria-label={t("map.recenter")}
        onClick={request}
        disabled={loading}
        className={`${btn} rounded-lg border border-line shadow-e2`}
      >
        {loading ? (
          <Loader2 size={16} strokeWidth={2.2} className="animate-spin text-fg-muted" />
        ) : (
          <Crosshair size={16} strokeWidth={2.2} />
        )}
      </button>
    </div>
  );
}

export default function MapRoute() {
  const { t, tn } = useI18n();
  const navigate = useNavigate();
  const dark = useIsDarkMode();

  const city = useAppStore((s) => s.city);
  const categories = useAppStore((s) => s.categories);
  const lens = useAppStore((s) => s.lens);
  const search = useAppStore((s) => s.search);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const selectedId = useAppStore((s) => s.selectedId);
  const setCity = useAppStore((s) => s.setCity);
  const sheetSnap = useAppStore((s) => s.sheetSnap);

  const mapRef = useRef<LeafletMap | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { coords, error: locError } = useUserLocation();
  // If the user shares their location and they are actually in one of the two
  // cities, follow them there — but never override a city they picked by hand.
  const touchedCity = useRef(false);
  useEffect(() => {
    if (!coords || touchedCity.current) return;
    touchedCity.current = true;
    const near = nearestCity(coords);
    if (near && near.id !== city.id) setCity(near);
  }, [coords, city.id, setCity]);

  const { data, isPending, isError, refetch } = usePlaces({ city: city.name, categories, lens });

  // Search runs over the already-loaded city rather than round-tripping: the
  // whole city is in memory, so filtering is instant and works offline-ish.
  const places = useMemo(() => {
    const all = data?.data ?? [];
    const q = normalizeText(search.trim());
    if (!q) return all;
    return all.filter(
      (p) =>
        normalizeText(p.name).includes(q) ||
        (p.address ? normalizeText(p.address).includes(q) : false),
    );
  }, [data, search]);

  const withEvents = useMemo(
    () => places.filter((p) => (p.upcomingEventCount ?? 0) > 0).length,
    [places],
  );

  const resultLabel = isPending
    ? t("state.loading")
    : `${tn("count.places", places.length)} · ${tn("count.withEvents", withEvents)}`;
  // The phone has no room for the full sentence, but it may not hide the count
  // the desktop shows — so it gets the short form, always visible.
  const compactLabel = isPending ? t("state.loading") : tn("count.places", places.length);

  const context: MapOutletContext = { places, getMap: () => mapRef.current };
  const noResults = !isPending && !isError && places.length === 0;

  return (
    <div
      className={cn(
        "absolute inset-0",
        sheetSnap === "peek" && "sheet-peek",
        sheetSnap === "full" && "sheet-full",
      )}
    >
      {mounted && (
        <MapContainer
          center={[city.center.lat, city.center.lng]}
          zoom={city.zoom}
          zoomControl={false}
          attributionControl={false}
          // react-leaflet only applies `className` when it creates the
          // container, so anything reactive has to live on the wrapper below.
          className={cn("h-full w-full", !usingCarto && "map-fallback")}
        >
          <TileLayer url={dark ? DARK_TILES : LIGHT_TILES} attribution={MAP_ATTRIBUTION} />
          {/* Bottom-left, not Leaflet's default bottom-right: the right edge is
              where the place panel docks, and attribution is a licence
              obligation that may not be parked under a panel. */}
          <AttributionControl position="bottomleft" prefix={false} />
          <MapBridge onReady={(m) => { mapRef.current = m; }} />
          <CityRecenter lat={city.center.lat} lng={city.center.lng} zoom={city.zoom} />
          {coords && <UserLocationMarker coords={coords} />}
          <PlaceMarkers
            places={places}
            selectedId={selectedId}
            onSelect={(place) => navigate(`/places/${place.id}`)}
            clusterLabel={(n) => t("map.cluster", { n })}
          />
          <MapControls />
        </MapContainer>
      )}

      <FilterBar resultLabel={resultLabel} compactLabel={compactLabel} />

      {isError && (
        <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-[450] mx-auto w-[min(92%,380px)] -translate-y-1/2 rounded-xl border border-line bg-surface shadow-e3">
          <StateBlock
            tone="danger"
            icon={<AlertTriangle size={18} strokeWidth={2} />}
            title={t("state.error")}
            body={t("state.errorBody")}
            action={
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                {t("state.retry")}
              </Button>
            }
          />
        </div>
      )}

      {/* Zero results is a guided recovery, never a blank map: it names what is
          filtering things out and offers the way back. */}
      {noResults && (
        <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-[450] mx-auto w-[min(92%,380px)] -translate-y-1/2 rounded-xl border border-line bg-surface shadow-e3">
          <StateBlock
            icon={<SearchX size={18} strokeWidth={2} />}
            title={
              search.trim()
                ? t("search.noMatch", { q: search.trim() })
                : lens !== "all"
                  ? t("state.zeroLens", { lens: t(`lens.${lens}`).toLowerCase(), city: city.name })
                  : t("state.zeroTitle")
            }
            body={t("state.zeroBody")}
            action={
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                {t("filters.clear")}
              </Button>
            }
          />
        </div>
      )}

      {locError && (
        <p className="pointer-events-none absolute inset-x-0 bottom-20 z-[400] mx-auto w-fit rounded-full border border-line bg-surface px-3 py-1.5 text-[12px] text-fg-muted shadow-e1 md:bottom-16">
          {t("map.locationDenied")}
        </p>
      )}

      <Outlet context={context} />
    </div>
  );
}
