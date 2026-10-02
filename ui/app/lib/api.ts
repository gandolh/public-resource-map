import type {
  Event,
  EventLens,
  PaginatedResponse,
  Place,
  PlaceCategory,
  WhatsOnItem,
} from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

/** The API answers with `{ code, message }` on failure; surface the message. */
export class ApiRequestError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body?.message) message = body.message;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new ApiRequestError(res.status, message);
  }
  return res.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export interface PlacesQueryInput {
  city?: string;
  categories?: PlaceCategory[];
  lens?: EventLens;
  page?: number;
  pageSize?: number;
}

/** The server's maximum page size (`placesQuerySchema`). */
const PLACES_PAGE_SIZE = 1000;
/** 10,000 places: far past any POC city. Past it, say so rather than hide it. */
const MAX_PLACE_PAGES = 10;

/** One page of places. The map wants them all: see `fetchAllPlaces`. */
export function fetchPlaces(
  input: PlacesQueryInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Place>> {
  return request(
    `/api/places${query({
      city: input.city,
      category: input.categories?.length ? input.categories.join(",") : undefined,
      lens: input.lens ?? "all",
      page: input.page,
      pageSize: input.pageSize ?? PLACES_PAGE_SIZE,
    })}`,
    signal,
  );
}

/**
 * The whole city. Clustering and search happen client-side over this set, so
 * panning and zooming never refetch, which is what makes the map feel
 * immediate rather than chattering at the network on every gesture.
 *
 * Page 1 says how many there are; the rest are fetched in parallel. One page
 * used to be taken as the whole city, so a real București sync (3,171 named
 * places) lost two thirds of its pins silently, to the map and to search
 * (brief 20).
 */
export async function fetchAllPlaces(
  input: PlacesQueryInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Place>> {
  const first = await fetchPlaces({ ...input, page: 1, pageSize: PLACES_PAGE_SIZE }, signal);
  const pages = Math.ceil(first.total / PLACES_PAGE_SIZE);
  if (pages <= 1) return first;

  const fetched = Math.min(pages, MAX_PLACE_PAGES);
  if (pages > MAX_PLACE_PAGES) {
    console.warn(
      `Loading ${fetched * PLACES_PAGE_SIZE} of ${first.total} places: past the ${MAX_PLACE_PAGES}-page cap.`,
    );
  }
  const rest = await Promise.all(
    Array.from({ length: fetched - 1 }, (_, i) =>
      fetchPlaces({ ...input, page: i + 2, pageSize: PLACES_PAGE_SIZE }, signal),
    ),
  );
  return {
    ...first,
    data: [first, ...rest].flatMap((p) => p.data),
    page: 1,
    pageSize: first.total,
  };
}

export function fetchPlace(id: string, signal?: AbortSignal): Promise<Place> {
  return request(`/api/places/${encodeURIComponent(id)}`, signal);
}

export function fetchPlaceEvents(
  id: string,
  lens: EventLens = "all",
  signal?: AbortSignal,
): Promise<PaginatedResponse<Event>> {
  return request(
    `/api/places/${encodeURIComponent(id)}/events${query({ lens })}`,
    signal,
  );
}

export interface WhatsOnQueryInput {
  city?: string;
  categories?: PlaceCategory[];
  lens?: EventLens;
  page?: number;
  pageSize?: number;
}

export function fetchWhatsOn(
  input: WhatsOnQueryInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<WhatsOnItem>> {
  return request(
    `/api/whats-on${query({
      city: input.city,
      category: input.categories?.length ? input.categories.join(",") : undefined,
      lens: input.lens ?? "all",
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 40,
    })}`,
    signal,
  );
}
