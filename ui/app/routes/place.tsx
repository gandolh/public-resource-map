import { useEffect } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { AlertTriangle } from "lucide-react";
import type { MapOutletContext } from "./map";
import { PlacePanel } from "~/components/place/PlacePanel";
import { PlaceSheet } from "~/components/place/PlaceSheet";
import { StateBlock } from "~/components/ui/StateBlock";
import { Button } from "~/components/ui/Button";
import { usePlace, usePlaceEvents } from "~/hooks/usePlaces";
import { useAppStore } from "~/stores/appStore";
import { useI18n } from "~/lib/i18n";
import { useIsMobile } from "~/hooks/useIsMobile";

/** Panel width plus its margins — how far the map must shift to clear it. */
const PANEL_OFFSET_X = 200;
/** Roughly half the peeked sheet, so the pin sits in the visible upper half. */
const SHEET_OFFSET_Y = 150;

/**
 * The place surface, rendered *over* the live map rather than as a separate
 * page. One place view, whether you clicked a pin or opened a shared link —
 * a cold visit centres the map on the place instead of showing a lesser
 * standalone copy.
 */
export default function PlaceRoute() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const { places, getMap } = useOutletContext<MapOutletContext>();
  const select = useAppStore((s) => s.select);

  const { data: place, isPending, isError, refetch } = usePlace(id);
  const { data: eventsPage, isPending: eventsPending } = usePlaceEvents(id);

  // The map owns pin highlighting, so the URL drives the store, not the reverse.
  useEffect(() => {
    select(id ?? null);
    return () => select(null);
  }, [id, select]);

  // Pan so the selected pin clears the panel (desktop) or the sheet (mobile),
  // rather than sitting underneath the thing describing it.
  const known = place ?? places.find((p) => p.id === id);
  const lat = known?.coordinates.lat;
  const lng = known?.coordinates.lng;

  useEffect(() => {
    const map = getMap();
    if (!map || lat === undefined || lng === undefined) return;
    const zoom = Math.max(map.getZoom(), 16);
    const point = map.project([lat, lng], zoom);
    const shifted = isMobile
      ? point.add([0, SHEET_OFFSET_Y])
      : point.add([PANEL_OFFSET_X, 0]);
    map.flyTo(map.unproject(shifted, zoom), zoom, { duration: 0.55 });
  }, [lat, lng, isMobile, getMap]);

  const close = () => navigate("/");

  if (isError) {
    return (
      <div className="pointer-events-auto absolute top-1/2 right-3 left-3 z-[600] mx-auto w-[min(92%,360px)] -translate-y-1/2 rounded-xl border border-line bg-surface shadow-e3 md:left-auto md:translate-y-0 md:top-3 md:w-[384px]">
        <StateBlock
          tone="danger"
          icon={<AlertTriangle size={18} strokeWidth={2} />}
          title={t("state.error")}
          body={t("state.errorBody")}
          action={
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => void refetch()}>
                {t("state.retry")}
              </Button>
              <Button variant="ghost" size="sm" onClick={close}>
                {t("place.backToMap")}
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  if (isPending || !place) {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[600] h-[46dvh] animate-pulse rounded-t-xl border-t border-line bg-surface md:inset-x-auto md:top-3 md:right-3 md:bottom-3 md:h-auto md:w-[384px] md:rounded-xl md:border"
        aria-label={t("state.loading")}
        role="status"
      />
    );
  }

  const events = eventsPage?.data ?? [];

  return isMobile ? (
    <PlaceSheet place={place} events={events} eventsLoading={eventsPending} onClose={close} />
  ) : (
    <PlacePanel place={place} events={events} eventsLoading={eventsPending} onClose={close} />
  );
}
