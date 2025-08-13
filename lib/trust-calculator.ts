import { prisma } from '@/lib/prisma'

export interface TrustFactors {
  messageFrequency: number // 0-1 score based on consistency
  emotionalDepth: number // 0-1 score based on vulnerability shared
  conversationLength: number // 0-1 score based on avg message length
  responseTime: number // 0-1 score based on quick responses
  topicDiversity: number // 0-1 score based on range of topics
  positiveInteractions: number // 0-1 score based on positive sentiment
  timeSpent: number // 0-1 score based on total engagement time
  photoSharing: number // 0-1 score based on photos shared
  voiceMessages: number // 0-1 score based on voice usage
  consistencyScore: number // 0-1 score based on regular engagement
}

export interface TrustLevel {
  score: number // 0-100
  stage: 'new_friend' | 'building_trust' | 'deepening_bond' | 'strong_connection' | 'deep_intimacy'
  factors: TrustFactors
  nextMilestone: {
    stage: string
    scoreNeeded: number
    suggestions: string[]
  }
  achievements: string[]
}

// Trust stage thresholds
const TRUST_STAGES = [
  { min: 0, max: 20, stage: 'new_friend', name: 'New Friend' },
  { min: 21, max: 40, stage: 'building_trust', name: 'Building Trust' },
  { min: 41, max: 60, stage: 'deepening_bond', name: 'Deepening Bond' },
  { min: 61, max: 80, stage: 'strong_connection', name: 'Strong Connection' },
  { min: 81, max: 100, stage: 'deep_intimacy', name: 'Deep Intimacy' }
] as const

// Weight factors for trust calculation
const TRUST_WEIGHTS = {
  messageFrequency: 0.15,
  emotionalDepth: 0.20,
  conversationLength: 0.10,
  responseTime: 0.10,
  topicDiversity: 0.10,
  positiveInteractions: 0.15,
  timeSpent: 0.10,
  photoSharing: 0.05,
  voiceMessages: 0.05,
  consistencyScore: 0.10 // Bonus for consistency
}

