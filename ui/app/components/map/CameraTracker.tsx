import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { MapCamera } from "~/lib/mapUrl";

/** A move that starts this soon after the user touched the map is theirs. */
const GESTURE_MS = 1000;

/**
 * Reports the camera after a move the user made (a drag, the wheel, the keyboard, a zoom button,
 * a pin), never after one the app made by itself (centring on a new city): the URL carries the
 * camera only once the user moved the map.
 */
export function CameraTracker({ onMove }: { onMove: (camera: MapCamera) => void }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let touchedAt = -Infinity;
    let theirs = false;
    const touch = () => {
      touchedAt = Date.now();
    };
    const start = () => {
      theirs = Date.now() - touchedAt < GESTURE_MS;
    };
    const end = () => {
      if (!theirs) return;
      theirs = false;
      const { lat, lng } = map.getCenter();
      onMove({ zoom: map.getZoom(), lat, lng });
    };
    const inputs = ["pointerdown", "wheel", "keydown", "touchstart"] as const;
    for (const name of inputs) container.addEventListener(name, touch, { passive: true });
    map.on("movestart", start);
    map.on("moveend", end);
    return () => {
      for (const name of inputs) container.removeEventListener(name, touch);
      map.off("movestart", start);
      map.off("moveend", end);
    };
  }, [map, onMove]);
  return null;
}
