import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface StateBlockProps {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
  tone?: "neutral" | "danger";
}

/**
 * Empty, zero-results and error all share one shape. Sparse event data is the
 * normal case here, not an edge case, so this is a first-class component that
 * explains *why* something is empty rather than leaving a blank rectangle.
 */
export function StateBlock({
  icon,
  title,
  body,
  action,
  className,
  tone = "neutral",
}: StateBlockProps) {
  return (
    <div className={cn("flex flex-col items-center px-5 py-8 text-center", className)}>
      {icon && (
        <div
          className={cn(
            "mb-3 grid h-10 w-10 place-items-center rounded-full",
            tone === "danger" ? "bg-danger-weak text-danger" : "bg-surface-2 text-fg-faint",
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-[14.5px] font-semibold tracking-[-0.01em] text-fg">{title}</p>
      {body && (
        <p className="mt-1.5 max-w-[38ch] text-[13px] leading-relaxed text-fg-muted">{body}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
