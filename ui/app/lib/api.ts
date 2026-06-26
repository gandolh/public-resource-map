import type {
  Event,
  EventCategory,
  PaginatedResponse,
  Resource,
  ResourceCategory,
} from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

export interface NearbyResourcesQuery {
  lat: number;
  lng: number;
  radiusKm: number;
  category?: ResourceCategory;
  pageSize?: number;
}

export function fetchResources(
  query: NearbyResourcesQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Resource>> {
  const qs = buildQuery({ ...query, pageSize: query.pageSize ?? 50 });
  return request(`/api/resources?${qs}`, signal);
}

export function fetchResource(id: string, signal?: AbortSignal): Promise<Resource> {
  return request(`/api/resources/${id}`, signal);
}

export interface EventsQuery {
  lat: number;
  lng: number;
  radiusKm?: number;
  category?: EventCategory;
  page?: number;
  pageSize?: number;
}

export function fetchEvents(
  query: EventsQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<Event>> {
  const qs = buildQuery({ radiusKm: 20, ...query });
  return request(`/api/events?${qs}`, signal);
}
