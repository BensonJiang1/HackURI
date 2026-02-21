import { Navigation } from "@/components/navigation"
import { AddressInput } from "@/components/address-input"
import { AnalyticsPlaceholder } from "@/components/analytics-placeholder"
import { MapPlaceholder } from "@/components/map-placeholder"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-0 p-4 pt-26 lg:p-6">
        {/* Top section: Address Input | Map */}
        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          <AddressInput />
          <MapPlaceholder />
        </div>

        {/* Divider line */}
        <div className="my-4 h-px w-full bg-border lg:my-5" />

        {/* Bottom section: Analytics */}
        <AnalyticsPlaceholder />
      </main>
    </div>
  )
}
