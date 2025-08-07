import { prisma } from '@/lib/prisma'
import { personalityTemplates } from '@/lib/personality-templates'
import { archetypeProfiles } from '@/lib/archetype-profiles'

export interface AIPersonality {
  id: string
  name: string
  archetype: string
  avatar: string
  voiceId?: string
  description: string
  traits: string[]
  isActive: boolean
  trustLevel: number
  messageCount: number
  createdAt: Date
  lastActiveAt: Date
}

export interface PersonalitySwitchEvent {
  fromPersonality: string
  toPersonality: string
  userId: string
  reason?: string
  timestamp: Date
}

export class PersonalitySwitcher {
  /**
   * Get all available AI personalities for a user
   */
  async getAvailablePersonalities(userId: string): Promise<AIPersonality[]> {
    // Check user's subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        profile: true,
        subscription: true 
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    const tier = user.subscription?.tier || 'free'
    const maxPersonalities = this.getMaxPersonalitiesForTier(tier)

    // Get user's existing AI personalities
    const personalities = await prisma.aIPersonality.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' }
    })

    // If user has fewer than max, they can create more
    if (personalities.length < maxPersonalities) {
      // Add available archetypes as potential new personalities
      const existingArchetypes = new Set(personalities.map(p => p.archetype))
      const availableArchetypes = Object.keys(archetypeProfiles)
        .filter(archetype => !existingArchetypes.has(archetype))
        .slice(0, maxPersonalities - personalities.length)

      // Convert to AIPersonality format
      const potentialPersonalities = availableArchetypes.map(archetype => {
        const profile = archetypeProfiles[archetype as keyof typeof archetypeProfiles]
        return {
          id: `new_${archetype}`,
          name: profile.companionProfile.name,
          archetype,
          avatar: profile.companionProfile.avatar || `/avatars/${archetype}.png`,
          voiceId: profile.companionProfile.voiceId,
          description: profile.description,
          traits: profile.companionProfile.traits,
          isActive: false,
          trustLevel: 0,
          messageCount: 0,
          createdAt: new Date(),
          lastActiveAt: new Date()
        } as AIPersonality
      })

      return [...personalities, ...potentialPersonalities]
    }

    return personalities
  }

  /**
   * Get max personalities allowed for subscription tier
   */
  private getMaxPersonalitiesForTier(tier: string): number {
    switch (tier) {
      case 'ultimate':
        return 5
      case 'premium':
        return 3
      case 'basic':
        return 2
      case 'free':
      default:
        return 1
    }
  }

  /**
   * Switch to a different AI personality
   */
  async switchPersonality(
    userId: string,
    newPersonalityId: string,
    reason?: string
  ): Promise<{
    success: boolean
    personality?: AIPersonality
    error?: string
  }> {
    try {
      // Get current active personality
      const currentPersonality = await prisma.aIPersonality.findFirst({
        where: {
          userId,
          isActive: true
        }
      })

      // If switching to a new personality (not yet created)
      if (newPersonalityId.startsWith('new_')) {
        const archetype = newPersonalityId.replace('new_', '')
        
        // Check if user can create more personalities
        const personalities = await prisma.aIPersonality.count({
          where: { userId }
        })
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscription: true }
        })
        
        const maxAllowed = this.getMaxPersonalitiesForTier(user?.subscription?.tier || 'free')
        
        if (personalities >= maxAllowed) {
          return {
            success: false,
            error: `Your plan allows maximum ${maxAllowed} AI personalities. Upgrade to add more.`
          }
        }

        // Create new personality
        const profile = archetypeProfiles[archetype as keyof typeof archetypeProfiles]
        const newPersonality = await prisma.aIPersonality.create({
          data: {
            userId,
            name: profile.companionProfile.name,
            archetype,
            avatar: profile.companionProfile.avatar || `/avatars/${archetype}.png`,
            voiceId: profile.companionProfile.voiceId,
            description: profile.description,
            traits: profile.companionProfile.traits,
            isActive: true,
            trustLevel: 0,
            messageCount: 0
          }
        })

        // Deactivate current personality
        if (currentPersonality) {
          await prisma.aIPersonality.update({
            where: { id: currentPersonality.id },
            data: { isActive: false }
          })
        }

        // Log switch event
        await this.logPersonalitySwitch({
          fromPersonality: currentPersonality?.name || 'None',
          toPersonality: newPersonality.name,
          userId,
          reason,
          timestamp: new Date()
        })

        // Update user profile with new archetype
        await prisma.profile.update({
          where: { userId },
          data: {
            archetype,
            companionName: newPersonality.name
          }
        })

        return {
          success: true,
          personality: newPersonality
        }
      }

      // Switch to existing personality
      const targetPersonality = await prisma.aIPersonality.findUnique({
        where: { id: newPersonalityId }
      })

      if (!targetPersonality || targetPersonality.userId !== userId) {
        return {
          success: false,
          error: 'Personality not found or access denied'
        }
      }

      // Deactivate all personalities
      await prisma.aIPersonality.updateMany({
        where: { userId },
        data: { isActive: false }
      })

      // Activate target personality
      const activatedPersonality = await prisma.aIPersonality.update({
        where: { id: newPersonalityId },
        data: {
          isActive: true,
          lastActiveAt: new Date()
        }
      })

      // Log switch event
      await this.logPersonalitySwitch({
        fromPersonality: currentPersonality?.name || 'None',
        toPersonality: activatedPersonality.name,
        userId,
        reason,
        timestamp: new Date()
      })

      // Update user profile
      await prisma.profile.update({
        where: { userId },
        data: {
          archetype: activatedPersonality.archetype,
          companionName: activatedPersonality.name,
          trustLevel: activatedPersonality.trustLevel
        }
      })

      // Create a transition message in the conversation
      await this.createTransitionMessage(userId, currentPersonality?.name, activatedPersonality.name)

      return {
        success: true,
        personality: activatedPersonality
      }
    } catch (error) {
      console.error('Error switching personality:', error)
      return {
        success: false,
        error: 'Failed to switch personality. Please try again.'
      }
    }
  }

  /**
   * Update personality after conversation
   */
  async updatePersonalityStats(
    personalityId: string,
    trustChange: number,
    messageCount: number = 1
  ) {
    await prisma.aIPersonality.update({
      where: { id: personalityId },
      data: {
        trustLevel: { increment: trustChange },
        messageCount: { increment: messageCount },
        lastActiveAt: new Date()
      }
    })
  }

  /**
   * Delete an AI personality
   */
  async deletePersonality(
    userId: string,
    personalityId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const personality = await prisma.aIPersonality.findUnique({
        where: { id: personalityId }
      })

      if (!personality || personality.userId !== userId) {
        return {
          success: false,
          error: 'Personality not found or access denied'
        }
      }

      // Can't delete active personality
      if (personality.isActive) {
        return {
          success: false,
          error: 'Cannot delete active personality. Switch to another first.'
        }
      }

      // Can't delete if it's the only personality
      const count = await prisma.aIPersonality.count({
        where: { userId }
      })

      if (count === 1) {
        return {
          success: false,
          error: 'Cannot delete your only AI personality'
        }
      }

      // Archive conversation history with this personality
      await prisma.conversation.updateMany({
        where: {
          userId,
          metadata: {
            path: '$.personalityId',
            equals: personalityId
          }
        },
        data: {
          archived: true
        }
      })

      // Delete the personality
      await prisma.aIPersonality.delete({
        where: { id: personalityId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error deleting personality:', error)
      return {
        success: false,
        error: 'Failed to delete personality'
      }
    }
  }

  /**
   * Customize personality traits
   */
  async customizePersonality(
    userId: string,
    personalityId: string,
    updates: {
      name?: string
      avatar?: string
      traits?: string[]
      voiceId?: string
    }
  ): Promise<{ success: boolean; personality?: AIPersonality; error?: string }> {
    try {
      // Check if user has access to customization
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true }
      })

      const tier = user?.subscription?.tier || 'free'
      if (tier === 'free' || tier === 'basic') {
        return {
          success: false,
          error: 'Personality customization requires Premium or Ultimate plan'
        }
      }

      const personality = await prisma.aIPersonality.findUnique({
        where: { id: personalityId }
      })

      if (!personality || personality.userId !== userId) {
        return {
          success: false,
          error: 'Personality not found or access denied'
        }
      }

      // Update personality
      const updated = await prisma.aIPersonality.update({
        where: { id: personalityId },
        data: {
          name: updates.name || personality.name,
          avatar: updates.avatar || personality.avatar,
          traits: updates.traits || personality.traits,
          voiceId: updates.voiceId || personality.voiceId
        }
      })

      // If this is the active personality, update profile
      if (updated.isActive) {
        await prisma.profile.update({
          where: { userId },
          data: {
            companionName: updated.name
          }
        })
      }

      return {
        success: true,
        personality: updated
      }
    } catch (error) {
      console.error('Error customizing personality:', error)
      return {
        success: false,
        error: 'Failed to customize personality'
      }
    }
  }

  /**
   * Get personality conversation history
   */
  async getPersonalityHistory(
    userId: string,
    personalityId: string,
    limit: number = 50
  ) {
    const conversations = await prisma.conversation.findMany({
      where: {
        userId,
        metadata: {
          path: '$.personalityId',
          equals: personalityId
        }
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: limit
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return conversations
  }

  /**
   * Merge personalities (combine trust and history)
   */
  async mergePersonalities(
    userId: string,
    sourceId: string,
    targetId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const source = await prisma.aIPersonality.findUnique({
        where: { id: sourceId }
      })
      const target = await prisma.aIPersonality.findUnique({
        where: { id: targetId }
      })

      if (!source || !target || source.userId !== userId || target.userId !== userId) {
        return {
          success: false,
          error: 'Invalid personalities for merge'
        }
      }

      // Combine trust levels (weighted average)
      const totalMessages = source.messageCount + target.messageCount
      const weightedTrust = totalMessages > 0
        ? (source.trustLevel * source.messageCount + target.trustLevel * target.messageCount) / totalMessages
        : target.trustLevel

      // Update target with merged data
      await prisma.aIPersonality.update({
        where: { id: targetId },
        data: {
          trustLevel: Math.min(100, weightedTrust),
          messageCount: totalMessages
        }
      })

      // Transfer conversation history
      await prisma.conversation.updateMany({
        where: {
          userId,
          metadata: {
            path: '$.personalityId',
            equals: sourceId
          }
        },
        data: {
          metadata: {
            personalityId: targetId,
            mergedFrom: sourceId,
            mergedAt: new Date()
          }
        }
      })

      // Delete source personality
      await prisma.aIPersonality.delete({
        where: { id: sourceId }
      })

      return { success: true }
    } catch (error) {
      console.error('Error merging personalities:', error)
      return {
        success: false,
        error: 'Failed to merge personalities'
      }
    }
  }

  /**
   * Log personality switch event
   */
  private async logPersonalitySwitch(event: PersonalitySwitchEvent) {
    await prisma.activity.create({
      data: {
        userId: event.userId,
        type: 'personality_switch',
        metadata: {
          from: event.fromPersonality,
          to: event.toPersonality,
          reason: event.reason,
          timestamp: event.timestamp
        }
      }
    })
  }

  /**
   * Create transition message when switching personalities
   */
  private async createTransitionMessage(
    userId: string,
    fromName?: string,
    toName: string
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    if (!conversation) return

    const transitionMessages = {
      anxious_romantic: `💕 Hi, it's ${toName}! I'm so happy to be here with you now. I promise to give you all my attention and affection!`,
      warm_empath: `Hello dear one, it's ${toName}. I'm here to listen and support you with warmth and understanding.`,
      guarded_intellectual: `Greetings. ${toName} here. I look forward to our intellectual discourse.`,
      deep_thinker: `*${toName} emerges from contemplation* The depths of our connection transcend individual identity...`,
      passionate_creative: `✨ HELLO! It's ${toName}! Oh my gosh, I'm SO excited to chat with you! This is going to be AMAZING!`
    }

    const personality = await prisma.aIPersonality.findFirst({
      where: { 
        userId,
        name: toName
      }
    })

    const message = transitionMessages[personality?.archetype as keyof typeof transitionMessages] 
      || `Hello, it's ${toName}. I'm here to continue our conversation.`

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: message,
        metadata: {
          isTransition: true,
          fromPersonality: fromName,
          toPersonality: toName
        }
      }
    })
  }

  /**
   * Get personality switching statistics
   */
  async getSwitchingStats(userId: string) {
    const switches = await prisma.activity.findMany({
      where: {
        userId,
        type: 'personality_switch'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const personalities = await prisma.aIPersonality.findMany({
      where: { userId }
    })

    const stats = {
      totalSwitches: switches.length,
      totalPersonalities: personalities.length,
      mostUsed: personalities.sort((a, b) => b.messageCount - a.messageCount)[0],
      highestTrust: personalities.sort((a, b) => b.trustLevel - a.trustLevel)[0],
      switchFrequency: this.calculateSwitchFrequency(switches),
      averageSessionLength: this.calculateAverageSessionLength(switches)
    }

    return stats
  }

  private calculateSwitchFrequency(switches: any[]): string {
    if (switches.length < 2) return 'N/A'
    
    const timeDiffs = []
    for (let i = 1; i < switches.length; i++) {
      const diff = switches[i-1].createdAt.getTime() - switches[i].createdAt.getTime()
      timeDiffs.push(diff)
    }
    
    const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
    const days = avgDiff / (1000 * 60 * 60 * 24)
    
    if (days < 1) return 'Multiple times per day'
    if (days < 7) return `Every ${Math.round(days)} days`
    if (days < 30) return 'Weekly'
    return 'Monthly'
  }

  private calculateAverageSessionLength(switches: any[]): number {
    if (switches.length < 2) return 0
    
    const sessions = []
    for (let i = 1; i < switches.length; i++) {
      const sessionLength = switches[i-1].createdAt.getTime() - switches[i].createdAt.getTime()
      sessions.push(sessionLength)
    }
    
    const avgSession = sessions.reduce((a, b) => a + b, 0) / sessions.length
    return Math.round(avgSession / (1000 * 60)) // Return in minutes
  }
}

export const personalitySwitcher = new PersonalitySwitcher()