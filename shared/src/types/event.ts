import { z } from "zod";
import { coordinatesSchema } from "./common.js";

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

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: eventCategorySchema,
  address: z.string(),
  coordinates: coordinatesSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
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
  title: z.string().min(1),
  description: z.string().optional(),
  category: eventCategorySchema,
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
  sourcePlatform: z.string().optional(),
  imageUrl: z.string().url().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
