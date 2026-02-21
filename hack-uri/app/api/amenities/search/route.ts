import { NextResponse } from "next/server"
import { searchAmenities } from "@/lib/server/amenities"

export async function POST(request: Request) {
  try {
    const { location, amenity_type, radius_m } = await request.json()
    if (!location || !amenity_type)
      return NextResponse.json({ error: "location and amenity_type are required" }, { status: 400 })

    const results = await searchAmenities(location.lat, location.lng, amenity_type, radius_m ?? 2500, 5)
    return NextResponse.json({ results })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
