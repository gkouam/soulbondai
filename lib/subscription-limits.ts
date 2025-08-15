import { prisma } from "@/lib/prisma"
import { pricingTiers } from "@/lib/stripe-pricing"
import { featureGate } from "@/lib/feature-gates"

export interface UsageLimit {
  messagesPerDay: number
  voiceMinutesPerMonth: number
  photosPerMonth: number
  memoryRetentionDays: number
}

export class SubscriptionLimits {
  
  // Get usage limits for a user based on their subscription
  async getUserLimits(userId: string): Promise<UsageLimit> {
    const subscription = await prisma.subscription.findUnique({
      where: { userId }
    })
    
    const plan = subscription?.plan || "free"
    const tier = pricingTiers[plan]
    
    if (!tier) {
      return this.getDefaultLimits()
    }
    
    return {
      messagesPerDay: tier.limits.messagesPerDay === -1 ? 999999 : tier.limits.messagesPerDay,
      voiceMinutesPerMonth: this.getVoiceMinutes(plan),
      photosPerMonth: this.getPhotoLimit(plan),
      memoryRetentionDays: this.getMemoryRetention(plan)
    }
  }
  
  // Check if user can send a message
  async canSendMessage(userId: string): Promise<{
    allowed: boolean
    reason?: string
    remaining?: number
    resetAt?: Date
  }> {
    const limits = await this.getUserLimits(userId)
    
    // Unlimited messages
    if (limits.messagesPerDay >= 999999) {
      return { allowed: true }
    }
    
    // Count today's messages
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const messageCount = await prisma.message.count({
      where: {
        conversation: {
          userId
        },
        role: "user",
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    })
    
    if (messageCount >= limits.messagesPerDay) {
      return {
        allowed: false,
        reason: `Daily message limit reached (${limits.messagesPerDay}/day)`,
        remaining: 0,
        resetAt: tomorrow
      }
    }
    
    return {
      allowed: true,
      remaining: limits.messagesPerDay - messageCount,
      resetAt: tomorrow
    }
  }
  
  // Check if user can use voice
  async canUseVoice(userId: string, minutes: number = 1): Promise<{
    allowed: boolean
    reason?: string
    remaining?: number
  }> {
    // First check if they have voice feature access
    const hasAccess = await featureGate.canAccess(userId, "voice_messages")
    if (!hasAccess.allowed) {
      return {
        allowed: false,
        reason: hasAccess.reason
      }
    }
    
    const limits = await this.getUserLimits(userId)
    
    // Count this month's voice usage
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const voiceUsage = await prisma.activity.findMany({
      where: {
        userId,
        type: "usage_voice",
        createdAt: {
          gte: startOfMonth
        }
      }
    })
    
    const totalMinutes = voiceUsage.reduce((sum, activity) => {
      return sum + (activity.metadata?.quantity || 0)
    }, 0)
    
    if (totalMinutes + minutes > limits.voiceMinutesPerMonth) {
      return {
        allowed: false,
        reason: `Monthly voice limit reached (${limits.voiceMinutesPerMonth} minutes/month)`,
        remaining: Math.max(0, limits.voiceMinutesPerMonth - totalMinutes)
      }
    }
    
    return {
      allowed: true,
      remaining: limits.voiceMinutesPerMonth - totalMinutes
    }
  }
  
  // Check if user can share photos
  async canSharePhoto(userId: string): Promise<{
    allowed: boolean
    reason?: string
    remaining?: number
  }> {
    // First check if they have photo feature access
    const hasAccess = await featureGate.canAccess(userId, "photo_sharing")
    if (!hasAccess.allowed) {
      return {
        allowed: false,
        reason: hasAccess.reason
      }
    }
    
    const limits = await this.getUserLimits(userId)
    
    // Count this month's photo uploads
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const photoCount = await prisma.activity.count({
      where: {
        userId,
        type: "usage_photo",
        createdAt: {
          gte: startOfMonth
        }
      }
    })
    
    if (photoCount >= limits.photosPerMonth) {
      return {
        allowed: false,
        reason: `Monthly photo limit reached (${limits.photosPerMonth}/month)`,
        remaining: 0
      }
    }
    
    return {
      allowed: true,
      remaining: limits.photosPerMonth - photoCount
    }
  }
  
  // Get current usage stats
  async getUsageStats(userId: string): Promise<{
    messages: { used: number; limit: number; percentage: number }
    voice: { used: number; limit: number; percentage: number }
    photos: { used: number; limit: number; percentage: number }
    storage: { used: number; limit: number; percentage: number }
  }> {
    const limits = await this.getUserLimits(userId)
    
    // Today's messages
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const messageCount = await prisma.message.count({
      where: {
        conversation: { userId },
        role: "user",
        createdAt: { gte: today, lt: tomorrow }
      }
    })
    
    // This month's voice and photos
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        type: { in: ["usage_voice", "usage_photo"] },
        createdAt: { gte: startOfMonth }
      }
    })
    
    const voiceMinutes = activities
      .filter(a => a.type === "usage_voice")
      .reduce((sum, a) => sum + (a.metadata?.quantity || 0), 0)
    
    const photoCount = activities.filter(a => a.type === "usage_photo").length
    
    // Memory storage
    const memoryCount = await prisma.memory.count({
      where: { userId }
    })
    const storageLimit = this.getStorageLimit(limits.memoryRetentionDays)
    
    return {
      messages: {
        used: messageCount,
        limit: limits.messagesPerDay,
        percentage: limits.messagesPerDay >= 999999 ? 0 : (messageCount / limits.messagesPerDay) * 100
      },
      voice: {
        used: voiceMinutes,
        limit: limits.voiceMinutesPerMonth,
        percentage: (voiceMinutes / limits.voiceMinutesPerMonth) * 100
      },
      photos: {
        used: photoCount,
        limit: limits.photosPerMonth,
        percentage: (photoCount / limits.photosPerMonth) * 100
      },
      storage: {
        used: memoryCount,
        limit: storageLimit,
        percentage: (memoryCount / storageLimit) * 100
      }
    }
  }
  
  // Private helper methods
  private getDefaultLimits(): UsageLimit {
    return {
      messagesPerDay: 50,
      voiceMinutesPerMonth: 0,
      photosPerMonth: 0,
      memoryRetentionDays: 7
    }
  }
  
  private getVoiceMinutes(plan: string): number {
    switch (plan) {
      case "basic": return 60
      case "premium": return 300
      case "ultimate": return 999999
      default: return 0
    }
  }
  
  private getPhotoLimit(plan: string): number {
    switch (plan) {
      case "premium": return 50
      case "ultimate": return 999999
      default: return 0
    }
  }
  
  private getMemoryRetention(plan: string): number {
    switch (plan) {
      case "basic": return 30
      case "premium": return 180
      case "ultimate": return 999999
      default: return 7
    }
  }
  
  private getStorageLimit(retentionDays: number): number {
    if (retentionDays >= 999999) return 999999 // Unlimited
    return retentionDays * 10 // 10 memories per day average
  }
}

export const subscriptionLimits = new SubscriptionLimits()

// Middleware function to check limits
export async function checkMessageLimit(userId: string): Promise<void> {
  const canSend = await subscriptionLimits.canSendMessage(userId)
  
  if (!canSend.allowed) {
    throw new Error(canSend.reason || "Message limit exceeded")
  }
}

export async function checkVoiceLimit(userId: string, minutes: number = 1): Promise<void> {
  const canUse = await subscriptionLimits.canUseVoice(userId, minutes)
  
  if (!canUse.allowed) {
    throw new Error(canUse.reason || "Voice limit exceeded")
  }
}

export async function checkPhotoLimit(userId: string): Promise<void> {
  const canShare = await subscriptionLimits.canSharePhoto(userId)
  
  if (!canShare.allowed) {
    throw new Error(canShare.reason || "Photo limit exceeded")
  }
}