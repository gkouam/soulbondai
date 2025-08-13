import { prisma } from "@/lib/prisma"
import { startOfDay, subDays, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from "date-fns"

export interface AnalyticsMetrics {
  users: {
    total: number
    new: number
    active: number
    churn: number
  }
  revenue: {
    total: number
    mrr: number
    arr: number
    avgTicket: number
  }
  engagement: {
    dau: number
    wau: number
    mau: number
    stickiness: number
    avgSessionDuration: number
    messagesPerUser: number
  }
  conversion: {
    signupToTest: number
    testToChat: number
    chatToPaid: number
    overallConversion: number
  }
}

export class AnalyticsService {
  static async getMetrics(period: 'day' | 'week' | 'month' = 'month'): Promise<AnalyticsMetrics> {
    const now = new Date()
    let startDate: Date
    let endDate = endOfDay(now)

    switch (period) {
      case 'day':
        startDate = startOfDay(now)
        break
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
    }

    // User metrics
    const totalUsers = await prisma.user.count()
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    const activeUsers = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: { userId: true },
      distinct: ['userId']
    })

    const churnedUsers = await prisma.subscription.count({
      where: {
        cancelledAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })

    // Revenue metrics
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'succeeded'
      },
      select: { amount: true }
    })

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount / 100), 0)
    const avgTicket = payments.length > 0 ? totalRevenue / payments.length : 0

    const activeSubs = await prisma.subscription.findMany({
      where: {
        status: 'active',
        plan: { not: 'free' }
      },
      select: { plan: true }
    })

    // Calculate MRR based on actual plans
    const planPrices: Record<string, number> = {
      basic: 9.99,
      premium: 19.99,
      ultimate: 29.99
    }

    const mrr = activeSubs.reduce((sum, sub) => {
      return sum + (planPrices[sub.plan] || 0)
    }, 0)

    const arr = mrr * 12

    // Engagement metrics
    const dayAgo = subDays(now, 1)
    const weekAgo = subDays(now, 7)
    const monthAgo = subDays(now, 30)

    const dauUsers = await prisma.activity.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: { userId: true },
      distinct: ['userId']
    })

    const wauUsers = await prisma.activity.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { userId: true },
      distinct: ['userId']
    })

    const mauUsers = await prisma.activity.findMany({
      where: { createdAt: { gte: monthAgo } },
      select: { userId: true },
      distinct: ['userId']
    })

    const dau = dauUsers.length
    const wau = wauUsers.length
    const mau = mauUsers.length
    const stickiness = mau > 0 ? (dau / mau) * 100 : 0

    // Calculate average session duration (simplified)
    const sessions = await prisma.activity.findMany({
      where: {
        createdAt: { gte: startDate },
        type: 'message_sent'
      },
      orderBy: { createdAt: 'asc' }
    })

    // Group by user and calculate session length
    let totalDuration = 0
    let sessionCount = 0
    const userSessions = new Map<string, Date[]>()

    sessions.forEach(activity => {
      if (!userSessions.has(activity.userId)) {
        userSessions.set(activity.userId, [])
      }
      userSessions.get(activity.userId)?.push(activity.createdAt)
    })

    userSessions.forEach((timestamps) => {
      if (timestamps.length > 1) {
        const sessionLength = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()
        totalDuration += sessionLength
        sessionCount++
      }
    })

    const avgSessionDuration = sessionCount > 0 ? totalDuration / sessionCount / 1000 / 60 : 0 // in minutes

    // Messages per user
    const messageCount = await prisma.message.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        role: 'user'
      }
    })

    const messagesPerUser = activeUsers.length > 0 ? messageCount / activeUsers.length : 0

    // Conversion metrics
    const usersWithTest = await prisma.personalityTestResult.count()
    const usersWithChat = await prisma.conversation.count({
      where: {
        messages: { some: {} }
      }
    })
    const paidUsers = await prisma.subscription.count({
      where: { plan: { not: 'free' } }
    })

    const signupToTest = totalUsers > 0 ? (usersWithTest / totalUsers) * 100 : 0
    const testToChat = usersWithTest > 0 ? (usersWithChat / usersWithTest) * 100 : 0
    const chatToPaid = usersWithChat > 0 ? (paidUsers / usersWithChat) * 100 : 0
    const overallConversion = totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0

    return {
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers.length,
        churn: churnedUsers
      },
      revenue: {
        total: totalRevenue,
        mrr,
        arr,
        avgTicket
      },
      engagement: {
        dau,
        wau,
        mau,
        stickiness,
        avgSessionDuration,
        messagesPerUser
      },
      conversion: {
        signupToTest,
        testToChat,
        chatToPaid,
        overallConversion
      }
    }
  }

  static async getGrowthTrends(days: number = 30) {
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const dailyData = []

    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - i - 1)
      const dayStart = startOfDay(date)
      const dayEnd = endOfDay(date)

      const [users, revenue, messages] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        }),
        prisma.payment.aggregate({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            },
            status: 'succeeded'
          },
          _sum: { amount: true }
        }),
        prisma.message.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd
            }
          }
        })
      ])

      dailyData.push({
        date: date.toISOString().split('T')[0],
        users,
        revenue: (revenue._sum.amount || 0) / 100,
        messages
      })
    }

    return dailyData
  }

  static async getArchetypeDistribution() {
    const profiles = await prisma.profile.groupBy({
      by: ['archetype'],
      _count: true,
      where: { archetype: { not: null } }
    })

    const total = profiles.reduce((sum, p) => sum + p._count, 0)

    return profiles.map(p => ({
      archetype: p.archetype || 'unknown',
      count: p._count,
      percentage: total > 0 ? (p._count / total) * 100 : 0
    }))
  }

  static async getTopFeatures(limit: number = 10) {
    const features = await prisma.activity.groupBy({
      by: ['type'],
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: limit,
      where: {
        createdAt: { gte: subDays(new Date(), 7) }
      }
    })

    return features.map(f => ({
      feature: f.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      usage: f._count
    }))
  }

  static async getCrisisEvents(days: number = 30) {
    const activities = await prisma.activity.findMany({
      where: {
        type: 'crisis_detected',
        createdAt: { gte: subDays(new Date(), days) }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return activities.map(a => ({
      id: a.id,
      userId: a.userId,
      timestamp: a.createdAt,
      metadata: a.metadata as any
    }))
  }
}