"use client"

import { useState } from "react"
import { MapPin, Home, Briefcase, Search, Sparkles, Loader2, MousePointerClick, Bus, Footprints } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { geocodeForward, getCommute, getWalkRoute } from "@/lib/api"

const addressTypes = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "amenities", label: "Amenities", icon: Sparkles },
] as const

type AddressType = (typeof addressTypes)[number]["id"]

interface AddressInputProps {
  onAmenitiesClick?: () => void;
}

export function AddressInput({ onAmenitiesClick }: AddressInputProps) {
  const [activeType, setActiveType] = useState<AddressType>("home")
  const [address, setAddress] = useState("")
  const [error, setError] = useState<string | null>(null)
  const {
    home, work,
    setHome, setWork,
    setWalkRoute, setCommute,
    loading, setLoading,
    activeLocationType, setActiveLocationType,
    commuteMode, setCommuteMode,
  } = useApp()

  const handleTypeClick = (id: AddressType) => {
    if (id === "amenities" && onAmenitiesClick) {
      onAmenitiesClick()
    } else {
      setActiveType(id)
      if (id === "home") setActiveLocationType("home")
      if (id === "work") setActiveLocationType("work")
    }
  }

  /** Geocode the address and store in context */
  const handleSearch = async () => {
    const trimmed = address.trim()
    if (!trimmed) return

    setError(null)
    setLoading("geocode", true)

    try {
      const result = await geocodeForward(trimmed)

      if (activeType === "home") {
        setHome(result)
      } else if (activeType === "work") {
        setWork(result)
      }

      // If both home and work are now set, compute commute automatically
      const newHome = activeType === "home" ? result : home
      const newWork = activeType === "work" ? result : work
      if (newHome && newWork) {
        setLoading("commute", true)
        try {
          if (commuteMode === "transit") {
            const c = await getCommute(
              { lat: newHome.lat, lng: newHome.lng },
              { lat: newWork.lat, lng: newWork.lng },
            )
            setCommute(c)
            setWalkRoute(null)
          } else {
            const walk = await getWalkRoute(
              { lat: newHome.lat, lng: newHome.lng },
              { lat: newWork.lat, lng: newWork.lng },
            )
            setWalkRoute(walk)
            setCommute(null)
          }
        } catch (e) {
          console.warn("Route failed:", e)
        } finally {
          setLoading("commute", false)
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Geocoding failed")
    } finally {
      setLoading("geocode", false)
    }
  }

  const isLoading = loading["geocode"] || loading["commute"]

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-[#121212] p-6 shadow-sm">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10"> 
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-white">Input Address</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Enter a destination and select the address type.
        </p>

        {/* Status pills */}
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {home && (
            <span className="rounded-lg bg-green-900/40 px-2.5 py-1 text-green-400">
              🏠 {home.display_name.split(",")[0]}
            </span>
          )}
          {work && (
            <span className="rounded-lg bg-blue-900/40 px-2.5 py-1 text-blue-400">
              💼 {work.display_name.split(",")[0]}
            </span>
          )}
        </div>

        {/* Click-to-place hint */}
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
          <span>
            Click the map to place{" "}
            <button
              onClick={() => setActiveLocationType("home")}
              className={`font-semibold ${activeLocationType === "home" ? "text-green-400 underline" : "text-muted-foreground hover:text-white"}`}
            >
              Home
            </button>
            {" / "}
            <button
              onClick={() => setActiveLocationType("work")}
              className={`font-semibold ${activeLocationType === "work" ? "text-blue-400 underline" : "text-muted-foreground hover:text-white"}`}
            >
              Work
            </button>
          </span>
        </div>

        {/* Walk / Transit toggle */}
        <div className="mb-3 flex rounded-xl border border-border bg-secondary/50 p-1">
          <button
            onClick={async () => {
              setCommuteMode("walk")
              if (home && work) {
                setLoading("commute", true)
                try {
                  const walk = await getWalkRoute(
                    { lat: home.lat, lng: home.lng },
                    { lat: work.lat, lng: work.lng },
                  )
                  setWalkRoute(walk)
                  setCommute(null)
                } catch { /* ignore */ }
                finally { setLoading("commute", false) }
              }
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              commuteMode === "walk"
                ? "bg-[#ffb614] text-black"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            Walk
          </button>
          <button
            onClick={async () => {
              setCommuteMode("transit")
              if (home && work) {
                setLoading("commute", true)
                try {
                  const c = await getCommute(
                    { lat: home.lat, lng: home.lng },
                    { lat: work.lat, lng: work.lng },
                  )
                  setCommute(c)
                  setWalkRoute(null)
                } catch { /* ignore */ }
                finally { setLoading("commute", false) }
              }
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              commuteMode === "transit"
                ? "bg-[#ffb614] text-black"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Bus className="h-3.5 w-3.5" />
            Transit
          </button>
        </div>

        {/* Search input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearch() }}
          className="relative mb-3"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for an address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-20 text-sm text-white placeholder:text-muted-foreground focus:border-[#ffb614]/40 focus:outline-none focus:ring-1 focus:ring-[#ffb614]/30"
          />
          <button
            type="submit"
            disabled={isLoading || !address.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#ffb614] px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Go"}
          </button>
        </form>

        {error && (
          <p className="mb-2 text-xs text-red-400">{error}</p>
        )}
      </div>

      {/* Address type buttons */}
      <div className="flex gap-2">
        {addressTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTypeClick(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
              activeType === id
                ? "border-[#ffb614] bg-white text-black"
                : "border-border bg-secondary/50 text-muted-foreground hover:border-[#ffb614]/30 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span> 
          </button>
        ))}
      </div>
    </div>
  )
}