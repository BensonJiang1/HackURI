import { NextResponse } from "next/server"
import { calculateScore } from "@/lib/server/score"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (!body.home)
      return NextResponse.json({ error: "home location is required" }, { status: 400 })

    const result = await calculateScore(
      body.home.lat,
      body.home.lng,
      body.work?.lat,
      body.work?.lng,
      body.amenities,
      body.work_days_per_week ?? 5,
      body.commute_mode ?? "transit",
    )
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
