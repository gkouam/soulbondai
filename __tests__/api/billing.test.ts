import { createMocks } from 'node-mocks-http'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn()
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn()
    },
    profile: {
      findUnique: jest.fn()
    }
  }
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn()
      }
    },
    customers: {
      create: jest.fn()
    },
    subscriptions: {
      retrieve: jest.fn(),
      cancel: jest.fn(),
      update: jest.fn()
    },
    coupons: {
      create: jest.fn()
    }
  }))
})

import { prisma } from '@/lib/prisma'
import createCheckoutHandler from '@/app/api/billing/create-checkout/route'
import cancelSubscriptionHandler from '@/app/api/billing/cancel/route'
import webhookHandler from '@/app/api/billing/webhook/route'

describe('/api/billing/create-checkout', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStripe = new (Stripe as any)()
  })

  it('should create checkout session for new subscription', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      stripeCustomerId: null
    })
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      trustLevel: 50,
      messageCount: 100
    })

    mockStripe.customers.create.mockResolvedValue({
      id: 'cus_123'
    })

    mockStripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/session123'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        tier: 'premium',
        interval: 'monthly'
      }
    })

    await createCheckoutHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.url).toBe('https://checkout.stripe.com/session123')
  })

  it('should apply discount for loyal users', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      stripeCustomerId: 'cus_123'
    })
    ;(prisma.profile.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-123',
      trustLevel: 85, // High trust for discount
      messageCount: 1500
    })

    mockStripe.coupons.create.mockResolvedValue({
      id: 'coupon_123'
    })

    mockStripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://checkout.stripe.com/session456'
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        tier: 'ultimate',
        interval: 'yearly'
      }
    })

    await createCheckoutHandler(req, res)

    expect(mockStripe.coupons.create).toHaveBeenCalled()
    expect(res._getStatusCode()).toBe(200)
  })

  it('should reject invalid tier', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        tier: 'invalid-tier',
        interval: 'monthly'
      }
    })

    await createCheckoutHandler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Invalid pricing tier')
  })

  it('should require authentication', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        tier: 'premium',
        interval: 'monthly'
      }
    })

    await createCheckoutHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('Unauthorized')
  })
})

describe('/api/billing/cancel', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStripe = new (Stripe as any)()
  })

  it('should cancel active subscription', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      id: 'sub-123',
      userId: 'user-123',
      stripeSubscriptionId: 'stripe_sub_123',
      status: 'active'
    })

    mockStripe.subscriptions.cancel.mockResolvedValue({
      id: 'stripe_sub_123',
      status: 'canceled'
    })

    const { req, res } = createMocks({
      method: 'POST'
    })

    await cancelSubscriptionHandler(req, res)

    expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('stripe_sub_123')
    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { id: 'sub-123' },
      data: { status: 'canceled', canceledAt: expect.any(Date) }
    })
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle no active subscription', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com'
      }
    }

    ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)
    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue(null)

    const { req, res } = createMocks({
      method: 'POST'
    })

    await cancelSubscriptionHandler(req, res)

    expect(res._getStatusCode()).toBe(404)
    const jsonData = JSON.parse(res._getData())
    expect(jsonData.error).toBe('No active subscription found')
  })
})

describe('/api/billing/webhook', () => {
  let mockStripe: any

  beforeEach(() => {
    jest.clearAllMocks()
    mockStripe = new (Stripe as any)()
  })

  it('should handle successful payment', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: {
            userId: 'user-123',
            tier: 'premium',
            interval: 'monthly'
          }
        }
      }
    }

    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com'
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid-signature'
      },
      body: event
    })

    await webhookHandler(req, res)

    expect(prisma.subscription.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        tier: 'premium',
        interval: 'monthly',
        stripeSubscriptionId: 'sub_123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        startedAt: expect.any(Date)
      }
    })
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle subscription cancellation', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          customer: 'cus_123',
          status: 'canceled'
        }
      }
    }

    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      id: 'db-sub-123',
      stripeSubscriptionId: 'sub_123',
      status: 'active'
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid-signature'
      },
      body: event
    })

    await webhookHandler(req, res)

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_123' },
      data: {
        status: 'canceled',
        canceledAt: expect.any(Date)
      }
    })
    expect(res._getStatusCode()).toBe(200)
  })

  it('should handle payment failure', async () => {
    const event = {
      type: 'invoice.payment_failed',
      data: {
        object: {
          subscription: 'sub_123',
          customer: 'cus_123'
        }
      }
    }

    ;(prisma.subscription.findUnique as jest.Mock).mockResolvedValue({
      id: 'db-sub-123',
      stripeSubscriptionId: 'sub_123',
      status: 'active'
    })

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        'stripe-signature': 'valid-signature'
      },
      body: event
    })

    await webhookHandler(req, res)

    expect(prisma.subscription.update).toHaveBeenCalledWith({
      where: { stripeSubscriptionId: 'sub_123' },
      data: {
        status: 'past_due'
      }
    })
    expect(res._getStatusCode()).toBe(200)
  })
})