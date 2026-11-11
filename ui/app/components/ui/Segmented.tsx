import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
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
  /** `compact` is the language switch: a rounded box with small capitals. */
  look?: "pill" | "compact";
  size?: "sm" | "md";
}

/**
 * One choice from a few: a radio group drawn as a segmented control. Tab enters
 * the group and the arrow keys move and choose (base-ui rule 16: the timing
 * lens, the draw mode and the language are all kept on the device, so trying
 * an option with the arrows costs nothing). A segmented control rather than
 * chips because the options are mutually exclusive: the shape says "pick one"
 * before the label does.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
  look = "pill",
  size = "md",
}: SegmentedProps<T>) {
  const compact = look === "compact";
  return (
    <RadioGroup<T>
      aria-label={label}
      value={value}
      onValueChange={onChange}
      className={cn(
        // `w-fit` so it hugs its options inside a stretching flex column
        // instead of spanning the container.
        "inline-flex w-fit items-center gap-0.5 border border-line bg-surface p-0.5",
        compact ? "h-8 rounded-lg" : "rounded-full shadow-e1",
        className,
      )}
    >
      {options.map((option) => (
        <Radio.Root
          key={option.value}
          value={option.value}
          className={cn(
            "cursor-pointer font-medium select-none",
            "transition-[background-color,color] duration-(--dur-1) ease-out-fast",
            compact
              ? "h-7 rounded-md px-2 text-caption font-semibold tracking-[0.04em] uppercase"
              : cn("rounded-full", size === "sm" ? "h-7 px-3 text-detail" : "h-8 px-3.5 text-ui"),
            "inline-flex items-center justify-center",
            // The accent, not --fg: the category chips right beside this one
            // fill with the accent when selected, and one surface may not
            // speak two selection languages.
            "data-checked:bg-accent data-checked:text-fg-on-accent",
            "data-unchecked:hover:bg-surface-2 data-unchecked:hover:text-fg",
            compact ? "data-unchecked:text-fg-faint" : "data-unchecked:text-fg-muted",
          )}
        >
          {option.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
