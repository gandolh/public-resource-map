import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils";

type WithClass<P> = Omit<P, "className"> & { className?: string };

/** The root renders a plain `<div>` with no look of its own. */
export const Tabs = BaseTabs.Root;

/** The row of tabs. Arrow keys choose (`activateOnFocus`): nothing is saved by moving between panels. */
export function TabsList({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.List>>) {
  return <BaseTabs.List activateOnFocus {...props} className={cn("flex gap-5 border-b border-line", className)} />;
}

export function Tab({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.Tab>>) {
  return (
    <BaseTabs.Tab
      {...props}
      className={cn(
        "-mb-px cursor-pointer border-b-2 border-transparent px-1 pb-2 text-body font-medium text-fg-muted select-none",
        "transition-colors duration-(--dur-1) ease-out-fast hover:text-fg",
        "data-active:border-accent data-active:text-fg",
        className,
      )}
    />
  );
}

export function TabPanel({ className, ...props }: WithClass<ComponentProps<typeof BaseTabs.Panel>>) {
  return <BaseTabs.Panel {...props} className={className} />;
}
