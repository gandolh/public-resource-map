import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Event, Place } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { PlaceDetail } from "./PlaceDetail";

interface PlacePanelProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  onClose: () => void;
}

/**
 * Desktop: a real panel docked to the right of the map, not a modal. The map
 * stays live and pannable behind it — the locked selection behaviour is that
 * the map pans the pin clear of this panel rather than covering it.
 */
export function PlacePanel({ place, events, eventsLoading, onClose }: PlacePanelProps) {
  const { t } = useI18n();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Selecting a pin moves focus into the panel, so keyboard users land where
  // the new content is instead of staying out on the map.
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
  }, [place.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      key={place.id}
      aria-label={place.name}
      className="cm-panel-in pointer-events-auto absolute top-3 right-3 bottom-3 z-[500] flex w-[384px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-e3"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t("place.close")}
        className="absolute top-3 right-3 z-10 grid h-7 w-7 place-items-center rounded-md border border-line bg-surface/85 text-fg-muted backdrop-blur transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <X size={15} strokeWidth={2.2} />
      </button>
      <PlaceDetail place={place} events={events} eventsLoading={eventsLoading} />
    </aside>
  );
}
