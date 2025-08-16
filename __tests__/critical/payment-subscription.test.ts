/**
 * CRITICAL: Payment & Subscription Tests
 * These directly affect revenue - must work 100%
 */

describe('CRITICAL: Payment & Subscription System', () => {
  
  test('Stripe webhook activates subscription after payment', async () => {
    // Your current bug - subscription not activating
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_test',
          subscription: 'sub_test',
          customer_email: 'user@test.com',
          amount_total: 999, // $9.99
          metadata: { tier: 'basic' }
        }
      }
    }
    
    await processStripeWebhook(webhookEvent)
    
    const user = await getUser('user@test.com')
    expect(user.subscription.plan).toBe('basic')
    expect(user.subscription.status).toBe('active')
  })
  
  test('Subscription plans have correct limits', async () => {
    // Your current bug - Basic showing 50 instead of 200
    const limits = {
      free: 50,
      basic: 200,
      premium: 999999,
      ultimate: 999999
    }
    
    for (const [plan, expectedLimit] of Object.entries(limits)) {
      const userLimits = await getUserLimits(plan)
      expect(userLimits.messagesPerDay).toBe(expectedLimit)
    }
  })
  
  test('Failed payments mark subscription as past_due', async () => {
    const webhookEvent = {
      type: 'invoice.payment_failed',
      data: { object: { subscription: 'sub_123' } }
    }
    
    await processStripeWebhook(webhookEvent)
    
    const subscription = await getSubscription('sub_123')
    expect(subscription.status).toBe('past_due')
  })
  
  test('Subscription cancellation reverts to free plan', async () => {
    await cancelSubscription('user123')
    
    const user = await getUser('user123')
    expect(user.subscription.plan).toBe('free')
    expect(user.limits.messagesPerDay).toBe(50)
  })
  
  test('Billing creates checkout session with correct pricing', async () => {
    const session = await createCheckoutSession('basic', 'monthly')
    
    expect(session.amount_total).toBe(999) // $9.99
    expect(session.metadata.tier).toBe('basic')
    expect(session.success_url).toContain('/dashboard')
  })
})