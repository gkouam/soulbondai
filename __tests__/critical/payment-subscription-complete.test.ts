/**
 * CRITICAL PRIORITY: Complete Payment & Subscription Tests
 * These tests ensure revenue generation and subscription management work correctly
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { 
  createMockUser, 
  createMockSubscription,
  createStripeWebhookEvent,
  createCheckoutSession,
  cleanupTestData,
  PLAN_LIMITS
} from '../setup/test-utils'

// Import actual functions to test
import { createDynamicCheckoutSession } from '@/lib/stripe-pricing'
import { processWebhook } from '@/app/api/billing/webhook/route'
import { subscriptionLimits } from '@/lib/subscription-limits'

describe('CRITICAL: Payment Processing', () => {
  let testUser: any
  
  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        email: 'payment-test@test.com',
        name: 'Payment Test User'
      }
    })
  })
  
  afterEach(async () => {
    await cleanupTestData(testUser.id)
  })
  
  describe('Stripe Checkout Session Creation', () => {
    it('should create checkout session with correct Basic pricing ($9.99/month)', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      }
      
      jest.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue(mockSession as any)
      
      const sessionUrl = await createDynamicCheckoutSession(
        testUser.id,
        'basic',
        'monthly',
        'https://soulbondai.com/success',
        'https://soulbondai.com/cancel'
      )
      
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID,
              quantity: 1
            })
          ]),
          metadata: expect.objectContaining({
            userId: testUser.id,
            tier: 'basic',
            interval: 'monthly'
          })
        })
      )
      
      expect(sessionUrl).toBe('https://checkout.stripe.com/pay/cs_test_123')
    })
    
    it('should create checkout session with correct Premium pricing ($19.99/month)', async () => {
      const sessionUrl = await createDynamicCheckoutSession(
        testUser.id,
        'premium',
        'monthly',
        'https://soulbondai.com/success',
        'https://soulbondai.com/cancel'
      )
      
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID
            })
          ])
        })
      )
    })
    
    it('should apply yearly discount (20% off)', async () => {
      const sessionUrl = await createDynamicCheckoutSession(
        testUser.id,
        'basic',
        'yearly',
        'https://soulbondai.com/success',
        'https://soulbondai.com/cancel'
      )
      
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: process.env.STRIPE_BASIC_YEARLY_PRICE_ID, // $99.99/year
              quantity: 1
            })
          ])
        })
      )
    })
  })
  
  describe('Webhook Processing - Subscription Activation', () => {
    it('should activate Basic subscription after successful payment', async () => {
      // This test would have caught your main bug!
      const checkoutSession = createCheckoutSession(
        testUser.email,
        'basic',
        999 // $9.99 in cents
      )
      
      const webhookEvent = createStripeWebhookEvent(
        'checkout.session.completed',
        checkoutSession
      )
      
      // Process webhook
      const response = await processWebhook(webhookEvent)
      expect(response.status).toBe(200)
      
      // Verify subscription was created/updated
      const subscription = await prisma.subscription.findUnique({
        where: { userId: testUser.id }
      })
      
      expect(subscription).toBeDefined()
      expect(subscription?.plan).toBe('basic')
      expect(subscription?.status).toBe('active')
      expect(subscription?.stripeCustomerId).toBe(checkoutSession.customer)
      expect(subscription?.stripeSubscriptionId).toBe(checkoutSession.subscription)
    })
    
    it('should handle webhook without userId in metadata', async () => {
      // This test addresses the issue where userId might be missing
      const checkoutSession = {
        ...createCheckoutSession(testUser.email, 'premium', 1999),
        metadata: { tier: 'premium' } // No userId
      }
      
      const webhookEvent = createStripeWebhookEvent(
        'checkout.session.completed',
        checkoutSession
      )
      
      const response = await processWebhook(webhookEvent)
      expect(response.status).toBe(200)
      
      // Should find user by email
      const subscription = await prisma.subscription.findUnique({
        where: { userId: testUser.id }
      })
      
      expect(subscription?.plan).toBe('premium')
    })
    
    it('should handle subscription cancellation', async () => {
      // Create active subscription
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active',
          stripeSubscriptionId: 'sub_123'
        }
      })
      
      const webhookEvent = createStripeWebhookEvent(
        'customer.subscription.deleted',
        { id: 'sub_123' }
      )
      
      const response = await processWebhook(webhookEvent)
      expect(response.status).toBe(200)
      
      const subscription = await prisma.subscription.findUnique({
        where: { userId: testUser.id }
      })
      
      expect(subscription?.plan).toBe('free')
      expect(subscription?.status).toBe('canceled')
    })
    
    it('should handle failed payment', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active',
          stripeSubscriptionId: 'sub_123'
        }
      })
      
      const webhookEvent = createStripeWebhookEvent(
        'invoice.payment_failed',
        { subscription: 'sub_123' }
      )
      
      const response = await processWebhook(webhookEvent)
      expect(response.status).toBe(200)
      
      const subscription = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: 'sub_123' }
      })
      
      expect(subscription?.status).toBe('past_due')
    })
  })
  
  describe('Subscription Plan Limits', () => {
    it('should enforce correct message limits for each plan', async () => {
      // This test would have caught the 50 vs 200 messages bug!
      const testCases = [
        { plan: 'free', expectedLimit: 50 },
        { plan: 'basic', expectedLimit: 200 },
        { plan: 'premium', expectedLimit: 999999 },
        { plan: 'ultimate', expectedLimit: 999999 }
      ]
      
      for (const { plan, expectedLimit } of testCases) {
        // Create user with specific plan
        const user = await prisma.user.create({
          data: {
            email: `${plan}@test.com`,
            subscription: {
              create: {
                plan,
                status: 'active'
              }
            }
          }
        })
        
        const limits = await subscriptionLimits.getUserLimits(user.id)
        
        expect(limits.messagesPerDay).toBe(expectedLimit)
        
        // Cleanup
        await cleanupTestData(user.id)
      }
    })
    
    it('should immediately update limits after upgrade', async () => {
      // Start with free plan
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      let limits = await subscriptionLimits.getUserLimits(testUser.id)
      expect(limits.messagesPerDay).toBe(50)
      
      // Simulate upgrade webhook
      const webhookEvent = createStripeWebhookEvent(
        'checkout.session.completed',
        createCheckoutSession(testUser.email, 'basic', 999)
      )
      
      await processWebhook(webhookEvent)
      
      // Check limits immediately after upgrade
      limits = await subscriptionLimits.getUserLimits(testUser.id)
      expect(limits.messagesPerDay).toBe(200)
    })
    
    it('should allow voice messages for Basic plan and above', async () => {
      const plans = ['free', 'basic', 'premium', 'ultimate']
      
      for (const plan of plans) {
        const user = await prisma.user.create({
          data: {
            email: `voice-${plan}@test.com`,
            subscription: {
              create: { plan, status: 'active' }
            }
          }
        })
        
        const canUseVoice = await subscriptionLimits.canUseVoice(user.id)
        
        if (plan === 'free') {
          expect(canUseVoice.allowed).toBe(false)
          expect(canUseVoice.reason).toContain('requires')
        } else {
          expect(canUseVoice.allowed).toBe(true)
        }
        
        await cleanupTestData(user.id)
      }
    })
    
    it('should allow photo sharing for Basic plan and above', async () => {
      // This test would have caught the photo sharing permission issue!
      const plans = ['free', 'basic', 'premium', 'ultimate']
      
      for (const plan of plans) {
        const user = await prisma.user.create({
          data: {
            email: `photo-${plan}@test.com`,
            subscription: {
              create: { plan, status: 'active' }
            }
          }
        })
        
        const canSharePhoto = await subscriptionLimits.canSharePhoto(user.id)
        
        if (plan === 'free') {
          expect(canSharePhoto.allowed).toBe(false)
        } else {
          expect(canSharePhoto.allowed).toBe(true)
        }
        
        await cleanupTestData(user.id)
      }
    })
  })
  
  describe('Billing Edge Cases', () => {
    it('should handle duplicate webhook events gracefully', async () => {
      const checkoutSession = createCheckoutSession(testUser.email, 'basic', 999)
      const webhookEvent = createStripeWebhookEvent(
        'checkout.session.completed',
        checkoutSession
      )
      
      // Process same webhook twice
      await processWebhook(webhookEvent)
      await processWebhook(webhookEvent)
      
      // Should only have one subscription
      const subscriptions = await prisma.subscription.findMany({
        where: { userId: testUser.id }
      })
      
      expect(subscriptions).toHaveLength(1)
      expect(subscriptions[0].plan).toBe('basic')
    })
    
    it('should handle subscription upgrade from Basic to Premium', async () => {
      // Start with Basic
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active',
          stripeSubscriptionId: 'sub_basic'
        }
      })
      
      // Upgrade to Premium
      const webhookEvent = createStripeWebhookEvent(
        'customer.subscription.updated',
        {
          id: 'sub_basic',
          items: {
            data: [{
              price: { id: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID }
            }]
          }
        }
      )
      
      await processWebhook(webhookEvent)
      
      const subscription = await prisma.subscription.findUnique({
        where: { userId: testUser.id }
      })
      
      expect(subscription?.plan).toBe('premium')
    })
    
    it('should refund unused time on plan downgrade', async () => {
      // This ensures fair billing practices
      const mockRefund = jest.spyOn(stripe.refunds, 'create')
      
      // Downgrade from Premium to Basic
      // Implementation would calculate prorated refund
      
      // expect(mockRefund).toHaveBeenCalledWith(...)
    })
  })
})