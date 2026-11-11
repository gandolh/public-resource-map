import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useI18n } from "~/lib/i18n";
import { cn } from "~/lib/utils";

/** The app's one manager, so code outside React can raise a toast. */
const manager = Toast.createToastManager();

export interface NotifyOptions {
  title: ReactNode;
  description?: ReactNode;
  type?: "info" | "success" | "error";
  /** Milliseconds before it closes; 0 keeps it until dismissed. An error defaults to 0. */
  timeout?: number;
}

/** Shows a toast and returns its id. An error stays until dismissed and is announced at once. */
export function notify({ title, description, type = "info", timeout }: NotifyOptions): string {
  return manager.add({
    title,
    description,
    type,
    timeout: timeout ?? (type === "error" ? 0 : 5000),
    priority: type === "error" ? "high" : "low",
  });
}

/** Wraps the app once. The viewport sits above the phone's tab bar and lets taps through to the map. */
export function ToastHost({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={manager} limit={3}>
      {children}
      <Toast.Portal>
        <Toast.Viewport className="pointer-events-none fixed inset-x-0 bottom-20 z-sheet flex flex-col-reverse items-center gap-2 px-4 outline-none md:bottom-16">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { t } = useI18n();
  const { toasts } = Toast.useToastManager();
  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className={cn(
        "pointer-events-auto max-w-full rounded-lg border border-line bg-surface text-fg shadow-e3",
        "translate-x-(--toast-swipe-movement-x) translate-y-(--toast-swipe-movement-y)",
        "transition-[opacity,translate] duration-(--dur-2) ease-out-fast data-swiping:duration-0",
        "data-ending-style:opacity-0 data-limited:hidden data-starting-style:opacity-0",
        "data-[type=error]:border-danger",
      )}
    >
      <Toast.Content className="flex items-center gap-2 py-2 pr-2 pl-3.5">
        <div className="min-w-0 flex-1">
          <Toast.Title className="text-ui" />
          <Toast.Description className="text-meta text-fg-muted" />
        </div>
        <Toast.Close
          aria-label={t("admin.close")}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg"
        >
          <X size={14} strokeWidth={2.2} />
        </Toast.Close>
      </Toast.Content>
    </Toast.Root>
  ));
}
