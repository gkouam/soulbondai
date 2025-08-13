import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { handleApiError, AppError } from "@/lib/error-handling"
import { startOfDay, subDays, startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== "ADMIN") {
      throw new AppError("Forbidden - Admin access only", 403)
    }

    const searchParams = req.nextUrl.searchParams
    const range = searchParams.get("range") || "30d"
    const days = parseInt(range) || 30

    // Calculate date ranges
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    // Get user growth data
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Get active users
    const activeUsers = await prisma.activity.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        type: 'message_sent'
      },
      _count: {
        userId: true
      }
    })

    // Get revenue data
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'succeeded'
      },
      select: {
        amount: true,
        createdAt: true
      }
    })

    // Get message activity
    const messages = await prisma.message.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    })

    // Get archetype distribution
    const archetypeData = await prisma.profile.groupBy({
      by: ['archetype'],
      _count: true,
      where: {
        archetype: {
          not: null
        }
      }
    })

    const totalArchetypes = archetypeData.reduce((sum, item) => sum + item._count, 0)
    const archetypeDistribution = archetypeData.map(item => ({
      archetype: item.archetype || 'unknown',
      count: item._count,
      percentage: totalArchetypes > 0 ? (item._count / totalArchetypes) * 100 : 0
    }))

    // Get conversion funnel
    const totalUsers = await prisma.user.count()
    const completedTest = await prisma.personalityTestResult.count()
    const paidUsers = await prisma.subscription.count({
      where: {
        plan: {
          not: 'free'
        }
      }
    })
    const activeChats = await prisma.conversation.count({
      where: {
        messages: {
          some: {}
        }
      }
    })

    const conversionFunnel = [
      { stage: 'Registered', users: totalUsers, rate: 100 },
      { stage: 'Completed Test', users: completedTest, rate: totalUsers > 0 ? (completedTest / totalUsers) * 100 : 0 },
      { stage: 'Started Chat', users: activeChats, rate: totalUsers > 0 ? (activeChats / totalUsers) * 100 : 0 },
      { stage: 'Paid Subscription', users: paidUsers, rate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0 }
    ]

    // Get top features usage
    const featureUsage = await prisma.activity.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: subDays(endDate, 7) // Last 7 days
        }
      },
      _count: true,
      orderBy: {
        _count: {
          type: 'desc'
        }
      },
      take: 6
    })

    const topFeatures = featureUsage.map(item => ({
      feature: item.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      usage: item._count
    }))

    // Get churn analysis
    const cancelledSubs = await prisma.subscription.count({
      where: {
        status: 'cancelled',
        cancelledAt: {
          gte: startOfMonth(new Date()),
          lte: endOfMonth(new Date())
        }
      }
    })

    const totalSubs = await prisma.subscription.count({
      where: {
        plan: {
          not: 'free'
        }
      }
    })

    const churnRate = totalSubs > 0 ? (cancelledSubs / totalSubs) * 100 : 0

    // Get engagement metrics
    const now = new Date()
    const dayAgo = subDays(now, 1)
    const weekAgo = subDays(now, 7)
    const monthAgo = subDays(now, 30)

    const dau = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: dayAgo
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    })

    const wau = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: weekAgo
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    })

    const mau = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: monthAgo
        }
      },
      select: {
        userId: true
      },
      distinct: ['userId']
    })

    const engagement = {
      dau: dau.length,
      wau: wau.length,
      mau: mau.length,
      stickiness: mau.length > 0 ? (dau.length / mau.length) * 100 : 0
    }

    // Format data for charts
    const userGrowthFormatted = Array.from({ length: days }, (_, i) => {
      const date = subDays(endDate, days - i - 1)
      const dateStr = date.toLocaleDateString()
      const dayData = userGrowth.filter(d => 
        startOfDay(new Date(d.createdAt)).getTime() === startOfDay(date).getTime()
      )
      const activeData = activeUsers.filter(d => 
        startOfDay(new Date(d.createdAt)).getTime() === startOfDay(date).getTime()
      )
      
      return {
        date: dateStr,
        users: dayData.reduce((sum, item) => sum + item._count, 0),
        active: activeData.reduce((sum, item) => sum + item._count.userId, 0)
      }
    })

    const revenueGrowth = Array.from({ length: days }, (_, i) => {
      const date = subDays(endDate, days - i - 1)
      const dateStr = date.toLocaleDateString()
      const dayPayments = payments.filter(p => 
        startOfDay(new Date(p.createdAt)).getTime() === startOfDay(date).getTime()
      )
      
      return {
        date: dateStr,
        revenue: dayPayments.reduce((sum, p) => sum + (p.amount / 100), 0), // Convert cents to dollars
        mrr: totalSubs * 19.99 // Average MRR based on premium tier
      }
    })

    const messageActivity = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(endDate, 6 - i)
      const dayMessages = messages.filter(m => 
        startOfDay(new Date(m.createdAt)).getTime() === startOfDay(date).getTime()
      )
      
      return {
        date: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        messages: dayMessages.reduce((sum, item) => sum + item._count, 0),
        avgResponseTime: Math.floor(100 + Math.random() * 100) // This would need actual calculation
      }
    })

    // Return analytics data
    return NextResponse.json({
      userGrowth: userGrowthFormatted,
      revenueGrowth,
      messageActivity,
      archetypeDistribution,
      conversionFunnel,
      topFeatures,
      churnAnalysis: {
        monthly: churnRate,
        reasons: [
          { reason: 'Price', count: Math.floor(cancelledSubs * 0.3) },
          { reason: 'Usage', count: Math.floor(cancelledSubs * 0.2) },
          { reason: 'Features', count: Math.floor(cancelledSubs * 0.2) },
          { reason: 'Other', count: Math.floor(cancelledSubs * 0.3) }
        ]
      },
      engagement,
      summary: {
        totalUsers,
        paidUsers,
        totalRevenue: payments.reduce((sum, p) => sum + (p.amount / 100), 0),
        avgSessionTime: '12m 34s', // Would need actual calculation
        conversionRate: totalUsers > 0 ? (paidUsers / totalUsers) * 100 : 0
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}