/** Geocoding service — Nominatim (OSM) forward & reverse geocoding. */

import { config } from "./config"

const USER_AGENT = "HackURI-WalkScore/1.0"

let lastRequestTime = 0

function throttle() {
  const elapsed = Date.now() - lastRequestTime
  if (elapsed < 1000) {
    return new Promise<void>((r) => setTimeout(r, 1000 - elapsed))
  }
  return Promise.resolve()
}

export async function geocodeForward(address: string) {
  await throttle()
  lastRequestTime = Date.now()

  const url = new URL(`${config.NOMINATIM_BASE_URL}/search`)
  url.searchParams.set("q", address)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const results = await res.json()
  if (!results.length) return null

  const hit = results[0]
  return {
    address,
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    display_name: hit.display_name ?? address,
  }
}

export async function reverseGeocode(lat: number, lng: number) {
  await throttle()
  lastRequestTime = Date.now()

  const url = new URL(`${config.NOMINATIM_BASE_URL}/reverse`)
  url.searchParams.set("lat", String(lat))
  url.searchParams.set("lon", String(lng))
  url.searchParams.set("format", "jsonv2")

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT },
  })
  if (!res.ok) throw new Error(`Nominatim reverse error: ${res.status}`)

  const data = await res.json()
  return {
    address: data.display_name ?? "",
    lat,
    lng,
    display_name: data.display_name ?? "",
  }
}
