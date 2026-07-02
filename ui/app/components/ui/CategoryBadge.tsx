import { cn } from "~/lib/utils";
import type { PlaceCategory, EventCategory } from "@public-resource-map/shared";

type Category = PlaceCategory | EventCategory;

const categoryConfig: Record<Category, { label: string; color: string }> = {
  // PlaceCategory
  park:            { label: "Park",          color: "var(--cm-cat-park)" },
  library:         { label: "Library",       color: "var(--cm-cat-library)" },
  clinic:          { label: "Clinic",        color: "var(--cm-cat-healthcare)" },
  museum:          { label: "Museum",        color: "var(--cm-cat-exhibition)" },
  townhall:        { label: "Town Hall",     color: "var(--cm-cat-other)" },
  community_center:{ label: "Community",     color: "var(--cm-cat-community)" },
  education:       { label: "Education",     color: "var(--cm-cat-education)" },
  sports:          { label: "Sports",        color: "var(--cm-cat-sport)" },
  cultural_center: { label: "Cultural",      color: "var(--cm-cat-festival)" },
  // EventCategory
  concert:         { label: "Concert",       color: "var(--cm-cat-concert)" },
  theater:         { label: "Theater",       color: "var(--cm-cat-theater)" },
  sport:           { label: "Sport",         color: "var(--cm-cat-sport)" },
  community:       { label: "Community",     color: "var(--cm-cat-community)" },
  festival:        { label: "Festival",      color: "var(--cm-cat-festival)" },
  exhibition:      { label: "Exhibition",    color: "var(--cm-cat-exhibition)" },
  workshop:        { label: "Workshop",      color: "var(--cm-cat-workshop)" },
  // shared
  other:           { label: "Other",         color: "var(--cm-cat-other)" },
};

interface CategoryBadgeProps {
  category: Category;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const config = categoryConfig[category] ?? { label: category, color: "var(--cm-cat-other)" };
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider", className)}
      style={{
        color: config.color,
        backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)`,
      }}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.color }}
      />
      {config.label}
    </span>
  );
}

export { categoryConfig };
export type { Category };
