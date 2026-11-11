import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export interface SelectItem<Value extends string> {
  value: Value;
  label: string;
}

export interface SelectProps<Value extends string> {
  label: ReactNode;
  /** Every choice, with the label the trigger shows for it (base-ui rule 10). */
  items: SelectItem<Value>[];
  /** Uncontrolled: the value a form starts with. */
  defaultValue?: Value;
  value?: Value;
  onValueChange?: (value: Value) => void;
  /** For a form: the name the value is sent under. */
  name?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A choice from a short list. It submits with its form under `name`, as the
 * native select it replaces did.
 */
export function Select<Value extends string>({
  label,
  items,
  defaultValue,
  value,
  onValueChange,
  name,
  disabled,
  className,
}: SelectProps<Value>) {
  return (
    <BaseSelect.Root
      items={items}
      defaultValue={defaultValue}
      value={value}
      onValueChange={(next) => {
        if (next !== null) onValueChange?.(next);
      }}
      name={name}
      disabled={disabled}
    >
      <div className={cn("block text-detail font-medium", className)}>
        <BaseSelect.Label className="block">{label}</BaseSelect.Label>
        <BaseSelect.Trigger
          className={cn(
            "mt-1 flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3",
            "text-control font-normal text-fg data-disabled:cursor-default data-disabled:opacity-60",
            "data-popup-open:border-accent",
          )}
        >
          <BaseSelect.Value className="truncate" />
          <BaseSelect.Icon className="text-fg-faint">
            <ChevronDown size={14} strokeWidth={2.2} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
      </div>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={4} collisionPadding={8} className="z-popup outline-none">
          <BaseSelect.Popup
            className={cn(
              "min-w-(--anchor-width) rounded-lg border border-line bg-surface shadow-e3 outline-none",
              "origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-1) ease-out-fast",
              "data-ending-style:scale-97 data-ending-style:opacity-0 data-starting-style:scale-97 data-starting-style:opacity-0",
            )}
          >
            <BaseSelect.List className="max-h-(--available-height) overflow-y-auto p-1">
              {items.map((item) => (
                <BaseSelect.Item
                  key={item.value}
                  value={item.value}
                  className="grid cursor-pointer grid-cols-[1rem_1fr] items-center gap-2 rounded-md px-2.5 py-2 text-control text-fg outline-none select-none data-highlighted:bg-surface-2"
                >
                  <BaseSelect.ItemIndicator className="col-start-1 text-accent">
                    <Check size={14} strokeWidth={2.5} />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className="col-start-2">{item.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
