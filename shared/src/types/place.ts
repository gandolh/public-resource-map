import { z } from "zod";
import { coordinatesSchema } from "./common.js";

export const placeCategories = [
  "park",
  "library",
  "clinic",
  "museum",
  "townhall",
  "community_center",
  "education",
  "theater",
  "sports",
  "cultural_center",
  "other",
] as const;

export const placeCategorySchema = z.enum(placeCategories);
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

export const placeSources = ["osm", "event-venue"] as const;
export const placeSourceSchema = z.enum(placeSources);
export type PlaceSource = z.infer<typeof placeSourceSchema>;

export const placeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: placeCategorySchema,
  source: placeSourceSchema,
  osmType: z.string().nullable(),
  osmId: z.string().nullable(),
  isManualPin: z.boolean(),
  address: z.string().nullable(),
  city: z.string(),
  coordinates: coordinatesSchema,
  website: z.string().nullable(),
  phone: z.string().nullable(),
  openingHours: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Place = z.infer<typeof placeSchema>;

export const createPlaceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: placeCategorySchema,
  source: placeSourceSchema.default("event-venue"),
  osmType: z.string().optional(),
  osmId: z.string().optional(),
  isManualPin: z.boolean().optional(),
  address: z.string().optional(),
  city: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
});

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
