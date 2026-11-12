import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import { useAppStore } from "~/stores/appStore";

/**
 * Centre on the city when it changes, unless a place is open: then the place
 * route's `flyTo` owns the camera, and a city switch (a deep link adopting the
 * place's city, or hydration) must not yank the view to the city centre.
 * Read at effect time, not as a dependency, so closing the panel does not
 * recentre either. A link that carries a camera opens there, so its city counts
 * as centred; a later recentre drops the link's camera (`onRecenter`).
 */
export function CityRecenter({
  lat,
  lng,
  zoom,
  keepFirst,
  onRecenter,
}: {
  lat: number;
  lng: number;
  zoom: number;
  keepFirst: boolean;
  onRecenter: () => void;
}) {
  const map = useMap();
  // The city last centred on. Keyed by the city, not "first run", so a double-run effect (React's
  // development mode) cannot recentre away from the link's camera.
  const key = `${lat},${lng},${zoom}`;
  const centred = useRef(keepFirst ? key : null);
  useEffect(() => {
    if (centred.current === key) return;
    centred.current = key;
    if (useAppStore.getState().selectedId !== null) return;
    map.setView([lat, lng], zoom, { animate: true });
    onRecenter();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentre on a city change only
  }, [map, key, lat, lng, zoom]);
  return null;
}
