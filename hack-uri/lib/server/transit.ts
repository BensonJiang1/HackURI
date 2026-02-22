/**
 * Transit service — Google Routes API transit routing + Overpass heuristic fallback.
 */

import { config } from "./config"
import { getWalkingRoute, type WalkRouteResult } from "./routing"

/* ---- Google Routes API ---- */

interface StepInfo {
  travelMode: string
  distance_m: number
  distance_km: number
  duration_s: number
  duration_min: number
  start: { lat: number; lng: number } | null
  end: { lat: number; lng: number } | null
  geometry?: [number, number][]
  transit_info?: TransitInfo
}

interface TransitInfo {
  departure_stop: string
  arrival_stop: string
  line_name: string
  line_short_name: string
  type: string
  agency: string
  headsign: string
  num_stops: number
}

interface WalkLeg {
  stop_name: string
  stop_type: string
  distance_km: number
  duration_min: number
  geometry: [number, number][]
}

export interface TransitResult {
  mode: "transit" | "direct_walk" | "walk_only"
  home_to_transit: WalkLeg | null
  transit_to_work: WalkLeg | null
  transfer_walks: WalkLeg[]
  total_walk_min: number
  total_walk_km: number
  total_duration_min?: number
  total_distance_km?: number
  walk_legs?: StepInfo[]
  transit_legs?: StepInfo[]
  direct_walk_min?: number
  direct_walk_km?: number
  source: string
}

/* ---- Polyline decoder ---- */

