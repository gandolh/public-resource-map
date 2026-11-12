import { eventLenses, placeCategories, type EventLens, type PlaceCategory } from "@public-resource-map/shared";
import { CITIES } from "./cities";

/**
 * The map's state in its URL, so a copied link opens the same view:
 *
 *   /?city=timisoara&q=muzeu&f=library,park&when=today&map=15/45.75390/21.22570
 *   /places/123?city=timisoara&q=muzeu&f=library,park
 *
 * `city`, `q` (the search) and `f` (the category filters) are the fields the store holds; `when`
 * is the timing lens; `map` (zoom/lat/lng, OpenStreetMap's own order) is there only once the user
 * moved the map. The selected place is the path, as it was; `place=<id>` is accepted as an alias.
 * The drawn area stays out: it is ephemeral by decision.
 */
export interface MapCamera {
  zoom: number;
  lat: number;
  lng: number;
}

export interface MapView {
  city?: string;
  q?: string;
  f?: PlaceCategory[];
  when?: Exclude<EventLens, "all">;
  map?: MapCamera;
  place?: string;
}

const isCategory = (value: string): value is PlaceCategory => (placeCategories as readonly string[]).includes(value);
const isLens = (value: string): value is EventLens => (eventLenses as readonly string[]).includes(value);

function parseCamera(value: string | null): MapCamera | undefined {
  const parts = value?.split("/").map(Number);
  if (!parts || parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return undefined;
  const [zoom, lat, lng] = parts;
  if (zoom < 0 || zoom > 22 || Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  return { zoom, lat, lng };
}

/** What a URL's query asks for. Anything unknown or malformed is dropped, never thrown. */
export function parseMapSearch(search: string): MapView {
  const params = new URLSearchParams(search);
  const view: MapView = {};
  const city = params.get("city");
  if (city && CITIES.some((c) => c.id === city)) view.city = city;
  const q = params.get("q")?.trim();
  if (q) view.q = q;
  const f = [...new Set((params.get("f") ?? "").split(",").filter(isCategory))];
  if (f.length > 0) view.f = f;
  const when = params.get("when");
  if (when && isLens(when) && when !== "all") view.when = when;
  const camera = parseCamera(params.get("map"));
  if (camera) view.map = camera;
  const place = params.get("place")?.trim();
  if (place) view.place = place;
  return view;
}

/**
 * The query for a view, in a fixed order, with `?`, or "" for an empty view. Commas and slashes
 * are left readable: both are legal in a query.
 */
export function mapSearch(view: MapView): string {
  const parts: string[] = [];
  const put = (key: string, value: string) =>
    parts.push(`${key}=${encodeURIComponent(value).replace(/%2C/g, ",").replace(/%2F/g, "/")}`);
  if (view.city) put("city", view.city);
  if (view.q?.trim()) put("q", view.q.trim());
  if (view.f?.length) put("f", view.f.join(","));
  if (view.when) put("when", view.when);
  if (view.map) put("map", `${Math.round(view.map.zoom)}/${view.map.lat.toFixed(5)}/${view.map.lng.toFixed(5)}`);
  return parts.length ? `?${parts.join("&")}` : "";
}

/** The query keys the map owns; any other (a pending favourite after sign-in) is someone else's. */
const MAP_KEYS = new Set(["city", "q", "f", "when", "map", "place"]);

/**
 * The query for a view, keeping every parameter of `current` the map does not own, after its own,
 * so writing the view never drops another feature's parameter.
 */
export function mapSearchKeeping(view: MapView, current: string): string {
  const own = mapSearch(view);
  const foreign = [...new URLSearchParams(current)].filter(([key]) => !MAP_KEYS.has(key));
  if (foreign.length === 0) return own;
  const rest = new URLSearchParams(foreign).toString();
  return own ? `${own}&${rest}` : `?${rest}`;
}

/** The app-relative path of a view: the place page when one is selected, else the map. */
export function mapPath(view: MapView): string {
  const { place, ...rest } = view;
  return `${place ? `/places/${encodeURIComponent(place)}` : "/"}${mapSearch(rest)}`;
}

/**
 * The shareable link to a view. It keeps the app's base path (`/prm/` when deployed, `/` in dev):
 * a link built from the origin alone points at a page the estate doesn't serve. Vite's `BASE_URL`
 * always ends in `/`.
 */
export function mapShareUrl(
  view: MapView,
  origin: string = window.location.origin,
  base: string = import.meta.env.BASE_URL,
): string {
  return new URL(mapPath(view).slice(1), `${origin}${base}`).href;
}
