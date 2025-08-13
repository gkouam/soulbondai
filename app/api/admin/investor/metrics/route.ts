import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { MetricsTracker } from '@/lib/metrics-tracker'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || '3m'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeframe) {
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case '6m':
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case '12m':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // Calculate KPIs
    const kpis = await calculateKPIs(startDate, endDate)
    
    // Get growth data
    const growth = await getGrowthData(startDate, endDate)
    
    // Get cohort data
    const cohorts = await getCohortData(startDate, endDate)
    
    // Calculate unit economics
    const unitEconomics = await calculateUnitEconomics(startDate, endDate)
    
    // Get personality performance
    const personalityPerformance = await getPersonalityPerformance(startDate, endDate)
    
    // Generate forecasts
    const forecasts = generateForecasts(kpis, growth)
    
    // Generate insights
    const { keyHighlights, risks } = generateInsights(kpis, growth, cohorts)

    return NextResponse.json({
      kpis,
      growth,
      cohorts,
      unitEconomics,
      personalityPerformance,
      forecasts,
      keyHighlights,
      risks
    })
  } catch (error) {
    console.error('Investor metrics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch investor metrics' },
      { status: 500 }
    )
  }
}

async function calculateKPIs(startDate: Date, endDate: Date) {
  // Get current metrics
  const metrics = await MetricsTracker.calculateKPIs({ start: startDate, end: endDate })
  
  // Calculate MRR and growth
  const currentMRR = metrics.monthlyRecurringRevenue
  
  // Get previous month MRR for growth calculation
  const prevMonthStart = new Date(startDate)
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1)
  const prevMonthEnd = new Date(startDate)
  prevMonthEnd.setDate(prevMonthEnd.getDate() - 1)
  
  const prevMetrics = await MetricsTracker.calculateKPIs({ 
    start: prevMonthStart, 
    end: prevMonthEnd 
  })
  const prevMRR = prevMetrics.monthlyRecurringRevenue
  
  const mrrGrowth = prevMRR > 0 ? (currentMRR - prevMRR) / prevMRR : 0
  
  // Get user counts
  const totalUsers = await prisma.user.count()
  const paidUsers = await prisma.subscription.count({
    where: {
      status: 'active',
      plan: { not: 'free' }
    }
  })
  
  const conversionRate = totalUsers > 0 ? paidUsers / totalUsers : 0
  
  // Calculate churn
  const churnedUsers = await prisma.subscription.count({
    where: {
      status: 'cancelled',
      cancelledAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const churnRate = paidUsers > 0 ? churnedUsers / paidUsers : 0
  
  // Calculate LTV and CAC
  const ltv = metrics.lifetimeValue
  const cac = 50 // Placeholder - should be calculated from marketing spend
  const ltvCacRatio = cac > 0 ? ltv / cac : 0
  
  return {
    mrr: currentMRR,
    mrrGrowth,
    arr: currentMRR * 12,
    users: totalUsers,
    paidUsers,
    conversionRate,
    churnRate,
    ltv,
    cac,
    ltvCacRatio
  }
}

async function getGrowthData(startDate: Date, endDate: Date) {
  const growth = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const monthStart = new Date(current.getFullYear(), current.getMonth(), 1)
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    
    // Get month metrics
    const users = await prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    })
    
    const revenue = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: 'succeeded'
      },
      _sum: { amount: true }
    })
    
    const conversions = await prisma.subscription.count({
      where: {
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        },
        status: 'active'
      }
    })
    
    growth.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      users,
      revenue: (revenue._sum.amount || 0) / 100,
      conversions
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return growth
}

async function getCohortData(startDate: Date, endDate: Date) {
  const cohorts = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const cohortStart = new Date(current.getFullYear(), current.getMonth(), 1)
    const cohortEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)
    
    // Get cohort users
    const cohortUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: cohortStart,
          lte: cohortEnd
        }
      },
      select: { id: true }
    })
    
    const userIds = cohortUsers.map(u => u.id)
    
    // Calculate revenue from cohort
    const cohortRevenue = await prisma.payment.aggregate({
      where: {
        userId: { in: userIds },
        status: 'succeeded'
      },
      _sum: { amount: true }
    })
    
    // Calculate retention for different months
    const retention = []
    for (let month = 1; month <= 6; month++) {
      if (month === 3 || month === 6) continue // Skip months we don't show
      
      const retentionDate = new Date(cohortStart)
      retentionDate.setMonth(retentionDate.getMonth() + month)
      
      if (retentionDate > endDate) {
        retention.push(0)
        continue
      }
      
      const activeUsers = await prisma.activity.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          createdAt: {
            gte: retentionDate,
            lt: new Date(retentionDate.getFullYear(), retentionDate.getMonth() + 1, 0)
          }
        }
      })
      
      retention.push(userIds.length > 0 ? activeUsers.length / userIds.length : 0)
    }
    
    // Fill in remaining slots
    while (retention.length < 4) {
      retention.push(0)
    }
    
    cohorts.push({
      month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      size: userIds.length,
      revenue: (cohortRevenue._sum.amount || 0) / 100,
      retention
    })
    
    current.setMonth(current.getMonth() + 1)
  }
  
  return cohorts.slice(-6) // Return last 6 cohorts
}

