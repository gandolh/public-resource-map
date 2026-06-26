import { useState, useEffect } from "react";
import type { Event, EventCategory, PaginatedResponse } from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface UseEventsParams {
  lat: number;
  lng: number;
  radiusKm?: number;
  category?: EventCategory;
  page?: number;
  pageSize?: number;
}

interface UseEventsResult {
  events: Event[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useEvents({
  lat,
  lng,
  radiusKm = 20,
  category,
  page = 1,
  pageSize = 12,
}: UseEventsParams): UseEventsResult {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusKm: String(radiusKm),
      page: String(page),
      pageSize: String(pageSize),
    });
    if (category) params.set("category", category);

    fetch(`${API_BASE}/api/events?${params}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<PaginatedResponse<Event>>)
      .then((data) => {
        setEvents(data.data);
        setTotal(data.total);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lng, radiusKm, category, page, pageSize]);

  return { events, total, loading, error };
}
