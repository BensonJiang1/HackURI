/**
 * Score service — aggregates walking data into exercise metrics.
 */

import { config } from "./config"
import { getWalkingRoute } from "./routing"
import { searchAmenities } from "./amenities"
import { getCommuteWalkLegs } from "./transit"

function letterGrade(pct: number): string {
  if (pct >= 150) return "A+"
  if (pct >= 100) return "A"
  if (pct >= 75) return "B"
  if (pct >= 50) return "C"
  if (pct >= 25) return "D"
  return "F"
}

interface AmenityInput {
  amenity_type: string
  visits_per_week: number
  nearest?: { lat: number; lng: number; name: string }
}

interface BreakdownItem {
  label: string
  distance_km: number
  one_way_min: number
  round_trips_per_week: number
  weekly_minutes: number
  commute_mode?: string
  commute_detail?: unknown
  source?: string
}

export interface ScoreResult {
  total_weekly_walk_min: number
  total_weekly_calories: number
  who_guideline_pct: number
  grade: string
  breakdown: BreakdownItem[]
}

export async function calculateScore(
  homeLat: number,
  homeLng: number,
  workLat?: number,
  workLng?: number,
  amenities?: AmenityInput[],
  workDaysPerWeek = 5,
  commuteMode = "transit",
): Promise<ScoreResult> {
  const calPerMin = config.CALORIES_PER_MINUTE_WALKING
  const whoMin = config.WHO_WEEKLY_MINUTES
  const breakdown: BreakdownItem[] = []

  // ── 1. Work commute ──
  if (workLat != null && workLng != null) {
    if (commuteMode === "transit") {
      const commute = await getCommuteWalkLegs(homeLat, homeLng, workLat, workLng)
      if (commute) {
        const walkMin = commute.total_walk_min
        const walkKm = commute.total_walk_km
        const weeklyMin = walkMin * 2 * workDaysPerWeek

        let label = "Work commute"
        if (commute.mode === "transit") {
          const h2t = commute.home_to_transit
          const t2w = commute.transit_to_work
          if (h2t && t2w) {
            label = `Walk to ${h2t.stop_name} + walk from ${t2w.stop_name} to work`
          } else if (h2t) {
            label = `Walk to ${h2t.stop_name} + transit to work`
          }
        }

        breakdown.push({
          label,
          distance_km: walkKm,
          one_way_min: walkMin,
          round_trips_per_week: workDaysPerWeek,
          weekly_minutes: Math.round(weeklyMin * 10) / 10,
          commute_mode: commute.mode,
          commute_detail: commute,
          source: commute.source,
        })
      }
    } else {
      const route = await getWalkingRoute(homeLat, homeLng, workLat, workLng)
      if (route) {
        const weeklyMin = route.duration_min * 2 * workDaysPerWeek
        breakdown.push({
          label: "Work commute (full walk)",
          distance_km: route.distance_km,
          one_way_min: route.duration_min,
          round_trips_per_week: workDaysPerWeek,
          weekly_minutes: Math.round(weeklyMin * 10) / 10,
          commute_mode: "walk",
        })
      }
    }
  }

  // ── 2. Amenity trips ──
  for (const item of amenities ?? []) {
    const visits = item.visits_per_week ?? 3

    // Use pre-fetched nearest location if provided, otherwise query Overpass
    let nearest: { lat: number; lng: number; name: string } | null = null
    if (item.nearest) {
      nearest = item.nearest
    } else {
      const results = await searchAmenities(homeLat, homeLng, item.amenity_type, 2500, 5)
      if (results.length) nearest = results[0]
    }
    if (!nearest) continue

    const route = await getWalkingRoute(homeLat, homeLng, nearest.lat, nearest.lng)
    if (!route) continue

    const weeklyMin = route.duration_min * 2 * visits
    breakdown.push({
      label: `${item.amenity_type.charAt(0).toUpperCase() + item.amenity_type.slice(1)} (${nearest.name})`,
      distance_km: route.distance_km,
      one_way_min: route.duration_min,
      round_trips_per_week: visits,
      weekly_minutes: Math.round(weeklyMin * 10) / 10,
    })
  }

  // ── 3. Aggregate ──
  const totalMin = Math.round(breakdown.reduce((s, b) => s + b.weekly_minutes, 0) * 10) / 10
  const totalCal = Math.round(totalMin * calPerMin)
  const whoPct = whoMin ? Math.round(((totalMin / whoMin) * 100) * 10) / 10 : 0

  return {
    total_weekly_walk_min: totalMin,
    total_weekly_calories: totalCal,
    who_guideline_pct: whoPct,
    grade: letterGrade(whoPct),
    breakdown,
  }
}
