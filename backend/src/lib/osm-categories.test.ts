import { describe, expect, it } from "vitest";
import {
  CATEGORY_RULES,
  OVERPASS_TAG_FILTERS,
  mapTagsToCategory,
} from "./osm-categories.js";

describe("mapTagsToCategory (OSM tag → PlaceCategory)", () => {
  it("maps the documented common civic/cultural tags", () => {
    expect(mapTagsToCategory({ amenity: "library" })).toBe("library");
    expect(mapTagsToCategory({ leisure: "park" })).toBe("park");
    expect(mapTagsToCategory({ amenity: "clinic" })).toBe("clinic");
    expect(mapTagsToCategory({ amenity: "hospital" })).toBe("clinic");
    expect(mapTagsToCategory({ healthcare: "centre" })).toBe("clinic");
    expect(mapTagsToCategory({ amenity: "townhall" })).toBe("townhall");
    expect(mapTagsToCategory({ tourism: "museum" })).toBe("museum");
    expect(mapTagsToCategory({ amenity: "theatre" })).toBe("theater");
    expect(mapTagsToCategory({ amenity: "arts_centre" })).toBe("cultural_center");
    expect(mapTagsToCategory({ amenity: "community_centre" })).toBe(
      "community_center",
    );
    expect(mapTagsToCategory({ amenity: "school" })).toBe("education");
    expect(mapTagsToCategory({ leisure: "sports_centre" })).toBe("sports");
    expect(mapTagsToCategory({ sport: "tennis" })).toBe("sports");
  });

  it("buckets unmapped tags into `other` (visible, not dropped)", () => {
    expect(mapTagsToCategory({ amenity: "fast_food" })).toBe("other");
    expect(mapTagsToCategory({ shop: "bakery" })).toBe("other");
    expect(mapTagsToCategory({})).toBe("other");
  });

  it("is deterministic (first-match-wins) for multi-tagged features", () => {
    // museum rule precedes arts_centre in the priority list
    expect(
      mapTagsToCategory({ tourism: "museum", amenity: "arts_centre" }),
    ).toBe("museum");
    // library rule precedes the generic healthcare rule
    expect(mapTagsToCategory({ amenity: "library", healthcare: "yes" })).toBe(
      "library",
    );
  });

  it("imports public healthcare only, not pharmacies or private practices", () => {
    // The bare key fetched every `healthcare=*` element (brief 25).
    expect(OVERPASS_TAG_FILTERS).not.toContain('["healthcare"]');
    expect(mapTagsToCategory({ healthcare: "hospital" })).toBe("clinic");
    expect(mapTagsToCategory({ healthcare: "clinic" })).toBe("clinic");
    // If one arrives anyway (via another tag), it is not called a clinic.
    expect(mapTagsToCategory({ amenity: "pharmacy", healthcare: "pharmacy" })).toBe("other");
    expect(mapTagsToCategory({ healthcare: "dentist" })).toBe("other");
  });

  it("keeps the Overpass filters in sync with the rule list", () => {
    expect(OVERPASS_TAG_FILTERS).toHaveLength(CATEGORY_RULES.length);
    expect(OVERPASS_TAG_FILTERS).toContain('["amenity"="library"]');
    expect(OVERPASS_TAG_FILTERS).toContain('["healthcare"~"^(hospital|clinic|centre)$"]');
    expect(OVERPASS_TAG_FILTERS).toContain(
      '["amenity"~"^(clinic|hospital|doctors)$"]',
    );
  });
});
