/**
 * Amenities service — Overpass (OSM) nearby POI search.
 */

import { config } from "./config"

/* ---- Overpass throttle ---- */
let lastOverpassTime = 0
const OVERPASS_MIN_INTERVAL = 3000 // ms — Overpass public API needs generous spacing

async function throttleOverpass() {
  const elapsed = Date.now() - lastOverpassTime
  if (elapsed < OVERPASS_MIN_INTERVAL) {
    await new Promise<void>((r) => setTimeout(r, OVERPASS_MIN_INTERVAL - elapsed))
  }
  lastOverpassTime = Date.now()
}

/* ---- Overpass mirrors (fallback on repeated failures) ---- */
const OVERPASS_MIRRORS = [
  config.OVERPASS_BASE_URL,
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

/* ---- Amenity tag map ---- */
type TagGroups = string[][]

const AMENITY_TAG_MAP: Record<string, TagGroups> = {
  gym:           [['"leisure"="fitness_centre"']],
  fitness:       [['"leisure"="fitness_centre"']],
  cafe:          [['"amenity"="cafe"']],
  coffee:        [['"amenity"="cafe"', '"cuisine"="coffee_shop"']],
  "coffee shop": [['"amenity"="cafe"', '"cuisine"="coffee_shop"']],
  restaurant:    [['"amenity"="restaurant"']],
  supermarket:   [['"shop"="supermarket"']],
  grocery:       [['"shop"="supermarket"'], ['"shop"="convenience"']],
  "grocery store": [['"shop"="supermarket"'], ['"shop"="convenience"']],
  pharmacy:      [['"amenity"="pharmacy"']],
  park:          [['"leisure"="park"']],
  library:       [['"amenity"="library"']],
  bar:           [['"amenity"="bar"']],
  bank:          [['"amenity"="bank"']],
  hospital:      [['"amenity"="hospital"']],
  school:        [['"amenity"="school"']],
  bakery:        [['"shop"="bakery"']],
  path:          [['"highway"="path"']],
  beach:         [['"natural"="beach"']],
  dog_park:      [['"leisure"="dog_park"']],
  yoga:          [['"leisure"="fitness_centre"', '"sport"="yoga"']],
  swimming_pool: [['"leisure"="swimming_pool"']],
  kindergarten:  [['"amenity"="kindergarten"']],
  mall:          [['"shop"="mall"'], ['"shop"="department_store"']],
  bus_station:   [['"amenity"="bus_station"'], ['"highway"="bus_stop"']],
  museum:        [['"tourism"="museum"']],
}

const EXCLUDE_KEYWORDS: Record<string, string[]> = {
  coffee:        ["dining hall", "canteen", "cafeteria", "food court", "food hall"],
  "coffee shop": ["dining hall", "canteen", "cafeteria", "food court", "food hall"],
  cafe:          ["dining hall", "canteen", "cafeteria"],
}

function resolveTag(amenityType: string): TagGroups {
  const key = amenityType.toLowerCase().trim()
  return AMENITY_TAG_MAP[key] ?? [[`"amenity"="${key}"`]]
}

export function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface AmenityResult {
  name: string
  lat: number
  lng: number
  amenity_type: string
  distance_m: number
}

export async function searchAmenities(
  lat: number, lng: number, amenityType: string, radiusM = 2500, limit = 5,
): Promise<AmenityResult[]> {
  const tagGroups = resolveTag(amenityType)

  const unionParts: string[] = []
  for (const group of tagGroups) {
    const tf = group.map((c) => `[${c}]`).join("")
    unionParts.push(`node${tf}(around:${radiusM},${lat},${lng});`)
    unionParts.push(`way${tf}(around:${radiusM},${lat},${lng});`)
  }

  const query = `
    [out:json][timeout:25];
    (
      ${unionParts.join("\n      ")}
    );
    out center body;
  `

  // Throttle + retry with back-off on 429/504, rotating through mirrors
  let resp: Response | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttleOverpass()
    const url = OVERPASS_MIRRORS[attempt % OVERPASS_MIRRORS.length]
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
      })
    } catch {
      console.warn(`[overpass] Network error on attempt ${attempt + 1} for "${amenityType}" via ${url}`)
      resp = null
    }
    if (!resp || resp.status === 429 || resp.status === 504) {
      const wait = OVERPASS_MIN_INTERVAL * (attempt + 2)
      console.warn(`[overpass] ${resp?.status ?? "ERR"} on attempt ${attempt + 1} for "${amenityType}" — trying next mirror in ${wait}ms`)
      await new Promise<void>((r) => setTimeout(r, wait))
      continue
    }
    break
  }
  if (!resp || !resp.ok) {
    const body = resp ? await resp.text().catch(() => "(no body)") : "(no response)"
    throw new Error(`Overpass ${resp?.status}: ${body}`)
  }

  const data = await resp.json()
  const elements: Array<Record<string, unknown>> = data.elements ?? []

  const excludes = EXCLUDE_KEYWORDS[amenityType.toLowerCase()] ?? []

  const results: AmenityResult[] = []
  for (const el of elements) {
    const elLat = (el.lat as number) ?? (el.center as Record<string, number>)?.lat
    const elLng = (el.lon as number) ?? (el.center as Record<string, number>)?.lon
    if (elLat == null || elLng == null) continue

    const name = ((el.tags as Record<string, string>)?.name) ?? "Unnamed"
    if (excludes.some((kw) => name.toLowerCase().includes(kw.toLowerCase()))) continue

    const dist = haversine(lat, lng, elLat, elLng)
    results.push({ name, lat: elLat, lng: elLng, amenity_type: amenityType, distance_m: Math.round(dist) })
  }

  results.sort((a, b) => a.distance_m - b.distance_m)
  return results.slice(0, limit)
}

export function getAmenityTypes(): string[] {
  return Object.keys(AMENITY_TAG_MAP).sort()
}
