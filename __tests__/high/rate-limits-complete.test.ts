/**
 * HIGH PRIORITY: Complete Message Limits & Rate Limiting Tests
 * These tests ensure proper usage limits and rate limiting functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { subscriptionLimits } from '@/lib/subscription-limits'
import { rateLimiters } from '@/lib/rate-limiter'
import { 
  createMockUser,
  sendTestMessage,
  sendMultipleMessages,
  advanceToNextDay,
  setMockTime,
  resetMockTime,
  cleanupTestData,
  PLAN_LIMITS
} from '../setup/test-utils'

describe('HIGH: Message Limits & Rate Limiting', () => {
  let testUser: any
  
  beforeEach(async () => {
    setMockTime('2025-08-15 10:00:00')
    
    testUser = await prisma.user.create({
      data: {
        email: 'ratelimit@test.com',
        name: 'Rate Limit Test'
      }
    })
  })
  
  afterEach(async () => {
    resetMockTime()
    await cleanupTestData(testUser.id)
  })
  
  describe('Daily Message Limits by Plan', () => {
    it('should enforce Free plan limit (50 messages/day)', async () => {
      // This test would have caught the wrong limit display issue!
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Send 50 messages (should work)
      const responses = await sendMultipleMessages(testUser.id, 50)
      responses.forEach((res, index) => {
        expect(res.status).toBe(200)
      })
      
      // 51st message should be blocked
      const blocked = await sendTestMessage(testUser.id, 'Message 51')
      expect(blocked.status).toBe(429) // Too Many Requests
      
      const data = await blocked.json()
      expect(data.error).toContain('Daily limit reached')
      expect(data.limitReached).toBe(true)
      expect(data.remaining).toBe(0)
      expect(data.upgradeUrl).toBe('/pricing')
    })
    
    it('should enforce Basic plan limit (200 messages/day)', async () => {
      // This test specifically checks the 200 limit for Basic plan
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      // Should allow 200 messages
      const responses = await sendMultipleMessages(testUser.id, 200)
      expect(responses[199].status).toBe(200) // 200th message OK
      
      // 201st message should be blocked
      const blocked = await sendTestMessage(testUser.id, 'Message 201')
      expect(blocked.status).toBe(429)
      
      const data = await blocked.json()
      expect(data.error).toContain('Daily limit reached')
      expect(data.remaining).toBe(0)
    })
    
    it('should allow unlimited messages for Premium plan', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'premium',
          status: 'active'
        }
      })
      
      // Send 1000 messages (should all work)
      const responses = await sendMultipleMessages(testUser.id, 1000)
      responses.forEach(res => {
        expect(res.status).toBe(200)
      })
      
      // 1001st should also work
      const response = await sendTestMessage(testUser.id, 'Message 1001')
      expect(response.status).toBe(200)
    })
    
    it('should allow unlimited messages for Ultimate plan', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'ultimate',
          status: 'active'
        }
      })
      
      // Send many messages
      const responses = await sendMultipleMessages(testUser.id, 500)
      responses.forEach(res => {
        expect(res.status).toBe(200)
      })
    })
  })
  
  describe('Limit Reset Behavior', () => {
    it('should reset limits at midnight UTC', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Use all 50 messages
      await sendMultipleMessages(testUser.id, 50)
      
      // Should be blocked
      let blocked = await sendTestMessage(testUser.id, 'Extra message')
      expect(blocked.status).toBe(429)
      
      // Advance to next day at 00:01
      advanceToNextDay()
      
      // Should work again
      const response = await sendTestMessage(testUser.id, 'New day message')
      expect(response.status).toBe(200)
      
      // Check remaining
      const limits = await subscriptionLimits.canSendMessage(testUser.id)
      expect(limits.allowed).toBe(true)
      expect(limits.remaining).toBe(49) // 50 - 1
    })
    
    it('should track correct reset time', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      const limits = await subscriptionLimits.canSendMessage(testUser.id)
      
      expect(limits.resetAt).toBeDefined()
      const resetTime = limits.resetAt!
      
      // Should be midnight tomorrow
      expect(resetTime.getHours()).toBe(0)
      expect(resetTime.getMinutes()).toBe(0)
      expect(resetTime.getSeconds()).toBe(0)
      
      // Should be tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      expect(resetTime.getTime()).toBe(tomorrow.getTime())
    })
    
    it('should maintain separate counters per user', async () => {
      // Create two users with same plan
      const user2 = await prisma.user.create({
        data: {
          email: 'user2@test.com',
          subscription: {
            create: {
              plan: 'free',
              status: 'active'
            }
          }
        }
      })
      
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // User 1 sends 50 messages
      await sendMultipleMessages(testUser.id, 50)
      
      // User 1 should be blocked
      const user1Blocked = await sendTestMessage(testUser.id, 'Extra')
      expect(user1Blocked.status).toBe(429)
      
      // User 2 should still be able to send
      const user2Response = await sendTestMessage(user2.id, 'First message')
      expect(user2Response.status).toBe(200)
      
      await cleanupTestData(user2.id)
    })
  })
  
  describe('Immediate Limit Updates on Plan Change', () => {
    it('should immediately update limits after upgrade', async () => {
      // Start with Free plan
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Use 40 of 50 messages
      await sendMultipleMessages(testUser.id, 40)
      
      // Check remaining
      let limits = await subscriptionLimits.canSendMessage(testUser.id)
      expect(limits.remaining).toBe(10) // 50 - 40
      
      // Upgrade to Basic
      await prisma.subscription.update({
        where: { userId: testUser.id },
        data: { plan: 'basic' }
      })
      
      // Check new limits immediately
      limits = await subscriptionLimits.canSendMessage(testUser.id)
      expect(limits.remaining).toBe(160) // 200 - 40 already sent
      
      // Should be able to send many more messages
      const responses = await sendMultipleMessages(testUser.id, 150)
      responses.forEach(res => {
        expect(res.status).toBe(200)
      })
    })
    
    it('should immediately restrict after downgrade', async () => {
      // Start with Basic plan
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      // Send 100 messages
      await sendMultipleMessages(testUser.id, 100)
      
      // Downgrade to Free
      await prisma.subscription.update({
        where: { userId: testUser.id },
        data: { plan: 'free' }
      })
      
      // Should be immediately blocked (already over Free limit)
      const response = await sendTestMessage(testUser.id, 'After downgrade')
      expect(response.status).toBe(429)
      
      const data = await response.json()
      expect(data.error).toContain('Daily limit reached')
      expect(data.upgradeUrl).toBe('/pricing')
    })
  })
  
  describe('Feature-Specific Rate Limits', () => {
    it('should rate limit voice message uploads', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      // Voice messages have separate rate limit
      const canUse = await subscriptionLimits.canUseVoice(testUser.id, 1)
      expect(canUse.allowed).toBe(true)
      
      // Simulate using voice minutes
      for (let i = 0; i < 60; i++) {
        await prisma.activity.create({
          data: {
            userId: testUser.id,
            type: 'usage_voice',
            metadata: { quantity: 1 }
          }
        })
      }
      
      // Check if limit reached
      const limitCheck = await subscriptionLimits.canUseVoice(testUser.id, 1)
      if (PLAN_LIMITS.basic.voiceMinutesPerMonth !== -1) {
        expect(limitCheck.remaining).toBeDefined()
      }
    })
    
    it('should rate limit photo uploads', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      // Check initial photo limit
      const canShare = await subscriptionLimits.canSharePhoto(testUser.id)
      expect(canShare.allowed).toBe(true)
      
      // Simulate uploading photos
      for (let i = 0; i < 10; i++) {
        await prisma.activity.create({
          data: {
            userId: testUser.id,
            type: 'usage_photo',
            metadata: { quantity: 1 }
          }
        })
      }
      
      // Check remaining
      const limitCheck = await subscriptionLimits.canSharePhoto(testUser.id)
      if (PLAN_LIMITS.basic.photosPerMonth !== -1) {
        expect(limitCheck.remaining).toBeLessThan(PLAN_LIMITS.basic.photosPerMonth)
      }
    })
    
    it('should block features entirely for Free plan', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Voice should be blocked
      const canUseVoice = await subscriptionLimits.canUseVoice(testUser.id)
      expect(canUseVoice.allowed).toBe(false)
      expect(canUseVoice.reason).toContain('requires')
      
      // Photos should be blocked
      const canSharePhoto = await subscriptionLimits.canSharePhoto(testUser.id)
      expect(canSharePhoto.allowed).toBe(false)
      expect(canSharePhoto.reason).toContain('requires')
    })
  })
  
  describe('API Rate Limiting', () => {
    it('should rate limit API requests (100/minute)', async () => {
      const endpoint = '/api/user/profile'
      
      // Make 100 requests rapidly
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(
          fetch(endpoint, {
            headers: { 'x-user-id': testUser.id }
          })
        )
      }
      
      const responses = await Promise.all(promises)
      const successCount = responses.filter(r => r.status === 200).length
      
      // Most should succeed
      expect(successCount).toBeGreaterThan(90)
      
      // 101st request should be rate limited
      const extraResponse = await fetch(endpoint, {
        headers: { 'x-user-id': testUser.id }
      })
      
      expect(extraResponse.status).toBe(429)
      const data = await extraResponse.json()
      expect(data.error).toContain('Rate limit')
    })
    
    it('should have stricter limits for auth endpoints (5/15min)', async () => {
      const endpoint = '/api/auth/login'
      
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@test.com',
            password: 'wrong'
          })
        })
      }
      
      // 6th attempt should be blocked
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'correct'
        })
      })
      
      expect(response.status).toBe(429)
    })
  })
  
  describe('Rate Limit Information', () => {
    it('should provide accurate rate limit headers', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'basic',
          status: 'active'
        }
      })
      
      const response = await sendTestMessage(testUser.id, 'Test message')
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('200')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('199')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()
    })
    
    it('should show correct remaining messages in response', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Send some messages
      await sendMultipleMessages(testUser.id, 10)
      
      // Check remaining
      const response = await fetch('/api/rate-limits', {
        headers: { 'x-user-id': testUser.id }
      })
      
      const data = await response.json()
      expect(data.plan).toBe('free')
      expect(data.chat.limit).toBe(50)
      expect(data.chat.remaining).toBe(40) // 50 - 10
    })
    
    it('should display upgrade prompt when limit reached', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Use all messages
      await sendMultipleMessages(testUser.id, 50)
      
      // Next message should show upgrade prompt
      const response = await sendTestMessage(testUser.id, 'Over limit')
      const data = await response.json()
      
      expect(data.limitReached).toBe(true)
      expect(data.upgradeUrl).toBe('/pricing')
      expect(data.error).toContain('upgrade')
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle clock changes gracefully', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Send messages
      await sendMultipleMessages(testUser.id, 25)
      
      // Simulate clock going backwards (DST change)
      setMockTime('2025-08-15 09:00:00')
      
      // Should still track correctly
      const limits = await subscriptionLimits.canSendMessage(testUser.id)
      expect(limits.remaining).toBe(25) // 50 - 25
    })
    
    it('should handle subscription changes mid-day', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Send 40 messages on Free plan
      await sendMultipleMessages(testUser.id, 40)
      
      // Upgrade at 2 PM
      setMockTime('2025-08-15 14:00:00')
      await prisma.subscription.update({
        where: { userId: testUser.id },
        data: { plan: 'premium' }
      })
      
      // Should now have unlimited
      const responses = await sendMultipleMessages(testUser.id, 100)
      responses.forEach(res => {
        expect(res.status).toBe(200)
      })
    })
    
    it('should handle rapid concurrent requests', async () => {
      await prisma.subscription.create({
        data: {
          userId: testUser.id,
          plan: 'free',
          status: 'active'
        }
      })
      
      // Send 50 messages concurrently
      const promises = []
      for (let i = 0; i < 52; i++) {
        promises.push(sendTestMessage(testUser.id, `Concurrent ${i}`))
      }
      
      const responses = await Promise.all(promises)
      
      // Exactly 50 should succeed
      const successCount = responses.filter(r => r.status === 200).length
      const blockedCount = responses.filter(r => r.status === 429).length
      
      expect(successCount).toBe(50)
      expect(blockedCount).toBe(2)
    })
  })
})