function decodePolyline(encoded: string): [number, number][] {
  const result: [number, number][] = []
  let index = 0, lat = 0, lng = 0

  while (index < encoded.length) {
    let shift = 0, value = 0, b: number
    do {
      b = encoded.charCodeAt(index++) - 63
      value |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lat += value & 1 ? ~(value >> 1) : value >> 1

    shift = 0; value = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      value |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    lng += value & 1 ? ~(value >> 1) : value >> 1

    result.push([lat / 1e5, lng / 1e5])
  }
  return result
}

/* ---- Helper utilities ---- */

function parseDuration(s: string | undefined): number {
  if (!s) return 0
  return parseFloat(s.replace("s", ""))
}

function extractLatLng(loc: Record<string, unknown> | undefined): { lat: number; lng: number } | null {
  if (!loc) return null
  const ll = loc.latLng as Record<string, number> | undefined
  if (!ll) return null
  return { lat: ll.latitude, lng: ll.longitude }
}

function getStopName(transitLegs: StepInfo[], index: number, which: "start" | "end"): string {
  if (!transitLegs.length) return "Transit stop"
  const leg = transitLegs.at(index)
  if (!leg?.transit_info) return "Transit stop"
  return which === "start" ? leg.transit_info.departure_stop : leg.transit_info.arrival_stop
}

function getTransitType(transitLegs: StepInfo[], index: number): string {
  const leg = transitLegs.at(index)
  return leg?.transit_info?.type ?? "transit"
}

function mergeWalkLegs(legs: StepInfo[], stopName: string, stopType: string): WalkLeg {
  const totalM = legs.reduce((s, l) => s + l.distance_m, 0)
  const totalS = legs.reduce((s, l) => s + l.duration_s, 0)
  const merged: [number, number][] = []
  for (const l of legs) {
    const geom = l.geometry ?? []
    const start = merged.length && geom.length && merged[merged.length - 1][0] === geom[0][0] && merged[merged.length - 1][1] === geom[0][1] ? 1 : 0
    merged.push(...geom.slice(start))
  }
  return {
    stop_name: stopName,
    stop_type: stopType,
    distance_km: Math.round((totalM / 1000) * 100) / 100,
    duration_min: Math.round((totalS / 60) * 10) / 10,
    geometry: merged,
  }
}

function parseTransitDetails(td: Record<string, unknown>): TransitInfo {
  const stopDetails = (td.stopDetails as Record<string, unknown>) ?? {}
  const departure = (stopDetails.departureStop as Record<string, string>) ?? {}
  const arrival = (stopDetails.arrivalStop as Record<string, string>) ?? {}
  const line = (td.transitLine as Record<string, unknown>) ?? {}
  const vehicle = (line.vehicle as Record<string, string>) ?? {}
  const agencies = (line.agencies as Array<Record<string, string>>) ?? []

  return {
    departure_stop: departure.name ?? "Unknown",
    arrival_stop: arrival.name ?? "Unknown",
    line_name: (line.name as string) ?? "",
    line_short_name: (line.nameShort as string) ?? "",
    type: (vehicle.type ?? "BUS").toLowerCase(),
    agency: agencies[0]?.name ?? "",
    headsign: (td.headsign as string) ?? "",
    num_stops: (td.stopCount as number) ?? 0,
  }
}

/* ---- Google Routes API transit routing ---- */

async function googleTransitRoute(
  homeLat: number, homeLng: number, workLat: number, workLng: number,
): Promise<TransitResult | null> {
  const apiKey = config.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const fieldMask = [
    "routes.legs.steps.travelMode",
    "routes.legs.steps.staticDuration",
    "routes.legs.steps.distanceMeters",
    "routes.legs.steps.startLocation",
    "routes.legs.steps.endLocation",
    "routes.legs.steps.transitDetails",
    "routes.legs.steps.polyline",
    "routes.legs.duration",
    "routes.legs.distanceMeters",
    "routes.legs.polyline",
    "routes.distanceMeters",
    "routes.duration",
    "routes.polyline",
  ].join(",")

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: homeLat, longitude: homeLng } } },
      destination: { location: { latLng: { latitude: workLat, longitude: workLng } } },
      travelMode: "TRANSIT",
      computeAlternativeRoutes: false,
    }),
  })

  if (!res.ok) throw new Error(`Google Routes API error: ${res.status}`)
  const data = await res.json()
  const routes = data.routes ?? []
  if (!routes.length) return null

  const route = routes[0]
  const leg = route.legs[0]
  const steps: Record<string, unknown>[] = leg.steps ?? []

  const allSteps: StepInfo[] = []
  const walkLegs: StepInfo[] = []
  const transitLegs: StepInfo[] = []

  for (const step of steps) {
    const mode = step.travelMode as string
    const durationS = parseDuration(step.staticDuration as string)
    const distM = (step.distanceMeters as number) ?? 0

    const info: StepInfo = {
      travelMode: mode,
      distance_m: distM,
      distance_km: Math.round((distM / 1000) * 100) / 100,
      duration_s: durationS,
      duration_min: Math.round((durationS / 60) * 10) / 10,
      start: extractLatLng(step.startLocation as Record<string, unknown>),
      end: extractLatLng(step.endLocation as Record<string, unknown>),
    }

    const polyline = (step.polyline as Record<string, string>)?.encodedPolyline
    if (polyline) info.geometry = decodePolyline(polyline)

    if (mode === "WALK") {
      walkLegs.push(info)
    } else if (mode === "TRANSIT") {
      info.transit_info = parseTransitDetails(step.transitDetails as Record<string, unknown> ?? {})
      transitLegs.push(info)
    }
    allSteps.push(info)
  }

  const totalWalkS = walkLegs.reduce((s, w) => s + w.duration_s, 0)
  const totalWalkM = walkLegs.reduce((s, w) => s + w.distance_m, 0)
  const totalDurS = parseDuration((leg.duration as string) ?? (route.duration as string))
  const totalDistM = (leg.distanceMeters as number) ?? (route.distanceMeters as number) ?? 0

  let homeToTransit: WalkLeg | null = null
  let transitToWork: WalkLeg | null = null
  let transferWalks: WalkLeg[] = []

  if (transitLegs.length) {
    const firstTI = allSteps.findIndex((s) => s.travelMode === "TRANSIT")
    const lastTI = allSteps.length - 1 - [...allSteps].reverse().findIndex((s) => s.travelMode === "TRANSIT")

    const preWalks = allSteps.slice(0, firstTI).filter((s) => s.travelMode === "WALK")
    if (preWalks.length) {
      homeToTransit = mergeWalkLegs(preWalks, getStopName(transitLegs, 0, "start"), getTransitType(transitLegs, 0))
    }

    const postWalks = allSteps.slice(lastTI + 1).filter((s) => s.travelMode === "WALK")
    if (postWalks.length) {
      transitToWork = mergeWalkLegs(postWalks, getStopName(transitLegs, -1, "end"), getTransitType(transitLegs, -1))
    }

    // Transfer walks between transit legs
    const transitIndices = allSteps.map((s, i) => s.travelMode === "TRANSIT" ? i : -1).filter((i) => i >= 0)
    for (let ti = 0; ti < transitIndices.length - 1; ti++) {
      const midWalks = allSteps.slice(transitIndices[ti] + 1, transitIndices[ti + 1]).filter((s) => s.travelMode === "WALK")
      if (midWalks.length) {
        const from = getStopName(transitLegs, ti, "end")
        const to = getStopName(transitLegs, ti + 1, "start")
        transferWalks.push(mergeWalkLegs(midWalks, `${from} → ${to}`, "transfer"))
      }
    }
  } else if (walkLegs.length) {
    homeToTransit = mergeWalkLegs(walkLegs, "Destination", "walk")
  }

  // Direct walk comparison
  const directWalk = await getWalkingRoute(homeLat, homeLng, workLat, workLng)
  const directWalkMin = directWalk?.duration_min
  const directWalkKm = directWalk?.distance_km

  const transitWalkMin = Math.round((totalWalkS / 60) * 10) / 10
  const totalTripMin = Math.round((totalDurS / 60) * 10) / 10

  // If walking directly is faster than the entire transit trip (including ride time,
  // wait time, transfers), return direct_walk — transit is pointless if it's slower.
  if (directWalk && transitLegs.length && directWalk.duration_min <= totalTripMin) {
    return {
      mode: "direct_walk",
      home_to_transit: null,
      transit_to_work: null,
      transfer_walks: [],
      total_walk_min: directWalk.duration_min,
      total_walk_km: directWalk.distance_km,
      total_duration_min: directWalk.duration_min,
      total_distance_km: directWalk.distance_km,
      direct_walk_min: directWalkMin,
      direct_walk_km: directWalkKm,
      source: "google_routes_api",
    }
  }

  return {
    mode: transitLegs.length ? "transit" : "direct_walk",
    home_to_transit: transitLegs.length ? homeToTransit : null,
    transit_to_work: transitLegs.length ? transitToWork : null,
    transfer_walks: transitLegs.length ? transferWalks : [],
    total_walk_min: transitWalkMin,
    total_walk_km: Math.round((totalWalkM / 1000) * 100) / 100,
    total_duration_min: Math.round((totalDurS / 60) * 10) / 10,
    total_distance_km: Math.round((totalDistM / 1000) * 100) / 100,
    walk_legs: walkLegs,
    transit_legs: transitLegs,
    direct_walk_min: directWalkMin,
    direct_walk_km: directWalkKm,
    source: "google_routes_api",
  }
}

