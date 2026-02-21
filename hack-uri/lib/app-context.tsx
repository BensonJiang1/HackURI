"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LatLng {
  lat: number
  lng: number
}

export interface GeoResult {
  lat: number
  lng: number
  display_name: string
}

export interface WalkRoute {
  distance_km: number
  duration_min: number
  geometry: [number, number][] // [lat, lng]
  source: string
}

export interface TransitLeg {
  mode: string
  name?: string
  short_name?: string
  color?: string
  departure_stop?: string
  arrival_stop?: string
  num_stops?: number
  departure_time?: string
  arrival_time?: string
  geometry?: [number, number][]
}

export interface TransferWalk {
  from_stop: string
  to_stop: string
  distance_km: number
  duration_min: number
  geometry: [number, number][]
}

export interface CommuteResult {
  mode: "transit" | "direct_walk"
  home_to_transit: {
    stop_name: string
    stop_type: string
    distance_km: number
    duration_min: number
    geometry: [number, number][]
  } | null
  transit_to_work: {
    stop_name: string
    stop_type: string
    distance_km: number
    duration_min: number
    geometry: [number, number][]
  } | null
  transfer_walks?: TransferWalk[]
  transit_legs?: TransitLeg[]
  total_walk_min: number
  total_walk_km: number
  direct_walk_min?: number
  direct_walk_km?: number
  source: string
}

export interface AmenityResult {
  name: string
  lat: number
  lng: number
  amenity_type: string
  distance_m: number
}

export interface ScoreResult {
  total_weekly_walk_min: number
  total_weekly_calories: number
  who_guideline_pct: number
  grade: string
  breakdown: Array<{
    label: string
    distance_km: number
    one_way_min: number
    round_trips_per_week: number
    weekly_minutes: number
    commute_mode?: string
    commute_detail?: CommuteResult
    source?: string
  }>
}

/* ------------------------------------------------------------------ */
/*  Context value                                                      */
/* ------------------------------------------------------------------ */

export type LocationType = "home" | "work"
export type CommuteMode = "transit" | "walk"

interface AppState {
  // Locations
  home: GeoResult | null
  work: GeoResult | null
  setHome: (g: GeoResult | null) => void
  setWork: (g: GeoResult | null) => void

  // Which pin the next map-click places
  activeLocationType: LocationType
  setActiveLocationType: (t: LocationType) => void

  // Commute mode toggle
  commuteMode: CommuteMode
  setCommuteMode: (m: CommuteMode) => void

  // Routes
  walkRoute: WalkRoute | null
  setWalkRoute: (r: WalkRoute | null) => void
  commute: CommuteResult | null
  setCommute: (c: CommuteResult | null) => void

  // Amenities
  selectedAmenityIds: string[]
  setSelectedAmenityIds: (ids: string[]) => void
  amenityResults: AmenityResult[]
  setAmenityResults: (results: AmenityResult[]) => void

  // Score
  score: ScoreResult | null
  setScore: (s: ScoreResult | null) => void

  // Loading states
  loading: Record<string, boolean>
  setLoading: (key: string, val: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [home, setHome] = useState<GeoResult | null>(null)
  const [work, setWork] = useState<GeoResult | null>(null)
  const [activeLocationType, setActiveLocationType] = useState<LocationType>("home")
  const [commuteMode, setCommuteMode] = useState<CommuteMode>("transit")
  const [walkRoute, setWalkRoute] = useState<WalkRoute | null>(null)
  const [commute, setCommute] = useState<CommuteResult | null>(null)
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<string[]>([])
  const [amenityResults, setAmenityResults] = useState<AmenityResult[]>([])
  const [score, setScore] = useState<ScoreResult | null>(null)
  const [loading, setLoadingState] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, val: boolean) => {
    setLoadingState((prev) => ({ ...prev, [key]: val }))
  }, [])

  return (
    <AppContext.Provider
      value={{
        home, setHome,
        work, setWork,
        activeLocationType, setActiveLocationType,
        commuteMode, setCommuteMode,
        walkRoute, setWalkRoute,
        commute, setCommute,
        selectedAmenityIds, setSelectedAmenityIds,
        amenityResults, setAmenityResults,
        score, setScore,
        loading, setLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within <AppProvider>")
  return ctx
}
