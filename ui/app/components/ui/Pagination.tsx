import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <PageButton
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} />
      </PageButton>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="text-cm-on-surface-variant mx-1">…</span>
        ) : (
          <PageButton
            key={p}
            onClick={() => onPageChange(p as number)}
            active={p === page}
          >
            {p}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={18} />
      </PageButton>
    </div>
  );
}

function buildPages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

interface PageButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}

function PageButton({ children, onClick, active, disabled, ...props }: PageButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors",
        active
          ? "bg-cm-primary text-cm-on-primary"
          : "border border-cm-outline-variant text-cm-on-surface hover:bg-cm-surface-container-low",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      {...props}
    >
      {children}
    </button>
  );
}
