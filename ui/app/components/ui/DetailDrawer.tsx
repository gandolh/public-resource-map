import { Link } from "react-router";
import { X, MapPin, Clock, ExternalLink, Navigation, ArrowRight, Calendar } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import { Button } from "./Button";
import { cn } from "~/lib/utils";
import { directionsUrl } from "~/lib/map";
import type { Place, Event } from "@public-resource-map/shared";

type DrawerItem = Place | Event;

function isEvent(item: DrawerItem): item is Event {
  return "title" in item;
}

interface DetailDrawerProps {
  item: DrawerItem | null;
  onClose: () => void;
  className?: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Opening hours are stored as a JSON object (e.g. {"Mon":"9–5",...}) or a plain
 * string. Render a one-line summary so the drawer never dumps raw JSON.
 */
function formatHours(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const entries = Object.entries(parsed);
    if (entries.length === 0) return raw;
    const [day, hours] = entries[0]!;
    return entries.length === 1 ? `${day}: ${hours}` : `${day}: ${hours} · +${entries.length - 1} more`;
  } catch {
    return raw;
  }
}

export function DetailDrawer({ item, onClose, className }: DetailDrawerProps) {
  if (!item) return null;

  const event = isEvent(item) ? item : null;
  const resource = isEvent(item) ? null : item;
  const name = event ? event.title : resource!.name;
  const description = event ? event.description : resource!.description;
  // Events carry no address of their own — it lives on their place.
  const address = resource?.address ?? null;
  const category = item.category;

  return (
    <>
      {/* Desktop: right panel */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-cm-surface border-l border-cm-outline-variant shadow-[0_10px_15px_rgba(0,0,0,0.1)] absolute right-0 top-0 h-full w-[400px] z-40",
          className,
        )}
      >
        <DrawerContent
          name={name}
          description={description}
          address={address}
          category={category as Parameters<typeof CategoryBadge>[0]["category"]}
          event={event}
          resource={resource}
          onClose={onClose}
        />
      </aside>

      {/* Mobile: bottom sheet */}
      <div className="lg:hidden absolute bottom-0 left-0 w-full bg-cm-surface rounded-t-2xl shadow-[0_-10px_15px_rgba(0,0,0,0.1)] z-40 max-h-[70vh] flex flex-col">
        <div className="flex justify-center py-2">
          <div className="w-12 h-1.5 bg-cm-outline-variant rounded-full" />
        </div>
        <DrawerContent
          name={name}
          description={description}
          address={address}
          category={category as Parameters<typeof CategoryBadge>[0]["category"]}
          event={event}
          resource={resource}
          onClose={onClose}
          compact
        />
      </div>
    </>
  );
}

interface DrawerContentProps {
  name: string;
  description: string | null;
  address: string | null;
  category: Parameters<typeof CategoryBadge>[0]["category"];
  event: Event | null;
  resource: Place | null;
  onClose: () => void;
  compact?: boolean;
}

function DrawerContent({ name, description, address, category, event, resource, onClose, compact }: DrawerContentProps) {
  return (
    <>
      {/* Header image placeholder / actual image */}
      {!compact && (
        <div className="relative w-full h-48 bg-cm-surface-container-high flex-shrink-0">
          {event?.imageUrl ? (
            <img src={event.imageUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-cm-surface-container to-cm-surface-container-high" />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-cm-surface/80 backdrop-blur-sm rounded-full text-cm-on-surface hover:bg-cm-surface transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-4">
        {compact && (
          <div className="flex justify-between items-start">
            <CategoryBadge category={category} />
            <button onClick={onClose} className="text-cm-on-surface-variant hover:text-cm-on-surface">
              <X size={18} />
            </button>
          </div>
        )}
        {!compact && <CategoryBadge category={category} />}

        <h2 className={cn("font-semibold text-cm-on-surface", compact ? "text-xl" : "text-2xl leading-tight")}>
          {name}
        </h2>

        {address && (
          <div className="flex items-start gap-2 text-cm-on-surface-variant">
            <MapPin size={16} className="flex-shrink-0 mt-0.5 text-cm-outline" />
            <p className="text-sm">{address}</p>
          </div>
        )}

        {resource?.openingHours && (
          <div className="flex items-start gap-2 text-cm-on-surface-variant">
            <Clock size={16} className="flex-shrink-0 mt-0.5 text-cm-outline" />
            <p className="text-sm">{formatHours(resource.openingHours)}</p>
          </div>
        )}

        {event && (
          <div className="flex items-start gap-2 text-cm-on-surface-variant">
            <Calendar size={16} className="flex-shrink-0 mt-0.5 text-cm-outline" />
            <div className="text-sm">
              <p>{formatDate(event.startDate)}</p>
              {event.price != null && event.price > 0 && (
                <p className="font-bold text-cm-primary mt-0.5">
                  {event.currency ?? "$"}{event.price}
                </p>
              )}
              {(event.price == null || event.price === 0) && (
                <p className="font-bold text-green-600 mt-0.5">Free</p>
              )}
            </div>
          </div>
        )}

        {!compact && (
          <>
            <div className="h-px w-full bg-cm-outline-variant" />
            {description && (
              <p className="text-sm text-cm-on-surface-variant leading-relaxed">{description}</p>
            )}
            {resource && (
              <a
                href={directionsUrl(resource.coordinates, resource.address ?? undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2"
              >
                <Button variant="secondary" size="md" className="w-full">
                  <Navigation size={16} />
                  Directions
                </Button>
              </a>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="p-4 border-t border-cm-outline-variant bg-cm-surface flex-shrink-0">
        {event?.sourceUrl ? (
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
            <Button size="lg" className="w-full">
              <ExternalLink size={16} />
              View Event
            </Button>
          </a>
        ) : resource ? (
          <Link to={`/resources/${resource.id}`} className="block">
            <Button size="lg" className="w-full">
              View details
              <ArrowRight size={16} />
            </Button>
          </Link>
        ) : null}
      </div>
    </>
  );
}
