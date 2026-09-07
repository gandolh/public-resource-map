import { useEffect, useState } from "react";
import type { Coordinates } from "@public-resource-map/shared";

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

const OSM_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> ' +
  '(<a href="https://opendatacommons.org/licenses/odbl/" target="_blank" rel="noreferrer">ODbL</a>)';

/**
 * Attribution is a licence obligation, not a courtesy, and it has to name the
 * tiles actually being served — so it changes with the provider.
 */
export const MAP_ATTRIBUTION = usingCarto
  ? `${OSM_ATTR} · &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>`
  : OSM_ATTR;

/** Directions to a coordinate. Coordinates, not the name — a name can be ambiguous. */
export function directionsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Reactively tracks whether the `dark` class is present on <html>. */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}
