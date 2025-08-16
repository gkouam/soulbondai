import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { subscriptionLimits } from '@/lib/subscription-limits'
import { featureGate } from '@/lib/feature-gates'

describe('Subscription Plans', () => {
  describe('Basic Plan ($9.99/month)', () => {
    const userId = 'test-user-basic'
    
    beforeEach(async () => {
      // Setup test user with Basic plan
      await prisma.user.create({
        data: {
          id: userId,
          email: 'basic@test.com',
          subscription: {
            create: {
              plan: 'basic',
              status: 'active',
              stripeCustomerId: 'cus_test',
              stripeSubscriptionId: 'sub_test'
            }
          }
        }
      })
    })
    
    it('should have 200 messages per day limit', async () => {
      const limits = await subscriptionLimits.getUserLimits(userId)
      expect(limits.messagesPerDay).toBe(200) // NOT 50!
    })
    
    it('should allow voice messages', async () => {
      const access = await featureGate.canAccess(userId, 'voice_messages')
      expect(access.allowed).toBe(true)
      expect(access.reason).toBeUndefined()
    })
    
    it('should allow photo sharing', async () => {
      const access = await featureGate.canAccess(userId, 'photo_sharing')
      expect(access.allowed).toBe(true) // Basic plan includes photos
    })
    
    it('should NOT require trust level for features', async () => {
      // Even with 0 trust level, Basic features should work
      const profile = await prisma.profile.create({
        data: {
          userId,
          trustLevel: 0,
          messageCount: 0
        }
      })
      
      const voiceAccess = await featureGate.canAccess(userId, 'voice_messages')
      expect(voiceAccess.allowed).toBe(true) // Should work immediately
    })
  })
  
  describe('Stripe Webhook', () => {
    it('should activate subscription after payment', async () => {
      // Simulate webhook event
      const webhookPayload = {
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test',
            subscription: 'sub_test',
            customer_email: 'user@test.com',
            metadata: {
              tier: 'basic'
            }
          }
        }
      }
      
      // Process webhook
      const response = await fetch('/api/billing/webhook', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
        headers: {
          'Stripe-Signature': 'test_signature'
        }
      })
      
      expect(response.status).toBe(200)
      
      // Check subscription was created
      const user = await prisma.user.findUnique({
        where: { email: 'user@test.com' },
        include: { subscription: true }
      })
      
      expect(user?.subscription?.plan).toBe('basic')
      expect(user?.subscription?.status).toBe('active')
    })
  })
  
  describe('Rate Limits API', () => {
    it('should return correct limits for each plan', async () => {
      const testCases = [
        { plan: 'free', expectedLimit: 50 },
        { plan: 'basic', expectedLimit: 200 },
        { plan: 'premium', expectedLimit: 999999 },
        { plan: 'ultimate', expectedLimit: 999999 }
      ]
      
      for (const { plan, expectedLimit } of testCases) {
        // Mock session with plan
        jest.spyOn(getServerSession, 'default').mockResolvedValue({
          user: {
            id: 'test-user',
            subscription: { plan }
          }
        })
        
        const response = await fetch('/api/rate-limits')
        const data = await response.json()
        
        expect(data.plan).toBe(plan)
        expect(data.chat.limit).toBe(expectedLimit)
      }
    })
  })
})

describe('Bug Prevention Tests', () => {
  it('should never show Free limits for paying users', async () => {
    // This test would have caught your issue!
    const payingPlans = ['basic', 'premium', 'ultimate']
    
    for (const plan of payingPlans) {
      const user = await prisma.user.create({
        data: {
          email: `${plan}@test.com`,
          subscription: {
            create: { plan, status: 'active' }
          }
        }
      })
      
      const limits = await subscriptionLimits.getUserLimits(user.id)
      
      // This assertion would FAIL if Basic shows 50 messages
      expect(limits.messagesPerDay).toBeGreaterThan(50)
    }
  })
  
  it('should handle session cache correctly', async () => {
    // Test that fresh sessions get correct data
    const response = await fetch('/api/auth/refresh-session', {
      method: 'POST'
    })
    
    const data = await response.json()
    
    // Session should always reflect database truth
    expect(data.limits.messages.plan).toBe(data.user.subscription.plan)
    expect(data.limits.messages.limit).toBeGreaterThan(0)
  })
})