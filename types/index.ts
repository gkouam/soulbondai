export interface PersonalityScores {
  // Primary dimensions (-10 to +10)
  introversion_extraversion: number
  thinking_feeling: number
  intuitive_sensing: number
  judging_perceiving: number
  stable_neurotic: number
  secure_insecure: number
  independent_dependent: number
  
  // Attachment style
  attachment_style: 'anxious' | 'avoidant' | 'secure' | 'disorganized'
  
  // Secondary traits (0-10)
  emotional_depth: number
  communication_openness: number
  intimacy_comfort: number
  support_needs: number
  fantasy_preference: number
  validation_seeking?: number
  intellectual_curiosity?: number
  relationship_intensity?: number
  independence_need?: number
}

export interface UserProfile {
  id: string
  userId: string
  archetype: string
  personalityScores: PersonalityScores
  companionName: string
  companionAvatar?: string
  trustLevel: number
  messageCount: number
}

export interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string
  sentiment?: any
  createdAt: Date
  editedAt?: Date
}

export interface ConversationContext {
  recentMessages: Message[]
  currentTopic?: string
  emotionalState?: string
  trustLevel: number
}

export interface SentimentAnalysis {
  primaryEmotion: string
  emotionalIntensity: number
  hiddenEmotions?: string[]
  needsDetected: string[]
  responseUrgency: 'normal' | 'crisis'
  crisisIndicators?: any
}

export interface TestAnswer {
  questionId: number
  optionIndex: number
  traits: Record<string, number>
}

export interface PersonalityTestQuestion {
  id: number
  section: string
  text: string
  subtext?: string
  options: {
    text: string
    subtext?: string
    traits: Record<string, number>
  }[]
}

export type AttachmentStyle = {
  primary: 'anxious' | 'avoidant' | 'secure' | 'disorganized'
  scores: Record<string, number>
  intensity: number
}

export type CommunicationStyle = {
  directness: number
  emotionalExpression: number
  analyticalDepth: number
  supportSeeking: number
}

export interface PersonalityProfile {
  dimensions: Record<string, number>
  attachmentStyle: AttachmentStyle
  archetype: string
  traitProfile: {
    strengths: string[]
    growthAreas: string[]
    communicationStyle: CommunicationStyle
    emotionalNeeds: string[]
    compatibilityFactors: any
  }
  rawScores: Record<string, number>
}