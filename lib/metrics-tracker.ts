import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { ConversionFunnel } from '@/lib/analytics/conversion-funnel'

export interface KPIMetrics {
  // Acquisition Metrics
  visitorToTestStart: number      // Target: 42%
  testCompletion: number          // Target: 89%
  testToSignup: number            // Target: 94%
  
  // Activation Metrics
  firstMessageSent: number        // Target: 91%
  firstDayRetention: number       // Target: 76%
  
  // Revenue Metrics
  freeToPayConversion: number     // Target: 27%
  averageRevenuePerUser: number   // Target: $112
  lifetimeValue: number           // Target: $342
  monthlyRecurringRevenue: number // Target: $100k
  
  // Engagement Metrics
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  averageSessionDuration: number
  messagesPerUser: number
  
  // Quality Metrics
  sentimentScore: number
  trustProgressRate: number
  milestoneAchievementRate: number
  featureAdoptionRate: number
}

export interface PersonalityMetrics {
  archetype: string
  metrics: {
    conversionRate: number
    retentionRate: number
    avgTrustLevel: number
    avgRevenue: number
    engagementScore: number
  }
}

export class MetricsTracker {
  // Track a metric event
  static async track(
    eventName: string,
    userId?: string,
    properties?: Record<string, any>
  ): Promise<void> {
    try {
      // Store in database
      await prisma.activity.create({
        data: {
          userId: userId || 'system',
          type: eventName,
          metadata: properties || {}
        }
      })
      
      // Update real-time counters in Redis
      const today = new Date().toISOString().split('T')[0]
      const key = `metrics:${eventName}:${today}`
      await redis?.incr(key)
      
      // Update user-specific metrics if userId provided
      if (userId) {
        const userKey = `metrics:user:${userId}:${eventName}`
        await redis?.incr(userKey)
      }
      
      // Track in conversion funnel if applicable
      const funnelEvents = [
        'landing_page_view',
        'test_started',
        'test_completed',
        'account_created',
        'first_message_sent',
        'subscription_started'
      ]
      
      if (funnelEvents.includes(eventName)) {
        await ConversionFunnel.trackStage(userId, eventName as any, properties)
      }
    } catch (error) {
      console.error('Error tracking metric:', error)
    }
  }

  // Calculate KPI metrics
  static async calculateKPIs(dateRange: { start: Date, end: Date }): Promise<KPIMetrics> {
    const { start, end } = dateRange
    
    // Get funnel metrics
    const funnelMetrics = await ConversionFunnel.getFunnelMetrics(start, end)
    
    // Calculate acquisition metrics
    const landingViews = funnelMetrics.find(m => m.stage === 'landing_page_view')?.count || 0
    const testStarts = funnelMetrics.find(m => m.stage === 'test_started')?.count || 0
    const testCompletes = funnelMetrics.find(m => m.stage === 'test_completed')?.count || 0
    const signups = funnelMetrics.find(m => m.stage === 'account_created')?.count || 0
    
    const visitorToTestStart = landingViews > 0 ? testStarts / landingViews : 0
    const testCompletion = testStarts > 0 ? testCompletes / testStarts : 0
    const testToSignup = testCompletes > 0 ? signups / testCompletes : 0
    
    // Calculate activation metrics
    const firstMessages = funnelMetrics.find(m => m.stage === 'first_message_sent')?.count || 0
    const firstMessageSent = signups > 0 ? firstMessages / signups : 0
    
    // Get retention metrics
    const retentionData = await this.calculateRetention(start, end)
    
    // Calculate revenue metrics
    const revenueData = await this.calculateRevenue(start, end)
    
    // Calculate engagement metrics
    const engagementData = await this.calculateEngagement(start, end)
    
    // Calculate quality metrics
    const qualityData = await this.calculateQuality(start, end)
    
    return {
      // Acquisition
      visitorToTestStart,
      testCompletion,
      testToSignup,
      
      // Activation
      firstMessageSent,
      firstDayRetention: retentionData.day1,
      
      // Revenue
      freeToPayConversion: revenueData.conversionRate,
      averageRevenuePerUser: revenueData.arpu,
      lifetimeValue: revenueData.ltv,
      monthlyRecurringRevenue: revenueData.mrr,
      
      // Engagement
      dailyActiveUsers: engagementData.dau,
      weeklyActiveUsers: engagementData.wau,
      monthlyActiveUsers: engagementData.mau,
      averageSessionDuration: engagementData.avgSessionDuration,
      messagesPerUser: engagementData.messagesPerUser,
      
      // Quality
      sentimentScore: qualityData.sentimentScore,
      trustProgressRate: qualityData.trustProgressRate,
      milestoneAchievementRate: qualityData.milestoneRate,
      featureAdoptionRate: qualityData.featureAdoption
    }
  }

