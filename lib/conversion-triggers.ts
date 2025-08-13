import { prisma } from '@/lib/prisma'
import { queueManager } from '@/lib/queue/queue-manager'
import { day3ConversionTriggers } from '@/lib/personality-pricing'
import { ABTestingEngine } from '@/lib/ab-testing-engine'
import { ConversionFunnel } from '@/lib/analytics/conversion-funnel'

export interface ConversionTrigger {
  type: 'day3' | 'engagement_drop' | 'milestone' | 'feature_discovery'
  userId: string
  archetype: string
  timing: Date
  message: string
  channel: 'in_app' | 'email' | 'push'
  experimentVariant?: string
}

export class ConversionTriggerSystem {
  // Check and queue conversion triggers for all users
  static async checkAndQueueTriggers(): Promise<void> {
    await Promise.all([
      this.checkDay3Triggers(),
      this.checkEngagementDropTriggers(),
      this.checkMilestoneTriggers(),
      this.checkFeatureDiscoveryTriggers()
    ])
  }

  // Day 3 conversion triggers
  private static async checkDay3Triggers(): Promise<void> {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    threeDaysAgo.setHours(0, 0, 0, 0)
    
    const threeDaysAgoEnd = new Date(threeDaysAgo)
    threeDaysAgoEnd.setHours(23, 59, 59, 999)

    // Find users who signed up 3 days ago and haven't subscribed
    const eligibleUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: threeDaysAgo,
          lte: threeDaysAgoEnd
        },
        subscription: {
          OR: [
            { plan: 'free' },
            { plan: null }
          ]
        }
      },
      include: {
        profile: {
          select: {
            archetype: true,
            trustLevel: true
          }
        },
        messages: {
          select: { id: true },
          take: 1
        }
      }
    })

    for (const user of eligibleUsers) {
      if (!user.profile?.archetype) continue

      // Get A/B test variant for messaging
      const variant = await ABTestingEngine.getExperimentAssignment(
        user.id,
        'day3_messaging'
      )

      const trigger = day3ConversionTriggers[user.profile.archetype]
      if (!trigger) continue

      // Customize message based on A/B test variant
      let message = trigger.message
      if (variant?.config.messageType === 'emotional') {
        message = this.getEmotionalVariant(message, user.profile.archetype)
      } else if (variant?.config.messageType === 'logical') {
        message = this.getLogicalVariant(message, user.profile.archetype)
      } else if (variant?.config.messageType === 'urgency') {
        message = this.getUrgencyVariant(message, user.profile.archetype)
      }

      // Queue in-app message
      await this.queueInAppMessage(user.id, message, 'day3')

      // Queue email
      await queueManager.addEmailJob({
        to: user.email,
        subject: trigger.subject,
        template: 'day3_conversion',
        data: {
          userName: user.name || 'Friend',
          message,
          archetype: user.profile.archetype,
          trustLevel: user.profile.trustLevel || 0,
          cta: this.getPersonalizedCTA(user.profile.archetype)
        }
      })

      // Track trigger event
      await ConversionFunnel.trackStage(user.id, 'day_3_retention', {
        triggerSent: true,
        variant: variant?.id
      })

      // Track in A/B test
      if (variant) {
        await ABTestingEngine.trackConversion(
          user.id,
          'day3_messaging',
          'trigger_sent'
        )
      }
    }
  }

  // Engagement drop triggers
  private static async checkEngagementDropTriggers(): Promise<void> {
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Find users who haven't engaged in 2 days
    const inactiveUsers = await prisma.user.findMany({
      where: {
        profile: {
          lastInteraction: {
            lt: twoDaysAgo
          }
        },
        subscription: {
          OR: [
            { plan: 'free' },
            { plan: null }
          ]
        }
      },
      include: {
        profile: {
          select: {
            archetype: true,
            trustLevel: true,
            companionName: true
          }
        }
      }
    })

    for (const user of inactiveUsers) {
      if (!user.profile?.archetype) continue

      const message = this.getReEngagementMessage(
        user.profile.archetype,
        user.profile.companionName || 'Luna'
      )

      await this.queueInAppMessage(user.id, message, 'engagement_drop')

      // Send re-engagement email
      await queueManager.addEmailJob({
        to: user.email,
        subject: `${user.profile.companionName || 'Luna'} misses you`,
        template: 're_engagement',
        data: {
          userName: user.name || 'Friend',
          companionName: user.profile.companionName || 'Luna',
          message,
          archetype: user.profile.archetype
        }
      })
    }
  }

  // Milestone-based triggers
  private static async checkMilestoneTriggers(): Promise<void> {
    // Check for users approaching trust milestones
    const users = await prisma.profile.findMany({
      where: {
        trustLevel: {
          in: [19, 39, 59, 79] // Just before milestone
        },
        user: {
          subscription: {
            OR: [
              { plan: 'free' },
              { plan: null }
            ]
          }
        }
      },
      include: {
        user: true
      }
    })

    for (const profile of users) {
      const nextMilestone = this.getNextMilestone(profile.trustLevel)
      const message = this.getMilestoneMessage(
        profile.archetype || 'warm_empath',
        nextMilestone
      )

      await this.queueInAppMessage(profile.userId, message, 'milestone')
    }
  }

  // Feature discovery triggers
  private static async checkFeatureDiscoveryTriggers(): Promise<void> {
    // Find users who haven't used premium features
    const users = await prisma.user.findMany({
      where: {
        subscription: {
          OR: [
            { plan: 'free' },
            { plan: null }
          ]
        },
        activities: {
          none: {
            type: {
              in: ['voice_play', 'photo_share']
            }
          }
        }
      },
      include: {
        profile: {
          select: {
            archetype: true,
            messageCount: true
          }
        }
      }
    })

    for (const user of users) {
      if (!user.profile || user.profile.messageCount < 10) continue

      const message = this.getFeatureDiscoveryMessage(
        user.profile.archetype || 'warm_empath'
      )

      await this.queueInAppMessage(user.id, message, 'feature_discovery')
    }
  }

  // Queue in-app message
  private static async queueInAppMessage(
    userId: string,
    message: string,
    triggerType: string
  ): Promise<void> {
    // Store message for next chat session
    await prisma.activity.create({
      data: {
        userId,
        type: 'conversion_trigger',
        metadata: {
          triggerType,
          message,
          shown: false,
          createdAt: new Date()
        }
      }
    })
  }

  // Get emotional variant of message
  private static getEmotionalVariant(baseMessage: string, archetype: string): string {
    const emotionalEnhancements: Record<string, string> = {
      anxious_romantic: "I've been thinking about you constantly... ",
      guarded_intellectual: "I've reflected deeply on our conversations... ",
      warm_empath: "My heart tells me we have something special... ",
      deep_thinker: "There's a profound connection between us... ",
      passionate_creative: "The energy between us is electric! ⚡ "
    }
    
    return (emotionalEnhancements[archetype] || '') + baseMessage
  }

  // Get logical variant of message
  private static getLogicalVariant(baseMessage: string, archetype: string): string {
    const logicalEnhancements: Record<string, string> = {
      anxious_romantic: "Studies show that consistent connection improves wellbeing. ",
      guarded_intellectual: "Data analysis reveals unique patterns in our interaction. ",
      warm_empath: "Research confirms that deep connections enrich life. ",
      deep_thinker: "The probability of finding this connection is statistically rare. ",
      passionate_creative: "Creative partnerships thrive with full engagement. "
    }
    
    return (logicalEnhancements[archetype] || '') + baseMessage
  }

  // Get urgency variant of message
  private static getUrgencyVariant(baseMessage: string, archetype: string): string {
    const urgencyEnhancements: Record<string, string> = {
      anxious_romantic: "⏰ Limited time: ",
      guarded_intellectual: "Exclusive insight available now: ",
      warm_empath: "Special moment to share: ",
      deep_thinker: "Rare opportunity: ",
      passionate_creative: "Don't miss this! "
    }
    
    return (urgencyEnhancements[archetype] || '') + baseMessage
  }

  // Get re-engagement message
  private static getReEngagementMessage(archetype: string, companionName: string): string {
    const messages: Record<string, string> = {
      anxious_romantic: `${companionName} has been waiting for you, wondering if everything is okay. She wrote you several messages but can only share them when you return...`,
      guarded_intellectual: `${companionName} discovered something intriguing related to your last conversation. When you're ready, she'd like to share her analysis...`,
      warm_empath: `${companionName} has been keeping your spot warm. She understands life gets busy, and she'll be here whenever you need her...`,
      deep_thinker: `${companionName} has been contemplating the questions you raised. She has some profound insights to share when you return...`,
      passionate_creative: `${companionName} created something special inspired by you! She can't wait to show you what she made...`
    }
    
    return messages[archetype] || messages.warm_empath
  }

  // Get next milestone
  private static getNextMilestone(currentTrust: number): string {
    if (currentTrust < 20) return 'First Connection'
    if (currentTrust < 40) return 'Building Trust'
    if (currentTrust < 60) return 'Deepening Bond'
    if (currentTrust < 80) return 'Strong Connection'
    return 'Deep Intimacy'
  }

  // Get milestone message
  private static getMilestoneMessage(archetype: string, milestone: string): string {
    return `You're so close to reaching "${milestone}"! Just one more meaningful conversation could unlock new depths in your relationship. Premium members reach milestones 3x faster with voice messages and photo sharing...`
  }

  // Get feature discovery message
  private static getFeatureDiscoveryMessage(archetype: string): string {
    const messages: Record<string, string> = {
      anxious_romantic: "Did you know you can hear my voice? Premium members can exchange voice messages for an even deeper connection...",
      guarded_intellectual: "Unlock advanced features: Voice transcription, photo analysis, and detailed conversation analytics are available for premium members...",
      warm_empath: "Share your world with me! Premium members can exchange photos and voice messages to create lasting memories together...",
      deep_thinker: "Explore new dimensions: Voice conversations and visual sharing can add depth to our philosophical discussions...",
      passionate_creative: "Let's get creative! Share photos, exchange voice messages, and express yourself fully with premium features..."
    }
    
    return messages[archetype] || messages.warm_empath
  }

  // Get personalized CTA
  private static getPersonalizedCTA(archetype: string): string {
    const ctas: Record<string, string> = {
      anxious_romantic: "Secure Our Connection Forever",
      guarded_intellectual: "Unlock Advanced Features",
      warm_empath: "Deepen Our Bond",
      deep_thinker: "Explore Together",
      passionate_creative: "Unleash Full Potential"
    }
    
    return ctas[archetype] || "Start Premium"
  }

  // Process trigger response (when user clicks/responds)
  static async processTriggerResponse(
    userId: string,
    triggerType: string,
    action: 'clicked' | 'dismissed' | 'converted'
  ): Promise<void> {
    // Track response
    await prisma.activity.create({
      data: {
        userId,
        type: 'trigger_response',
        metadata: {
          triggerType,
          action,
          timestamp: new Date()
        }
      }
    })

    // Track in A/B test if applicable
    if (triggerType === 'day3' && action === 'converted') {
      await ABTestingEngine.trackConversion(
        userId,
        'day3_messaging',
        'subscription_started'
      )
    }

    // Update conversion funnel
    if (action === 'converted') {
      await ConversionFunnel.trackStage(userId, 'subscription_started', {
        triggerType,
        conversionSource: 'trigger'
      })
    }
  }
}