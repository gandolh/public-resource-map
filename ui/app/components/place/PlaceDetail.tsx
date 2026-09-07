import { useState } from "react";
import { Check, Clock, Globe, Link2, MapPin, Navigation, Phone } from "lucide-react";
import type { Event, Place } from "@public-resource-map/shared";
import { useI18n } from "~/lib/i18n";
import { categoryNameKey } from "~/lib/categories";
import { directionsUrl } from "~/lib/map";
import { Button } from "~/components/ui/Button";
import { CategoryBadge } from "~/components/ui/CategoryBadge";
import { EventList } from "./EventList";

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 border-t border-line py-2.5 first:border-t-0">
      <span className="mt-0.5 shrink-0 text-fg-faint" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-medium tracking-[0.08em] text-fg-faint uppercase">
          {label}
        </p>
        <div className="mt-0.5 text-[13px] leading-snug break-words text-fg">{children}</div>
      </div>
    </div>
  );
}

interface PlaceDetailProps {
  place: Place;
  events: Event[];
  eventsLoading?: boolean;
  /** `page` gives the standalone route a slightly larger title. */
  variant?: "panel" | "page";
}

/**
 * One place surface. The panel over the map, the mobile sheet and the
 * standalone `/places/:id` page all render this — a locked decision, because
 * two divergent place views is exactly how a deep link ends up showing less
 * than a pin click.
 */
export function PlaceDetail({
  place,
  events,
  eventsLoading,
  variant = "panel",
}: PlaceDetailProps) {
  const { t, tn } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/places/${place.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context, permissions). Fall back to
      // the address bar rather than failing silently.
      window.prompt(t("place.share"), url);
    }
  };

  const count = place.upcomingEventCount ?? events.length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <header className="px-4 pt-4 pb-3.5">
          <CategoryBadge category={place.category} label={t(categoryNameKey(place.category))} />
          <h2
            className={
              variant === "page"
                ? "mt-2.5 text-[26px] leading-[1.15] font-semibold tracking-[-0.025em] text-balance"
                : "mt-2.5 text-[19px] leading-[1.2] font-semibold tracking-[-0.02em] text-balance"
            }
          >
            {place.name}
          </h2>
          {place.address && (
            <p className="mt-1.5 text-[13px] leading-snug text-fg-muted">{place.address}</p>
          )}

          <div className="mt-3.5 flex gap-2">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              onClick={() =>
                window.open(directionsUrl(place.coordinates), "_blank", "noopener,noreferrer")
              }
            >
              <Navigation size={15} strokeWidth={2.2} />
              {t("place.directions")}
            </Button>
            <Button variant="secondary" size="md" onClick={copyLink} aria-live="polite">
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
          </div>
        </header>

        <div className="border-t border-line px-4 py-1">
          {place.openingHours && (
            <MetaRow icon={<Clock size={14} strokeWidth={2} />} label={t("place.hours")}>
              {place.openingHours}
            </MetaRow>
          )}
          {place.phone && (
            <MetaRow icon={<Phone size={14} strokeWidth={2} />} label={t("place.phone")}>
              <a href={`tel:${place.phone}`} className="hover:text-accent hover:underline">
                {place.phone}
              </a>
            </MetaRow>
          )}
          {place.website && (
            <MetaRow icon={<Globe size={14} strokeWidth={2} />} label={t("place.website")}>
              <a
                href={place.website}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent hover:underline"
              >
                {place.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            </MetaRow>
          )}
          <MetaRow icon={<MapPin size={14} strokeWidth={2} />} label={t("place.source")}>
            {place.source === "osm" ? t("place.sourceOsm") : t("place.sourceVenue")}
            {place.osmType && place.osmId && (
              <span className="font-mono text-[11.5px] text-fg-faint">
                {" "}
                · {place.osmType}/{place.osmId}
              </span>
            )}
          </MetaRow>
        </div>

        <div className="border-t border-line">
          <div className="flex items-baseline justify-between px-4 pt-3.5 pb-0.5">
            <h3 className="text-[13px] font-semibold tracking-[-0.01em]">
              {t("place.whatsOnHere")}
            </h3>
            {count > 0 && (
              <span className="tnum text-[12px] text-fg-muted">{tn("count.events", count)}</span>
            )}
          </div>
          <EventList
            events={events}
            loading={eventsLoading}
            emptyTitle={t("place.noEvents")}
            emptyBody={t("place.noEventsBody")}
          />
        </div>
      </div>
    </div>
  );
}
