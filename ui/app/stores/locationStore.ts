import { create } from "zustand";
import type { Coordinates } from "@public-resource-map/shared";

/** Bucharest — used until (or unless) the browser grants geolocation. */
export const DEFAULT_CENTER: Coordinates = { lat: 44.4268, lng: 26.1025 };

interface LocationState {
  coords: Coordinates | null;
  loading: boolean;
  error: string | null;
  /** True once a geolocation request has been started, so we only ask once. */
  requested: boolean;
  requestLocation: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  coords: null,
  loading: false,
  error: null,
  requested: false,
  requestLocation: () => {
    if (get().requested) return;
    set({ requested: true });

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      set({ error: "Geolocation not supported", loading: false });
      return;
    }

    set({ loading: true });
    navigator.geolocation.getCurrentPosition(
      (pos) => set({
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        loading: false,
        error: null,
      }),
      (err) => set({ error: err.message, loading: false }),
      { timeout: 10_000, maximumAge: 60_000 },
    );
  },
}));
