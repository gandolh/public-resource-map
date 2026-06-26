import { Menu } from "@base-ui/react/menu";
import { cn } from "~/lib/utils";
import type { ReactElement, ReactNode, ComponentPropsWithoutRef } from "react";

interface DropdownMenuProps {
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "end" | "center";
}

export function DropdownMenu({ trigger, children, align = "end" }: DropdownMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner align={align} sideOffset={6}>
          <Menu.Popup
            className={cn(
              "z-50 min-w-40 rounded-lg border border-cm-outline-variant bg-cm-surface shadow-[0_10px_15px_rgba(0,0,0,0.1)] p-1",
              "data-[starting-style]:opacity-0 data-[starting-style]:scale-95",
              "data-[ending-style]:opacity-0 data-[ending-style]:scale-95",
              "transition-[opacity,transform] duration-150",
            )}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function DropdownMenuItem({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm text-cm-on-surface rounded-md cursor-pointer",
        "hover:bg-cm-surface-container-high focus:bg-cm-surface-container-high outline-none",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
    </Menu.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <Menu.Separator className={cn("my-1 h-px bg-cm-outline-variant -mx-1", className)} />;
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-semibold text-cm-on-surface-variant uppercase tracking-wider", className)}>
      {children}
    </div>
  );
}
