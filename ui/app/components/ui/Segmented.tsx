import { cn } from "~/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * The timing lens. A segmented control rather than chips because the three
 * options are mutually exclusive — the shape should say "pick one" before the
 * label does.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  size = "md",
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        // `w-fit` so it hugs its options inside a stretching flex column
        // instead of spanning the container.
        "inline-flex w-fit items-center gap-0.5 rounded-full border border-line bg-surface p-0.5 shadow-e1",
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full font-medium transition-[background-color,color] duration-[120ms] ease-[cubic-bezier(.2,.8,.2,1)]",
              size === "sm" ? "h-7 px-3 text-[12.5px]" : "h-8 px-3.5 text-[13px]",
              // The accent, not --fg: the category chips right beside this one
              // fill with the accent when selected, and one surface may not
              // speak two selection languages.
              active
                ? "bg-accent text-fg-on-accent"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
