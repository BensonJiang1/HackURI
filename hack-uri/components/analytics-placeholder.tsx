"use client"

import { useEffect, useRef, useState } from "react"
import { BarChart3, TrendingUp, Clock, Route, Loader2, Footprints, Flame, Award, HelpCircle, X, Trees, Waves } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { calculateScore, getEnvironmentalContext } from "@/lib/api" // Ensure this is exported in lib/api
import { AMENITY_ID_TO_BACKEND } from "@/lib/amenity-map"

export function AnalyticsPlaceholder() {
  const [mounted, setMounted] = useState(false);
  const { home, work, selectedAmenityIds, amenityResults, commuteMode, score, setScore, loading, setLoading } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  // --- NEW STATE FOR ENVIRONMENTAL DATA ---
  const [envData, setEnvData] = useState<any>(null)
  const [envLoading, setEnvLoading] = useState(false)

  useEffect(() => {
    setMounted(true);
  }, []);

  const tripOverridesRef = useRef<Record<string, number>>({})

  useEffect(() => {
  if (!home?.lat || !home?.lng) {
    setScore(null);
    setEnvData(null);
    return;
  }

  const fetchData = async () => {
    // Set both loading states
    setLoading("score", true);
    setEnvLoading(true);
    setError(null);

    try {
      const overrides = tripOverridesRef.current;
      const nearestByType: Record<string, { lat: number; lng: number; name: string }> = {};
      for (const r of amenityResults) {
        if (!nearestByType[r.amenity_type]) {
          nearestByType[r.amenity_type] = { lat: r.lat, lng: r.lng, name: r.name };
        }
      }

      const amenitiesPayload = selectedAmenityIds.map((id) => {
        const backendId = AMENITY_ID_TO_BACKEND[id] ?? id;
        return {
          amenity_type: backendId,
          visits_per_week: overrides[backendId] ?? 3,
          ...(nearestByType[backendId] ? { nearest: nearestByType[backendId] } : {}),
        };
      });

      // Run both calls in parallel
      const [scoreRes, envRes] = await Promise.allSettled([
        calculateScore({
          home: { lat: home.lat, lng: home.lng },
          work: work ? { lat: work.lat, lng: work.lng } : undefined,
          amenities: amenitiesPayload.length > 0 ? amenitiesPayload : undefined,
          work_days_per_week: 5,
          commute_mode: commuteMode,
        }),
        getEnvironmentalContext(home.lat, home.lng)
      ]);

      // Update states based on results
      if (scoreRes.status === "fulfilled") {
        setScore(scoreRes.value);
      } else {
        setError("Score calculation failed");
      }

      if (envRes.status === "fulfilled") {
        setEnvData(envRes.value);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading("score", false);
      setEnvLoading(false);
    }
  };

  fetchData();
}, [home?.lat, home?.lng, work?.lat, work?.lng, selectedAmenityIds, commuteMode]);

  function handleTripsChange(index: number, newTrips: number) {
    if (!score) return
    const item = score.breakdown[index]
    if (!item || item.commute_mode) return

    const amenityKey = item.label.split(" (")[0].toLowerCase()
    tripOverridesRef.current[amenityKey] = newTrips

    const newBreakdown = score.breakdown.map((b, i) => {
      if (i !== index) return b
      const weeklyMin = Math.round(b.one_way_min * 2 * newTrips * 10) / 10
      return { ...b, round_trips_per_week: newTrips, weekly_minutes: weeklyMin }
    })
    const totalMin = Math.round(newBreakdown.reduce((s, b) => s + b.weekly_minutes, 0) * 10) / 10
    const totalCal = Math.round(totalMin * 4)
    const whoPct = Math.round(((totalMin / 150) * 100) * 10) / 10

    setScore({
      ...score,
      breakdown: newBreakdown,
      total_weekly_walk_min: totalMin,
      total_weekly_calories: totalCal,
      who_guideline_pct: whoPct,
      grade: whoPct >= 150 ? "A+" : whoPct >= 100 ? "A" : whoPct >= 75 ? "B" : whoPct >= 50 ? "C" : whoPct >= 25 ? "D" : "F",
    })
  }

  const isLoading = loading["score"]

  const statCards = [
    { label: "Weekly Walk", value: score ? `${Math.round(score.total_weekly_walk_min)} min` : "--", icon: Footprints, color: "bg-primary" },
    { label: "Weekly Calories", value: score ? `${Math.round(score.total_weekly_calories)}` : "--", icon: Flame, color: "bg-accent" },
    { label: "WHO Guideline", value: score ? `${Math.round(score.who_guideline_pct)}%` : "--", icon: TrendingUp, color: "bg-chart-1" },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold text-card-foreground">Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInfo(true)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-white">
            <HelpCircle className="h-5 w-5" />
          </button>
          {score ? (
            <span className={`rounded-lg px-3 py-1 text-sm font-bold ${score.grade.startsWith("A") ? "bg-green-900/50 text-green-400" : score.grade === "B" ? "bg-yellow-900/50 text-yellow-400" : score.grade === "C" ? "bg-orange-900/50 text-orange-400" : "bg-red-900/50 text-red-400"}`}>
              Grade: {score.grade}
            </span>
          ) : (
            <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{home ? "Calculating…" : "Set home to begin"}</span>
          )}
        </div>
      </div>

      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {/* Stat cards row */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-card-foreground">{isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown list */}
      {score && score.breakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-secondary p-4">
          <h3 className="mb-3 text-sm font-semibold text-card-foreground">Breakdown</h3>
          <div className="mb-2 grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-border pb-2 text-xs text-muted-foreground">
            <span>Activity</span>
            <span className="w-20 text-right">Round trip</span>
            <span className="w-16 text-right">Trips/wk</span>
            <span className="w-20 text-right">Total/wk</span>
          </div>
          {score.breakdown.map((item, i) => {
            const isAmenity = !item.commute_mode
            return (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 py-1.5 text-sm">
                <span className="truncate text-muted-foreground">{item.label}</span>
                <span className="w-20 text-right tabular-nums text-card-foreground">{Math.round(item.one_way_min * 2)} min</span>
                {isAmenity ? (
                  <span className="flex w-16 items-center justify-end">
                    <input type="number" min={1} max={14} value={item.round_trips_per_week} onChange={(e) => handleTripsChange(i, Math.max(1, Math.min(14, parseInt(e.target.value) || 1)))} className="w-12 rounded border border-border bg-secondary px-1.5 py-0.5 text-right tabular-nums text-card-foreground text-sm focus:border-primary focus:outline-none" />
                    <span className="ml-0.5 text-card-foreground">×</span>
                  </span>
                ) : (
                  <span className="w-16 text-right tabular-nums text-card-foreground">{item.round_trips_per_week}×</span>
                )}
                <span className="w-20 text-right font-medium tabular-nums text-card-foreground">{Math.round(item.weekly_minutes)} min</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Chart/Empty state */}
      {!score && (
        <div className="flex h-36 items-end gap-2 rounded-xl border border-border bg-secondary p-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 rounded-md bg-border transition-all duration-500" style={{ height: mounted ? `${20 + (i * 7) % 70}%` : "50%", opacity: mounted ? 0.5 + (i * 0.1) % 0.5 : 0.5 }} />
          ))}
        </div>
      )}

      {/* --- NEW ENVIRONMENTAL BONUS BOX UI --- */}
      {(envData || envLoading) && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-card-foreground text-sm">
              {envLoading ? "Analyzing Surrounding Environment..." : `Bonus: ${envData.regionName}`}
            </h3>
          </div>

          {envLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { key: 'tree', label: 'Tree Canopy', color: 'text-green-400', icon: Trees },
                { key: 'road', label: 'Road Impact', color: 'text-red-400', icon: Route },
                { key: 'lifestyle', label: 'Lifestyle/Coast', color: 'text-blue-400', icon: Waves }
              ].map((item) => (
                <div key={item.key} className="rounded-xl border border-border bg-card/40 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <item.icon className={`h-3 w-3 ${item.color}`} />
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${item.color}`}>
                      {envData.scores[item.key].value > 0 ? '+' : ''}{envData.scores[item.key].value}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground/90">
                    {envData.scores[item.key].justification}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formula info popup */}
{showInfo && (
  <div 
    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" 
    onClick={() => setShowInfo(false)}
  >
    {/* This is the missing container div */}
    <div 
      className="max-w-md w-full rounded-xl border bg-background p-6 shadow-lg space-y-6 overflow-y-auto max-h-[90vh]" 
      onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the box
    >
      <div>
        <h4 className="mb-1 font-semibold text-card-foreground">🚶 Work Commute</h4>
        <p className="text-sm text-muted-foreground">
          In <strong>transit mode</strong>, we use the Google Routes API to get a real transit itinerary and extract only the walking portions (walk to stop + walk from stop).
          In <strong>walk mode</strong>, we use the full walking route.
        </p>
        <p className="mt-1 rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
          weekly = one_way_walk_min × 2 × work_days (5)
        </p>
      </div>

      <div>
        <h4 className="mb-1 font-semibold text-card-foreground">📍 Amenity Trips</h4>
        <p className="text-sm text-muted-foreground">
          For each selected amenity, we find the 5 closest within ~20 min walking distance.
          The score uses the <strong>nearest one</strong> with a default of <strong>3 round trips/week</strong>.
        </p>
        <p className="mt-1 text-xs text-card-foreground/80 italic">
          💡 You can click the <strong>Trips/wk</strong> value in the breakdown table to customize how often you visit each amenity.
        </p>
        <p className="mt-1 rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
          weekly = one_way_walk_min × 2 × trips_per_week
        </p>
      </div>

      <div>
        <h4 className="mb-1 font-semibold text-card-foreground">🔥 Calories</h4>
        <p className="text-sm text-muted-foreground">
          Estimated at <strong>4 calories/minute</strong> of moderate-pace walking.
        </p>
        <p className="mt-1 rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
          calories = total_weekly_min × 4.0
        </p>
      </div>

      <div>
        <h4 className="mb-1 font-semibold text-card-foreground">📊 WHO Guideline %</h4>
        <p className="text-sm text-muted-foreground">
          The World Health Organization recommends at least <strong>150 minutes</strong> of moderate exercise per week.
        </p>
        <p className="mt-1 rounded-lg bg-secondary px-3 py-2 font-mono text-xs">
          who_pct = (total_weekly_min / 150) × 100
        </p>
      </div>

      <div>
        <h4 className="mb-1 font-semibold text-card-foreground">🏅 Grade Scale</h4>
        <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-secondary px-3 py-2 text-xs">
          <span><strong className="text-green-500">A+</strong> — ≥ 150% of WHO</span>
          <span><strong className="text-green-500">A</strong> — ≥ 100%</span>
          <span><strong className="text-yellow-500">B</strong> — ≥ 75%</span>
          <span><strong className="text-orange-500">C</strong> — ≥ 50%</span>
          <span><strong className="text-red-500">D</strong> — ≥ 25%</span>
          <span><strong className="text-red-500">F</strong> — &lt; 25%</span>
        </div>
      </div>
    </div> {/* End of content container */}
  </div> // End of overlay
)}
    </div>
  )
}