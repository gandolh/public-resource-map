import { useLocationStore } from "~/stores/locationStore";

/**
 * Geolocation is an enhancement, never a dependency: nothing here fires on
 * mount. The user asks for it by pressing "centre on me", and the whole app
 * works if they never do, or if the browser refuses.
 */
export function useUserLocation() {
  const coords = useLocationStore((s) => s.coords);
  const loading = useLocationStore((s) => s.loading);
  const error = useLocationStore((s) => s.error);
  const request = useLocationStore((s) => s.requestLocation);
  return { coords, loading, error, request };
}
