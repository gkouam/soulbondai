import { prisma } from "@/lib/prisma"

export type AnalyticsEvent = {
  userId: string
  eventType: string
  eventName?: string
  properties?: Record<string, any>
  timestamp?: Date
}

export class Analytics {
  static async track(event: AnalyticsEvent) {
    try {
      // Store event in database
      await prisma.conversionEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          archetype: event.properties?.archetype,
          metadata: {
            eventName: event.eventName,
            ...event.properties,
            timestamp: event.timestamp || new Date()
          }
        }
      })

      // Also log to activity for user timeline
      await prisma.activity.create({
        data: {
          userId: event.userId,
          type: event.eventType,
          metadata: event.properties
        }
      })
    } catch (error) {
      console.error("Analytics tracking error:", error)
    }
  }

  static async trackPageView(userId: string, page: string, properties?: Record<string, any>) {
    return this.track({
      userId,
      eventType: "page_view",
      eventName: page,
      properties: {
        page,
        ...properties
      }
    })
  }

  static async trackConversion(
    userId: string, 
    conversionType: string, 
    archetype: string,
    properties?: Record<string, any>
  ) {
    return this.track({
      userId,
      eventType: conversionType,
      properties: {
        archetype,
        ...properties
      }
    })
  }

  static async trackEngagement(
    userId: string,
    action: string,
    properties?: Record<string, any>
  ) {
    return this.track({
      userId,
      eventType: "engagement",
      eventName: action,
      properties
    })
  }

  static async getConversionMetrics(timeframe: "day" | "week" | "month" = "week") {
    const now = new Date()
    let startDate = new Date()

    switch (timeframe) {
      case "day":
        startDate.setDate(now.getDate() - 1)
        break
      case "week":
        startDate.setDate(now.getDate() - 7)
        break
      case "month":
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const conversions = await prisma.conversionEvent.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    })

    // Calculate metrics by archetype
    const archetypeMetrics: Record<string, {
      total: number
      conversions: number
      rate: number
      events: Record<string, number>
    }> = {}

    for (const conversion of conversions) {
      const archetype = conversion.archetype || conversion.user.profile?.archetype || "unknown"
      
      if (!archetypeMetrics[archetype]) {
        archetypeMetrics[archetype] = {
          total: 0,
          conversions: 0,
          rate: 0,
          events: {}
        }
      }

      archetypeMetrics[archetype].total++
      
      if (conversion.eventType === "subscription_started") {
        archetypeMetrics[archetype].conversions++
      }

      if (!archetypeMetrics[archetype].events[conversion.eventType]) {
        archetypeMetrics[archetype].events[conversion.eventType] = 0
      }
      archetypeMetrics[archetype].events[conversion.eventType]++
    }

    // Calculate conversion rates
    for (const archetype in archetypeMetrics) {
      const metrics = archetypeMetrics[archetype]
      metrics.rate = metrics.total > 0 ? (metrics.conversions / metrics.total) * 100 : 0
    }

    return {
      timeframe,
      startDate,
      endDate: now,
      totalConversions: conversions.length,
      archetypeMetrics
    }
  }

  static async getUserJourney(userId: string) {
    const activities = await prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    })

    const conversions = await prisma.conversionEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }
    })

    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          userId
        }
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        sentiment: true
      }
    })

    // Combine and sort all events
    const journey = [
      ...activities.map(a => ({
        type: "activity",
        event: a.type,
        timestamp: a.createdAt,
        metadata: a.metadata
      })),
      ...conversions.map(c => ({
        type: "conversion",
        event: c.eventType,
        timestamp: c.createdAt,
        metadata: c.metadata
      })),
      ...messages.map(m => ({
        type: "message",
        event: "message_sent",
        timestamp: m.createdAt,
        metadata: { sentiment: m.sentiment }
      }))
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return journey
  }

  static async getPersonalityInsights() {
    const profiles = await prisma.profile.findMany({
      include: {
        user: {
          include: {
            subscription: true,
            conversions: true
          }
        }
      }
    })

    const insights: Record<string, {
      totalUsers: number
      paidUsers: number
      conversionRate: number
      avgMessageCount: number
      avgTrustLevel: number
      topConversionTriggers: string[]
    }> = {}

    for (const profile of profiles) {
      const archetype = profile.archetype || "unknown"
      
      if (!insights[archetype]) {
        insights[archetype] = {
          totalUsers: 0,
          paidUsers: 0,
          conversionRate: 0,
          avgMessageCount: 0,
          avgTrustLevel: 0,
          topConversionTriggers: []
        }
      }

      insights[archetype].totalUsers++
      
      if (profile.user.subscription?.plan !== "free") {
        insights[archetype].paidUsers++
      }

      insights[archetype].avgMessageCount += profile.messageCount
      insights[archetype].avgTrustLevel += profile.trustLevel
    }

    // Calculate averages and conversion rates
    for (const archetype in insights) {
      const data = insights[archetype]
      data.conversionRate = data.totalUsers > 0 ? (data.paidUsers / data.totalUsers) * 100 : 0
      data.avgMessageCount = data.totalUsers > 0 ? data.avgMessageCount / data.totalUsers : 0
      data.avgTrustLevel = data.totalUsers > 0 ? data.avgTrustLevel / data.totalUsers : 0
    }

    return insights
  }
}