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
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1",
        "text-caption font-semibold tracking-[0.01em]",
        "border-(color:--cat)/34 bg-(--cat)/10 text-(color:--cat)",
        className,
      )}
      style={catVar(color)}
    >
      <CategoryIcon category={category} size={13} strokeWidth={2.2} />
      {label}
    </span>
  );
}
