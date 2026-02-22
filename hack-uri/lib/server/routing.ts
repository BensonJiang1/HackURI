/**
 * Routing service — walking directions.
 * Primary: OpenRouteService (foot-walking).
 * Fallback: OSRM car distance + estimated walk time at 5 km/h.
 */

import { config } from "./config"

export interface WalkRouteResult {
  distance_km: number
  duration_min: number
  geometry: [number, number][] // [lat, lng]
  source: string
}

export async function getWalkingRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<WalkRouteResult | null> {
  if (config.ORS_API_KEY) {
    return orsWalkingRoute(originLat, originLng, destLat, destLng)
  }
  return osrmEstimatedWalk(originLat, originLng, destLat, destLng)
}

async function orsWalkingRoute(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<WalkRouteResult | null> {
  const url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: config.ORS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates: [
        [originLng, originLat],
        [destLng, destLat],
      ],
    }),
  })

  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ORS error: ${res.status}`)

  const data = await res.json()
  const feature = data.features[0]
  const props = feature.properties.summary
  const coords: number[][] = feature.geometry.coordinates

  // Flip [lng, lat] → [lat, lng] for Leaflet
  const geometry: [number, number][] = coords.map(
    (pt: number[]) => [pt[1], pt[0]] as [number, number],
  )

  return {
    distance_km: Math.round((props.distance / 1000) * 100) / 100,
    duration_min: Math.round((props.duration / 60) * 10) / 10,
    geometry,
    source: "openrouteservice",
  }
}

async function osrmEstimatedWalk(
  originLat: number, originLng: number,
  destLat: number, destLng: number,
): Promise<WalkRouteResult | null> {
  const coords = `${originLng},${originLat};${destLng},${destLat}`
  const url = `${config.OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM error: ${res.status}`)

  const data = await res.json()
  if (data.code !== "Ok" || !data.routes?.length) return null

  const route = data.routes[0]
  const distanceM: number = route.distance
  const rawCoords: number[][] = route.geometry.coordinates

  const geometry: [number, number][] = rawCoords.map(
    (pt: number[]) => [pt[1], pt[0]] as [number, number],
  )

  const distanceKm = distanceM / 1000
  const durationMin = (distanceKm / config.WALKING_SPEED_KMH) * 60

  return {
    distance_km: Math.round(distanceKm * 100) / 100,
    duration_min: Math.round(durationMin * 10) / 10,
    geometry,
    source: "osrm_estimated",
  }
}
