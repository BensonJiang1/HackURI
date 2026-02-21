import { Map } from "lucide-react"

export function MapPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
        <Map className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-card-foreground">Google Maps</h3>
      <p className="text-center text-sm text-muted-foreground">
        Map integration will appear here
      </p>
      {/* Decorative grid to mimic a map */}
      <div className="mt-5 grid w-full max-w-xs grid-cols-4 gap-1.5">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-secondary"
            style={{ opacity: 0.4 + Math.random() * 0.6 }}
          />
        ))}
      </div>
    </div>
  )
}
