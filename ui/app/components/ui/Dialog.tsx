import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "~/lib/utils";

const FOCUSABLE =
  "input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href]";

const PLACEMENT = {
  /** A panel docked to the right edge, full height: the admin review panel. */
  right: "fixed top-0 right-0 h-dvh w-[min(100vw,480px)] border-l",
  /** A sheet rising from the bottom edge, full width: the phone's Categories. */
  bottom: "fixed inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t pb-[env(safe-area-inset-bottom)]",
  /** A card in the middle of the screen. */
  center:
    "fixed top-1/2 left-1/2 max-h-[85dvh] w-[min(calc(100vw-2rem),560px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border",
} as const;

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** The actions, shown in a bar under the body. */
  footer?: ReactNode;
  /** The X's accessible name, in the page's language. */
  closeLabel: string;
  placement?: keyof typeof PLACEMENT;
  /** For a dialog that holds a form: an outside tap must not throw away what was typed. */
  disablePointerDismissal?: boolean;
  /** The popup's own classes. */
  className?: string;
  /** The scrolling body's padding and spacing. */
  bodyClassName?: string;
}

/**
 * A modal dialog (base-ui rule 12). Focus stays inside, the page behind is inert, and focus goes back
 * where it was on close. Esc, the X and an outside press close it (the last unless
 * `disablePointerDismissal`). On open, focus goes to the first `[data-autofocus]` inside, else the
 * body's first field or button, else the footer's first button: never the X.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeLabel,
  placement = "right",
  disablePointerDismissal,
  className,
  bodyClassName,
}: DialogProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <BaseDialog.Root
      open={open}
      onOpenChange={(next, details) => {
        // The Escape guard: an Esc that a control inside already used (a list closing) isn't the dialog's.
        if (!next && details.reason === "escape-key" && details.event.defaultPrevented) return;
        onOpenChange(next);
      }}
      disablePointerDismissal={disablePointerDismissal}
    >
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className="fixed inset-0 z-overlay bg-scrim transition-opacity duration-(--dur-2) ease-out-fast data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <BaseDialog.Popup
          ref={popupRef}
          initialFocus={() =>
            popupRef.current?.querySelector<HTMLElement>("[data-autofocus]") ??
            bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE) ??
            popupRef.current?.querySelector<HTMLElement>("footer button:not(:disabled)") ??
            true
          }
          className={cn(
            "z-dialog flex flex-col border-line bg-surface shadow-e3 outline-none",
            PLACEMENT[placement],
            className,
          )}
        >
          <header className="flex items-start justify-between gap-3 border-b border-line p-4">
            <div className="min-w-0">
              <BaseDialog.Title className="text-title leading-snug font-semibold">{title}</BaseDialog.Title>
              {description && (
                <BaseDialog.Description className="mt-0.5 text-detail text-fg-muted">
                  {description}
                </BaseDialog.Description>
              )}
            </div>
            <BaseDialog.Close
              aria-label={closeLabel}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line-strong text-fg-muted hover:bg-surface-2 md:h-8 md:w-8 md:border-0"
            >
              <X size={16} />
            </BaseDialog.Close>
          </header>
          <div ref={bodyRef} className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
            {children}
          </div>
          {footer && <footer className="flex gap-2 border-t border-line p-4">{footer}</footer>}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
