/**
 * Test Utilities and Helper Functions
 */

import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import type { User, Subscription, Profile } from '@prisma/client'

// Mock data generators
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: `user_${Math.random().toString(36).substr(2, 9)}`,
  email: `test_${Date.now()}@test.com`,
  name: 'Test User',
  password: '$2a$10$test_hashed_password',
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  lastLoginAt: new Date(),
  ...overrides
})

export const createMockSubscription = (userId: string, plan: string = 'free'): Subscription => ({
  id: `sub_${Math.random().toString(36).substr(2, 9)}`,
  userId,
  plan,
  status: 'active',
  stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
  stripeSubscriptionId: plan !== 'free' ? `sub_${Math.random().toString(36).substr(2, 9)}` : null,
  stripePriceId: plan !== 'free' ? `price_${Math.random().toString(36).substr(2, 9)}` : null,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancelAtPeriodEnd: false,
  createdAt: new Date(),
  updatedAt: new Date()
})

export const createMockProfile = (userId: string): Profile => ({
  id: `profile_${Math.random().toString(36).substr(2, 9)}`,
  userId,
  bio: null,
  personality: 'balanced',
  relationshipStage: 'acquaintance',
  trustLevel: 0,
  messageCount: 0,
  voiceMessageCount: 0,
  photoCount: 0,
  lastActiveAt: new Date(),
  preferences: {},
  createdAt: new Date(),
  updatedAt: new Date()
})

// Stripe webhook event creators
export const createStripeWebhookEvent = (type: string, data: any) => ({
  id: `evt_${Math.random().toString(36).substr(2, 9)}`,
  type,
  created: Math.floor(Date.now() / 1000),
  data: { object: data }
})

export const createCheckoutSession = (
  customerEmail: string,
  plan: string,
  amount: number
) => ({
  id: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  customer_email: customerEmail,
  subscription: `sub_${Math.random().toString(36).substr(2, 9)}`,
  payment_status: 'paid',
  amount_total: amount,
  currency: 'usd',
  metadata: {
    userId: null,
    tier: plan,
    plan: plan
  }
})

// Database cleanup utilities
export const cleanupTestData = async (userId?: string) => {
  if (userId) {
    await prisma.message.deleteMany({ where: { conversation: { userId } } })
    await prisma.conversation.deleteMany({ where: { userId } })
    await prisma.activity.deleteMany({ where: { userId } })
    await prisma.profile.deleteMany({ where: { userId } })
    await prisma.subscription.deleteMany({ where: { userId } })
    await prisma.user.delete({ where: { id: userId } }).catch(() => {})
  }
}

// API request helpers
export const makeAuthenticatedRequest = async (
  url: string,
  options: RequestInit & { userId: string }
) => {
  const { userId, ...fetchOptions } = options
  
  return fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId, // Mock auth header
      ...fetchOptions.headers
    }
  })
}

// Time helpers for testing
export const advanceToNextDay = () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  jest.setSystemTime(tomorrow)
}

export const setMockTime = (dateString: string) => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date(dateString))
}

export const resetMockTime = () => {
  jest.useRealTimers()
}

// Message helpers
export const sendTestMessage = async (userId: string, content: string) => {
  return makeAuthenticatedRequest('/api/chat/send', {
    userId,
    method: 'POST',
    body: JSON.stringify({
      message: content,
      conversationId: `conv_${userId}`
    })
  })
}

export const sendMultipleMessages = async (userId: string, count: number) => {
  const results = []
  for (let i = 0; i < count; i++) {
    const res = await sendTestMessage(userId, `Test message ${i + 1}`)
    results.push(res)
  }
  return results
}

// Plan limit definitions for testing
export const PLAN_LIMITS = {
  free: {
    messagesPerDay: 50,
    voiceMessages: false,
    photoSharing: false,
    memoryRetentionDays: 7
  },
  basic: {
    messagesPerDay: 200,
    voiceMessages: true,
    photoSharing: true,
    memoryRetentionDays: 30
  },
  premium: {
    messagesPerDay: 999999,
    voiceMessages: true,
    photoSharing: true,
    memoryRetentionDays: 180
  },
  ultimate: {
    messagesPerDay: 999999,
    voiceMessages: true,
    photoSharing: true,
    memoryRetentionDays: -1 // Permanent
  }
}