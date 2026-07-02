import { z } from "zod";

export const eventCategories = [
  "concert",
  "theater",
  "sport",
  "community",
  "festival",
  "exhibition",
  "workshop",
  "other",
] as const;

export const eventCategorySchema = z.enum(eventCategories);
export type EventCategory = z.infer<typeof eventCategorySchema>;

export const eventStatuses = ["live", "stale", "ended", "past"] as const;
export const eventStatusSchema = z.enum(eventStatuses);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventSchema = z.object({
  id: z.string(),
  placeId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: eventCategorySchema,
  status: eventStatusSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  buyUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  sourcePlatform: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price: z.number().nullable(),
  currency: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Event = z.infer<typeof eventSchema>;

export const createEventSchema = z.object({
  placeId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: eventCategorySchema,
  status: eventStatusSchema.default("live"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  buyUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  sourcePlatform: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
