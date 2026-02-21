import { NextResponse } from "next/server"
import { getCommuteWalkLegs } from "@/lib/server/transit"

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json()
    if (!origin || !destination)
      return NextResponse.json({ error: "origin and destination are required" }, { status: 400 })

    const result = await getCommuteWalkLegs(origin.lat, origin.lng, destination.lat, destination.lng)
    if (!result) return NextResponse.json({ error: "No commute route found" }, { status: 404 })
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
