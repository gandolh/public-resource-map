import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, clearLabel, className }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-11 items-center gap-2 rounded-xl border border-outline bg-surface px-3 md:h-10 md:rounded-lg",
        "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent",
        className,
      )}
    >
      <Search size={16} strokeWidth={2} className="shrink-0 text-fg-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent text-field text-fg outline-none md:text-body",
          "placeholder:text-fg-faint",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="-mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
