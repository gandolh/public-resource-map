import { cn } from "~/lib/utils";

export function Avatar({ fallback, className }: { fallback?: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-surface-2",
        "text-[12px] font-semibold text-fg-muted",
        className,
      )}
      aria-hidden="true"
    >
      {fallback ?? "?"}
    </span>
  );
}
