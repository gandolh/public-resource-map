import { useState, useEffect } from "react";
import type { Coordinates } from "@public-resource-map/shared";

interface UseUserLocationResult {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
}

export function useUserLocation(): UseUserLocationResult {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { coords, loading, error };
}
