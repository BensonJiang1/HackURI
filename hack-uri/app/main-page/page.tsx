"use client"

import { useState } from "react"
import { NavigationMain } from "@/components/navigation-main"
import { AddressInput } from "@/components/address-input"
import { AnalyticsPlaceholder } from "@/components/analytics-placeholder"
import { MapView } from "@/components/map-view"
import { AmenityPicker } from "@/components/amenity-picker"
import { AppProvider } from "@/lib/app-context"
import { ArrowLeft } from "lucide-react"

export default function Home() {
  const [leftPanelMode, setLeftPanelMode] = useState<"address" | "amenities">("address")

  return (
    <AppProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <NavigationMain
          activeTab={leftPanelMode}
          onTabChange={(tab) => setLeftPanelMode(tab as "address" | "amenities")}
        />

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 p-4 lg:p-6">
          <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
            
            {/* Conditional Left Panel */}
            <div className="relative z-50">
              {leftPanelMode === "address" ? (
                <AddressInput onAmenitiesClick={() => setLeftPanelMode("amenities")} />
              ) : (
                <div className="flex max-h-[80vh] flex-col rounded-2xl border border-border bg-[#121212] p-6 shadow-sm">
                  <div className="mb-4 flex shrink-0 items-center justify-between">
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
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <AmenityPicker onApply={() => setLeftPanelMode("address")} />
                  </div>
                </div>
              )}
            </div>

            <MapView />
          </div>

          <div className="my-4 h-px w-full bg-border lg:my-5" />
          <AnalyticsPlaceholder />
        </main>
      </div>
    </AppProvider>
  )
}