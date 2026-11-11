import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge, told this app's own @theme names. Without the `text` list it
 * reads `text-meta` as a colour, so `cn("text-meta", "text-fg")` drops the
 * size; without the others it can't tell that two z values, shadows or
 * easings clash. Keep the lists in step with `@theme` in app.css.
 *
 * The named sizes carry no line height, so a size must not remove a `leading-*`,
 * which tailwind-merge does by default: `cn("leading-snug", "text-control")` keeps both.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "nano",
        "micro",
        "tag",
        "note",
        "caption",
        "meta",
        "detail",
        "ui",
        "control",
        "body",
        "reading",
        "lead",
        "title",
        "heading",
        "headline",
        "display",
        "hero",
      ],
      shadow: ["e1", "e2", "e3"],
      ease: ["out-fast"],
      animate: ["panel-in"],
    },
    classGroups: {
      z: [{ z: ["chrome", "draw", "panel", "sheet", "nav", "overlay", "dialog", "popup"] }],
    },
  },
  override: {
    conflictingClassGroups: { "font-size": [] },
  },
});

/** Joins class names, and lets a later class win over an earlier one it conflicts with. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lowercase and strip diacritics so searching for "timisoara" finds
 * "Timișoara". Romanian place names are full of ă â î ș ț, and nobody types
 * them into a search box.
 */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
