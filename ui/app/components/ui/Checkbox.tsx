import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface CheckboxProps extends Omit<ComponentProps<typeof BaseCheckbox.Root>, "className" | "children"> {
  /** A visible label; without one, pass an `aria-label` (a table row's tick). */
  label?: ReactNode;
  className?: string;
}

/**
 * A tick box a form or a list collects. The box's border is the faint ink, not
 * the hairline: an empty box must stay visible against the surface.
 */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <BaseCheckbox.Root
      {...props}
      className={cn(
        "grid size-4 shrink-0 cursor-pointer place-items-center rounded-xs border border-fg-faint bg-surface text-fg-on-accent",
        "transition-colors duration-(--dur-1) ease-out-fast",
        "data-checked:border-accent data-checked:bg-accent",
        "data-disabled:cursor-default data-disabled:opacity-60",
        label ? undefined : className,
      )}
    >
      <BaseCheckbox.Indicator className="grid place-items-center">
        <Check size={12} strokeWidth={3} aria-hidden="true" />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
  if (!label) return box;
  return (
    <label className={cn("inline-flex items-center gap-1.5", className)}>
      {box}
      {label}
    </label>
  );
}
