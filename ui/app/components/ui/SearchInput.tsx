import { Search, X } from "lucide-react";
import { cn } from "~/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  clearLabel: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  clearLabel,
  className,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-10 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 shadow-e2",
        "focus-within:border-accent-line focus-within:ring-2 focus-within:ring-accent/15",
        "transition-[border-color,box-shadow] duration-[120ms]",
        className,
      )}
    >
      <Search size={16} strokeWidth={2} className="shrink-0 text-fg-faint" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-[14px] text-fg outline-none",
          "placeholder:text-fg-faint",
          "[&::-webkit-search-cancel-button]:appearance-none",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={clearLabel}
          className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
