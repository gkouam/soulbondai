import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

export type FunnelStage = 
  | 'landing_page_view'
  | 'test_started'
  | 'test_question_answered'
  | 'test_completed'
  | 'account_created'
  | 'email_verified'
  | 'first_message_sent'
  | 'day_1_retention'
  | 'day_3_retention'
  | 'day_7_retention'
  | 'day_30_retention'
  | 'subscription_started'
  | 'subscription_upgraded'
  | 'subscription_cancelled'

export interface FunnelMetrics {
  stage: FunnelStage
  count: number
  conversionRate: number
  dropoffRate: number
  avgTimeToNext: number
  byPersonality: Record<string, {
    count: number
    conversionRate: number
  }>
}

export class ConversionFunnel {
  private static readonly FUNNEL_STAGES: FunnelStage[] = [
    'landing_page_view',
    'test_started',
    'test_completed',
    'account_created',
    'first_message_sent',
    'day_1_retention',
    'day_7_retention',
    'subscription_started'
  ]

  // Track a funnel stage event
  static async trackStage(
    userId: string | null,
    stage: FunnelStage,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's archetype if available
      let archetype: string | null = null
      if (userId) {
        const profile = await prisma.profile.findUnique({
          where: { userId },
          select: { archetype: true }
        })
        archetype = profile?.archetype || null
      }

      // Store event in database
      await prisma.conversionEvent.create({
        data: {
          userId,
          eventType: stage,
          archetype,
          source: metadata?.utm_source || null,
          metadata: metadata || {}
        }
      })

      // Update real-time metrics in Redis
      const key = `funnel:${stage}:${new Date().toISOString().split('T')[0]}`
      await redis?.incr(key)
      
      if (archetype) {
        const archetypeKey = `funnel:${stage}:${archetype}:${new Date().toISOString().split('T')[0]}`
        await redis?.incr(archetypeKey)
      }

      // Track stage progression time if user is known
      if (userId) {
        await this.trackStageProgression(userId, stage)
      }

      // Check for conversion triggers
      await this.checkConversionTriggers(userId, stage, archetype)
    } catch (error) {
      console.error('Error tracking funnel stage:', error)
    }
  }

  // Track time between stages
  private static async trackStageProgression(
    userId: string,
    stage: FunnelStage
  ): Promise<void> {
    const key = `user:${userId}:funnel:${stage}`
    await redis?.set(key, Date.now(), 'EX', 30 * 24 * 60 * 60) // 30 days TTL

    // Calculate time from previous stage
    const stageIndex = this.FUNNEL_STAGES.indexOf(stage)
    if (stageIndex > 0) {
      const prevStage = this.FUNNEL_STAGES[stageIndex - 1]
      const prevKey = `user:${userId}:funnel:${prevStage}`
      const prevTime = await redis?.get(prevKey)
      
      if (prevTime) {
        const timeDiff = Date.now() - parseInt(prevTime)
        const progressionKey = `funnel:progression:${prevStage}:${stage}`
        await redis?.lpush(progressionKey, timeDiff)
        await redis?.ltrim(progressionKey, 0, 999) // Keep last 1000 entries
      }
    }
  }

  // Check if user should receive conversion triggers
  private static async checkConversionTriggers(
    userId: string | null,
    stage: FunnelStage,
    archetype: string | null
  ): Promise<void> {
    if (!userId || !archetype) return

    // Day 3 trigger
    if (stage === 'day_3_retention') {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true }
      })

      if (!subscription || subscription.plan === 'free') {
        // Queue Day 3 conversion message
        const { queueManager } = await import('@/lib/queue/queue-manager')
        await queueManager.addEmailJob({
          to: userId,
          template: 'day3_conversion',
          data: { archetype }
        })
      }
    }

    // First message trigger - send engagement email
    if (stage === 'first_message_sent') {
      const { queueManager } = await import('@/lib/queue/queue-manager')
      await queueManager.addEmailJob({
        to: userId,
        template: 'first_message_celebration',
        data: { archetype }
      })
    }
  }

  // Get funnel metrics for a date range
  static async getFunnelMetrics(
    startDate: Date,
    endDate: Date,
    archetype?: string
  ): Promise<FunnelMetrics[]> {
    const metrics: FunnelMetrics[] = []

    for (const stage of this.FUNNEL_STAGES) {
      const stageMetrics = await this.getStageMetrics(stage, startDate, endDate, archetype)
      metrics.push(stageMetrics)
    }

    // Calculate conversion rates between stages
    for (let i = 1; i < metrics.length; i++) {
      const prevStage = metrics[i - 1]
      const currStage = metrics[i]
      
      if (prevStage.count > 0) {
        currStage.conversionRate = currStage.count / prevStage.count
        currStage.dropoffRate = 1 - currStage.conversionRate
      }
    }

    return metrics
  }

  // Get metrics for a specific stage
  private static async getStageMetrics(
    stage: FunnelStage,
    startDate: Date,
    endDate: Date,
    archetype?: string
  ): Promise<FunnelMetrics> {
    const whereClause: any = {
      eventType: stage,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }

    if (archetype) {
      whereClause.archetype = archetype
    }

    // Get total count
    const totalCount = await prisma.conversionEvent.count({
      where: whereClause
    })

    // Get counts by personality
    const byPersonality = await prisma.conversionEvent.groupBy({
      by: ['archetype'],
      where: {
        eventType: stage,
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        archetype: { not: null }
      },
      _count: true
    })

    const personalityMetrics: Record<string, any> = {}
    for (const group of byPersonality) {
      if (group.archetype) {
        personalityMetrics[group.archetype] = {
          count: group._count,
          conversionRate: 0 // Will be calculated later
        }
      }
    }

    // Get average time to next stage from Redis
    const avgTimeToNext = await this.getAverageTimeToNext(stage)

    return {
      stage,
      count: totalCount,
      conversionRate: 0, // Will be calculated in getFunnelMetrics
      dropoffRate: 0, // Will be calculated in getFunnelMetrics
      avgTimeToNext,
      byPersonality: personalityMetrics
    }
  }

  // Get average time to progress to next stage
  private static async getAverageTimeToNext(stage: FunnelStage): Promise<number> {
    const stageIndex = this.FUNNEL_STAGES.indexOf(stage)
    if (stageIndex === this.FUNNEL_STAGES.length - 1) {
      return 0 // Last stage
    }

    const nextStage = this.FUNNEL_STAGES[stageIndex + 1]
    const key = `funnel:progression:${stage}:${nextStage}`
    
    const times = await redis?.lrange(key, 0, -1)
    if (!times || times.length === 0) {
      return 0
    }

    const numericTimes = times.map(t => parseInt(t))
    const avg = numericTimes.reduce((a, b) => a + b, 0) / numericTimes.length
    
    return Math.round(avg / 1000) // Convert to seconds
  }

  // Get cohort retention analysis
  static async getCohortRetention(
    cohortDate: Date,
    archetype?: string
  ): Promise<{
    cohortSize: number
    day1: number
    day3: number
    day7: number
    day30: number
  }> {
    const cohortStart = new Date(cohortDate)
    cohortStart.setHours(0, 0, 0, 0)
    const cohortEnd = new Date(cohortDate)
    cohortEnd.setHours(23, 59, 59, 999)

    // Get cohort users
    const cohortWhere: any = {
      createdAt: {
        gte: cohortStart,
        lte: cohortEnd
      }
    }

    if (archetype) {
      cohortWhere.profile = {
        archetype
      }
    }

    const cohortUsers = await prisma.user.findMany({
      where: cohortWhere,
      select: { id: true }
    })

    const cohortUserIds = cohortUsers.map(u => u.id)
    const cohortSize = cohortUserIds.length

    if (cohortSize === 0) {
      return { cohortSize: 0, day1: 0, day3: 0, day7: 0, day30: 0 }
    }

    // Check retention at different intervals
    const day1Date = new Date(cohortDate.getTime() + 24 * 60 * 60 * 1000)
    const day3Date = new Date(cohortDate.getTime() + 3 * 24 * 60 * 60 * 1000)
    const day7Date = new Date(cohortDate.getTime() + 7 * 24 * 60 * 60 * 1000)
    const day30Date = new Date(cohortDate.getTime() + 30 * 24 * 60 * 60 * 1000)

    const [day1Active, day3Active, day7Active, day30Active] = await Promise.all([
      this.getActiveUsers(cohortUserIds, day1Date),
      this.getActiveUsers(cohortUserIds, day3Date),
      this.getActiveUsers(cohortUserIds, day7Date),
      this.getActiveUsers(cohortUserIds, day30Date)
    ])

    return {
      cohortSize,
      day1: day1Active / cohortSize,
      day3: day3Active / cohortSize,
      day7: day7Active / cohortSize,
      day30: day30Active / cohortSize
    }
  }

  // Get active users on a specific date
  private static async getActiveUsers(
    userIds: string[],
    date: Date
  ): Promise<number> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const activeUsers = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    return activeUsers.length
  }

  // Get real-time conversion metrics
  static async getRealTimeMetrics(): Promise<{
    todayVisitors: number
    todaySignups: number
    todayConversions: number
    liveConversionRate: number
    topPerformingArchetype: string
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [visitors, signups, conversions] = await Promise.all([
      prisma.conversionEvent.count({
        where: {
          eventType: 'landing_page_view',
          createdAt: { gte: today }
        }
      }),
      prisma.conversionEvent.count({
        where: {
          eventType: 'account_created',
          createdAt: { gte: today }
        }
      }),
      prisma.conversionEvent.count({
        where: {
          eventType: 'subscription_started',
          createdAt: { gte: today }
        }
      })
    ])

    // Get top performing archetype
    const archetypePerformance = await prisma.conversionEvent.groupBy({
      by: ['archetype'],
      where: {
        eventType: 'subscription_started',
        createdAt: { gte: today },
        archetype: { not: null }
      },
      _count: true,
      orderBy: {
        _count: {
          archetype: 'desc'
        }
      },
      take: 1
    })

    return {
      todayVisitors: visitors,
      todaySignups: signups,
      todayConversions: conversions,
      liveConversionRate: visitors > 0 ? conversions / visitors : 0,
      topPerformingArchetype: archetypePerformance[0]?.archetype || 'none'
    }
  }
}