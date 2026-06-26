import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchEvents, type EventsQuery } from "~/lib/api";

export function useEvents(query: EventsQuery) {
  const { data, isPending, error } = useQuery({
    queryKey: ["events", query],
    queryFn: ({ signal }) => fetchEvents(query, signal),
    placeholderData: keepPreviousData,
  });

  return {
    events: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isPending,
    error: error ? (error as Error).message : null,
  };
}
