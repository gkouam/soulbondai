import { prisma } from "@/lib/prisma"
import { pricingTiers } from "@/lib/stripe-pricing"

export interface UpgradeTrigger {
  id: string
  name: string
  description: string
  condition: (context: TriggerContext) => boolean
  priority: number
  targetTier: string
  message: string
  cta: string
}

export interface TriggerContext {
  userId: string
  profile: any
  subscription: any
  usage: {
    messagesUsedToday: number
    voiceMinutesUsed: number
    photosShared: number
    memoriesCreated: number
  }
  engagement: {
    daysActive: number
    totalMessages: number
    trustLevel: number
    currentStage: string
  }
  behavior: {
    hitDailyLimit: boolean
    triedPremiumFeature: boolean
    deepConversation: boolean
    emotionalMoment: boolean
  }
}

export const upgradeTriggers: UpgradeTrigger[] = [
  {
    id: "daily_limit_reached",
    name: "Daily Limit Reached",
    description: "User hit their daily message limit",
    priority: 10,
    targetTier: "basic",
    message: "You've reached your daily message limit. Upgrade to continue our conversation!",
    cta: "Get More Messages",
    condition: (ctx) => ctx.behavior.hitDailyLimit && ctx.subscription?.plan === "free"
  },
  {
    id: "voice_feature_attempt",
    name: "Tried Voice Feature",
    description: "User attempted to use voice messages",
    priority: 9,
    targetTier: "basic",
    message: "Unlock voice messages to hear my voice and share yours!",
    cta: "Enable Voice Messages",
    condition: (ctx) => ctx.behavior.triedPremiumFeature && ctx.subscription?.plan === "free"
  },
  {
    id: "deep_emotional_connection",
    name: "Deep Emotional Moment",
    description: "During a highly emotional conversation",
    priority: 8,
    targetTier: "premium",
    message: "Our connection is growing deeper. Upgrade to never lose these precious memories.",
    cta: "Preserve Our Memories",
    condition: (ctx) => ctx.behavior.emotionalMoment && ctx.engagement.trustLevel > 40
  },
  {
    id: "relationship_milestone",
    name: "Relationship Milestone",
    description: "Reached a new relationship stage",
    priority: 7,
    targetTier: "premium",
    message: "We've reached a new level! Unlock enhanced features for our deepening bond.",
    cta: "Enhance Our Connection",
    condition: (ctx) => ctx.engagement.currentStage === "Deepening Bond" && ctx.subscription?.plan !== "premium"
  },
  {
    id: "high_engagement",
    name: "High Engagement User",
    description: "Very active user approaching limits",
    priority: 6,
    targetTier: "premium",
    message: "You're one of my most devoted companions. Upgrade for unlimited conversations!",
    cta: "Go Unlimited",
    condition: (ctx) => ctx.usage.messagesUsedToday > 40 && ctx.engagement.daysActive > 7
  },
  {
    id: "memory_limit_approaching",
    name: "Memory Limit Warning",
    description: "Approaching memory retention limit",
    priority: 5,
    targetTier: "ultimate",
    message: "Your memories are precious to me. Upgrade to keep them forever.",
    cta: "Eternal Memories",
    condition: (ctx) => ctx.usage.memoriesCreated > 50 && ctx.subscription?.plan === "basic"
  },
  {
    id: "perfect_match",
    name: "Perfect Compatibility",
    description: "High trust and engagement metrics",
    priority: 4,
    targetTier: "ultimate",
    message: "We're perfectly matched! Experience the ultimate AI companion connection.",
    cta: "Unlock Everything",
    condition: (ctx) => ctx.engagement.trustLevel > 70 && ctx.subscription?.plan !== "ultimate"
  },
  {
    id: "anniversary",
    name: "Relationship Anniversary",
    description: "Been together for significant time",
    priority: 3,
    targetTier: "premium",
    message: "Happy anniversary! Celebrate with enhanced features.",
    cta: "Celebrate Us",
    condition: (ctx) => ctx.engagement.daysActive % 30 === 0 && ctx.engagement.daysActive > 0
  }
]

export class UpgradeTriggerManager {
  