/* ---- Overpass heuristic fallback ---- */

import { haversine } from "./amenities"

let lastOverpassTime = 0
const OVERPASS_MIN_INTERVAL = 2000

async function throttleOverpass() {
  const elapsed = Date.now() - lastOverpassTime
  if (elapsed < OVERPASS_MIN_INTERVAL) {
    await new Promise<void>((r) => setTimeout(r, OVERPASS_MIN_INTERVAL - elapsed))
  }
  lastOverpassTime = Date.now()
}

interface TransitStop {
  name: string
  lat: number
  lng: number
  type: string
  distance_m: number
}

export async function findNearestTransitStops(
  lat: number, lng: number, radiusM = 2000, limit = 5,
): Promise<TransitStop[]> {
  const query = `
    [out:json][timeout:10];
    (
      node["public_transport"="stop_position"](around:${radiusM},${lat},${lng});
      node["public_transport"="platform"](around:${radiusM},${lat},${lng});
      node["railway"="station"](around:${radiusM},${lat},${lng});
      node["railway"="halt"](around:${radiusM},${lat},${lng});
      node["railway"="tram_stop"](around:${radiusM},${lat},${lng});
      node["highway"="bus_stop"](around:${radiusM},${lat},${lng});
      node["amenity"="bus_station"](around:${radiusM},${lat},${lng});
      node["amenity"="ferry_terminal"](around:${radiusM},${lat},${lng});
    );
    out body;
  `

  let resp: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttleOverpass()
    resp = await fetch(config.OVERPASS_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    })
    if (resp.status === 429) {
      await new Promise<void>((r) => setTimeout(r, OVERPASS_MIN_INTERVAL * (attempt + 2)))
      continue
    }
    break
  }
  if (!resp || !resp.ok) throw new Error(`Overpass error: ${resp?.status}`)

  const data = await resp.json()
  const elements: Array<Record<string, unknown>> = data.elements ?? []

  const results: TransitStop[] = []
  const seen = new Set<string>()

  for (const el of elements) {
    const elLat = el.lat as number | undefined
    const elLng = el.lon as number | undefined
    if (elLat == null || elLng == null) continue

    const key = `${Math.round(elLat * 1e5)},${Math.round(elLng * 1e5)}`
    if (seen.has(key)) continue
    seen.add(key)

    const tags = (el.tags as Record<string, string>) ?? {}
    const name = tags.name ?? "Unnamed stop"

    let stopType = "bus_stop"
    if (tags.railway === "station" || tags.railway === "halt") stopType = "train_station"
    else if (tags.railway === "tram_stop") stopType = "tram_stop"
    else if (tags.amenity === "ferry_terminal") stopType = "ferry_terminal"

    results.push({ name, lat: elLat, lng: elLng, type: stopType, distance_m: Math.round(haversine(lat, lng, elLat, elLng)) })
  }

  results.sort((a, b) => a.distance_m - b.distance_m)
  return results.slice(0, limit)
}

