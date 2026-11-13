import type { PlaceCategory } from "@public-resource-map/shared";
import { CategoryIcon, catVar, categoryColor } from "~/lib/categories";
import { cn } from "~/lib/utils";

/**
 * Hue plus icon plus written label, always all three. The colour is a fast
 * secondary cue for people who can use it, never the thing carrying meaning.
 */
export function CategoryBadge({
  category,
  label,
  className,
}: {
  category: PlaceCategory;
  label: string;
  className?: string;
}) {
  const color = categoryColor(category);
  return (
    <span
      className={cn(
        // Deliberately not a pill: this states what a place IS, it does not
        // filter anything, and the pill shape is reserved for controls that do.
        "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2.5 md:h-7",
        "text-meta font-semibold text-fg",
        "hue-edge bg-surface",
        className,
      )}
      style={catVar(color)}
    >
      <span className="inline-flex text-(--cat)">
        <CategoryIcon category={category} size={14} strokeWidth={2.2} />
      </span>
      {label}
    </span>
  );
}
