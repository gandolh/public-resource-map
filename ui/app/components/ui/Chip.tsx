import { Toggle } from "@base-ui/react/toggle";
import type { ComponentProps, ReactNode } from "react";
import { catVar } from "~/lib/categories";
import { cn } from "~/lib/utils";

interface ChipProps extends Omit<ComponentProps<typeof Toggle>, "children" | "className" | "pressed"> {
  active?: boolean;
  /** The category hue, shown as a dot so colour is never the only signal. */
  dotColor?: string;
  count?: number;
  className?: string;
  children: ReactNode;
}

/**
 * The pill shape is reserved for filters. Nothing else in the system is fully
 * rounded, so a pill always means "this narrows what you are looking at".
 * Several chips can be on at once, so each is a Toggle, not a radio.
 */
export function Chip({ active = false, dotColor, count, className, children, ...props }: ChipProps) {
  return (
    <Toggle
      pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3",
        "text-ui font-medium whitespace-nowrap select-none",
        "transition-[background-color,border-color,color] duration-(--dur-1) ease-out-fast",
        "data-pressed:border-accent data-pressed:bg-accent data-pressed:text-fg-on-accent",
        "not-data-pressed:border-line not-data-pressed:bg-surface not-data-pressed:text-fg",
        "not-data-pressed:hover:border-line-strong not-data-pressed:hover:bg-surface-2",
        className,
      )}
      {...props}
    >
      {dotColor && (
        <span
          aria-hidden="true"
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            active ? "bg-current ring-1 ring-fg-on-accent/60 ring-inset" : "bg-(--cat)",
          )}
          style={catVar(dotColor)}
        />
      )}
      {children}
      {count !== undefined && (
        <span className={cn("ml-0.5 text-caption tnum", active ? "text-fg-on-accent/75" : "text-fg-faint")}>
          {count}
        </span>
      )}
    </Toggle>
  );
}
