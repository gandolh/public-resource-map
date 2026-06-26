import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { cn } from "~/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
}

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      className={cn(
        "relative flex w-8 h-8 shrink-0 overflow-hidden rounded-full",
        className,
      )}
    >
      <BaseAvatar.Image
        src={src}
        alt={alt}
        className="aspect-square w-full h-full object-cover"
      />
      <BaseAvatar.Fallback
        className="flex w-full h-full items-center justify-center rounded-full bg-cm-surface-container-high text-cm-on-surface-variant text-sm font-medium"
      >
        {fallback ?? (alt ? alt[0]?.toUpperCase() : "?")}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
