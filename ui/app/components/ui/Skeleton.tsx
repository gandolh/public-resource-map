import { cn } from "~/lib/utils";

/**
 * A resting shape at the size of the content it stands in for. It pulses rather
 * than sweeping a gradient: a shimmer that travels reads as a second kind of
 * motion competing with the map.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-surface-3", className)}
    />
  );
}

export function EventRowSkeleton() {
  return (
    <div className="flex gap-3 py-3">
      <Skeleton className="h-10 w-11 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
