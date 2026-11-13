import { useState, type ReactNode, type Ref } from "react";
import { Check, Clock, Globe, Link2, MapPin, Navigation, Phone } from "lucide-react";
import { sourceById, type Event, type Place, type SourceId } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { catVar, categoryColor, categoryNameKey } from "~/lib/categories";
import { directionsUrl } from "~/lib/map";
import { mapShareUrl, parseMapSearch } from "~/lib/mapUrl";
import { Button } from "~/components/ui/Button";
import { FavoriteStar } from "~/components/FavoriteStar";
import { Popover, PopoverDescription, PopoverTitle } from "~/components/ui/Popover";
import { CategoryBadge } from "~/components/ui/CategoryBadge";
import { EventList } from "./EventList";

function MetaRow({
  icon,
  label,
  children,
  rowRef,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  rowRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={rowRef}
      className="mx-4 grid grid-cols-[76px_minmax(0,1fr)] gap-x-2 border-b border-line py-2.5 last:border-b-0"
    >
      <dt className="flex items-start gap-1.5 text-ui font-medium text-fg-faint">
        <span className="mt-0.5 shrink-0 text-fg-muted" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="m-0 min-w-0 text-body break-words">{children}</dd>
    </div>
  );
}

/** Each credited source, from the registry, linked to its own credit page. */
function Credits({ ids }: { ids: readonly SourceId[] }) {
  const { lang } = useI18n();
  return ids.flatMap((id, i) => {
    const source = sourceById(id);
    if (!source) return [];
    return [
      i > 0 && " · ",
      <a
        key={id}
        href={source.attributionUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="hover:text-accent hover:underline"
      >
        {source.attribution[lang]}
      </a>,
    ];
  });
}

interface PlaceDetailProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  /** The close button, set in the head's first row. */
  closeButton: ReactNode;
  /** Set on the first fact, so the sheet can size its resting height to the head, the actions and this row. */
  firstFactRef?: Ref<HTMLDivElement>;
}

export function PlaceDetail({ place, events, eventsLoading, closeButton, firstFactRef }: PlaceDetailProps) {
  const { t, tn } = useI18n();
  const [copied, setCopied] = useState(false);
  // The clipboard can be blocked; the link is then shown, selected, to copy by hand.
  const [manual, setManual] = useState(false);
  // The link copied last, shown when the clipboard is blocked.
  const [url, setUrl] = useState("");

  const copyLink = async () => {
    // The place with the map's view around it (city, search, filters, camera), read from the
    // address bar when it is copied: the map writes the view there itself.
    const link = mapShareUrl({ ...parseMapSearch(window.location.search), place: place.id });
    setUrl(link);
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Show the link
      // rather than failing silently.
      setManual(true);
    }
  };

  const count = place.upcomingEventCount ?? events.length;

  return (
    <div className="flex h-full flex-col">
      <header
        style={catVar(categoryColor(place.category))}
        className="relative flex-none border-b border-line-strong bg-[color-mix(in_srgb,var(--cat)_var(--head-mix),var(--surface))] px-4 pt-3 pb-2.5 md:pb-4"
      >
        <div className="flex min-h-11 items-center justify-between gap-2 md:mb-3 md:min-h-9">
          <CategoryBadge category={place.category} label={t(categoryNameKey(place.category))} />
          {closeButton}
        </div>
        <h2 className="text-place font-semibold tracking-[-0.015em] text-balance">{place.name}</h2>
        {place.address && <p className="mt-1 text-body text-fg-muted md:text-ui">{place.address}</p>}

        <div className="mt-2 flex gap-2 md:mt-4">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 text-body md:h-10 md:px-3.5"
            onClick={() => window.open(directionsUrl(place.coordinates), "_blank", "noopener,noreferrer")}
          >
            <Navigation size={15} strokeWidth={2.2} />
            {t("place.directions")}
          </Button>
          <Popover
            open={manual}
            // The trigger copies the link; only a failed copy opens the panel, so a press never opens it by itself.
            onOpenChange={(open) => {
              if (!open) setManual(false);
            }}
            className="w-[300px] p-3.5 text-ui"
            trigger={
              <Button
                variant="secondary"
                size="lg"
                className="text-body md:h-10 md:px-3.5"
                onClick={() => void copyLink()}
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <Check size={15} strokeWidth={2.4} className="text-ok" />
                    {t("place.shared")}
                  </>
                ) : (
                  <>
                    <Link2 size={15} strokeWidth={2.2} />
                    {t("place.share")}
                  </>
                )}
              </Button>
            }
          >
            <PopoverTitle>{t("place.shareManual")}</PopoverTitle>
            <PopoverDescription className="mt-1">{t("place.shareManualBody")}</PopoverDescription>
            <input
              readOnly
              value={url}
              aria-label={t("place.share")}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-2.5 h-10 w-full rounded-lg border border-outline bg-surface px-3 text-body"
            />
          </Popover>
          <FavoriteStar kind="place" id={place.id} name={place.name} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-surface">
        <dl className="m-0 py-1">
          {place.openingHours && (
            <MetaRow rowRef={firstFactRef} icon={<Clock size={14} strokeWidth={2} />} label={t("place.hours")}>
              {place.openingHours}
            </MetaRow>
          )}
          {place.phone && (
            <MetaRow
              rowRef={place.openingHours ? undefined : firstFactRef}
              icon={<Phone size={14} strokeWidth={2} />}
              label={t("place.phone")}
            >
              <a
                href={`tel:${place.phone}`}
                className="inline-flex min-h-11 items-center hover:text-accent hover:underline md:min-h-0"
              >
                {place.phone}
              </a>
            </MetaRow>
          )}
          {place.website && (
            <MetaRow
              rowRef={place.openingHours || place.phone ? undefined : firstFactRef}
              icon={<Globe size={14} strokeWidth={2} />}
              label={t("place.website")}
            >
              <a
                href={place.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex min-h-11 items-center text-accent hover:underline md:min-h-0"
              >
                {place.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </MetaRow>
          )}
          <MetaRow
            rowRef={place.openingHours || place.phone || place.website ? undefined : firstFactRef}
            icon={<MapPin size={14} strokeWidth={2} />}
            label={t("place.source")}
          >
            <span className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-meta">
                {place.source === "osm" && place.credits.length > 0 ? (
                  <Credits ids={place.credits} />
                ) : place.source === "osm" ? (
                  t("place.sourceOsm")
                ) : (
                  <>
                    {t("place.sourceVenue")}
                    {place.credits.length > 0 && (
                      <>
                        {": "}
                        <Credits ids={place.credits} />
                      </>
                    )}
                  </>
                )}
              </span>
              {place.osmType && place.osmId && (
                <span className="font-mono text-meta text-fg-muted">
                  {place.osmType}/{place.osmId}
                </span>
              )}
            </span>
          </MetaRow>
        </dl>

        <section className="border-t border-line-strong bg-surface px-4 pt-3 pb-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-body font-semibold">{t("place.whatsOnHere")}</h3>
            {count > 0 && <span className="text-meta text-fg-muted tnum">{tn("count.events", count)}</span>}
          </div>
          <EventList
            events={events}
            loading={eventsLoading}
            emptyTitle={t("place.noEvents")}
            emptyBody={t("place.noEventsBody")}
          />
        </section>
      </div>
    </div>
  );
}
