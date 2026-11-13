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
 * Desktop: a real column docked to the left of the map, not a modal. The map
 * stays live and pannable beside it: the map's box ends where the column does,
 * so the selected pin is never covered.
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
      // An Esc that a control already used (a popover closing) isn't the panel's.
      if (e.key === "Escape" && !e.defaultPrevented) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <aside
      key={place.id}
      aria-label={place.name}
      className="pointer-events-auto absolute top-3 bottom-3 left-3 z-panel flex w-[400px] animate-panel-in flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-e3"
    >
      <PlaceDetail
        place={place}
        events={events}
        eventsLoading={eventsLoading}
        closeButton={
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={t("place.close")}
            className="-mr-1 grid h-9 w-9 place-items-center rounded-lg border border-line-strong bg-surface text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        }
      />
    </aside>
  );
}
