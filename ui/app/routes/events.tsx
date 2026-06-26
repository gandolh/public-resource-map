import { useState } from "react";
import type { MetaFunction } from "react-router";
import { EventCard, EventCardSkeleton } from "~/components/ui/EventCard";
import { Pagination } from "~/components/ui/Pagination";
import { FilterChip } from "~/components/ui/FilterChip";
import { useEvents } from "~/hooks/useEvents";
import { useUserLocation } from "~/hooks/useUserLocation";
import type { EventCategory } from "@public-resource-map/shared";

export const meta: MetaFunction = () => [
  { title: "Events — CivicMap" },
  { name: "description", content: "Find upcoming events near you" },
];

const EVENT_CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: "concert", label: "Concerts" },
  { value: "festival", label: "Festivals" },
  { value: "theater", label: "Theater" },
  { value: "sport", label: "Sport" },
  { value: "workshop", label: "Workshops" },
  { value: "community", label: "Community" },
  { value: "exhibition", label: "Exhibitions" },
  { value: "other", label: "Other" },
];

const PAGE_SIZE = 12;

export default function EventsPage() {
  const { center } = useUserLocation();

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<EventCategory | undefined>();

  const { events, total, loading } = useEvents({
    lat: center.lat,
    lng: center.lng,
    category,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24 pb-24 md:pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="hidden md:block text-4xl font-bold tracking-tight text-cm-on-surface mb-1">
          Upcoming Events
        </h1>
        <h1 className="md:hidden text-2xl font-semibold text-cm-on-surface mb-1">
          Upcoming Events
        </h1>
        {total > 0 && (
          <p className="text-sm text-cm-on-surface-variant">{total} events nearby</p>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <FilterChip
          pressed={category === undefined}
          onPressedChange={() => { setCategory(undefined); setPage(1); }}
        >
          All
        </FilterChip>
        {EVENT_CATEGORIES.map((cat) => (
          <FilterChip
            key={cat.value}
            pressed={category === cat.value}
            onPressedChange={() => {
              setCategory(cat.value === category ? undefined : cat.value);
              setPage(1);
            }}
          >
            {cat.label}
          </FilterChip>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="mt-10"
      />
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-cm-surface-container-high flex items-center justify-center mb-4">
        <span className="text-2xl">🗓️</span>
      </div>
      <h3 className="text-lg font-semibold text-cm-on-surface mb-2">No events found</h3>
      <p className="text-sm text-cm-on-surface-variant leading-relaxed max-w-sm w-full">
        Try changing your category filter or expand your search area on the map.
      </p>
    </div>
  );
}
