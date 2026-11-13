import { useEffect, useMemo, useRef, useState } from "react";
import { AttributionControl, MapContainer, TileLayer, useMap } from "react-leaflet";
import { Outlet, useNavigate } from "react-router";
import L, { type Control } from "leaflet";
import type { Map as LeafletMap } from "leaflet";
import { AlertTriangle, Crosshair, Loader2, Minus, Plus, SearchX, X } from "lucide-react";
import type { MetaFunction } from "react-router";
import type { Place } from "@public-resource-map/shared";
import { AreaDraw } from "~/components/map/AreaDraw";
import { FilterBar } from "~/components/map/FilterBar";
import { PlaceMarkers } from "~/components/map/PlaceMarkers";
import { UserLocationMarker } from "~/components/map/UserLocationMarker";
import { CameraTracker } from "~/components/map/CameraTracker";
import { CityRecenter } from "~/components/map/CityRecenter";
import { SourceCredits } from "~/components/map/SourceCredits";
import { useMapUrl } from "~/hooks/useMapUrl";
import { StateBlock } from "~/components/ui/StateBlock";
import { Button } from "~/components/ui/Button";
import { Chip } from "~/components/ui/Chip";
import { useAppStore } from "~/stores/appStore";
import { usePlaces } from "~/hooks/usePlaces";
import { useUserLocation } from "~/hooks/useUserLocation";
import { useI18n } from "~/lib/i18n";
import { DARK_TILES, LIGHT_TILES, mapCredits, publishersOf, usingCarto, useIsDarkMode } from "~/lib/map";
import { normalizeText } from "~/lib/utils";
import { inArea } from "~/lib/area";
import { categoryLabelKey } from "~/lib/categories";
import { nearestCity } from "~/lib/cities";
import { useIsMobile } from "~/hooks/useIsMobile";
import { cn } from "~/lib/utils";

export const meta: MetaFunction = () => [
  { title: "CivicMap — locurile publice din orașul tău" },
  {
    name: "description",
    content: "Parcuri, biblioteci, muzee și instituții publice din Timișoara și București, cu ce se întâmplă la ele.",
  },
];

function filterBySearch(places: Place[], search: string): Place[] {
  const q = normalizeText(search.trim());
  if (!q) return places;
  return places.filter(
    (p) => normalizeText(p.name).includes(q) || (p.address ? normalizeText(p.address).includes(q) : false),
  );
}

/**
 * Every active filter as a chip that removes just that filter: the
 * zero-results overlay's way back that does not throw everything away.
 */
function ActiveFilterChips() {
  const { t } = useI18n();
  const categories = useAppStore((s) => s.categories);
  const toggleCategory = useAppStore((s) => s.toggleCategory);
  const lens = useAppStore((s) => s.lens);
  const setLens = useAppStore((s) => s.setLens);
  const search = useAppStore((s) => s.search);
  const setSearch = useAppStore((s) => s.setSearch);
  const area = useAppStore((s) => s.area);
  const clearArea = useAppStore((s) => s.clearArea);

  const chip = (key: string, label: string, onRemove: () => void) => (
    <Chip key={key} active onClick={onRemove} aria-label={t("filters.remove", { filter: label })}>
      {label}
      <X size={13} strokeWidth={2.4} aria-hidden="true" />
    </Chip>
  );

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {search.trim() && chip("search", `“${search.trim()}”`, () => setSearch(""))}
      {lens !== "all" && chip("lens", t(`lens.${lens}`), () => setLens("all"))}
      {categories.map((c) => chip(c, t(categoryLabelKey(c)), () => toggleCategory(c)))}
      {area && chip("area", t("area.chip"), clearArea)}
    </div>
  );
}

export interface MapOutletContext {
  places: Place[];
  getMap: () => LeafletMap | null;
}

/**
 * "About the data" rides in the attribution control, the one corner
 * that is always on screen beside the licence it explains. Leaflet takes the
 * prefix as HTML, so the click is routed through the SPA by hand: a full page
 * load would throw away the drawn area and the selection.
 */
function AboutDataLink({ control }: { control: Control.Attribution | null }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  useEffect(() => {
    if (!control) return;
    const href = `${import.meta.env.BASE_URL}about-data`;
    control.setPrefix(`<a href="${href}" data-about-data>${t("nav.aboutData")}</a>`);
    const container = control.getContainer();
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || !e.target.closest("[data-about-data]")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      void navigate("/about-data");
    };
    container?.addEventListener("click", onClick);
    return () => container?.removeEventListener("click", onClick);
  }, [control, lang, t, navigate]);
  return null;
}

/**
 * On a phone the attribution folds behind a tappable "i", so the
 * map stays the hero; on a desktop it is always open. A real Leaflet control
 * in the same corner, so it inherits the corner's offsets above the tab bar
 * and the sheet.
 */
