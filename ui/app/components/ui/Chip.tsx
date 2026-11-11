import type { ButtonHTMLAttributes, ReactNode } from "react";
import { catVar } from "~/lib/categories";
import { cn } from "~/lib/utils";

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  active?: boolean;
  /** The category hue, shown as a dot so colour is never the only signal. */
  dotColor?: string;
  count?: number;
  children: ReactNode;
}

/**
 * The pill shape is reserved for filters. Nothing else in the system is fully
 * rounded, so a pill always means "this narrows what you are looking at".
 */
export function Chip({ active = false, dotColor, count, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3",
        "text-ui font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color] duration-(--dur-1) ease-out-fast",
        active
          ? "border-accent bg-accent text-fg-on-accent"
          : "border-line bg-surface text-fg hover:border-line-strong hover:bg-surface-2",
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
        <span className={cn("tnum ml-0.5 text-caption", active ? "text-fg-on-accent/75" : "text-fg-faint")}>
          {count}
        </span>
      )}
    </button>
  );
}