  // Calculate retention metrics
  private static async calculateRetention(start: Date, end: Date) {
    // Get cohort retention
    const cohortRetention = await ConversionFunnel.getCohortRetention(start)
    
    return {
      day1: cohortRetention.day1,
      day3: cohortRetention.day3,
      day7: cohortRetention.day7,
      day30: cohortRetention.day30
    }
  }

  // Calculate revenue metrics
  private static async calculateRevenue(start: Date, end: Date) {
    // Get active subscriptions
    const subscriptions = await prisma.subscription.count({
      where: {
        status: 'active',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    // Get total users
    const totalUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    // Calculate conversion rate
    const conversionRate = totalUsers > 0 ? subscriptions / totalUsers : 0
    
    // Calculate MRR
    const mrrData = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { plan: true }
    })
    
    const mrr = mrrData.reduce((total, sub) => {
      const amount = sub.plan === 'basic' ? 9.99 :
                    sub.plan === 'premium' ? 19.99 :
                    sub.plan === 'ultimate' ? 39.99 : 0
      return total + amount
    }, 0)
    
    // Calculate ARPU
    const arpu = totalUsers > 0 ? mrr / totalUsers : 0
    
    // Calculate LTV (simplified)
    const avgRetentionMonths = 6
    const ltv = arpu * avgRetentionMonths
    
    return {
      conversionRate,
      mrr,
      arpu,
      ltv
    }
  }

  // Calculate engagement metrics
  private static async calculateEngagement(start: Date, end: Date) {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get active users
    const [dau, wau, mau] = await Promise.all([
      prisma.activity.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneDayAgo }
        },
        _count: true
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneWeekAgo }
        },
        _count: true
      }),
      prisma.activity.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: oneMonthAgo }
        },
        _count: true
      })
    ])
    
    // Calculate average session duration
    const sessions = await prisma.activity.findMany({
      where: {
        type: 'session_end',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        metadata: true
      }
    })
    
    const avgSessionDuration = sessions.length > 0
      ? sessions.reduce((acc, s) => acc + (s.metadata?.duration || 0), 0) / sessions.length
      : 0
    
    // Calculate messages per user
    const messageCount = await prisma.message.count({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    const userCount = await prisma.user.count()
    const messagesPerUser = userCount > 0 ? messageCount / userCount : 0
    
    return {
      dau: dau.length,
      wau: wau.length,
      mau: mau.length,
      avgSessionDuration,
      messagesPerUser
    }
  }

  // Calculate quality metrics
  private static async calculateQuality(start: Date, end: Date) {
    // Get average sentiment score
    const messages = await prisma.message.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        },
        metadata: {
          not: null
        }
      },
      select: {
        metadata: true
      },
      take: 1000
    })
    
    const sentimentScores = messages
      .map(m => m.metadata?.sentiment?.score)
      .filter(s => s !== undefined)
    
    const sentimentScore = sentimentScores.length > 0
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length
      : 0.5
    
    // Calculate trust progress rate
    const profiles = await prisma.profile.findMany({
      where: {
        updatedAt: {
          gte: start,
          lte: end
        }
      },
      select: {
        trustLevel: true,
        createdAt: true
      }
    })
    
    const trustProgressRate = profiles.length > 0
      ? profiles.reduce((acc, p) => {
          const daysActive = Math.max(1, 
            (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          return acc + (p.trustLevel / daysActive)
        }, 0) / profiles.length
      : 0
    
    // Calculate milestone achievement rate
    const milestonesAchieved = await prisma.activity.count({
      where: {
        type: 'milestone_achieved',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    })
    
    const activeUsers = await prisma.user.count({
      where: {
        profile: {
          lastInteraction: {
            gte: start
          }
        }
      }
    })
    
    const milestoneRate = activeUsers > 0 ? milestonesAchieved / activeUsers : 0
    
    // Calculate feature adoption rate
    const featureUsage = await prisma.activity.groupBy({
      by: ['type'],
      where: {
        type: {
          in: ['voice_play', 'photo_share', 'personality_switch']
        },
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _count: true
    })
    
    const featureAdoption = activeUsers > 0
      ? featureUsage.length / (3 * activeUsers) // 3 features tracked
      : 0
    
    return {
      sentimentScore,
      trustProgressRate,
      milestoneRate,
      featureAdoption
    }
  }

  // Get personality-specific metrics
  static async getPersonalityMetrics(
    archetype: string,
    dateRange: { start: Date, end: Date }
  ): Promise<PersonalityMetrics> {
    const { start, end } = dateRange
    
    // Get users with this archetype
    const users = await prisma.profile.findMany({
      where: {
        archetype,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: {
          include: {
            subscription: true,
            messages: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    })
    
    if (users.length === 0) {
      return {
        archetype,
        metrics: {
          conversionRate: 0,
          retentionRate: 0,
          avgTrustLevel: 0,
          avgRevenue: 0,
          engagementScore: 0
        }
      }
    }
    
    // Calculate conversion rate
    const converted = users.filter(u => 
      u.user.subscription && u.user.subscription.plan !== 'free'
    ).length
    const conversionRate = converted / users.length
    
    // Calculate retention rate
    const retainedUsers = users.filter(u => {
      const lastActive = u.lastInteraction
      if (!lastActive) return false
      const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceActive < 7
    }).length
    const retentionRate = retainedUsers / users.length
    
    // Calculate average trust level
    const avgTrustLevel = users.reduce((acc, u) => acc + (u.trustLevel || 0), 0) / users.length
    
    // Calculate average revenue
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        userId: {
          in: users.map(u => u.userId)
        },
        status: 'succeeded',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      }
    })
    const avgRevenue = (totalRevenue._sum.amount || 0) / 100 / users.length
    
    // Calculate engagement score
    const engagementScore = users.reduce((acc, u) => {
      const messageCount = u.user.messages.length
      const hasSubscription = u.user.subscription?.plan !== 'free' ? 1 : 0
      const trustScore = (u.trustLevel || 0) / 100
      return acc + (messageCount / 10 + hasSubscription + trustScore) / 3
    }, 0) / users.length
    
    return {
      archetype,
      metrics: {
        conversionRate,
        retentionRate,
        avgTrustLevel,
        avgRevenue,
        engagementScore
      }
    }
  }

  // Real-time dashboard metrics
  static async getRealTimeDashboard(): Promise<{
    current: {
      activeUsers: number
      messagesPerMinute: number
      conversionRate: number
      revenue: number
    }
    trends: {
      userGrowth: number
      revenueGrowth: number
      engagementGrowth: number
    }
    alerts: {
      type: 'success' | 'warning' | 'error'
      message: string
    }[]
  }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Get current metrics
    const activeUsers = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: oneHourAgo }
      }
    })
    
    const recentMessages = await prisma.message.count({
      where: {
        createdAt: { gte: oneHourAgo }
      }
    })
    
    const todayConversions = await prisma.conversionEvent.count({
      where: {
        eventType: 'subscription_started',
        createdAt: { gte: oneDayAgo }
      }
    })
    
    const todaySignups = await prisma.user.count({
      where: {
        createdAt: { gte: oneDayAgo }
      }
    })
    
    const todayRevenue = await prisma.payment.aggregate({
      where: {
        createdAt: { gte: oneDayAgo },
        status: 'succeeded'
      },
      _sum: { amount: true }
    })
    
    // Calculate trends
    const lastWeekUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
          lt: oneDayAgo
        }
      }
    })
    
    const userGrowth = lastWeekUsers > 0 
      ? ((todaySignups - (lastWeekUsers / 7)) / (lastWeekUsers / 7)) * 100
      : 0
    
    // Generate alerts
    const alerts = []
    
    if (activeUsers.length > 100) {
      alerts.push({
        type: 'success' as const,
        message: `High activity: ${activeUsers.length} users active in the last hour`
      })
    }
    
    if (todayConversions / todaySignups > 0.3) {
      alerts.push({
        type: 'success' as const,
        message: `Excellent conversion rate: ${((todayConversions / todaySignups) * 100).toFixed(1)}%`
      })
    }
    
    if (recentMessages < 10) {
      alerts.push({
        type: 'warning' as const,
        message: 'Low message activity in the last hour'
      })
    }
    
    return {
      current: {
        activeUsers: activeUsers.length,
        messagesPerMinute: recentMessages / 60,
        conversionRate: todaySignups > 0 ? todayConversions / todaySignups : 0,
        revenue: (todayRevenue._sum.amount || 0) / 100
      },
      trends: {
        userGrowth,
        revenueGrowth: 0, // Would need historical data
        engagementGrowth: 0 // Would need historical data
      },
      alerts
    }
  }
}