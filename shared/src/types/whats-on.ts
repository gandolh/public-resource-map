import { z } from "zod";
import { eventSchema } from "./event.js";
import { placeCategorySchema } from "./place.js";
import { coordinatesSchema } from "./common.js";

/**
 * The slice of a place a what's-on row needs to render and to link back to the
 * map. Deliberately not the full `Place` — the list is date-first, and sending
 * opening hours and OSM ids for every row would be waste.
 */
export const whatsOnPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: placeCategorySchema,
  address: z.string().nullable(),
  city: z.string(),
  coordinates: coordinatesSchema,
});

export type WhatsOnPlace = z.infer<typeof whatsOnPlaceSchema>;

/**
 * One row of the citywide index: an event plus the place it happens at. Every
 * row links back to its place on the map — the list is a second lens on the
 * same data, never a separate model.
 */
export const whatsOnItemSchema = z.object({
  event: eventSchema,
  place: whatsOnPlaceSchema,
});

export type WhatsOnItem = z.infer<typeof whatsOnItemSchema>;
