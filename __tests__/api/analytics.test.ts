import { createMocks } from 'node-mocks-http'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getServerSession } from 'next-auth'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    profile: {
      findMany: jest.fn(),
      groupBy: jest.fn()
    },
    message: {
      count: jest.fn(),
      groupBy: jest.fn()
    },
    conversation: {
      count: jest.fn(),
      findMany: jest.fn()
    },
    subscription: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn()
    },
    activity: {
      findMany: jest.fn(),
      groupBy: jest.fn()
    }
  }
}))

import { prisma } from '@/lib/prisma'
import analyticsHandler from '@/app/api/analytics/route'
import adminStatsHandler from '@/app/api/admin/stats/route'

describe('/api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get engagement metrics', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.message.count as jest.Mock).mockResolvedValue(5000)
    ;(prisma.conversation.count as jest.Mock).mockResolvedValue(100)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(50)
    ;(prisma.message.groupBy as jest.Mock).mockResolvedValue([
      { _avg: { responseTime: 2500 } }
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: 'engagement-metrics'
      }
    })

    await analyticsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.metrics).toBeDefined()
    expect(jsonData.metrics.avgMessagesPerDay).toBeDefined()
  })

  it('should get personality insights', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.profile.groupBy as jest.Mock).mockResolvedValue([
      { archetype: 'anxious_romantic', _count: { archetype: 35 } },
      { archetype: 'warm_empath', _count: { archetype: 25 } },
      { archetype: 'deep_thinker', _count: { archetype: 15 } },
      { archetype: 'guarded_intellectual', _count: { archetype: 15 } },
      { archetype: 'passionate_creative', _count: { archetype: 10 } }
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: 'personality-insights'
      }
    })

    await analyticsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.insights).toBeDefined()
    expect(jsonData.insights).toHaveLength(5)
    expect(jsonData.insights[0].archetype).toBeDefined()
  })

  it('should get conversion metrics', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(1000)
    ;(prisma.profile.findMany as jest.Mock).mockResolvedValue([
      { personalityTestCompleted: true },
      { personalityTestCompleted: true },
      { personalityTestCompleted: false }
    ])
    ;(prisma.subscription.count as jest.Mock).mockResolvedValue(150)

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: 'conversion-metrics',
        timeframe: 'month'
      }
    })

    await analyticsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.funnel).toBeDefined()
    expect(Array.isArray(jsonData.funnel)).toBe(true)
  })

  it('should get crisis statistics', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.activity.findMany as jest.Mock).mockResolvedValue([
      { type: 'crisis_detected', metadata: { severity: 'high', type: 'suicide' } },
      { type: 'crisis_detected', metadata: { severity: 'moderate', type: 'self_harm' } },
      { type: 'crisis_resolved', metadata: {} }
    ])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: 'crisis-stats',
        timeframe: 'week'
      }
    })

    await analyticsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.stats).toBeDefined()
    expect(jsonData.stats.total).toBe(2)
    expect(jsonData.stats.resolved).toBe(1)
  })

  it('should require admin role for sensitive data', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'USER' // Not admin
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        type: 'engagement-metrics'
      }
    })

    await analyticsHandler(req, res)

    expect(res._getStatusCode()).toBe(403)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Unauthorized - Admin access required')
  })
})

describe('/api/admin/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should get comprehensive admin statistics', async () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(1000)
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([
      { createdAt: new Date('2025-01-01') },
      { createdAt: new Date('2025-01-02') }
    ])
    ;(prisma.subscription.count as jest.Mock).mockResolvedValue(150)
    ;(prisma.subscription.findMany as jest.Mock).mockResolvedValue([
      { tier: 'premium', amount: 19.99 },
      { tier: 'ultimate', amount: 39.99 }
    ])
    ;(prisma.message.count as jest.Mock).mockResolvedValue(50000)

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        timeframe: 'month'
      }
    })

    await adminStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.stats).toBeDefined()
    expect(jsonData.stats.totalUsers).toBe(1000)
    expect(jsonData.stats.totalRevenue).toBeDefined()
    expect(jsonData.userGrowth).toBeDefined()
  })

  it('should calculate growth rates', async () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    }

    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.count as jest.Mock)
      .mockResolvedValueOnce(1000) // Total
      .mockResolvedValueOnce(100)  // Active today
      .mockResolvedValueOnce(950)  // Total yesterday
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.subscription.count as jest.Mock).mockResolvedValue(0)
    ;(prisma.subscription.findMany as jest.Mock).mockResolvedValue([])

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        timeframe: 'day'
      }
    })

    await adminStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.stats.growthRate).toBeDefined()
  })

  it('should aggregate revenue metrics', async () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
        role: 'ADMIN'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.count as jest.Mock).mockResolvedValue(100)
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])
    ;(prisma.subscription.findMany as jest.Mock).mockResolvedValue([
      { tier: 'basic', interval: 'monthly', amount: 9.99, createdAt: new Date() },
      { tier: 'premium', interval: 'monthly', amount: 19.99, createdAt: new Date() },
      { tier: 'premium', interval: 'yearly', amount: 199.99, createdAt: new Date() },
      { tier: 'ultimate', interval: 'monthly', amount: 39.99, createdAt: new Date() }
    ])
    ;(prisma.subscription.count as jest.Mock).mockResolvedValue(4)

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        timeframe: 'month'
      }
    })

    await adminStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.stats.totalRevenue).toBe(269.96)
    expect(jsonData.stats.avgRevenuePerUser).toBeDefined()
    expect(jsonData.revenueMetrics).toBeDefined()
  })

  it('should reject non-admin users', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
        role: 'USER'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const { req, res } = createMocks({
      method: 'GET'
    })

    await adminStatsHandler(req, res)

    expect(res._getStatusCode()).toBe(403)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Admin access required')
  })
})