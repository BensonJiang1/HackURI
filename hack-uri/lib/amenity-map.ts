/**
 * Amenity picker IDs now directly match backend AMENITY_TAG_MAP keys.
 * This map is kept for backwards compatibility but is now an identity map.
 */
export const AMENITY_ID_TO_BACKEND: Record<string, string> = {
  park: "park",
  path: "path",
  beach: "beach",
  dog_park: "dog_park",
  gym: "gym",
  yoga: "yoga",
  swimming_pool: "swimming_pool",
  restaurant: "restaurant",
  cafe: "cafe",
  coffee: "coffee",
  bar: "bar",
  bakery: "bakery",
  grocery: "grocery",
  supermarket: "supermarket",
  pharmacy: "pharmacy",
  mall: "mall",
  school: "school",
  library: "library",
  kindergarten: "kindergarten",
  hospital: "hospital",
  bank: "bank",
  bus_station: "bus_station",
  museum: "museum",
}

/** Convert selected frontend IDs to backend amenity types. */
export function mapAmenitiesToBackend(ids: string[]): string[] {
  return ids.map((id) => AMENITY_ID_TO_BACKEND[id] ?? id)
}
