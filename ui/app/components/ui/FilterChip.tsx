import { Toggle } from "@base-ui/react/toggle";
import { cn } from "~/lib/utils";
import type { ReactNode } from "react";

interface FilterChipProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  children: ReactNode;
  className?: string;
}

export function FilterChip({ pressed, onPressedChange, children, className }: FilterChipProps) {
  return (
    <Toggle
      pressed={pressed}
      onPressedChange={onPressedChange}
      className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer",
        pressed
          ? "bg-cm-primary text-cm-on-primary border-transparent"
          : "bg-transparent border border-cm-outline-variant text-cm-on-surface hover:bg-cm-surface-container-low",
        className,
      )}
    >
      {children}
    </Toggle>
  );
}
