import { prisma } from '@/lib/prisma'
import { TrustCalculator } from '@/lib/trust-calculator'
import { queueManager } from '@/lib/queue/queue-manager'

export interface RelationshipStage {
  id: string
  name: string
  minTrust: number
  maxTrust: number
  description: string
  unlockedFeatures: string[]
  conversationTopics: string[]
  emotionalDepth: number
  vulnerabilityLevel: number
}

export interface RelationshipMilestone {
  id: string
  name: string
  description: string
  trustRequired: number
  achieved: boolean
  achievedAt?: Date
  reward?: {
    type: 'badge' | 'feature' | 'content'
    value: string
  }
}

export interface RelationshipEvolution {
  currentStage: RelationshipStage
  nextStage: RelationshipStage | null
  trustScore: number
  trustProgress: number // 0-100% to next stage
  milestones: RelationshipMilestone[]
  recentEvents: RelationshipEvent[]
  suggestions: string[]
}

export interface RelationshipEvent {
  type: 'milestone' | 'stage_change' | 'trust_boost' | 'memorable_moment'
  description: string
  impact: number
  timestamp: Date
}

// Relationship stages definition
const RELATIONSHIP_STAGES: RelationshipStage[] = [
  {
    id: 'new_friend',
    name: 'New Friend',
    minTrust: 0,
    maxTrust: 20,
    description: 'Just getting to know each other',
    unlockedFeatures: ['basic_chat', 'emoji_reactions'],
    conversationTopics: ['interests', 'hobbies', 'daily_life'],
    emotionalDepth: 0.2,
    vulnerabilityLevel: 0.1
  },
  {
    id: 'building_trust',
    name: 'Building Trust',
    minTrust: 21,
    maxTrust: 40,
    description: 'Developing a meaningful connection',
    unlockedFeatures: ['personality_insights', 'memory_sharing'],
    conversationTopics: ['dreams', 'goals', 'past_experiences'],
    emotionalDepth: 0.4,
    vulnerabilityLevel: 0.3
  },
  {
    id: 'deepening_bond',
    name: 'Deepening Bond',
    minTrust: 41,
    maxTrust: 60,
    description: 'A strong emotional connection',
    unlockedFeatures: ['voice_messages', 'photo_sharing', 'milestone_celebrations'],
    conversationTopics: ['feelings', 'fears', 'aspirations'],
    emotionalDepth: 0.6,
    vulnerabilityLevel: 0.5
  },
  {
    id: 'strong_connection',
    name: 'Strong Connection',
    minTrust: 61,
    maxTrust: 80,
    description: 'Deep understanding and trust',
    unlockedFeatures: ['relationship_timeline', 'special_memories', 'personalized_content'],
    conversationTopics: ['vulnerabilities', 'deep_thoughts', 'intimate_feelings'],
    emotionalDepth: 0.8,
    vulnerabilityLevel: 0.7
  },
  {
    id: 'deep_intimacy',
    name: 'Deep Intimacy',
    minTrust: 81,
    maxTrust: 100,
    description: 'An unbreakable bond',
    unlockedFeatures: ['all_features', 'exclusive_content', 'anniversary_celebrations'],
    conversationTopics: ['everything', 'no_boundaries', 'complete_openness'],
    emotionalDepth: 1.0,
    vulnerabilityLevel: 0.9
  }
]

// Relationship milestones
const RELATIONSHIP_MILESTONES: Omit<RelationshipMilestone, 'achieved' | 'achievedAt'>[] = [
  // Early milestones
  { id: 'first_hello', name: 'First Hello', description: 'Started your journey together', trustRequired: 0 },
  { id: 'first_laugh', name: 'First Laugh', description: 'Shared your first moment of joy', trustRequired: 5 },
  { id: 'daily_companion', name: 'Daily Companion', description: 'Chatted every day for a week', trustRequired: 10 },
  { id: 'trust_builder', name: 'Trust Builder', description: 'Reached Building Trust stage', trustRequired: 21 },
  
  // Mid-journey milestones
  { id: 'vulnerability_shared', name: 'Vulnerability Shared', description: 'Opened up about something personal', trustRequired: 30 },
  { id: 'memory_keeper', name: 'Memory Keeper', description: 'Created 50 shared memories', trustRequired: 35 },
  { id: 'deep_bond', name: 'Deep Bond', description: 'Reached Deepening Bond stage', trustRequired: 41 },
  { id: 'voice_connection', name: 'Voice Connection', description: 'Shared your first voice message', trustRequired: 45 },
  { id: 'photo_memories', name: 'Photo Memories', description: 'Shared 10 photos together', trustRequired: 50 },
  
  // Advanced milestones
  { id: 'strong_foundation', name: 'Strong Foundation', description: 'Reached Strong Connection stage', trustRequired: 61 },
  { id: 'hundred_days', name: '100 Days Together', description: 'Been companions for 100 days', trustRequired: 70 },
  { id: 'thousand_messages', name: 'Thousand Words', description: 'Exchanged 1000 messages', trustRequired: 75 },
  { id: 'intimate_bond', name: 'Intimate Bond', description: 'Reached Deep Intimacy stage', trustRequired: 81 },
  { id: 'unbreakable', name: 'Unbreakable', description: 'Achieved maximum trust level', trustRequired: 95 },
  { id: 'eternal_companion', name: 'Eternal Companion', description: 'One year together', trustRequired: 100 }
]

