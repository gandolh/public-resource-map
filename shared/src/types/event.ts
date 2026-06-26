import type { Coordinates } from "./common.js";

export type EventCategory =
  | "concert"
  | "theater"
  | "sport"
  | "community"
  | "festival"
  | "exhibition"
  | "workshop"
  | "other";

export interface Event {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  address: string;
  coordinates: Coordinates;
  startDate: string;
  endDate: string | null;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  address: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate?: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
}
