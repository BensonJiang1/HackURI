/**
 * API client — typed wrappers for Next.js API route handlers.
 * All requests go to /api/* on the same origin (no separate backend needed).
 */

import type {
  GeoResult,
  WalkRoute,
  CommuteResult,
  AmenityResult,
  ScoreResult,
} from "./app-context"

const API_BASE = "/api"

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

/* ------------------------------------------------------------------ */
/*  Geocoding                                                          */
/* ------------------------------------------------------------------ */

export async function geocodeForward(address: string): Promise<GeoResult> {
  return post<GeoResult>("/geocode/forward", { address })
}

export async function geocodeReverse(lat: number, lng: number) {
  return post<{ address: string; display_name: string }>("/geocode/reverse", { lat, lng })
}

/* ------------------------------------------------------------------ */
/*  Routing                                                            */
/* ------------------------------------------------------------------ */

export async function getWalkRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<WalkRoute> {
  return post<WalkRoute>("/route/walk", { origin, destination })
}

export async function getCommute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<CommuteResult> {
  return post<CommuteResult>("/route/commute", { origin, destination })
}

/* ------------------------------------------------------------------ */
/*  Amenities                                                          */
/* ------------------------------------------------------------------ */

export async function searchAmenities(
  location: { lat: number; lng: number },
  amenity_type: string,
  radius_m = 2000,
): Promise<AmenityResult[]> {
  const data = await post<{ results: AmenityResult[] }>("/amenities/search", {
    location,
    amenity_type,
    radius_m,
  })
  return data.results
}

export async function getAmenityTypes(): Promise<string[]> {
  const data = await get<{ types: string[] }>("/amenities/types")
  return data.types
}

/* ------------------------------------------------------------------ */
/*  Score                                                              */
/* ------------------------------------------------------------------ */

export async function calculateScore(body: {
  home: { lat: number; lng: number }
  work?: { lat: number; lng: number }
  amenities?: Array<{ amenity_type: string; visits_per_week: number; nearest?: { lat: number; lng: number; name: string } }>
  work_days_per_week?: number
  commute_mode?: string
}): Promise<ScoreResult> {
  return post<ScoreResult>("/score/calculate", body)
}
