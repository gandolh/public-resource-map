import { useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";
import type { Event, Place } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { PlaceDetail } from "./PlaceDetail";
import { BottomSheet, BottomSheetClose, BottomSheetContent } from "~/components/ui/Drawer";
import { useAppStore } from "~/stores/appStore";

/** The resting height before the content is measured, in px. */
const PEEK_FALLBACK = 240;
/** Under the full height the sheet leaves this much of the screen above it, for the band. */
const FULL_SHARE = 0.82;

interface PlaceSheetProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  onClose: () => void;
}

/**
 * Mobile: a bottom sheet with two snap points, because the map must stay the
 * hero. It is not modal: the map behind a resting sheet still pans and its
 * pins still open another place. The resting height is sized from the content:
 * the head, the actions and the first fact. The grab bar is a button, the
 * keyboard's alternative to dragging; swiping down from rest closes the sheet.
 */
export function PlaceSheet({ place, events, eventsLoading, onClose }: PlaceSheetProps) {
  const { t } = useI18n();
  const setSheetSnap = useAppStore((s) => s.setSheetSnap);
  // State, not refs: the sheet is portalled, so its elements arrive after this component's first render.
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const [fact, setFact] = useState<HTMLDivElement | null>(null);
  const [peek, setPeek] = useState(PEEK_FALLBACK);
  const [expanded, setExpanded] = useState(false);

  // Rest height: from the sheet's top edge to the first fact's bottom, plus the border.
  useLayoutEffect(() => {
    if (!content || !fact) return;
    const measure = () => {
      const next = Math.ceil(fact.getBoundingClientRect().bottom - content.getBoundingClientRect().top) + 1;
      setPeek((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(fact);
    observer.observe(content);
    return () => observer.disconnect();
  }, [content, fact]);

  const full = Math.max(peek + 80, Math.round(window.innerHeight * FULL_SHARE));
  const rest = expanded ? full : peek;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new place starts the sheet at rest; keying the sheet by place would replay its entrance
    setExpanded(false);
  }, [place.id]);

  useEffect(() => {
    setSheetSnap(expanded ? "full" : "peek");
    return () => setSheetSnap(null);
  }, [expanded, setSheetSnap]);

  // The map's controls and credit ride above the sheet, whatever height it rests at.
  useEffect(() => {
    document.documentElement.style.setProperty("--sheet-h", `${rest}px`);
    return () => {
      document.documentElement.style.removeProperty("--sheet-h");
    };
  }, [rest]);

  return (
    <BottomSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={place.name}
      snapPoints={[`${peek}px`, `${full}px`]}
      snapPoint={`${rest}px`}
      onSnapPointChange={(next) => {
        if (next === null) return;
        const px = typeof next === "number" ? next * window.innerHeight : parseFloat(next);
        setExpanded(px > peek + 1);
      }}
      className="h-[82dvh]"
    >
      {/* A strip across the top that drags the sheet, with the grab bar as a button in it. */}
      <div className="absolute inset-x-0 top-0 z-10 flex h-3 cursor-grab justify-center active:cursor-grabbing">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? t("place.collapse") : t("place.expand")}
          className="relative h-11 w-30 before:absolute before:top-1.5 before:left-1/2 before:h-1 before:w-10 before:-translate-x-1/2 before:rounded-full before:bg-outline before:content-['']"
        />
      </div>
      <BottomSheetContent ref={setContent}>
        <PlaceDetail
          place={place}
          events={events}
          eventsLoading={eventsLoading}
          firstFactRef={setFact}
          closeButton={
            <BottomSheetClose
              aria-label={t("place.close")}
              className="-mr-2 grid h-11 w-11 place-items-center rounded-lg border border-line-strong bg-surface text-fg-muted"
            >
              <X size={18} strokeWidth={2.2} />
            </BottomSheetClose>
          }
        />
      </BottomSheetContent>
    </BottomSheet>
  );
}
