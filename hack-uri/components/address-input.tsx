"use client"

import { useState } from "react"
// Added Sparkles for the Amenities icon
import { MapPin, Home, Briefcase, ShoppingCart, Search, Sparkles } from "lucide-react"

const addressTypes = [
  { id: "home", label: "Home", icon: Home },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "amenities", label: "Amenities", icon: Sparkles }, // Added new 3rd option
  { id: "groceries", label: "Groceries", icon: ShoppingCart },
] as const

type AddressType = (typeof addressTypes)[number]["id"]

export function AddressInput() {
  const [activeType, setActiveType] = useState<AddressType>("home")
  const [address, setAddress] = useState("")

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10"> 
            {/* Note: I added /10 to the bg-primary for a softer look similar to your screenshot */}
            <MapPin className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-card-foreground">Input Address</h2>
        </div>
        <p className="mb-5 text-sm text-muted-foreground">
          Enter a destination and select the address type.
        </p>

        {/* Search input */}
        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search for an address..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-sm text-card-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
      </div>

      {/* Address type buttons - will now automatically render 4 buttons */}
      <div className="flex gap-2">
        {addressTypes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveType(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
              activeType === id
                ? "border-primary bg-white text-black" // Matches your "active" screenshot style
                : "border-border bg-secondary/50 text-muted-foreground hover:border-ring/30 hover:text-card-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span> 
            {/* Hidden sm:inline helps buttons not overlap on smaller screens */}
          </button>
        ))}
      </div>
    </div>
  )
}