import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "~/lib/utils";

type SnapPoint = number | string;

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the sheet for a screen reader. It is not drawn. */
  title: string;
  /** The sheet's visible heights: fractions of the viewport height, smallest first. The last is the full height. */
  snapPoints: readonly SnapPoint[];
  snapPoint: SnapPoint | null;
  onSnapPointChange: (snapPoint: SnapPoint | null) => void;
  /** What sits above the sheet's content, over the drag handle: the close button. */
  children: ReactNode;
  className?: string;
}

/**
 * A bottom sheet over a map that stays live: not modal, no backdrop, and an
 * outside press does not close it. A swipe down closes it from the lowest snap
 * and drops it a snap from the highest; Esc and the close button close it too
 * (base-ui rule 15's Drawer, as a content sheet rather than a navigation panel).
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  snapPoints,
  snapPoint,
  onSnapPointChange,
  children,
  className,
}: BottomSheetProps) {
  return (
    <BaseDrawer.Root
      open={open}
      onOpenChange={(next, details) => {
        // The Escape guard: an Esc that a control inside already used isn't the sheet's.
        if (!next && details.reason === "escape-key" && details.event.defaultPrevented) return;
        onOpenChange(next);
      }}
      modal={false}
      disablePointerDismissal
      swipeDirection="down"
      snapToSequentialPoints
      snapPoints={[...snapPoints]}
      snapPoint={snapPoint}
      onSnapPointChange={onSnapPointChange}
    >
      <BaseDrawer.Portal>
        {/* The viewport covers the screen, so it lets every press through to the map; only the popup takes them. */}
        <BaseDrawer.Viewport className="pointer-events-none fixed inset-0 z-sheet flex items-end justify-center pb-(--tabbar)">
          <BaseDrawer.Popup
            className={cn(
              "pointer-events-auto relative flex min-h-0 w-full flex-col rounded-t-xl border-t border-line-strong bg-surface shadow-e3 outline-none",
              "touch-none [padding-bottom:max(0px,calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]",
              "[transform:translateY(calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y)))]",
              "transition-[transform] duration-(--dur-3) ease-out-fast data-swiping:duration-0",
              "data-ending-style:[transform:translateY(calc(100%+2px))] data-starting-style:[transform:translateY(calc(100%+2px))]",
              "data-ending-style:[padding-bottom:0] data-starting-style:[padding-bottom:0]",
              "after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-12 after:bg-surface after:content-['']",
              className,
            )}
          >
            <BaseDrawer.Title render={<p />} className="sr-only">
              {title}
            </BaseDrawer.Title>
            {children}
          </BaseDrawer.Popup>
        </BaseDrawer.Viewport>
      </BaseDrawer.Portal>
    </BaseDrawer.Root>
  );
}

/** The scrolling content of a sheet. Touches inside it scroll; a swipe that starts at its top still drags the sheet. */
export function BottomSheetContent({
  className,
  ...props
}: Omit<ComponentProps<typeof BaseDrawer.Content>, "className"> & { className?: string }) {
  return (
    <BaseDrawer.Content
      {...props}
      className={cn("min-h-0 flex-1 touch-auto overflow-y-auto overscroll-contain", className)}
    />
  );
}

export const BottomSheetClose = BaseDrawer.Close;