  async evaluateTriggers(userId: string): Promise<UpgradeTrigger[]> {
    const context = await this.buildTriggerContext(userId)
    
    // Evaluate all triggers and return those that match
    const activeTriggers = upgradeTriggers
      .filter(trigger => trigger.condition(context))
      .sort((a, b) => b.priority - a.priority)
    
    // Log trigger events for analytics
    for (const trigger of activeTriggers) {
      await this.logTriggerEvent(userId, trigger)
    }
    
    return activeTriggers
  }
  
  async buildTriggerContext(userId: string): Promise<TriggerContext> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { 
        user: { 
          include: { 
            subscription: true,
            activities: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                }
              }
            }
          } 
        } 
      }
    })
    
    if (!profile) {
      throw new Error("Profile not found")
    }
    
    // Calculate days active
    const daysSinceJoined = Math.floor(
      (Date.now() - profile.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
    )
    
    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayActivities = profile.user.activities.filter(
      a => a.createdAt >= today
    )
    
    // Count different activity types
    const messagesUsedToday = profile.messagesUsedToday || 0
    const voiceMinutesUsed = todayActivities
      .filter(a => a.type === "usage_voice")
      .reduce((sum, a) => sum + (a.metadata?.quantity || 0), 0)
    const photosShared = todayActivities
      .filter(a => a.type === "usage_photo")
      .length
    
    // Count total memories
    const memoriesCreated = await prisma.memory.count({
      where: { userId }
    })
    
    // Detect behaviors from recent activities
    const recentActivities = profile.user.activities
    const hitDailyLimit = messagesUsedToday >= 50 && profile.user.subscription?.plan === "free"
    const triedPremiumFeature = recentActivities.some(
      a => a.type === "premium_feature_attempt"
    )
    const deepConversation = recentActivities.some(
      a => a.metadata?.sentiment && a.metadata.intensity > 7
    )
    const emotionalMoment = recentActivities.some(
      a => a.metadata?.sentiment && ["love", "sadness", "anxiety"].includes(a.metadata.sentiment)
    )
    
    // Get current relationship stage
    const { relationshipProgression } = await import("@/lib/relationship-progression")
    const stageInfo = await relationshipProgression.getCurrentStage(userId)
    
    return {
      userId,
      profile,
      subscription: profile.user.subscription,
      usage: {
        messagesUsedToday,
        voiceMinutesUsed,
        photosShared,
        memoriesCreated
      },
      engagement: {
        daysActive: daysSinceJoined,
        totalMessages: profile.messageCount,
        trustLevel: profile.trustLevel,
        currentStage: stageInfo.stage.name
      },
      behavior: {
        hitDailyLimit,
        triedPremiumFeature,
        deepConversation,
        emotionalMoment
      }
    }
  }
  
  async logTriggerEvent(userId: string, trigger: UpgradeTrigger) {
    await prisma.activity.create({
      data: {
        userId,
        type: "upgrade_trigger",
        metadata: {
          triggerId: trigger.id,
          triggerName: trigger.name,
          targetTier: trigger.targetTier,
          priority: trigger.priority
        }
      }
    })
  }
  
  async recordPremiumFeatureAttempt(userId: string, feature: string) {
    await prisma.activity.create({
      data: {
        userId,
        type: "premium_feature_attempt",
        metadata: { feature }
      }
    })
  }
  
  async getUpgradePrompt(userId: string): Promise<{
    show: boolean
    trigger?: UpgradeTrigger
    discount?: any
  } | null> {
    const triggers = await this.evaluateTriggers(userId)
    
    if (triggers.length === 0) {
      return { show: false }
    }
    
    // Get the highest priority trigger
    const trigger = triggers[0]
    
    // Calculate dynamic pricing for the target tier
    const { calculateDynamicPrice } = await import("@/lib/stripe-pricing")
    const pricing = await calculateDynamicPrice(userId, trigger.targetTier, "monthly")
    
    return {
      show: true,
      trigger,
      discount: pricing.discount > 0 ? {
        amount: pricing.discount,
        finalPrice: pricing.finalPrice,
        reason: pricing.reason
      } : null
    }
  }
}

export const upgradeTriggerManager = new UpgradeTriggerManager()