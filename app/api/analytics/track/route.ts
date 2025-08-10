import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { event, properties } = body
    
    // Create analytics event
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        event,
        properties: properties || {},
        timestamp: new Date()
      }
    }).catch((error) => {
      // If AnalyticsEvent table doesn't exist, just log it
      console.log("Analytics tracking:", { event, properties, userId: session.user.id })
    })
    
    // Handle specific events
    switch (event) {
      case "upgrade_clicked":
        // Track conversion event
        await prisma.conversionEvent.create({
          data: {
            userId: session.user.id,
            eventType: "upgrade_intent",
            archetype: properties?.archetype || "unknown",
            metadata: properties
          }
        }).catch(console.error)
        break
        
      case "feature_used":
        // Track feature usage
        await prisma.activity.create({
          data: {
            userId: session.user.id,
            type: properties?.feature || "unknown_feature",
            metadata: properties
          }
        }).catch(console.error)
        break
        
      case "page_view":
        // Update last interaction
        await prisma.profile.update({
          where: { userId: session.user.id },
          data: { lastInteraction: new Date() }
        }).catch(console.error)
        break
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Analytics tracking error:", error)
    // Don't fail requests due to analytics errors
    return NextResponse.json({ success: true })
  }
}

// Support GET for health checks
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    service: "analytics"
  })
}