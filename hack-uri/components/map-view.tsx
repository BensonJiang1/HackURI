"use client"

import dynamic from "next/dynamic"

const LeafletMap = dynamic(() => import("./leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-border bg-card">
      <p className="text-sm text-muted-foreground">Loading map…</p>
    </div>
  ),
})

export function MapView() {
  return (
    <div className="h-full min-h-[400px] rounded-2xl border border-border bg-card overflow-hidden">
      <LeafletMap />
    </div>
  )
}
