"use client"

import { useState } from "react"
import { NavigationMain } from "@/components/navigation-main"
import { AddressInput } from "@/components/address-input"
import { AnalyticsPlaceholder } from "@/components/analytics-placeholder"
import { MapPlaceholder } from "@/components/map-placeholder"
import { AmenityPicker } from "@/components/amenity-picker"
import { ArrowLeft } from "lucide-react"

export default function Home() {
  const [leftPanelMode, setLeftPanelMode] = useState<"address" | "amenities">("address")

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavigationMain />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 p-4 pt-32 lg:p-6 lg:pt-36">
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          
          {/* Conditional Left Panel */}
          <div className="h-full">
            {leftPanelMode === "address" ? (
              <AddressInput onAmenitiesClick={() => setLeftPanelMode("amenities")} />
            ) : (
              <div className="flex h-full flex-col rounded-2xl border border-border bg-[#121212] p-6 shadow-sm overflow-hidden">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setLeftPanelMode("address")}
                      className="rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-white"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Select Amenities</h2>
                  </div>
                </div>
                {/* Your Skill Picker Component */}
                <AmenityPicker />
              </div>
            )}
          </div>

          <MapPlaceholder />
        </div>

        <div className="my-4 h-px w-full bg-border lg:my-5" />
        <AnalyticsPlaceholder />
      </main>
    </div>
  )
}