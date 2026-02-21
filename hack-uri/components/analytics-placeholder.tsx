import { BarChart3, TrendingUp, Clock, Route } from "lucide-react"

const statCards = [
  { label: "Total Routes", value: "--", icon: Route, color: "bg-primary" },
  { label: "Avg. Distance", value: "--", icon: TrendingUp, color: "bg-accent" },
  { label: "Time Saved", value: "--", icon: Clock, color: "bg-chart-1" },
]

export function AnalyticsPlaceholder() {
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
        <span className="rounded-lg bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Coming Soon
        </span>
      </div>

      {/* Stat cards row */}
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-xl border border-border bg-secondary p-4"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-card-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart placeholder area */}
      <div className="flex h-36 items-end gap-2 rounded-xl border border-border bg-secondary p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-md bg-border"
            style={{
              height: `${20 + Math.random() * 70}%`,
              opacity: 0.5 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>
    </div>
  )
}
