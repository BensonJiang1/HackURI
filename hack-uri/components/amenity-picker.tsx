"use client"

import { useState, useMemo } from "react"
import {
  Search,
  Trees,
  Dumbbell,
  GraduationCap,
  ShoppingCart,
  ShoppingBag,
  Utensils,
  Bus,
  Heart,
  Building2,
  Coffee,
  Bike,
  Baby,
  Waves,
  BookOpen,
  Landmark,
  Dog,
  Wine,
  Pill,
  Banknote,
  CakeSlice,
  X,
  Loader2,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { searchAmenities } from "@/lib/api"

interface Amenity {
  id: string
  label: string
  icon: React.ElementType
  category: string
}

const amenities: Amenity[] = [
  // Outdoors
  { id: "park", label: "Parks", icon: Trees, category: "Outdoors" },
  { id: "path", label: "Trails", icon: Bike, category: "Outdoors" },
  { id: "beach", label: "Beaches", icon: Waves, category: "Outdoors" },
  { id: "dog_park", label: "Dog Parks", icon: Dog, category: "Outdoors" },
  // Fitness
  { id: "gym", label: "Gyms", icon: Dumbbell, category: "Fitness" },
  { id: "yoga", label: "Yoga Studios", icon: Heart, category: "Fitness" },
  { id: "swimming_pool", label: "Swimming Pools", icon: Waves, category: "Fitness" },
  // Food & Drink
  { id: "restaurant", label: "Restaurants", icon: Utensils, category: "Food & Drink" },
  { id: "cafe", label: "Cafes", icon: Coffee, category: "Food & Drink" },
  { id: "coffee", label: "Coffee Shops", icon: Coffee, category: "Food & Drink" },
  { id: "bar", label: "Bars", icon: Wine, category: "Food & Drink" },
  { id: "bakery", label: "Bakeries", icon: CakeSlice, category: "Food & Drink" },
  // Shopping
  { id: "grocery", label: "Grocery Stores", icon: ShoppingCart, category: "Shopping" },
  { id: "supermarket", label: "Supermarkets", icon: ShoppingBag, category: "Shopping" },
  { id: "pharmacy", label: "Pharmacies", icon: Pill, category: "Shopping" },
  { id: "mall", label: "Malls", icon: Building2, category: "Shopping" },
  // Education
  { id: "school", label: "Schools", icon: GraduationCap, category: "Education" },
  { id: "library", label: "Libraries", icon: BookOpen, category: "Education" },
  { id: "kindergarten", label: "Daycare", icon: Baby, category: "Education" },
  // Services
  { id: "hospital", label: "Hospitals", icon: Heart, category: "Services" },
  { id: "bank", label: "Banks", icon: Banknote, category: "Services" },
  { id: "bus_station", label: "Public Transit", icon: Bus, category: "Services" },
  { id: "museum", label: "Museums", icon: Landmark, category: "Services" },
]

const categories = Array.from(new Set(amenities.map((a) => a.category)))

export function AmenityPicker({ onApply }: { onApply?: () => void }) {
  const { home, selectedAmenityIds, setAmenityResults, setSelectedAmenityIds, setLoading } = useApp()
  const [selected, setSelected] = useState<string[]>(selectedAmenityIds)
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return amenities.filter((a) => {
      const matchesQuery =
        query === "" ||
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.category.toLowerCase().includes(query.toLowerCase())
      const matchesCategory = !activeCategory || a.category === activeCategory
      return matchesQuery && matchesCategory
    })
  }, [query, activeCategory])

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const removeSelected = (id: string) => {
    setSelected((prev) => prev.filter((s) => s !== id))
  }

  const selectedAmenities = amenities.filter((a) => selected.includes(a.id))

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search amenities..."
          className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#ffb614]/40 focus:outline-none focus:ring-1 focus:ring-[#ffb614]/30"
        />
      </div>

      {/* Selected chips */}
      {selectedAmenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedAmenities.map((a) => {
            const Icon = a.icon
            return (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground"
              >
                <Icon className="h-3 w-3" />
                {a.label}
                <button
                  onClick={() => removeSelected(a.id)}
                  className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-accent-foreground/10"
                  aria-label={`Remove ${a.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
          {selected.length > 0 && (
            <button
              onClick={() => setSelected([])}
              className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#ffb614]/30 hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            activeCategory === null
              ? "bg-foreground/10 text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              activeCategory === cat
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Amenity grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((a) => {
            const Icon = a.icon
            const isSelected = selected.includes(a.id)
            return (
              <button
                key={a.id}
                onClick={() => toggle(a.id)}
                className={`group flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition-all ${
                  isSelected
                    ? "border-[#ffb614]/50 bg-[#ffb614]/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:border-[#ffb614]/25 hover:text-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    isSelected
                      ? "bg-accent text-accent-foreground"
                      : "bg-background text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{a.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.category}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No amenities found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Count badge + Apply */}
      {selected.length > 0 && (
        <div className="flex flex-col gap-2">
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center justify-between rounded-xl border border-[#ffb614]/20 bg-[#ffb614]/5 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{selected.length}</span>{" "}
              {selected.length === 1 ? "amenity" : "amenities"} selected
            </span>
            <button
              disabled={searching || !home}
              onClick={async () => {
                if (!home) {
                  setError("Set a home address first")
                  return
                }
                setError(null)
                setSearching(true)
                setLoading("amenities", true)
                try {
                  // Search sequentially to avoid Overpass 429 rate limits
                  const allResults = []
                  for (const id of selected) {
                    const results = await searchAmenities({ lat: home.lat, lng: home.lng }, id)
                    allResults.push(...results)
                  }
                  setAmenityResults(allResults)
                  setSelectedAmenityIds(selected)
                  onApply?.()
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Search failed")
                } finally {
                  setSearching(false)
                  setLoading("amenities", false)
                }
              }}
              className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
            >
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
