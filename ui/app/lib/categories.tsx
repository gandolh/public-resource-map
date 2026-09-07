import type { EventCategory, PlaceCategory } from "@public-resource-map/shared";

/**
 * One category icon set, authored on a 24 grid at stroke 2 with round caps, and
 * stored as raw path data so the *same* drawing can be rendered by React in the
 * panel and injected as a string into a Leaflet `divIcon` on the map. Two
 * sources would drift, and the pin and its list row would stop agreeing.
 *
 * Category colour is never the only signal: every place shows an icon and a
 * written label alongside its hue.
 */
export const CATEGORY_PATHS: Record<PlaceCategory, string> = {
  park:
    '<path d="M12 21v-3"/><path d="M6.5 18h11L12 9.5z"/><path d="M8 12h8L12 4z"/>',
  library:
    '<path d="M3 5h5.2A3.3 3.3 0 0 1 11.5 8.3V19a2.5 2.5 0 0 0-2.5-2.1H3z"/>' +
    '<path d="M21 5h-5.2a3.3 3.3 0 0 0-3.3 3.3V19a2.5 2.5 0 0 1 2.5-2.1H21z"/>',
  clinic:
    '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M7.5 12h9"/>',
  museum:
    '<path d="M3 21h18"/><path d="M5 21V10M9.7 21V10M14.3 21V10M19 21V10"/>' +
    '<path d="M2.5 9 12 3.4 21.5 9z"/>',
  townhall:
    '<path d="M3 21h18"/><path d="M5 21V9l7-5.2L19 9v12"/><path d="M10 21v-5.4h4V21"/>' +
    '<path d="M12 7.4v.01"/>',
  community_center:
    '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.4 2.9-5.4 6.5-5.4s6.5 2 6.5 5.4"/>' +
    '<path d="M16.4 5.4a3.2 3.2 0 0 1 0 5.9"/><path d="M18 14.9c2.1.7 3.5 2.3 3.5 4.4"/>',
  education:
    '<path d="M2.4 9 12 4.2 21.6 9 12 13.8z"/>' +
    '<path d="M6.4 11.4V16c0 1.7 2.5 3 5.6 3s5.6-1.3 5.6-3v-4.6"/>',
  theater:
    '<path d="M4 4h16v7.5a8 8 0 0 1-16 0z"/><path d="M9 8.5v.01M15 8.5v.01"/>' +
    '<path d="M9 13c.9.9 1.9 1.3 3 1.3s2.1-.4 3-1.3"/>',
  sports:
    '<path d="M7 3.5h10V9a5 5 0 0 1-10 0z"/>' +
    '<path d="M7 5.5H4.6A2.4 2.4 0 0 0 7 10.4M17 5.5h2.4A2.4 2.4 0 0 1 17 10.4"/>' +
    '<path d="M12 14v3.8"/><path d="M8.5 20.5h7"/>',
  cultural_center:
    '<path d="M4 20.5V12a8 8 0 0 1 16 0v8.5"/><path d="M3 20.5h18"/>' +
    '<path d="M9 20.5V14a3 3 0 0 1 6 0v6.5"/>',
  other:
    '<path d="M12 21.2s6.8-5.2 6.8-9.9a6.8 6.8 0 1 0-13.6 0c0 4.7 6.8 9.9 6.8 9.9z"/>' +
    '<circle cx="12" cy="10.6" r="2.2"/>',
};

/** Tailwind text/background utilities are generated from these token names. */
export const CATEGORY_VAR: Record<PlaceCategory, string> = {
  park: "--cat-park",
  library: "--cat-library",
  clinic: "--cat-clinic",
  museum: "--cat-museum",
  townhall: "--cat-townhall",
  community_center: "--cat-community_center",
  education: "--cat-education",
  theater: "--cat-theater",
  sports: "--cat-sports",
  cultural_center: "--cat-cultural_center",
  other: "--cat-other",
};

export function categoryColor(category: PlaceCategory): string {
  return `var(${CATEGORY_VAR[category] ?? CATEGORY_VAR.other})`;
}

/** i18n key for the plural (filter chip) form, e.g. "Museums". */
export function categoryLabelKey(category: PlaceCategory): string {
  return `cat.${category}`;
}

/** i18n key for the singular (one place's type) form, e.g. "Museum". */
export function categoryNameKey(category: PlaceCategory): string {
  return `cat.one.${category}`;
}

/** Raw markup for a Leaflet `divIcon`, where React cannot reach. */
export function categoryIconMarkup(category: PlaceCategory, size: number, color: string): string {
  const paths = CATEGORY_PATHS[category] ?? CATEGORY_PATHS.other;
  return (
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" ` +
    `stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true">${paths}</svg>`
  );
}

export function CategoryIcon({
  category,
  size = 16,
  className,
  strokeWidth = 2,
}: {
  category: PlaceCategory;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: CATEGORY_PATHS[category] ?? CATEGORY_PATHS.other,
      }}
    />
  );
}

/**
 * Event categories borrow the place palette rather than introducing eight more
 * hues. Two taxonomies, one set of colours: a rainbow of sixteen would stop any
 * single hue meaning anything, and the two enums never appear on the same mark.
 */
const EVENT_TO_PLACE_HUE: Record<EventCategory, PlaceCategory> = {
  concert: "theater",
  theater: "theater",
  sport: "sports",
  community: "community_center",
  festival: "museum",
  exhibition: "cultural_center",
  workshop: "education",
  other: "other",
};

export function eventCategoryColor(category: EventCategory): string {
  return categoryColor(EVENT_TO_PLACE_HUE[category] ?? "other");
}

export function eventCategoryKey(category: EventCategory): string {
  return `ev.${category}`;
}
