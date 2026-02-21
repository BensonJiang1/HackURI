import { NextResponse } from "next/server"
import { geocodeForward } from "@/lib/server/geocoding"

export async function POST(request: Request) {
  try {
    const { address } = await request.json()
    if (!address) return NextResponse.json({ error: "address is required" }, { status: 400 })
    const result = await geocodeForward(address)
    return NextResponse.json(result)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
