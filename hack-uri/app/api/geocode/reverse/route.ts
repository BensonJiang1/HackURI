import { NextResponse } from "next/server"
import { reverseGeocode } from "@/lib/server/geocoding"

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json()
    if (lat == null || lng == null)
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 })
    const result = await reverseGeocode(lat, lng)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
