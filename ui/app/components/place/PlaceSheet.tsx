import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Event, Place } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { PlaceDetail } from "./PlaceDetail";
import { BottomSheet, BottomSheetClose, BottomSheetContent } from "~/components/ui/Drawer";
import { useAppStore } from "~/stores/appStore";

/**
 * The sheet's two visible heights, as shares of the viewport. The peek stops
 * clear of the map's own chrome (search field + timing lens) and the full
 * height leaves it showing, so the map is never reduced to a sliver behind
 * the sheet. `app.css` lifts the map's attribution by the same two heights.
 */
const PEEK = 0.46;
const FULL = 0.82;
const SNAP_POINTS = [PEEK, FULL] as const;

interface PlaceSheetProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  onClose: () => void;
}

/**
 * Mobile: a bottom sheet with two snap points, because the map must stay the
 * hero. It is not modal: the map behind a peeking sheet still pans and its
 * pins still open another place. Swiping down from the peek closes it, which
 * is the gesture people already expect from every map app on their phone.
 */
export function PlaceSheet({ place, events, eventsLoading, onClose }: PlaceSheetProps) {
  const { t } = useI18n();
  const [snapPoint, setSnapPoint] = useState<number>(PEEK);
  const setSheetSnap = useAppStore((s) => s.setSheetSnap);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- a new place starts the sheet at its peek height; keying the sheet by place would replay its entrance
    setSnapPoint(PEEK);
  }, [place.id]);

  useEffect(() => {
    setSheetSnap(snapPoint === FULL ? "full" : "peek");
    return () => setSheetSnap(null);
  }, [snapPoint, setSheetSnap]);

  return (
    <BottomSheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={place.name}
      snapPoints={SNAP_POINTS}
      snapPoint={snapPoint}
      onSnapPointChange={(next) => {
        if (typeof next === "number") setSnapPoint(next);
      }}
      className="h-[82dvh]"
    >
      <BottomSheetClose
        aria-label={t("place.close")}
        className="absolute top-3 right-3 z-10 grid h-7 w-7 place-items-center rounded-md border border-line bg-surface/85 text-fg-muted backdrop-blur-sm"
      >
        <X size={15} strokeWidth={2.2} />
      </BottomSheetClose>
      <BottomSheetContent>
        <PlaceDetail place={place} events={events} eventsLoading={eventsLoading} />
      </BottomSheetContent>
    </BottomSheet>
  );
}
