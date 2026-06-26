import { Input } from "@base-ui/react/input";
import { Search } from "lucide-react";
import { cn } from "~/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface SearchInputProps extends ComponentPropsWithoutRef<typeof Input> {
  containerClassName?: string;
}

export function SearchInput({ containerClassName, className, ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 h-12 px-4 rounded-full bg-cm-surface border border-cm-outline-variant shadow-[0_4px_6px_rgba(0,0,0,0.05)]",
        containerClassName,
      )}
    >
      <Search size={18} className="text-cm-outline flex-shrink-0" />
      <Input
        className={cn(
          "flex-1 bg-transparent border-none outline-none text-sm text-cm-on-surface placeholder:text-cm-outline focus:ring-0 p-0",
          className,
        )}
        {...props}
      />
    </div>
  );
}
