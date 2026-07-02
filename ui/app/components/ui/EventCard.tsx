import { Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { CategoryBadge } from "./CategoryBadge";
import type { Event } from "@public-resource-map/shared";

interface EventCardProps {
  event: Event;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="group bg-cm-surface rounded-xl overflow-hidden border border-cm-outline-variant shadow-sm flex flex-col cursor-pointer transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_15px_rgba(0,0,0,0.08)]">
      <div className="relative h-48 w-full bg-cm-surface-container-high">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cm-on-surface-variant/30">
            <Calendar size={40} />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <CategoryBadge category={event.category} />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-semibold text-cm-on-surface leading-tight mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div className="flex items-center gap-1.5 text-sm text-cm-on-surface-variant mb-4">
          <Calendar size={14} className="flex-shrink-0" />
          <span>{formatDate(event.startDate)}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-cm-surface-variant flex justify-between items-center">
          <span className="text-sm font-semibold text-cm-secondary">
            {event.price == null || event.price === 0
              ? "Free"
              : `${event.currency ?? "$"}${event.price}`}
          </span>
          <ArrowRight size={18} className="text-cm-primary group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

interface EventCardSkeletonProps {}

export function EventCardSkeleton(_props: EventCardSkeletonProps) {
  return (
    <div className="bg-cm-surface rounded-xl overflow-hidden border border-cm-outline-variant shadow-sm flex flex-col animate-pulse">
      <div className="h-48 bg-cm-surface-container-high" />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-4 bg-cm-surface-container-high rounded w-3/4" />
        <div className="h-3 bg-cm-surface-container-high rounded w-1/2" />
        <div className="h-3 bg-cm-surface-container-high rounded w-2/3" />
      </div>
    </div>
  );
}
