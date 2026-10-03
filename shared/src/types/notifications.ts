import { z } from "zod";

/** What the signed-in person has starred (brief 05). */
export interface FavoritesDto {
  places: string[];
  events: string[];
}

export type NotificationKind = "new-event" | "reminder";

/** One inbox item: a coalesced "new at a place you follow", or a day-before reminder. */
export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  createdAt: string;
  readAt: string | null;
  place: { id: string; name: string } | null;
  /** The events it is about: several for a coalesced new-event item, one for a reminder. */
  events: { id: string; title: string; startDate: string }[];
}

export interface InboxDto {
  unread: number;
  data: NotificationDto[];
}

export const markReadSchema = z.union([
  z.object({ ids: z.array(z.string().min(1)).min(1).max(200) }),
  z.object({ all: z.literal(true) }),
]);
export type MarkReadInput = z.infer<typeof markReadSchema>;
