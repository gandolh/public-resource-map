import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAppStore } from "~/stores/appStore";
import { mapPath, mapSearchKeeping, parseMapSearch, type MapCamera } from "~/lib/mapUrl";

/** What the URL held when the map loaded. */
export interface LoadedView {
  /** The camera to open at, when the link carries one. */
  camera: MapCamera | undefined;
  /** True when the link named a city: then it wins over the visitor's location. */
  city: boolean;
}

/**
 * Keeps the map's state in its URL (`lib/mapUrl.ts`). On load the store reads the URL once;
 * after that every change is written back with `replace`, never `push`, so Back leaves the map
 * instead of stepping through each pan, search key or filter. Opening a place still pushes, as
 * it always did. `loaded` is null until the URL has been read: the map waits for it, so it opens
 * at the link's camera rather than flying there.
 */
export function useMapUrl() {
  const location = useLocation();
  const navigate = useNavigate();
  const readUrl = useAppStore((s) => s.readUrl);
  const city = useAppStore((s) => s.city.id);
  const search = useAppStore((s) => s.search);
  const categories = useAppStore((s) => s.categories);
  const lens = useAppStore((s) => s.lens);
  const [loaded, setLoaded] = useState<LoadedView | null>(null);
  const [camera, setCamera] = useState<MapCamera | null>(null);

  useEffect(() => {
    // The address bar, not the router: while a single-page build hydrates, the router can still
    // be on the shell's "/" with no query.
    const view = parseMapSearch(window.location.search);
    readUrl(view);
    // `place=<id>` is an alias for the place's own path.
    if (view.place && !window.location.pathname.includes("/places/")) {
      void navigate(mapPath(view), { replace: true });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the URL is only read on the client, once, after the first render
    setCamera(view.map ?? null);
    setLoaded({ camera: view.map, city: view.city !== undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the URL is read once, on load; later changes are ours
  }, []);

  useEffect(() => {
    // Not before the URL is read, not while the `place` alias is on its way to the path, and not
    // while the router is still on another path than the address bar (hydrating): a write then
    // would replace a deep link with the shell's "/".
    if (!loaded || new URLSearchParams(location.search).has("place")) return;
    if (window.location.pathname !== `${import.meta.env.BASE_URL}${location.pathname.slice(1)}`) return;
    const next = mapSearchKeeping(
      { city, q: search, f: categories, when: lens === "all" ? undefined : lens, map: camera ?? undefined },
      location.search,
    );
    if (next !== location.search) void navigate({ pathname: location.pathname, search: next }, { replace: true });
  }, [loaded, city, search, categories, lens, camera, location.pathname, location.search, navigate]);

  return { loaded, camera, setCamera };
}
