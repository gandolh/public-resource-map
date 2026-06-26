import { useEffect } from "react";
import { useLocationStore, DEFAULT_CENTER } from "~/stores/locationStore";
import type { Coordinates } from "@public-resource-map/shared";

interface UseUserLocationResult {
  coords: Coordinates | null;
  /** User location if granted, otherwise the default center. */
  center: Coordinates;
  loading: boolean;
  error: string | null;
}

/**
 * Shared geolocation. The underlying request fires at most once per session
 * (tracked in the store), so multiple pages reuse the same result.
 */
export function useUserLocation(): UseUserLocationResult {
  const coords = useLocationStore((s) => s.coords);
  const loading = useLocationStore((s) => s.loading);
  const error = useLocationStore((s) => s.error);
  const requestLocation = useLocationStore((s) => s.requestLocation);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { coords, center: coords ?? DEFAULT_CENTER, loading, error };
}
