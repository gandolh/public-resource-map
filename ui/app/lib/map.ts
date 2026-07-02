import { useEffect, useState } from "react";
import type { Coordinates } from "@public-resource-map/shared";

export const LIGHT_TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
export const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
// Place data is sourced from OpenStreetMap under the ODbL — attribution is
// required by the licence (brief 03; full "about the data" page is brief 09).
export const CARTO_ATTR =
  'Data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors (<a href="https://opendatacommons.org/licenses/odbl/">ODbL</a>), tiles &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Google Maps directions link for a coordinate, optionally labelled by address. */
export function directionsUrl({ lat, lng }: Coordinates, label?: string): string {
  const destination = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

/** Reactively tracks whether the `dark` class is present on <html>. */
export function useIsDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

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
