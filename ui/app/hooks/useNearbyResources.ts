import { useState, useEffect } from "react";
import type { Resource, ResourceCategory, PaginatedResponse } from "@public-resource-map/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

interface UseNearbyResourcesParams {
  lat: number;
  lng: number;
  radiusKm: number;
  categories?: ResourceCategory[];
}

interface UseNearbyResourcesResult {
  resources: Resource[];
  loading: boolean;
  error: string | null;
}

export function useNearbyResources({
  lat,
  lng,
  radiusKm,
  categories,
}: UseNearbyResourcesParams): UseNearbyResourcesResult {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusKm: String(radiusKm),
      pageSize: "50",
    });
    if (categories?.length) params.set("category", categories[0]!);

    fetch(`${API_BASE}/api/resources?${params}`, { signal: controller.signal })
      .then((r) => r.json() as Promise<PaginatedResponse<Resource>>)
      .then((data) => {
        setResources(data.data);
        setError(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [lat, lng, radiusKm, JSON.stringify(categories)]);

  return { resources, loading, error };
}
