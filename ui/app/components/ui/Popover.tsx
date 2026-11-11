import { Popover as BasePopover } from "@base-ui/react/popover";
import type { ComponentProps, ReactElement, ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface PopoverProps {
  /** The element that opens it, passed through `render`, so a button is never nested in a button. */
  trigger: ReactElement;
  children: ReactNode;
  side?: ComponentProps<typeof BasePopover.Positioner>["side"];
  align?: ComponentProps<typeof BasePopover.Positioner>["align"];
  /** Controlled: a popover that code opens, such as the share fallback. Without it the trigger opens and closes it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Width, padding and radius of the panel. */
  className?: string;
}

/**
 * A small panel anchored to a button, opened by a tap. Name it with a
 * `PopoverTitle` inside, or give `className`'s panel an `aria-label`.
 */
export function Popover({ trigger, children, side, align = "end", open, onOpenChange, className }: PopoverProps) {
  return (
    <BasePopover.Root open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner side={side} align={align} sideOffset={6} className="z-popup">
          <BasePopover.Popup
            className={cn(
              "rounded-xl border border-line bg-surface shadow-e3 outline-none",
              "origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-1) ease-out-fast",
              "data-starting-style:scale-97 data-starting-style:opacity-0",
              "data-ending-style:scale-97 data-ending-style:opacity-0",
              className,
            )}
          >
            {children}
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
}

type WithClass<P> = Omit<P, "className"> & { className?: string };

/** The panel's heading; it also names the panel for a screen reader. */
export function PopoverTitle({ className, ...props }: WithClass<ComponentProps<typeof BasePopover.Title>>) {
  return <BasePopover.Title {...props} className={cn("font-semibold text-fg", className)} />;
}

export function PopoverDescription({ className, ...props }: WithClass<ComponentProps<typeof BasePopover.Description>>) {
  return <BasePopover.Description {...props} className={cn("text-fg-muted", className)} />;
}
