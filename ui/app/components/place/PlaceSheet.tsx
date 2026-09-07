import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Event, Place } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { PlaceDetail } from "./PlaceDetail";
import { cn } from "~/lib/utils";
import { useAppStore } from "~/stores/appStore";

/**
 * The sheet is always FULL tall and slides down to reveal only PEEK — so the
 * snap animates `transform`, never `height`. Animating height relayouts the
 * whole panel every frame and janks on exactly the mid-range phones this is
 * for. `PEEK_SHIFT` is how far down that is, as a share of the sheet's height.
 */
const PEEK = 0.46;
/* Stops clear of the map's own chrome (search field + timing lens) so the map
   is never reduced to a sliver behind the sheet. */
const FULL = 0.82;
const PEEK_SHIFT = ((FULL - PEEK) / FULL) * 100;

interface PlaceSheetProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  onClose: () => void;
}

/**
 * Mobile: a draggable bottom sheet with two snap points, because the map must
 * stay the hero. Dragging past the peek point closes it, which is the gesture
 * people already expect from every map app on their phone.
 */
export function PlaceSheet({ place, events, eventsLoading, onClose }: PlaceSheetProps) {
  const { t } = useI18n();
  const [snap, setSnap] = useState<"peek" | "full">("peek");
  const [drag, setDrag] = useState(0);
  // Mount fully off-screen, then settle to the peek snap on the next frame, so
  // the entrance slide is the snap transition rather than a second animation
  // fighting it for ownership of `transform`.
  const [entered, setEntered] = useState(false);
  const setSheetSnap = useAppStore((s) => s.setSheetSnap);
  const startY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    setSnap("peek");
    setDrag(0);
  }, [place.id]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setSheetSnap(snap);
    return () => setSheetSnap(null);
  }, [snap, setSheetSnap]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    startY.current = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    setDrag(e.clientY - startY.current);
  }, []);

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    const delta = drag;
    setDrag(0);
    if (delta > 110) {
      if (snap === "full") setSnap("peek");
      else onClose();
    } else if (delta < -60) {
      setSnap("full");
    }
  }, [drag, snap, onClose]);

  const shift = !entered ? 100 : snap === "full" ? 0 : PEEK_SHIFT;

  return (
    <div
      role="dialog"
      aria-label={place.name}
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[600] flex flex-col rounded-t-xl border-t border-line bg-surface shadow-e3"
      style={{
        height: `${FULL * 100}dvh`,
        transform: `translateY(calc(${shift}% + ${Math.max(0, drag)}px))`,
        transition: dragging.current
          ? "none"
          : "transform 240ms cubic-bezier(.2,.8,.2,1)",
      }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="shrink-0 cursor-grab touch-none pt-2.5 pb-1 active:cursor-grabbing"
      >
        <div className={cn("mx-auto h-1 w-9 rounded-full bg-line-strong")} aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t("place.close")}
        className="absolute top-3 right-3 z-10 grid h-7 w-7 place-items-center rounded-md border border-line bg-surface/85 text-fg-muted backdrop-blur"
      >
        <X size={15} strokeWidth={2.2} />
      </button>

      <div className="min-h-0 flex-1">
        <PlaceDetail place={place} events={events} eventsLoading={eventsLoading} />
      </div>
    </div>
  );
}
