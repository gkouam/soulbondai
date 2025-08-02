import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Analytics } from "@/lib/analytics"
import { z } from "zod"

const trackEventSchema = z.object({
  eventType: z.string(),
  eventName: z.string().optional(),
  properties: z.record(z.any()).optional()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { eventType, eventName, properties } = trackEventSchema.parse(body)
    
    await Analytics.track({
      userId: session.user.id,
      eventType,
      eventName,
      properties
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Analytics tracking error:", error)
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    
    switch (type) {
      case "journey":
        const journey = await Analytics.getUserJourney(session.user.id)
        return NextResponse.json({ journey })
        
      case "conversion-metrics":
        const timeframe = searchParams.get("timeframe") as "day" | "week" | "month" || "week"
        const metrics = await Analytics.getConversionMetrics(timeframe)
        return NextResponse.json(metrics)
        
      case "personality-insights":
        const insights = await Analytics.getPersonalityInsights()
        return NextResponse.json({ insights })
        
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        )
    }
    
  } catch (error) {
    console.error("Analytics fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}