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
 * after that every change is written back in place (`history.replaceState`), never pushed, so Back leaves the map
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
    // Not before the URL is read, and not while the `place` alias is on its way to the path.
    if (!loaded || new URLSearchParams(window.location.search).has("place")) return;
    const next = mapSearchKeeping(
      { city, q: search, f: categories, when: lens === "all" ? undefined : lens, map: camera ?? undefined },
      window.location.search,
    );
    if (next === window.location.search) return;
    // The address bar only, keeping the router's own history state: a router navigation per
    // keystroke or pan would re-render every route as a transition, and on a cold deep link it
    // held the place's first render back. The router's `location` (it runs again on each of its
    // navigations, which may drop the query) is a trigger here, never the source.
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${next}${window.location.hash}`);
  }, [loaded, city, search, categories, lens, camera, location.pathname, location.search]);

  return { loaded, camera, setCamera };
}
