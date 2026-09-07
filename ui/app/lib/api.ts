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
  pageSize?: number;
}

/**
 * The whole city in one request. Clustering happens client-side over this set,
 * so panning and zooming never refetch — which is what makes the map feel
 * immediate rather than chattering at the network on every gesture.
 */
export function fetchPlaces(
  input: PlacesQueryInput,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Place>> {
  return request(
    `/api/places${query({
      city: input.city,
      category: input.categories?.length ? input.categories.join(",") : undefined,
      lens: input.lens ?? "all",
      pageSize: input.pageSize ?? 1000,
    })}`,
    signal,
  );
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