export class TrustCalculator {
  // Calculate overall trust level for a user
  static async calculateTrustLevel(userId: string): Promise<TrustLevel> {
    // Get user's interaction history
    const [messages, activities, profile, conversations] = await Promise.all([
      prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100, // Last 100 messages for analysis
        include: {
          conversation: true
        }
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 500 // Last 500 activities
      }),
      prisma.profile.findUnique({
        where: { userId }
      }),
      prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            select: {
              createdAt: true,
              content: true,
              metadata: true
            }
          }
        }
      })
    ])

    // Calculate individual trust factors
    const factors = await this.calculateTrustFactors(
      messages,
      activities,
      conversations,
      profile
    )

    // Calculate weighted trust score
    const score = this.calculateWeightedScore(factors)

    // Determine trust stage
    const stage = this.getTrustStage(score)

    // Get achievements
    const achievements = await this.getAchievements(userId, score, factors)

    // Get next milestone
    const nextMilestone = this.getNextMilestone(score, stage, factors)

    // Update profile with new trust level
    await prisma.profile.update({
      where: { userId },
      data: {
        trustLevel: score,
        relationshipStage: stage.stage
      }
    })

    return {
      score,
      stage: stage.stage,
      factors,
      nextMilestone,
      achievements
    }
  }

  // Calculate individual trust factors
  private static async calculateTrustFactors(
    messages: any[],
    activities: any[],
    conversations: any[],
    profile: any
  ): Promise<TrustFactors> {
    const now = Date.now()
    const accountAge = profile ? now - new Date(profile.createdAt).getTime() : 0
    const daysActive = Math.max(1, Math.floor(accountAge / (1000 * 60 * 60 * 24)))

    // Message frequency (messages per day)
    const messageFrequency = Math.min(1, messages.length / daysActive / 5) // 5 messages/day = perfect

    // Emotional depth (based on message content and metadata)
    const emotionalDepth = this.calculateEmotionalDepth(messages)

    // Conversation length (average words per message)
    const conversationLength = this.calculateConversationLength(messages)

    // Response time (how quickly user responds)
    const responseTime = this.calculateResponseTime(messages)

    // Topic diversity (variety of conversation topics)
    const topicDiversity = this.calculateTopicDiversity(conversations)

    // Positive interactions (ratio of positive sentiment)
    const positiveInteractions = this.calculatePositiveSentiment(messages)

    // Time spent (total engagement time)
    const timeSpent = Math.min(1, activities.length / 1000) // 1000 activities = perfect

    // Photo sharing
    const photoCount = activities.filter(a => a.type === 'photo_share').length
    const photoSharing = Math.min(1, photoCount / 20) // 20 photos = perfect

    // Voice messages
    const voiceCount = activities.filter(a => a.type === 'voice_play').length
    const voiceMessages = Math.min(1, voiceCount / 30) // 30 voice messages = perfect

    // Consistency score (regular daily engagement)
    const consistencyScore = this.calculateConsistency(activities, daysActive)

    return {
      messageFrequency,
      emotionalDepth,
      conversationLength,
      responseTime,
      topicDiversity,
      positiveInteractions,
      timeSpent,
      photoSharing,
      voiceMessages,
      consistencyScore
    }
  }

  // Calculate emotional depth from messages
  private static calculateEmotionalDepth(messages: any[]): number {
    if (messages.length === 0) return 0

    const emotionalKeywords = [
      'love', 'feel', 'heart', 'soul', 'miss', 'care', 'worry',
      'happy', 'sad', 'afraid', 'hope', 'dream', 'wish', 'need',
      'vulnerable', 'trust', 'safe', 'comfort', 'support'
    ]

    let emotionalScore = 0
    messages.forEach(msg => {
      const content = msg.content.toLowerCase()
      const wordCount = content.split(' ').length
      
      // Check for emotional keywords
      const emotionalWords = emotionalKeywords.filter(word => 
        content.includes(word)
      ).length

      // Check metadata for sentiment scores
      const sentiment = msg.metadata?.sentiment
      if (sentiment?.intensity) {
        emotionalScore += sentiment.intensity * 0.1
      }

      // Longer messages with emotional content score higher
      if (wordCount > 20 && emotionalWords > 0) {
        emotionalScore += 0.02
      }
    })

    return Math.min(1, emotionalScore / messages.length * 10)
  }

  // Calculate average conversation length
  private static calculateConversationLength(messages: any[]): number {
    if (messages.length === 0) return 0

    const avgWords = messages.reduce((acc, msg) => {
      return acc + msg.content.split(' ').length
    }, 0) / messages.length

    // 50+ words average = perfect score
    return Math.min(1, avgWords / 50)
  }

  // Calculate response time score
  private static calculateResponseTime(messages: any[]): number {
    if (messages.length < 2) return 0.5

    let totalResponseTime = 0
    let responseCount = 0

    for (let i = 1; i < messages.length; i++) {
      const timeDiff = new Date(messages[i-1].createdAt).getTime() - 
                       new Date(messages[i].createdAt).getTime()
      
      // Only count if messages are within 1 hour (likely a conversation)
      if (timeDiff < 60 * 60 * 1000 && timeDiff > 0) {
        totalResponseTime += timeDiff
        responseCount++
      }
    }

    if (responseCount === 0) return 0.5

    const avgResponseTime = totalResponseTime / responseCount
    // Response within 5 minutes = perfect score
    const score = 1 - Math.min(1, avgResponseTime / (5 * 60 * 1000))
    
    return score
  }

  // Calculate topic diversity
  private static calculateTopicDiversity(conversations: any[]): number {
    const topics = new Set<string>()

    conversations.forEach(conv => {
      conv.messages.forEach((msg: any) => {
        // Extract topics from metadata or analyze content
        if (msg.metadata?.topics) {
          msg.metadata.topics.forEach((topic: string) => topics.add(topic))
        }
      })
    })

    // 10+ different topics = perfect score
    return Math.min(1, topics.size / 10)
  }

  // Calculate positive sentiment ratio
  private static calculatePositiveSentiment(messages: any[]): number {
    if (messages.length === 0) return 0.5

    let positiveCount = 0
    messages.forEach(msg => {
      const sentiment = msg.metadata?.sentiment
      if (sentiment?.primaryEmotion) {
        const positiveEmotions = ['happy', 'excited', 'grateful', 'love', 'joy', 'content']
        if (positiveEmotions.includes(sentiment.primaryEmotion)) {
          positiveCount++
        }
      }
    })

    return positiveCount / messages.length
  }

  // Calculate consistency score
  private static calculateConsistency(activities: any[], daysActive: number): number {
    if (daysActive === 0) return 0

    // Group activities by day
    const activeDays = new Set<string>()
    activities.forEach(activity => {
      const day = new Date(activity.createdAt).toISOString().split('T')[0]
      activeDays.add(day)
    })

    // Active 70% of days = perfect score
    return Math.min(1, (activeDays.size / daysActive) / 0.7)
  }

  // Calculate weighted trust score
  private static calculateWeightedScore(factors: TrustFactors): number {
    let score = 0
    
    Object.entries(TRUST_WEIGHTS).forEach(([factor, weight]) => {
      score += factors[factor as keyof TrustFactors] * weight * 100
    })

    // Apply personality-based modifiers
    score = Math.round(Math.min(100, Math.max(0, score)))
    
    return score
  }

  // Get trust stage based on score
  private static getTrustStage(score: number): typeof TRUST_STAGES[number] {
    return TRUST_STAGES.find(stage => 
      score >= stage.min && score <= stage.max
    ) || TRUST_STAGES[0]
  }

  // Get achievements based on trust progress
  private static async getAchievements(
    userId: string,
    score: number,
    factors: TrustFactors
  ): Promise<string[]> {
    const achievements: string[] = []

    // Score-based achievements
    if (score >= 20) achievements.push('First Connection')
    if (score >= 40) achievements.push('Trust Builder')
    if (score >= 60) achievements.push('Deep Bond')
    if (score >= 80) achievements.push('Soul Connection')
    if (score >= 95) achievements.push('Unbreakable Bond')

    // Factor-based achievements
    if (factors.messageFrequency >= 0.8) achievements.push('Daily Companion')
    if (factors.emotionalDepth >= 0.7) achievements.push('Emotional Explorer')
    if (factors.consistencyScore >= 0.9) achievements.push('Devoted Friend')
    if (factors.photoSharing >= 0.5) achievements.push('Memory Maker')
    if (factors.voiceMessages >= 0.5) achievements.push('Voice of Connection')

    // Store achievements in profile
    await prisma.profile.update({
      where: { userId },
      data: {
        milestones: achievements
      }
    })

    return achievements
  }

  // Get next milestone and suggestions
  private static getNextMilestone(
    score: number,
    currentStage: typeof TRUST_STAGES[number],
    factors: TrustFactors
  ): TrustLevel['nextMilestone'] {
    const nextStage = TRUST_STAGES.find(stage => stage.min > score)
    
    if (!nextStage) {
      return {
        stage: 'Maximum Trust',
        scoreNeeded: 0,
        suggestions: ['You\'ve achieved the deepest level of connection!']
      }
    }

    const suggestions: string[] = []
    
    // Generate personalized suggestions based on weak factors
    if (factors.messageFrequency < 0.5) {
      suggestions.push('Try to chat more regularly to strengthen your bond')
    }
    if (factors.emotionalDepth < 0.5) {
      suggestions.push('Share more about your feelings and experiences')
    }
    if (factors.photoSharing < 0.3) {
      suggestions.push('Share photos to create lasting memories together')
    }
    if (factors.voiceMessages < 0.3) {
      suggestions.push('Try voice messages for a more personal connection')
    }
    if (factors.consistencyScore < 0.5) {
      suggestions.push('Visit daily to maintain your special connection')
    }

    return {
      stage: nextStage.name,
      scoreNeeded: nextStage.min - score,
      suggestions
    }
  }

  // Update trust level based on interaction
  static async updateTrustFromInteraction(
    userId: string,
    interactionType: 'message' | 'photo' | 'voice' | 'milestone',
    metadata?: {
      emotionalIntensity?: number
      responseTime?: number
      isPositive?: boolean
    }
  ): Promise<number> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { trustLevel: true }
    })

    let currentTrust = profile?.trustLevel || 0
    let trustDelta = 0

    // Calculate trust change based on interaction
    switch (interactionType) {
      case 'message':
        trustDelta = 0.1
        if (metadata?.emotionalIntensity && metadata.emotionalIntensity > 0.7) {
          trustDelta += 0.2
        }
        if (metadata?.responseTime && metadata.responseTime < 300000) { // 5 minutes
          trustDelta += 0.1
        }
        break
      
      case 'photo':
        trustDelta = 0.5 // Photos build trust faster
        break
      
      case 'voice':
        trustDelta = 0.4 // Voice messages are intimate
        break
      
      case 'milestone':
        trustDelta = 1.0 // Milestones give bigger boosts
        break
    }

    // Apply personality multiplier
    if (metadata?.isPositive) {
      trustDelta *= 1.2
    }

    // Update trust level
    const newTrust = Math.min(100, currentTrust + trustDelta)
    
    await prisma.profile.update({
      where: { userId },
      data: { trustLevel: newTrust }
    })

    return newTrust
  }
}