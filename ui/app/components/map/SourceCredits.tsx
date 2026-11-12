import { useEffect } from "react";
import type { Control } from "leaflet";

/**
 * The credits in the attribution corner, from the source registry: OpenStreetMap, the tiles in
 * use, and the publishers whose venues are on screen, in the current language. One entry, so the
 * credits keep their own separator.
 */
export function SourceCredits({ control, credit }: { control: Control.Attribution | null; credit: string }) {
  useEffect(() => {
    if (!control || !credit) return;
    control.addAttribution(credit);
    return () => {
      control.removeAttribution(credit);
    };
  }, [control, credit]);
  return null;
}