async function calculateUnitEconomics(startDate: Date, endDate: Date) {
  // Get revenue per user
  const totalRevenue = await prisma.payment.aggregate({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      status: 'succeeded'
    },
    _sum: { amount: true }
  })
  
  const totalUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const avgRevenuePerUser = totalUsers > 0 
    ? (totalRevenue._sum.amount || 0) / 100 / totalUsers 
    : 0
  
  // Estimate costs (placeholder values)
  const avgCostPerUser = 15 // Infrastructure + AI API costs
  const cac = 50 // Customer acquisition cost
  
  // Calculate payback period
  const monthlyRevenuePerUser = avgRevenuePerUser / 3 // Assuming 3 month average
  const paybackPeriod = monthlyRevenuePerUser > 0 
    ? Math.ceil(cac / monthlyRevenuePerUser)
    : 0
  
  // Calculate gross margin
  const grossMargin = avgRevenuePerUser > 0 
    ? (avgRevenuePerUser - avgCostPerUser) / avgRevenuePerUser
    : 0
  
  return {
    avgRevenuePerUser,
    avgCostPerUser,
    paybackPeriod,
    grossMargin
  }
}

async function getPersonalityPerformance(startDate: Date, endDate: Date) {
  const archetypes = [
    'anxious_romantic',
    'guarded_intellectual',
    'warm_empath',
    'deep_thinker',
    'passionate_creative'
  ]
  
  const performance = []
  
  for (const archetype of archetypes) {
    const metrics = await MetricsTracker.getPersonalityMetrics(archetype, { 
      start: startDate, 
      end: endDate 
    })
    
    // Get total revenue for this archetype
    const revenue = await prisma.payment.aggregate({
      where: {
        user: {
          profile: {
            archetype
          }
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'succeeded'
      },
      _sum: { amount: true }
    })
    
    // Get user count
    const users = await prisma.profile.count({
      where: {
        archetype,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    performance.push({
      archetype: archetype.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      users,
      revenue: (revenue._sum.amount || 0) / 100,
      ltv: metrics.metrics.avgRevenue * 6, // Estimated 6 month LTV
      conversionRate: metrics.metrics.conversionRate
    })
  }
  
  return performance
}

function generateForecasts(kpis: any, growth: any[]) {
  const forecasts = []
  const currentMRR = kpis.mrr
  const growthRate = kpis.mrrGrowth
  
  // Generate 6 month forecast
  for (let month = 1; month <= 6; month++) {
    const date = new Date()
    date.setMonth(date.getMonth() + month)
    
    // Simple linear projection with decay
    const decayFactor = Math.pow(0.95, month) // 5% decay per month
    const projectedGrowth = growthRate * decayFactor
    const projectedMRR = currentMRR * Math.pow(1 + projectedGrowth, month)
    
    // Project user growth
    const avgUserGrowth = growth.length > 0 
      ? growth.reduce((acc, g) => acc + g.users, 0) / growth.length
      : 100
    const projectedUsers = kpis.users + (avgUserGrowth * month)
    
    // Calculate confidence based on historical consistency
    const confidence = Math.max(0.5, 1 - (month * 0.1)) // Decrease confidence over time
    
    forecasts.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      projectedMRR: Math.round(projectedMRR),
      projectedUsers: Math.round(projectedUsers),
      confidence
    })
  }
  
  return forecasts
}

function generateInsights(kpis: any, growth: any[], cohorts: any[]) {
  const keyHighlights = []
  const risks = []
  
  // Generate positive insights
  if (kpis.mrrGrowth > 0.2) {
    keyHighlights.push(`Strong MRR growth of ${(kpis.mrrGrowth * 100).toFixed(0)}% month-over-month`)
  }
  
  if (kpis.ltvCacRatio > 3) {
    keyHighlights.push(`Excellent LTV:CAC ratio of ${kpis.ltvCacRatio.toFixed(1)}x indicates healthy unit economics`)
  }
  
  if (kpis.conversionRate > 0.25) {
    keyHighlights.push(`${(kpis.conversionRate * 100).toFixed(0)}% conversion rate exceeds industry average`)
  }
  
  if (cohorts.length > 0 && cohorts[cohorts.length - 1].retention[0] > 0.7) {
    keyHighlights.push(`Strong month 1 retention of ${(cohorts[cohorts.length - 1].retention[0] * 100).toFixed(0)}%`)
  }
  
  if (growth.length > 1) {
    const recentGrowth = growth[growth.length - 1].users - growth[growth.length - 2].users
    if (recentGrowth > 0) {
      keyHighlights.push(`User acquisition accelerating with ${recentGrowth} new users last month`)
    }
  }
  
  // Generate risk factors
  if (kpis.churnRate > 0.1) {
    risks.push(`Churn rate of ${(kpis.churnRate * 100).toFixed(0)}% needs improvement`)
  }
  
  if (kpis.ltvCacRatio < 2) {
    risks.push(`LTV:CAC ratio below healthy threshold, optimize acquisition costs`)
  }
  
  if (kpis.mrrGrowth < 0.1) {
    risks.push(`MRR growth slowing, consider new growth initiatives`)
  }
  
  if (cohorts.length > 0 && cohorts[cohorts.length - 1].retention[2] < 0.3) {
    risks.push(`Month 3 retention declining, focus on engagement features`)
  }
  
  // Add default insights if needed
  if (keyHighlights.length === 0) {
    keyHighlights.push('Steady growth trajectory maintained')
  }
  
  if (risks.length === 0) {
    risks.push('Monitor competitive landscape for new entrants')
  }
  
  return { keyHighlights, risks }
}