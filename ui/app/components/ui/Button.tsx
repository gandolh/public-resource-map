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
  primary: "border border-accent bg-accent font-semibold text-fg-on-accent hover:border-accent-hover hover:bg-accent-hover active:bg-accent-hover",
  secondary: "border border-outline bg-surface text-fg hover:bg-surface-2 active:bg-surface-3",
  ghost: "text-fg-muted hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-fg-on-danger hover:opacity-90",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-ui rounded-lg gap-2",
  md: "h-10 px-3.5 text-body rounded-lg gap-2",
  lg: "h-12 px-5 text-field rounded-lg gap-2",
  icon: "h-10 w-10 rounded-lg",
  "icon-sm": "h-8 w-8 rounded-lg",
};

export function Button({ variant = "secondary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center font-medium select-none",
        "transition-[background-color,border-color,color,opacity] duration-(--dur-1) ease-out-fast",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
