import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "~/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "destructive";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ComponentPropsWithoutRef<typeof BaseButton> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-cm-primary text-cm-on-primary hover:opacity-90 shadow-sm",
  secondary:
    "bg-cm-surface-container-high text-cm-primary border border-cm-outline-variant hover:bg-cm-surface-container-highest",
  ghost:
    "text-cm-on-surface-variant hover:bg-cm-surface-container-high hover:text-cm-on-surface",
  outline:
    "border border-cm-outline-variant text-cm-on-surface bg-transparent hover:bg-cm-surface-container-low",
  destructive:
    "bg-cm-error text-cm-on-error hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm:   "px-3 py-1.5 text-xs rounded",
  md:   "px-4 py-2.5 text-sm rounded-lg",
  lg:   "px-6 py-3 text-sm rounded-lg",
  icon: "p-2 rounded-full",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
