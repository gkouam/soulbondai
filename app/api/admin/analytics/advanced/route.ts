import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { ConversionFunnel } from '@/lib/analytics/conversion-funnel'
import { ABTestingEngine } from '@/lib/ab-testing-engine'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.authorized) {
    return admin.response
  }

  try {
    const searchParams = req.nextUrl.searchParams
    const range = searchParams.get('range') || '7d'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
    }

    // Fetch all analytics data in parallel
    const [
      funnelMetrics,
      retentionData,
      revenueMetrics,
      personalityMetrics,
      experimentResults,
      realtimeMetrics
    ] = await Promise.all([
      ConversionFunnel.getFunnelMetrics(startDate, endDate),
      getRetentionCohorts(startDate, endDate),
      getRevenueMetrics(startDate, endDate),
      getPersonalityMetrics(startDate, endDate),
      getExperimentResults(),
      ConversionFunnel.getRealTimeMetrics()
    ])

    return NextResponse.json({
      funnel: funnelMetrics,
      retention: retentionData,
      revenue: revenueMetrics,
      personalities: personalityMetrics,
      experiments: experimentResults,
      realtime: realtimeMetrics
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// Get retention cohorts
async function getRetentionCohorts(startDate: Date, endDate: Date) {
  const cohorts = []
  const currentDate = new Date(endDate)
  
  // Get weekly cohorts
  for (let i = 0; i < 4; i++) {
    const cohortDate = new Date(currentDate)
    cohortDate.setDate(cohortDate.getDate() - (i * 7))
    
    const retention = await ConversionFunnel.getCohortRetention(cohortDate)
    
    cohorts.push({
      cohort: cohortDate.toISOString().split('T')[0],
      size: retention.cohortSize,
      day1: retention.day1,
      day3: retention.day3,
      day7: retention.day7,
      day30: retention.day30
    })
  }
  
  return cohorts
}

// Get revenue metrics
async function getRevenueMetrics(startDate: Date, endDate: Date) {
  // Get all active subscriptions
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: 'active',
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      user: {
        include: {
          payments: true
        }
      }
    }
  })

  // Calculate MRR
  const mrr = subscriptions.reduce((total, sub) => {
    const monthlyAmount = sub.plan === 'basic' ? 9.99 : 
                         sub.plan === 'premium' ? 19.99 : 
                         sub.plan === 'ultimate' ? 39.99 : 0
    return total + monthlyAmount
  }, 0)

  // Calculate ARR
  const arr = mrr * 12

  // Calculate ARPU
  const totalUsers = await prisma.user.count()
  const arpu = totalUsers > 0 ? mrr / totalUsers : 0

  // Calculate LTV (simplified: ARPU * average retention months)
  const avgRetentionMonths = 6 // This should be calculated from actual data
  const ltv = arpu * avgRetentionMonths

  // Get daily revenue trend
  const dailyRevenue = []
  const current = new Date(startDate)
  
  while (current <= endDate) {
    const dayStart = new Date(current)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(current)
    dayEnd.setHours(23, 59, 59, 999)
    
    const dayPayments = await prisma.payment.aggregate({
      where: {
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        },
        status: 'succeeded'
      },
      _sum: {
        amount: true
      }
    })
    
    dailyRevenue.push({
      date: current.toISOString().split('T')[0],
      revenue: (dayPayments._sum.amount || 0) / 100
    })
    
    current.setDate(current.getDate() + 1)
  }

  return [{
    date: endDate.toISOString().split('T')[0],
    mrr: Math.round(mrr),
    arr: Math.round(arr),
    arpu: Math.round(arpu * 100) / 100,
    ltv: Math.round(ltv),
    trend: dailyRevenue
  }]
}

// Get personality performance metrics
async function getPersonalityMetrics(startDate: Date, endDate: Date) {
  const archetypes = [
    'anxious_romantic',
    'guarded_intellectual',
    'warm_empath',
    'deep_thinker',
    'passionate_creative'
  ]
  
  const metrics = []
  
  for (const archetype of archetypes) {
    // Get user count
    const userCount = await prisma.profile.count({
      where: {
        archetype,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    // Get conversion rate
    const conversions = await prisma.conversionEvent.count({
      where: {
        archetype,
        eventType: 'subscription_started',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const signups = await prisma.conversionEvent.count({
      where: {
        archetype,
        eventType: 'account_created',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const conversionRate = signups > 0 ? conversions / signups : 0
    
    // Get average revenue
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
      _avg: {
        amount: true
      }
    })
    
    // Get retention (simplified)
    const retention = await ConversionFunnel.getCohortRetention(startDate, archetype)
    
    metrics.push({
      archetype: archetype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      users: userCount,
      conversionRate,
      avgRevenue: Math.round((revenue._avg.amount || 0) / 100),
      retention: retention.day7
    })
  }
  
  return metrics
}

// Get experiment results
async function getExperimentResults() {
  const experiments = [
    'pricing_optimization',
    'onboarding_flow',
    'day3_messaging'
  ]
  
  const results = []
  
  for (const experimentId of experiments) {
    try {
      const { experiment, results: expResults } = await ABTestingEngine.getExperimentResults(experimentId)
      
      if (experiment && expResults.length > 0) {
        const winner = expResults.find(r => r.isWinner) || expResults[0]
        const control = expResults.find(r => r.variant === 'control') || expResults[0]
        
        results.push({
          name: experiment.name,
          status: experiment.status,
          variant: winner.variant,
          conversionRate: winner.conversionRate,
          confidence: winner.confidence,
          improvement: control.conversionRate > 0 
            ? ((winner.conversionRate - control.conversionRate) / control.conversionRate) * 100
            : 0
        })
      }
    } catch (error) {
      console.error(`Error fetching experiment ${experimentId}:`, error)
    }
  }
  
  return results
}