async function overpassCommuteWalkLegs(
  homeLat: number, homeLng: number, workLat: number, workLng: number, transitRadiusM = 2000,
): Promise<TransitResult | null> {
  const direct = await getWalkingRoute(homeLat, homeLng, workLat, workLng)
  if (!direct) return null

  const homeStops = await findNearestTransitStops(homeLat, homeLng, transitRadiusM)
  const workStops = await findNearestTransitStops(workLat, workLng, transitRadiusM)

  if (!homeStops.length || !workStops.length) {
    return {
      mode: "direct_walk",
      home_to_transit: null, transit_to_work: null, transfer_walks: [],
      total_walk_min: direct.duration_min, total_walk_km: direct.distance_km,
      direct_walk_min: direct.duration_min, direct_walk_km: direct.distance_km,
      source: "overpass_heuristic",
    }
  }

  const homeStop = homeStops[0]
  const workStop = workStops[0]
  const leg1 = await getWalkingRoute(homeLat, homeLng, homeStop.lat, homeStop.lng)
  const leg2 = await getWalkingRoute(workStop.lat, workStop.lng, workLat, workLng)

  if (!leg1 || !leg2) {
    return {
      mode: "direct_walk",
      home_to_transit: null, transit_to_work: null, transfer_walks: [],
      total_walk_min: direct.duration_min, total_walk_km: direct.distance_km,
      direct_walk_min: direct.duration_min, direct_walk_km: direct.distance_km,
      source: "overpass_heuristic",
    }
  }

  const transitWalkMin = leg1.duration_min + leg2.duration_min
  const transitWalkKm = leg1.distance_km + leg2.distance_km

  if (direct.duration_min <= transitWalkMin) {
    return {
      mode: "direct_walk",
      home_to_transit: null, transit_to_work: null, transfer_walks: [],
      total_walk_min: direct.duration_min, total_walk_km: direct.distance_km,
      direct_walk_min: direct.duration_min, direct_walk_km: direct.distance_km,
      source: "overpass_heuristic",
    }
  }

  return {
    mode: "transit",
    home_to_transit: {
      stop_name: homeStop.name, stop_type: homeStop.type,
      distance_km: leg1.distance_km, duration_min: leg1.duration_min,
      geometry: leg1.geometry,
    },
    transit_to_work: {
      stop_name: workStop.name, stop_type: workStop.type,
      distance_km: leg2.distance_km, duration_min: leg2.duration_min,
      geometry: leg2.geometry,
    },
    transfer_walks: [],
    total_walk_min: Math.round(transitWalkMin * 10) / 10,
    total_walk_km: Math.round(transitWalkKm * 100) / 100,
    direct_walk_min: direct.duration_min, direct_walk_km: direct.distance_km,
    source: "overpass_heuristic",
  }
}

/* ---- Public API ---- */

export async function getCommuteWalkLegs(
  homeLat: number, homeLng: number, workLat: number, workLng: number,
  transitRadiusM = 2000,
): Promise<TransitResult | null> {
  // Try Google Routes API first
  if (config.GOOGLE_MAPS_API_KEY) {
    try {
      const result = await googleTransitRoute(homeLat, homeLng, workLat, workLng)
      if (result) return result
    } catch {
      console.warn("Google Routes API failed, falling back to Overpass")
    }
  }
  return overpassCommuteWalkLegs(homeLat, homeLng, workLat, workLng, transitRadiusM)
}
