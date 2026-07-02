import type { PlaceCategory } from "@public-resource-map/shared";

export type OsmTags = Record<string, string>;

/**
 * Priority-ordered, first-match-wins rule list mapping OSM tags onto a single
 * `PlaceCategory`. Deterministic for multi-tagged features (a feature that is
 * both `tourism=museum` and `amenity=arts_centre` resolves to the first rule
 * that matches). Anything that matches no rule buckets into `other` (visible,
 * not dropped) so coverage gaps surface. Keep this in sync with
 * `OVERPASS_TAG_FILTERS` below — the Overpass query must fetch exactly the tags
 * this list knows how to categorise.
 */
export interface CategoryRule {
  key: string;
  /** If present, tag value must be one of these; otherwise any value matches. */
  values?: string[];
  category: PlaceCategory;
}

export const CATEGORY_RULES: CategoryRule[] = [
  { key: "amenity", values: ["library"], category: "library" },
  { key: "amenity", values: ["clinic", "hospital", "doctors"], category: "clinic" },
  { key: "healthcare", category: "clinic" },
  { key: "amenity", values: ["townhall"], category: "townhall" },
  { key: "tourism", values: ["museum"], category: "museum" },
  { key: "amenity", values: ["theatre"], category: "theater" },
  { key: "amenity", values: ["arts_centre"], category: "cultural_center" },
  { key: "amenity", values: ["community_centre"], category: "community_center" },
  {
    key: "amenity",
    values: ["school", "university", "college", "kindergarten"],
    category: "education",
  },
  { key: "leisure", values: ["park"], category: "park" },
  {
    key: "leisure",
    values: ["sports_centre", "stadium", "pitch"],
    category: "sports",
  },
  { key: "sport", category: "sports" },
];

/** Map a feature's OSM tags to its single PlaceCategory (unmapped → `other`). */
export function mapTagsToCategory(tags: OsmTags): PlaceCategory {
  for (const rule of CATEGORY_RULES) {
    const value = tags[rule.key];
    if (value === undefined) continue;
    if (rule.values && !rule.values.includes(value)) continue;
    return rule.category;
  }
  return "other";
}

/**
 * Overpass tag selectors, derived from CATEGORY_RULES so the query and the
 * category map cannot drift apart. Used by `buildOverpassQuery`.
 */
export const OVERPASS_TAG_FILTERS: string[] = CATEGORY_RULES.map((rule) => {
  if (!rule.values) return `["${rule.key}"]`;
  if (rule.values.length === 1) return `["${rule.key}"="${rule.values[0]}"]`;
  return `["${rule.key}"~"^(${rule.values.join("|")})$"]`;
});
