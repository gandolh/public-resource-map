import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import type { FavoritesDto } from "@public-resource-map/shared";
import { meApi, type FavoriteKind } from "~/lib/meApi";
import { useAuthStore } from "~/stores/authStore";

const FAVORITES = ["me", "favorites"] as const;
const INBOX = ["me", "inbox"] as const;

const useSignedIn = () => useAuthStore((s) => s.status === "authenticated" && s.user !== null);

export function useFavorites() {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: FAVORITES, queryFn: meApi.favorites, enabled: signedIn });
}

/** Star or unstar, shown at once and rolled back if the server says no. */
export function useToggleFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, id, on }: { kind: FavoriteKind; id: string; on: boolean }) =>
      on ? meApi.addFavorite(kind, id) : meApi.removeFavorite(kind, id),
    onMutate: async ({ kind, id, on }) => {
      await client.cancelQueries({ queryKey: FAVORITES });
      const before = client.getQueryData<FavoritesDto>(FAVORITES);
      const key = kind === "place" ? "places" : "events";
      client.setQueryData<FavoritesDto>(FAVORITES, (prev) => {
        const current = prev ?? { places: [], events: [] };
        const list = current[key].filter((x) => x !== id);
        return { ...current, [key]: on ? [...list, id] : list };
      });
      return { before };
    },
    onError: (_err, _vars, context) => client.setQueryData(FAVORITES, context?.before),
    onSettled: () => client.invalidateQueries({ queryKey: FAVORITES }),
  });
}

/** The inbox, checked once a minute while signed in. */
export function useInbox() {
  const signedIn = useSignedIn();
  return useQuery({ queryKey: INBOX, queryFn: meApi.inbox, enabled: signedIn, refetchInterval: 60_000 });
}

export function useMarkAllRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => meApi.markRead({ all: true }),
    onSettled: () => client.invalidateQueries({ queryKey: INBOX }),
  });
}

/** The query parameter a signed-out star click carries through Ward's sign-in. */
export const PENDING_FAVORITE = "favorite";

/**
 * Finish the favourite somebody asked for before signing in (decisions.md:
 * favourite-while-logged-out = contextual sign-in, then complete the
 * favourite). The star sends them to Ward with `?favorite=place:<id>`; when they
 * come back signed in, this adds it and takes the parameter off the URL.
 */
export function usePendingFavorite() {
  const signedIn = useSignedIn();
  const [params, setParams] = useSearchParams();
  const toggle = useToggleFavorite();
  const pending = params.get(PENDING_FAVORITE);
  const { mutate } = toggle;

  useEffect(() => {
    if (!signedIn || !pending) return;
    const [kind, id] = pending.split(":");
    if ((kind === "place" || kind === "event") && id) mutate({ kind, id, on: true });
    const next = new URLSearchParams(params);
    next.delete(PENDING_FAVORITE);
    setParams(next, { replace: true });
  }, [signedIn, pending, params, setParams, mutate]);
}
