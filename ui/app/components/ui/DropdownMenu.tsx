import { Menu } from "@base-ui/react/menu";
import { cn } from "~/lib/utils";
import type { ReactElement, ReactNode, ComponentPropsWithoutRef } from "react";

interface DropdownMenuProps {
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

export function DropdownMenu({ trigger, children, align = "end", className }: DropdownMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner align={align} sideOffset={6} className="z-overlay">
          <Menu.Popup
            className={cn(
              "min-w-48 rounded-lg border border-line bg-surface p-1 shadow-e3",
              "origin-(--transform-origin) transition-[opacity,transform] duration-(--dur-1) ease-out-fast",
              "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
              className,
            )}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function DropdownMenuItem({ className, children, ...props }: ComponentPropsWithoutRef<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-control text-fg outline-none",
        "transition-colors duration-(--dur-1)",
        "data-[highlighted]:bg-surface-2 hover:bg-surface-2",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn("-mx-1 my-1 h-px bg-line", className)} />;
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("label-cap px-2.5 pt-1.5 pb-1", className)}>{children}</div>;
}

/** A group of menu items of which exactly one is chosen: the screen reader hears which. */
export const DropdownMenuRadioGroup = Menu.RadioGroup;

/** One choice in a `DropdownMenuRadioGroup`. Choosing it closes the menu, as an ordinary item does. */
export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      closeOnClick
      className={cn(
        "group flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-control text-fg outline-none",
        "transition-colors duration-(--dur-1) data-highlighted:bg-surface-2 hover:bg-surface-2",
        "data-disabled:pointer-events-none data-disabled:opacity-45",
        className,
      )}
      {...props}
    >
      {children}
    </Menu.RadioItem>
  );
}
