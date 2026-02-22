"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useApp } from "@/lib/app-context"
import { geocodeReverse, getCommute, getWalkRoute } from "@/lib/api"

/** Emoji div-icon factory */
function emojiIcon(emoji: string, size = 24) {
  return L.divIcon({
    html: `<span style="font-size:${size}px;line-height:1">${emoji}</span>`,
    className: "emoji-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

/** Per-amenity emoji map */
const AMENITY_EMOJI: Record<string, string> = {
  park: "🌳",
  path: "🥾",
  beach: "🏖️",
  dog_park: "🐕",
  gym: "🏋️",
  yoga: "🧘",
  swimming_pool: "🏊",
  restaurant: "🍽️",
  cafe: "☕",
  coffee: "☕",
  bar: "🍺",
  bakery: "🥐",
  grocery: "🛒",
  supermarket: "🛒",
  pharmacy: "💊",
  mall: "🏬",
  school: "🏫",
  library: "📚",
  kindergarten: "👶",
  hospital: "🏥",
  bank: "🏦",
  bus_station: "🚌",
  museum: "🏛️",
}

export default function LeafletMap() {
  const mapRef = useRef<L.Map | null>(null)
  const layersRef = useRef<L.LayerGroup>(L.layerGroup())
  const {
    home,
    work,
    walkRoute,
    commute,
    amenityResults,
    activeLocationType,
    setActiveLocationType,
    commuteMode,
    setHome,
    setWork,
    setCommute,
    setWalkRoute,
    setLoading,
  } = useApp()

  /* ---- handle map click → set home or work ---- */
  const stateRef = useRef({ home, work, activeLocationType, commuteMode })
  stateRef.current = { home, work, activeLocationType, commuteMode }

  const handleMapClick = useCallback(async (e: L.LeafletMouseEvent) => {
    const { lat, lng } = e.latlng
    const { activeLocationType: locType, commuteMode: mode } = stateRef.current

    // Reverse-geocode to get a display name
    let displayName = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    try {
      const rev = await geocodeReverse(lat, lng)
      displayName = rev.display_name
    } catch { /* use coords */ }

    const geo = { lat, lng, display_name: displayName }

    let newHome = stateRef.current.home
    let newWork = stateRef.current.work

    if (locType === "home") {
      setHome(geo)
      newHome = geo
      // Auto-advance to work after setting home
      setActiveLocationType("work")
    } else {
      setWork(geo)
      newWork = geo
    }

    // Auto-compute route when both are set
    if (newHome && newWork) {
      setLoading("commute", true)
      try {
        if (mode === "transit") {
          const result = await getCommute(
            { lat: newHome.lat, lng: newHome.lng },
            { lat: newWork.lat, lng: newWork.lng },
          )
          setCommute(result)
          setWalkRoute(null)
        } else {
          const walk = await getWalkRoute(
            { lat: newHome.lat, lng: newHome.lng },
            { lat: newWork.lat, lng: newWork.lng },
          )
          setWalkRoute(walk)
          setCommute(null)
        }
      } catch (err) {
        console.warn("Route computation failed:", err)
      } finally {
        setLoading("commute", false)
      }
    }
  }, [setHome, setWork, setActiveLocationType, setCommute, setWalkRoute, setLoading])

  /* ---- initialise map once ---- */
  useEffect(() => {
    if (mapRef.current) return
    const map = L.map("leaflet-map", {
      center: [41.826, -71.403], // Providence default
      zoom: 13,
      zoomControl: true,
    })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map)
    layersRef.current.addTo(map)
    map.on("click", handleMapClick)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [handleMapClick])

  /* ---- redraw layers when data changes ---- */
  useEffect(() => {
    const layers = layersRef.current
    layers.clearLayers()
    const map = mapRef.current
    if (!map) return

    const bounds: L.LatLngExpression[] = []

    // Home marker
    if (home) {
      L.marker([home.lat, home.lng], { icon: emojiIcon("🏠") }).addTo(layers)
        .bindPopup(`<b>Home</b><br/>${home.display_name}`)
      bounds.push([home.lat, home.lng])
    }

    // Work marker
    if (work) {
      L.marker([work.lat, work.lng], { icon: emojiIcon("💼") }).addTo(layers)
        .bindPopup(`<b>Work</b><br/>${work.display_name}`)
      bounds.push([work.lat, work.lng])
    }

    // Walk route (blue polyline)
    if (walkRoute?.geometry?.length) {
      L.polyline(walkRoute.geometry as L.LatLngExpression[], {
        color: "#3b82f6",
        weight: 4,
        opacity: 0.8,
      }).addTo(layers)
    }

    // Transit commute
    if (commute && commute.mode === "transit") {
      // Home → transit walk (green)
      if (commute.home_to_transit?.geometry?.length) {
        L.polyline(commute.home_to_transit.geometry as L.LatLngExpression[], {
          color: "#22c55e",
          weight: 4,
        }).addTo(layers)
        const stop = commute.home_to_transit
        const g = stop.geometry
        L.marker(g[g.length - 1] as L.LatLngExpression, { icon: emojiIcon("🚏") })
          .addTo(layers)
          .bindPopup(`<b>${stop.stop_name}</b>`)
      }

      // Transit legs (colored by line)
      commute.transit_legs?.forEach((leg) => {
        if (leg.geometry?.length) {
          L.polyline(leg.geometry as L.LatLngExpression[], {
            color: leg.color ? `#${leg.color}` : "#f59e0b",
            weight: 5,
            opacity: 0.9,
          }).addTo(layers)
        }
      })

      // Transfer walks (dashed blue)
      commute.transfer_walks?.forEach((tw) => {
        if (tw.geometry?.length) {
          L.polyline(tw.geometry as L.LatLngExpression[], {
            color: "#3b82f6",
            weight: 3,
            dashArray: "6,8",
          }).addTo(layers)
        }
      })

      // Transit → work walk (orange)
      if (commute.transit_to_work?.geometry?.length) {
        L.polyline(commute.transit_to_work.geometry as L.LatLngExpression[], {
          color: "#f97316",
          weight: 4,
        }).addTo(layers)
        const stop = commute.transit_to_work
        L.marker(stop.geometry[0] as L.LatLngExpression, { icon: emojiIcon("🚏") })
          .addTo(layers)
          .bindPopup(`<b>${stop.stop_name}</b>`)
      }
    } else if (commute && commute.mode === "direct_walk") {
      // Entire walk route
      if (commute.home_to_transit?.geometry?.length) {
        L.polyline(commute.home_to_transit.geometry as L.LatLngExpression[], {
          color: "#3b82f6",
          weight: 4,
        }).addTo(layers)
      }
    }

    // Amenity markers — per-type emoji
    amenityResults.forEach((a) => {
      const emoji = AMENITY_EMOJI[a.amenity_type] ?? "📍"
      L.marker([a.lat, a.lng], { icon: emojiIcon(emoji, 28) })
        .addTo(layers)
        .bindPopup(`<b>${a.name}</b><br/>${a.amenity_type} · ${Math.round(a.distance_m)}m`)
      bounds.push([a.lat, a.lng])
    })

    // Fit bounds
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]).pad(0.1))
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngTuple, 14)
    }
  }, [home, work, walkRoute, commute, amenityResults])

  return (
    <div
      id="leaflet-map"
      className="h-full w-full rounded-2xl"
      style={{ minHeight: 400 }}
    />
  )
}
