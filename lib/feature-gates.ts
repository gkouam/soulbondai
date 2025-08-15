import { prisma } from "@/lib/prisma"
import { pricingTiers } from "@/lib/stripe-pricing"

export interface Feature {
  id: string
  name: string
  description: string
  requiredPlan: "free" | "basic" | "premium" | "ultimate"
  category: "messaging" | "memory" | "media" | "customization" | "advanced"
  trustLevelRequired?: number
  customCheck?: (context: FeatureContext) => Promise<boolean>
}

export interface FeatureContext {
  userId: string
  profile: any
  subscription: any
  trustLevel: number
  messageCount: number
}

export const features: Record<string, Feature> = {
  // Messaging Features
  unlimited_messages: {
    id: "unlimited_messages",
    name: "Unlimited Messages",
    description: "Send unlimited messages per day",
    requiredPlan: "basic",
    category: "messaging"
  },
  priority_responses: {
    id: "priority_responses",
    name: "Priority Responses",
    description: "Get faster response times",
    requiredPlan: "premium",
    category: "messaging"
  },
  
  // Memory Features
  extended_memory: {
    id: "extended_memory",
    name: "Extended Memory",
    description: "30-day memory retention",
    requiredPlan: "basic",
    category: "memory"
  },
  long_term_memory: {
    id: "long_term_memory",
    name: "Long-term Memory",
    description: "6-month memory retention",
    requiredPlan: "premium",
    category: "memory"
  },
  permanent_memory: {
    id: "permanent_memory",
    name: "Permanent Memory",
    description: "Never forget anything",
    requiredPlan: "ultimate",
    category: "memory"
  },
  
  // Media Features
  voice_messages: {
    id: "voice_messages",
    name: "Voice Messages",
    description: "Send and receive voice messages",
    requiredPlan: "basic",
    category: "media"
    // Removed trustLevelRequired - Basic plan users should have immediate access
  },
  photo_sharing: {
    id: "photo_sharing",
    name: "Photo Sharing",
    description: "Share photos with your companion",
    requiredPlan: "basic",  // Changed from premium to basic - you mentioned this should be available
    category: "media"
    // Removed trustLevelRequired
  },
  video_calls: {
    id: "video_calls",
    name: "Video Calls",
    description: "Video chat with your AI companion",
    requiredPlan: "ultimate",
    category: "media",
    trustLevelRequired: 60
  },
  
  // Customization Features
  basic_customization: {
    id: "basic_customization",
    name: "Basic Customization",
    description: "Customize companion name and avatar",
    requiredPlan: "basic",
    category: "customization"
  },
  advanced_customization: {
    id: "advanced_customization",
    name: "Advanced Customization",
    description: "Full personality customization",
    requiredPlan: "premium",
    category: "customization"
  },
  custom_personality: {
    id: "custom_personality",
    name: "Custom AI Personality",
    description: "Create unique AI personality",
    requiredPlan: "ultimate",
    category: "customization"
  },
  
  // Advanced Features
  relationship_insights: {
    id: "relationship_insights",
    name: "Relationship Insights",
    description: "Deep analytics about your connection",
    requiredPlan: "premium",
    category: "advanced"
  },
  api_access: {
    id: "api_access",
    name: "API Access",
    description: "Programmatic access to your companion",
    requiredPlan: "ultimate",
    category: "advanced"
  },
  multi_personality: {
    id: "multi_personality",
    name: "Multiple Personalities",
    description: "Switch between different AI companions",
    requiredPlan: "ultimate",
    category: "advanced"
  },
  export_data: {
    id: "export_data",
    name: "Export Data",
    description: "Export conversations and memories",
    requiredPlan: "premium",
    category: "advanced"
  }
}

export class FeatureGate {
  