function AttributionToggle({ control }: { control: Control.Attribution | null }) {
  const { t } = useI18n();
  const map = useMap();
  const isMobile = useIsMobile();
  useEffect(() => {
    const panel = control?.getContainer();
    if (!panel || !isMobile) return;
    const button = L.DomUtil.create("button", "cm-attr-toggle");
    button.type = "button";
    button.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/>' +
      '<path d="M12 11v5.5M12 7.6v.01"/></svg>';
    const label = document.createElement("span");
    label.textContent = t("map.attribution");
    button.append(label);
    L.DomEvent.disableClickPropagation(button);
    let open = false;
    const apply = () => {
      panel.style.display = open ? "" : "none";
      button.setAttribute("aria-expanded", String(open));
    };
    button.addEventListener("click", () => {
      open = !open;
      apply();
    });
    apply();
    const Toggle = L.Control.extend({ onAdd: () => button });
    const toggle = new Toggle({ position: "bottomleft" }).addTo(map);
    return () => {
      toggle.remove();
      panel.style.display = "";
    };
  }, [control, isMobile, map, t]);
  return null;
}

/** Keeps the Leaflet instance reachable from the child (place) route. */
function MapBridge({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

/** Keeps Leaflet's size right when the box around it changes: the band leaving, the column docking. */
function MapResize() {
  const map = useMap();
  useEffect(() => {
    const box = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(box);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function MapControls() {
  const { t } = useI18n();
  const map = useMap();
  const { coords, loading, request } = useUserLocation();

  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [coords, map]);

  const btn =
    "grid h-11 w-11 place-items-center bg-surface text-fg transition-colors hover:bg-surface-2 active:bg-surface-3 disabled:opacity-50 md:h-10 md:w-10";
  const group = "overflow-hidden rounded-xl border border-line-strong shadow-e2";

  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-3 z-chrome flex flex-col gap-2",
        // Above the sheet's rest height on a phone (set while a sheet is up), clear of the corner otherwise.
        "bottom-[calc(var(--sheet-h,0px)+0.75rem)] md:bottom-3",
      )}
    >
      <div className={group}>
        <button
          type="button"
          aria-label={t("map.zoomIn")}
          onClick={() => map.zoomIn()}
          className={`${btn} border-b border-line`}
        >
          <Plus size={18} strokeWidth={2.2} />
        </button>
        <button type="button" aria-label={t("map.zoomOut")} onClick={() => map.zoomOut()} className={btn}>
          <Minus size={18} strokeWidth={2.2} />
        </button>
      </div>
      <div className={group}>
        <button type="button" aria-label={t("map.recenter")} onClick={request} disabled={loading} className={btn}>
          {loading ? (
            <Loader2 size={18} strokeWidth={2.2} className="animate-spin text-fg-muted" />
          ) : (
            <Crosshair size={18} strokeWidth={2.2} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function MapRoute() {
  const { t, tn, lang } = useI18n();
  const navigate = useNavigate();
  const { loaded, setCamera } = useMapUrl();
  const dark = useIsDarkMode();

  const city = useAppStore((s) => s.city);
  const categories = useAppStore((s) => s.categories);
  const lens = useAppStore((s) => s.lens);
  const search = useAppStore((s) => s.search);
  const clearFilters = useAppStore((s) => s.clearFilters);
  const selectedId = useAppStore((s) => s.selectedId);
  const setCity = useAppStore((s) => s.setCity);
  const sheetSnap = useAppStore((s) => s.sheetSnap);
  const area = useAppStore((s) => s.area);

  const mapRef = useRef<LeafletMap | null>(null);
  const [attribution, setAttribution] = useState<Control.Attribution | null>(null);
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- marks the first client render, so the map mounts after hydration
  useEffect(() => setMounted(true), []);

  const { coords, error: locError } = useUserLocation();
  // If the user shares their location and they are actually in one of the two
  // cities, follow them there — but never override a city they picked by hand.
  const touchedCity = useRef(false);
  useEffect(() => {
    // A link that names its city keeps it: it is the view someone shared.
    if (!coords || touchedCity.current || !loaded || loaded.city) return;
    touchedCity.current = true;
    const near = nearestCity(coords);
    if (near && near.id !== city.id) setCity(near);
  }, [coords, city.id, setCity, loaded]);

  const { data, isPending, isError, refetch } = usePlaces({ city: city.name, categories, lens });

  // Search and the drawn area run over the already-loaded city rather than
  // round-tripping: the whole city is in memory, so filtering is instant and
  // works offline-ish.
  const places = useMemo(
    () =>
      filterBySearch(
        (data?.data ?? []).filter((p) => inArea(p.coordinates, area)),
        search,
      ),
    [data, search, area],
  );

  const credit = useMemo(() => mapCredits(lang, publishersOf(places)).join(" · "), [lang, places]);

  const withEvents = useMemo(() => places.filter((p) => (p.upcomingEventCount ?? 0) > 0).length, [places]);

  // With an area drawn the count says so: "12 places in this area".
  const placesKey = area ? "count.inArea" : "count.places";
  // What widening would show, worked out from what is already loaded: the
  // area and the search filter on the client, so their counts are free.
  const withoutArea = useMemo(() => (area ? filterBySearch(data?.data ?? [], search).length : 0), [area, data, search]);
  const withoutSearch = useMemo(
    () => (search.trim() ? (data?.data ?? []).filter((p) => inArea(p.coordinates, area)).length : 0),
    [area, data, search],
  );
  const widenHint =
    area && withoutArea > 0
      ? t("state.widenArea", { places: tn("count.places", withoutArea) })
      : search.trim() && withoutSearch > 0
        ? t("state.widenSearch", { places: tn("count.places", withoutSearch) })
        : null;

  const counts = {
    places: isPending ? null : tn(placesKey, places.length),
    events: isPending ? null : tn("count.withEvents", withEvents),
  };

  const context: MapOutletContext = { places, getMap: () => mapRef.current };
  const noResults = !isPending && !isError && places.length === 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col",
        // Others fade while one place is open, so the selection reads at a
        // glance. The timing lens removes places; this only dims.
        selectedId && "has-selection",
        sheetSnap === "peek" && "sheet-peek",
        sheetSnap === "full" && "sheet-full",
      )}
    >
      <FilterBar counts={counts} placeCount={isPending ? null : places.length} />

      <div className="relative min-h-0 flex-1 overflow-hidden bg-bg">
      {/* The map: the whole stage, or what is right of the place column when a place is open on a desktop. */}
      <div
        className={cn(
          "absolute inset-y-0 right-0 left-0 transition-[left] duration-(--dur-3) ease-out-fast",
          selectedId && "md:left-[424px] md:border-l md:border-line-strong",
        )}
      >
      {mounted && loaded && (
        <MapContainer
          center={loaded.camera ? [loaded.camera.lat, loaded.camera.lng] : [city.center.lat, city.center.lng]}
          zoom={loaded.camera?.zoom ?? city.zoom}
          zoomControl={false}
          attributionControl={false}
          // react-leaflet only applies `className` when it creates the
          // container, so anything reactive has to live on the wrapper below.
          className={cn("h-full w-full", !usingCarto && "map-fallback")}
        >
          <TileLayer url={dark ? DARK_TILES : LIGHT_TILES} />
          {/* Bottom-left, not Leaflet's default bottom-right: the right edge is
              where the place panel docks, and attribution is a licence
              obligation that may not be parked under a panel. */}
          <AttributionControl position="bottomleft" prefix={false} ref={setAttribution} />
          <SourceCredits control={attribution} credit={credit} />
          <AboutDataLink control={attribution} />
          <AttributionToggle control={attribution} />
          <MapResize />
          <MapBridge
            onReady={(m) => {
              mapRef.current = m;
            }}
          />
          <CityRecenter
            lat={city.center.lat}
            lng={city.center.lng}
            zoom={city.zoom}
            keepFirst={loaded.camera !== undefined}
            onRecenter={() => setCamera(null)}
          />
          <CameraTracker onMove={setCamera} />
          {coords && <UserLocationMarker coords={coords} />}
          <PlaceMarkers
            places={places}
            selectedId={selectedId}
            onSelect={(place) => {
              // The view's query goes along, so the place's URL still shares the same view.
              void navigate({ pathname: `/places/${place.id}`, search: window.location.search });
            }}
            clusterLabel={(n) => t("map.cluster", { n })}
            pinLabel={(p) =>
              p.upcomingEventCount ? `${p.name} · ${tn("count.events", p.upcomingEventCount)}` : p.name
            }
          />
          <MapControls />
          <AreaDraw />
        </MapContainer>
      )}

      {isError && (
        <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-draw mx-auto w-[min(92%,380px)] -translate-y-1/2 rounded-xl border border-line bg-surface shadow-e3">
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
          filtering things out, offers each filter back as a removable chip, and
          says what dropping the area or the search would show. */}
      {noResults && (
        <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-draw mx-auto w-[min(92%,380px)] -translate-y-1/2 rounded-xl border border-line bg-surface shadow-e3">
          <StateBlock
            icon={<SearchX size={18} strokeWidth={2} />}
            title={
              search.trim()
                ? t("search.noMatch", { q: search.trim() })
                : lens !== "all"
                  ? t("state.zeroLens", { lens: t(`lens.${lens}`).toLowerCase(), city: city.name })
                  : area
                    ? t("area.zeroTitle")
                    : t("state.zeroTitle")
            }
            body={widenHint ?? t("state.zeroBody")}
            action={
              <div className="flex flex-col items-center gap-3">
                <ActiveFilterChips />
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  {t("filters.clear")}
                </Button>
              </div>
            }
          />
        </div>
      )}

      {locError && (
        <p className="pointer-events-none absolute inset-x-0 bottom-20 z-chrome mx-auto w-fit rounded-full border border-line bg-surface px-3 py-1.5 text-meta text-fg-muted shadow-e1 md:bottom-16">
          {t("map.locationDenied")}
        </p>
      )}
      </div>

      <Outlet context={context} />
      </div>
    </div>
  );
}