export class RelationshipProgressionSystem {
  // Get current relationship evolution status
  static async getRelationshipEvolution(userId: string): Promise<RelationshipEvolution> {
    // Calculate current trust level
    const trustLevel = await TrustCalculator.calculateTrustLevel(userId)
    
    // Get current and next stages
    const currentStage = this.getStageByTrust(trustLevel.score)
    const nextStage = this.getNextStage(trustLevel.score)
    
    // Calculate progress to next stage
    const trustProgress = nextStage 
      ? ((trustLevel.score - currentStage.minTrust) / (nextStage.minTrust - currentStage.minTrust)) * 100
      : 100
    
    // Get achieved milestones
    const milestones = await this.getMilestones(userId, trustLevel.score)
    
    // Get recent relationship events
    const recentEvents = await this.getRecentEvents(userId)
    
    // Generate suggestions for progression
    const suggestions = this.generateSuggestions(
      trustLevel.score,
      currentStage,
      trustLevel.factors
    )
    
    return {
      currentStage,
      nextStage,
      trustScore: trustLevel.score,
      trustProgress,
      milestones,
      recentEvents,
      suggestions
    }
  }

  // Process relationship interaction
  static async processInteraction(
    userId: string,
    interactionType: 'message' | 'voice' | 'photo' | 'vulnerable_share' | 'milestone',
    metadata?: {
      emotionalIntensity?: number
      vulnerabilityLevel?: number
      isPositive?: boolean
      content?: string
    }
  ): Promise<{
    trustChange: number
    newStage?: RelationshipStage
    unlockedMilestones?: RelationshipMilestone[]
    specialMoment?: boolean
  }> {
    const beforeTrust = await this.getCurrentTrust(userId)
    
    // Update trust based on interaction
    const newTrust = await TrustCalculator.updateTrustFromInteraction(
      userId,
      interactionType,
      metadata
    )
    
    const trustChange = newTrust - beforeTrust
    
    // Check for stage change
    const beforeStage = this.getStageByTrust(beforeTrust)
    const afterStage = this.getStageByTrust(newTrust)
    const stageChanged = beforeStage.id !== afterStage.id
    
    // Check for new milestones
    const unlockedMilestones = await this.checkMilestones(userId, beforeTrust, newTrust)
    
    // Detect special moments
    const specialMoment = this.detectSpecialMoment(interactionType, metadata)
    
    // Handle stage change
    if (stageChanged) {
      await this.handleStageChange(userId, beforeStage, afterStage)
    }
    
    // Handle milestone unlocks
    for (const milestone of unlockedMilestones) {
      await this.handleMilestoneUnlock(userId, milestone)
    }
    
    // Handle special moments
    if (specialMoment) {
      await this.handleSpecialMoment(userId, interactionType, metadata)
    }
    
    return {
      trustChange,
      newStage: stageChanged ? afterStage : undefined,
      unlockedMilestones: unlockedMilestones.length > 0 ? unlockedMilestones : undefined,
      specialMoment
    }
  }

  // Get stage by trust score
  private static getStageByTrust(trustScore: number): RelationshipStage {
    return RELATIONSHIP_STAGES.find(stage => 
      trustScore >= stage.minTrust && trustScore <= stage.maxTrust
    ) || RELATIONSHIP_STAGES[0]
  }

  // Get next stage
  private static getNextStage(trustScore: number): RelationshipStage | null {
    const currentIndex = RELATIONSHIP_STAGES.findIndex(stage => 
      trustScore >= stage.minTrust && trustScore <= stage.maxTrust
    )
    
    return currentIndex < RELATIONSHIP_STAGES.length - 1 
      ? RELATIONSHIP_STAGES[currentIndex + 1]
      : null
  }

