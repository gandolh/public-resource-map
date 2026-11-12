import { useEffect, useState } from "react";
import { SOURCES, sourceById, type Coordinates, type SourceId } from "@public-resource-map/shared";
import type { Lang } from "./i18n";

/**
 * Basemap.
 *
 * CARTO Positron / Dark Matter is the intended style: quiet and low-saturation,
 * so eleven category hues and one accent can carry meaning on top of it. As of
 * 2026 CARTO's keyless raster endpoints answer 200 with an "API KEY REQUIRED"
 * watermark tile instead of the map, so the style is behind a key.
 *
 * Set `VITE_CARTO_API_KEY` to get the real thing. Without one we fall back to
 * standard OpenStreetMap raster tiles and filter them in CSS toward the same
 * quiet register (see `.map-fallback` in app.css) — usable, correctly
 * attributed, and honest about which is in play.
 */
const CARTO_KEY = import.meta.env.VITE_CARTO_API_KEY as string | undefined;

export const usingCarto = Boolean(CARTO_KEY);

const cartoSuffix = CARTO_KEY ? `?api_key=${encodeURIComponent(CARTO_KEY)}` : "";

export const LIGHT_TILES = usingCarto
  ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${cartoSuffix}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const DARK_TILES = usingCarto
  ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${cartoSuffix}`
  : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

/** The registry source of the basemap in use. */
export const TILE_SOURCE: SourceId = usingCarto ? "carto" : "osm-tiles";

const escapeHtml = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const anchor = (href: string, text: string) =>
  `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(text)}</a>`;

/**
 * One source's credit as Leaflet's attribution control takes it (HTML), from the registry: its
 * credit text, linked, and its licence when that has a page of its own. "© OpenStreetMap
 * contributors" is the wording the OSM Foundation's attribution guidelines ask for.
 */
export function creditHtml(id: SourceId, lang: Lang): string {
  const source = sourceById(id);
  if (!source) return "";
  const credit = anchor(source.attributionUrl, source.attribution[lang]);
  const { url, name } = source.licence;
  return url && url !== source.attributionUrl ? `${credit} (${anchor(url, name)})` : credit;
}

/**
 * The map's credits, each once: OpenStreetMap, the tiles actually being served (attribution is a
 * licence obligation, so it changes with the provider), then `extra`, the publishers whose places
 * are on screen.
 */
export function mapCredits(lang: Lang, extra: readonly SourceId[] = []): string[] {
  const ids: SourceId[] = ["openstreetmap", TILE_SOURCE, ...extra];
  return [...new Set(ids.map((id) => creditHtml(id, lang)))].filter(Boolean);
}

/** The event publishers credited by these places, in registry order: their venues are on the map. */
export function publishersOf(places: readonly { credits: readonly SourceId[] }[]): SourceId[] {
  const credited = new Set(places.flatMap((p) => p.credits));
  return SOURCES.filter((s) => s.kind === "event-publisher" && credited.has(s.id)).map((s) => s.id);
}

/** The credit for a map that shows no ingested places (the review page's preview). */
export const MAP_ATTRIBUTION = mapCredits("ro").join(" · ");

/** Directions to a coordinate. Coordinates, not the name — a name can be ambiguous. */
export function directionsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Reactively tracks whether <html> is drawn in the dark theme (`data-theme`). */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.dataset.theme === "dark");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