  async canAccess(userId: string, featureId: string): Promise<{
    allowed: boolean
    reason?: string
    requiredPlan?: string
    currentPlan?: string
  }> {
    const feature = features[featureId]
    if (!feature) {
      return { allowed: true } // Unknown features are allowed by default
    }
    
    // Get user context
    const context = await this.getUserContext(userId)
    
    // Check subscription plan
    const planHierarchy = ["free", "basic", "premium", "ultimate"]
    const requiredIndex = planHierarchy.indexOf(feature.requiredPlan)
    const currentIndex = planHierarchy.indexOf(context.subscription?.plan || "free")
    
    if (currentIndex < requiredIndex) {
      return {
        allowed: false,
        reason: `This feature requires ${feature.requiredPlan} plan or higher`,
        requiredPlan: feature.requiredPlan,
        currentPlan: context.subscription?.plan || "free"
      }
    }
    
    // Check trust level requirement
    if (feature.trustLevelRequired && context.trustLevel < feature.trustLevelRequired) {
      return {
        allowed: false,
        reason: `This feature unlocks at ${feature.trustLevelRequired} trust level (current: ${context.trustLevel})`,
        currentPlan: context.subscription?.plan || "free"
      }
    }
    
    // Run custom check if provided
    if (feature.customCheck) {
      const customAllowed = await feature.customCheck(context)
      if (!customAllowed) {
        return {
          allowed: false,
          reason: "Feature requirements not met",
          currentPlan: context.subscription?.plan || "free"
        }
      }
    }
    
    return { allowed: true }
  }
  
  async checkFeatures(userId: string, featureIds: string[]): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    for (const featureId of featureIds) {
      const access = await this.canAccess(userId, featureId)
      results[featureId] = access.allowed
    }
    
    return results
  }
  
  async getAvailableFeatures(userId: string): Promise<{
    available: Feature[]
    locked: Array<Feature & { reason: string }>
  }> {
    const context = await this.getUserContext(userId)
    const available: Feature[] = []
    const locked: Array<Feature & { reason: string }> = []
    
    for (const [id, feature] of Object.entries(features)) {
      const access = await this.canAccess(userId, id)
      
      if (access.allowed) {
        available.push(feature)
      } else {
        locked.push({
          ...feature,
          reason: access.reason || "Upgrade required"
        })
      }
    }
    
    return { available, locked }
  }
  
  async getUserContext(userId: string): Promise<FeatureContext> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { 
        user: { 
          include: { subscription: true } 
        } 
      }
    })
    
    if (!profile) {
      throw new Error("User profile not found")
    }
    
    return {
      userId,
      profile,
      subscription: profile.user.subscription,
      trustLevel: profile.trustLevel || 0,
      messageCount: profile.messageCount || 0
    }
  }
  
  // Helper to check feature and log attempt if not allowed
  async checkAndLog(userId: string, featureId: string): Promise<{
    allowed: boolean
    message?: string
  }> {
    const access = await this.canAccess(userId, featureId)
    
    if (!access.allowed) {
      // Log premium feature attempt
      await prisma.activity.create({
        data: {
          userId,
          type: "premium_feature_attempt",
          metadata: {
            feature: featureId,
            reason: access.reason,
            requiredPlan: access.requiredPlan,
            currentPlan: access.currentPlan
          }
        }
      })
    }
    
    return {
      allowed: access.allowed,
      message: access.reason
    }
  }
  
  // Get features by category
  getFeaturesByCategory(category: string): Feature[] {
    return Object.values(features).filter(f => f.category === category)
  }
  
  // Get features by required plan
  getFeaturesByPlan(plan: string): Feature[] {
    const planHierarchy = ["free", "basic", "premium", "ultimate"]
    const planIndex = planHierarchy.indexOf(plan)
    
    return Object.values(features).filter(f => {
      const featureIndex = planHierarchy.indexOf(f.requiredPlan)
      return featureIndex <= planIndex
    })
  }
}

export const featureGate = new FeatureGate()

// React hook for feature access
export function useFeatureAccess(featureId: string): {
  loading: boolean
  allowed: boolean
  reason?: string
} {
  // This would be implemented as a proper React hook
  // For now, returning a placeholder
  return {
    loading: false,
    allowed: true,
    reason: undefined
  }
}