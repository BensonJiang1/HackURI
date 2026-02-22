import { NextResponse } from "next/server"
import { getAmenityTypes } from "@/lib/server/amenities"

export async function GET() {
  return NextResponse.json({ types: getAmenityTypes() })
}
