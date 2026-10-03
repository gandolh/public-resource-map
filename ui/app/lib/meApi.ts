import type { FavoritesDto, InboxDto, MarkReadInput, PaginatedResponse, WhatsOnItem } from "@public-resource-map/shared";
import { ApiRequestError } from "~/lib/api";

/** The signed-in person's favourites and inbox (brief 05). Same origin, so Ward's cookie rides along. */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type FavoriteKind = "place" | "event";

async function send<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new ApiRequestError(res.status, `Request failed (${res.status})`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const path = (kind: FavoriteKind, id: string) =>
  `/api/favorites/${kind === "place" ? "places" : "events"}/${encodeURIComponent(id)}`;

export const meApi = {
  favorites: () => send<FavoritesDto>("GET", "/api/favorites"),
  addFavorite: (kind: FavoriteKind, id: string) => send<void>("POST", path(kind, id)),
  removeFavorite: (kind: FavoriteKind, id: string) => send<void>("DELETE", path(kind, id)),
  inbox: () => send<InboxDto>("GET", "/api/notifications"),
  markRead: (input: MarkReadInput) => send<{ read: number }>("POST", "/api/notifications/read", input),
  /** Your past events: saved ones, and those at places you follow (brief 14). */
  myArchive: (categories: string[], page: number) =>
    send<PaginatedResponse<WhatsOnItem>>(
      "GET",
      `/api/archive/mine?pageSize=30&page=${page}${categories.length ? `&category=${encodeURIComponent(categories.join(","))}` : ""}`,
    ),
};
