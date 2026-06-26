import { z } from "zod";
import { coordinatesSchema } from "./common.js";

export const resourceCategories = [
  "park",
  "library",
  "community_center",
  "healthcare",
  "education",
  "food",
  "shelter",
  "transport",
  "other",
] as const;

export const resourceCategorySchema = z.enum(resourceCategories);
export type ResourceCategory = z.infer<typeof resourceCategorySchema>;

export const resourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: resourceCategorySchema,
  address: z.string(),
  coordinates: coordinatesSchema,
  website: z.string().nullable(),
  phone: z.string().nullable(),
  openingHours: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Resource = z.infer<typeof resourceSchema>;

export const createResourceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: resourceCategorySchema,
  address: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  website: z.string().url().optional(),
  phone: z.string().optional(),
  openingHours: z.string().optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