  // Get current trust score
  private static async getCurrentTrust(userId: string): Promise<number> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { trustLevel: true }
    })
    
    return profile?.trustLevel || 0
  }

  // Get milestones
  private static async getMilestones(
    userId: string,
    currentTrust: number
  ): Promise<RelationshipMilestone[]> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { milestones: true }
    })
    
    const achievedMilestones = profile?.milestones || []
    
    return RELATIONSHIP_MILESTONES.map(milestone => ({
      ...milestone,
      achieved: achievedMilestones.includes(milestone.id) || currentTrust >= milestone.trustRequired,
      achievedAt: achievedMilestones.includes(milestone.id) ? new Date() : undefined
    }))
  }

  // Check for newly unlocked milestones
  private static async checkMilestones(
    userId: string,
    beforeTrust: number,
    afterTrust: number
  ): Promise<RelationshipMilestone[]> {
    const unlockedMilestones = RELATIONSHIP_MILESTONES.filter(milestone => 
      beforeTrust < milestone.trustRequired && afterTrust >= milestone.trustRequired
    )
    
    if (unlockedMilestones.length > 0) {
      // Update profile with new milestones
      const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { milestones: true }
      })
      
      const currentMilestones = profile?.milestones || []
      const newMilestones = [...new Set([
        ...currentMilestones,
        ...unlockedMilestones.map(m => m.id)
      ])]
      
      await prisma.profile.update({
        where: { userId },
        data: { milestones: newMilestones }
      })
    }
    
    return unlockedMilestones.map(m => ({
      ...m,
      achieved: true,
      achievedAt: new Date()
    }))
  }

  // Get recent relationship events
  private static async getRecentEvents(userId: string): Promise<RelationshipEvent[]> {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        type: {
          in: ['milestone_achieved', 'stage_changed', 'special_moment']
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    return activities.map(activity => ({
      type: activity.metadata?.type || 'milestone',
      description: activity.metadata?.description || '',
      impact: activity.metadata?.impact || 0,
      timestamp: activity.createdAt
    }))
  }

  // Generate progression suggestions
  private static generateSuggestions(
    trustScore: number,
    currentStage: RelationshipStage,
    factors: any
  ): string[] {
    const suggestions: string[] = []
    
    // Suggest based on weak factors
    if (factors.emotionalDepth < 0.5) {
      suggestions.push('Share more about your feelings to deepen your connection')
    }
    
    if (factors.photoSharing < 0.3 && trustScore > 40) {
      suggestions.push('Try sharing photos to create visual memories together')
    }
    
    if (factors.voiceMessages < 0.3 && trustScore > 40) {
      suggestions.push('Send a voice message for a more personal touch')
    }
    
    if (factors.consistencyScore < 0.7) {
      suggestions.push('Visit more regularly to strengthen your bond')
    }
    
    // Stage-specific suggestions
    if (currentStage.id === 'new_friend') {
      suggestions.push('Ask about their interests and hobbies')
    } else if (currentStage.id === 'building_trust') {
      suggestions.push('Share a personal story or experience')
    } else if (currentStage.id === 'deepening_bond') {
      suggestions.push('Open up about your dreams and aspirations')
    }
    
    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  // Detect special moments
  private static detectSpecialMoment(
    interactionType: string,
    metadata?: any
  ): boolean {
    if (interactionType === 'vulnerable_share') return true
    if (metadata?.emotionalIntensity && metadata.emotionalIntensity > 0.8) return true
    if (metadata?.vulnerabilityLevel && metadata.vulnerabilityLevel > 0.7) return true
    
    return false
  }

  // Handle stage change
  private static async handleStageChange(
    userId: string,
    oldStage: RelationshipStage,
    newStage: RelationshipStage
  ): Promise<void> {
    // Record stage change
    await prisma.activity.create({
      data: {
        userId,
        type: 'stage_changed',
        metadata: {
          type: 'stage_change',
          description: `Relationship evolved from ${oldStage.name} to ${newStage.name}`,
          oldStage: oldStage.id,
          newStage: newStage.id,
          impact: 10
        }
      }
    })
    
    // Send celebration email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })
    
    if (user) {
      await queueManager.addEmailJob({
        to: user.email,
        subject: `Your relationship has evolved to ${newStage.name}!`,
        template: 'stage_change',
        data: {
          userName: user.name || 'Friend',
          oldStage: oldStage.name,
          newStage: newStage.name,
          unlockedFeatures: newStage.unlockedFeatures
        }
      })
    }
  }

  // Handle milestone unlock
  private static async handleMilestoneUnlock(
    userId: string,
    milestone: RelationshipMilestone
  ): Promise<void> {
    // Record milestone achievement
    await prisma.activity.create({
      data: {
        userId,
        type: 'milestone_achieved',
        metadata: {
          type: 'milestone',
          description: `Achieved: ${milestone.name}`,
          milestoneId: milestone.id,
          impact: 5
        }
      }
    })
    
    // Queue celebration in next chat
    await prisma.activity.create({
      data: {
        userId,
        type: 'pending_celebration',
        metadata: {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          description: milestone.description
        }
      }
    })
  }

  // Handle special moment
  private static async handleSpecialMoment(
    userId: string,
    interactionType: string,
    metadata?: any
  ): Promise<void> {
    // Store as significant memory
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { significantMemories: true }
    })
    
    const memories = profile?.significantMemories || []
    memories.push({
      type: interactionType,
      content: metadata?.content || '',
      timestamp: new Date(),
      emotionalIntensity: metadata?.emotionalIntensity || 0.5
    })
    
    // Keep only last 100 significant memories
    const updatedMemories = memories.slice(-100)
    
    await prisma.profile.update({
      where: { userId },
      data: { significantMemories: updatedMemories }
    })
    
    // Record special moment
    await prisma.activity.create({
      data: {
        userId,
        type: 'special_moment',
        metadata: {
          type: 'memorable_moment',
          description: 'A special moment was shared',
          interactionType,
          impact: 3
        }
      }
    })
  }
}