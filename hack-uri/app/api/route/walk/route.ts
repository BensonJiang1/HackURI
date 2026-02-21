import { NextResponse } from "next/server"
import { getWalkingRoute } from "@/lib/server/routing"

export async function POST(request: Request) {
  try {
    const { origin, destination } = await request.json()
    if (!origin || !destination)
      return NextResponse.json({ error: "origin and destination are required" }, { status: 400 })

    const route = await getWalkingRoute(origin.lat, origin.lng, destination.lat, destination.lng)
    if (!route) return NextResponse.json({ error: "No route found" }, { status: 404 })
    return NextResponse.json(route)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
