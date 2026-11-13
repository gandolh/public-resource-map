import { Toggle } from "@base-ui/react/toggle";
import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

interface ChipProps extends Omit<ComponentProps<typeof Toggle>, "children" | "className" | "pressed"> {
  active?: boolean;
  /** The category's glyph, drawn in its hue, so colour is never the only signal. */
  icon?: ReactNode;
  count?: number;
  className?: string;
  children: ReactNode;
}

/**
 * The pill shape is reserved for filters. Nothing else in the system is fully
 * rounded, so a pill always means "this narrows what you are looking at".
 * Several chips can be on at once, so each is a Toggle, not a radio.
 */
export function Chip({ active = false, icon, count, className, children, ...props }: ChipProps) {
  return (
    <Toggle
      pressed={active}
      className={cn(
        "inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-4 md:h-8 md:px-3",
        "text-body font-medium whitespace-nowrap select-none",
        "transition-[background-color,border-color,color] duration-(--dur-1) ease-out-fast",
        "data-pressed:border-accent data-pressed:bg-accent data-pressed:text-fg-on-accent",
        "not-data-pressed:border-line-strong not-data-pressed:bg-surface not-data-pressed:text-fg",
        "not-data-pressed:hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {active && icon ? <Check size={14} strokeWidth={2.6} aria-hidden="true" className="shrink-0" /> : icon}
      {children}
      {count !== undefined && (
        <span className={cn("ml-0.5 text-meta tnum", active ? "text-fg-on-accent/75" : "text-fg-faint")}>{count}</span>
      )}
    </Toggle>
  );
}
