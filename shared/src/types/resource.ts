import type { Coordinates } from "./common.js";

export type ResourceCategory =
  | "park"
  | "library"
  | "community_center"
  | "healthcare"
  | "education"
  | "food"
  | "shelter"
  | "transport"
  | "other";

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  category: ResourceCategory;
  address: string;
  coordinates: Coordinates;
  website: string | null;
  phone: string | null;
  openingHours: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceInput {
  name: string;
  description?: string;
  category: ResourceCategory;
  address: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  openingHours?: string;
}
