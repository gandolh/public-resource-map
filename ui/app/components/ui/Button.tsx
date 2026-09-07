import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon" | "icon-sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

/**
 * One accent, one primary action per surface. Secondary carries a 1px border
 * rather than a fill, which is what keeps a row of actions from reading as
 * three equally-weighted choices.
 */
const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-fg-on-accent hover:bg-accent-hover active:bg-accent-hover shadow-e1",
  secondary:
    "bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong",
  ghost:
    "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger:
    "bg-danger text-white hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md gap-1.5",
  md: "h-9 px-3.5 text-[13.5px] rounded-lg gap-2",
  lg: "h-11 px-5 text-[15px] rounded-lg gap-2",
  icon: "h-9 w-9 rounded-lg",
  "icon-sm": "h-8 w-8 rounded-md",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium",
        "transition-[background-color,border-color,color,opacity] duration-[120ms] ease-[cubic-bezier(.2,.8,.2,1)]",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
