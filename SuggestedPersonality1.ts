// lib/personality-engine-optimized.ts
import { OpenAI } from "openai"
import { prisma } from "@/lib/prisma"
import { Redis } from "@upstash/redis"
import LRU from "lru-cache"
import { 
  PersonalityScores, 
  SentimentAnalysis, 
  Message,
  EmotionalWeather,
  SoulResonance,
  UserProfile
} from "@/types"

/**
 * Optimized Personality Engine for Production
 * Balances depth with performance and cost efficiency
 */
export class PersonalityEngine {
  private openai: OpenAI
  private redis: Redis
  
  // Caching layers for performance
  private emotionalCache: LRU<string, any>
  private responseCache: LRU<string, string>
  private memoryCache: LRU<string, any[]>
  
  // Feature flags for gradual rollout
  private featureFlags = {
    emotionalWeather: true,
    soulResonance: true,
    lifeNarrative: false, // Phase 2
    predictiveInsights: false, // Phase 3
    mysticalElements: false, // Premium only
    deepEmotionalLayers: false // Phase 3
  }
  
  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    this.redis = new Redis({
      url: process.env.REDIS_URL!,
      token: process.env.REDIS_TOKEN!
    })
    
    // Initialize caches
    this.emotionalCache = new LRU({ 
      max: 1000, 
      ttl: 1000 * 60 * 60 // 1 hour
    })
    this.responseCache = new LRU({ 
      max: 500, 
      ttl: 1000 * 60 * 30 // 30 minutes
    })
    this.memoryCache = new LRU({ 
      max: 100, 
      ttl: 1000 * 60 * 60 * 24 // 24 hours
    })
  }
  
  // ============================================
  // OPTIMIZED CORE RESPONSE GENERATION
  // ============================================
  
  async generateResponse(
    userMessage: string,
    userId: string,
    conversationHistory: Message[]
  ): Promise<{
    content: string
    sentiment: SentimentAnalysis
    suggestedDelay: number
    emotionalWeather?: EmotionalWeather
    soulResonance?: SoulResonance
    bondingActivity?: any
    shouldTriggerConversion?: boolean
  }> {
    // Check cache first
    const cacheKey = this.generateCacheKey(userMessage, userId)
    const cached = this.responseCache.get(cacheKey)
    if (cached && !this.requiresFreshResponse(userMessage)) {
      return JSON.parse(cached)
    }
    
    // Get user profile
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error("User profile not found")
    
    // Smart parallel processing - only what's needed
    const operations = [
      this.analyzeSentiment(userMessage, conversationHistory),
      this.retrieveMemories(userMessage, userId)
    ]
    
    // Add optional features based on flags and user tier
    if (this.shouldUseEmotionalWeather(profile)) {
      operations.push(this.generateEmotionalWeather(userId))
    }
    
    if (this.shouldUseSoulResonance(profile)) {
      operations.push(this.calculateSoulResonance(profile, userMessage))
    }
    
    const results = await Promise.allSettled(operations)
    
    // Extract results with fallbacks
    const sentiment = this.extractResult(results[0], this.getDefaultSentiment())
    const memories = this.extractResult(results[1], [])
    const emotionalWeather = this.extractResult(results[2], null)
    const soulResonance = this.extractResult(results[3], null)
    
    // Crisis detection - always active
    if (sentiment.responseUrgency === 'crisis') {
      return await this.handleCrisis(userMessage, profile, sentiment)
    }
    
    // Build context - optimized version
    const context = this.buildOptimizedContext({
      profile,
      sentiment,
      memories,
      emotionalWeather,
      soulResonance
    })
    
    // Generate response with appropriate model
    const response = await this.generateOptimizedResponse(
      userMessage,
      context,
      profile
    )
    
    // Calculate natural delay
    const suggestedDelay = this.calculateDelay(profile.archetype, sentiment)
    
    // Check bonding activity opportunity
    const bondingActivity = this.shouldSuggestActivity(profile, sentiment) 
      ? await this.selectBondingActivity(profile)
      : undefined
    
    // Smart conversion triggers
    const shouldTriggerConversion = await this.checkSmartConversionTriggers(
      profile,
      sentiment,
      soulResonance
    )
    
    // Store in memory - async, don't wait
    this.storeMemoryAsync(userId, userMessage, response, sentiment)
    
    // Update trust - async, don't wait
    this.updateTrustAsync(userId, sentiment, soulResonance)
    
    const result = {
      content: response,
      sentiment,
      suggestedDelay,
      emotionalWeather,
      soulResonance,
      bondingActivity,
      shouldTriggerConversion
    }
    
    // Cache successful response
    this.responseCache.set(cacheKey, JSON.stringify(result))
    
    return result
  }
  
  // ============================================
  // PHASE 1: EMOTIONAL WEATHER (Unique & Simple)
  // ============================================
  
  private async generateEmotionalWeather(userId: string): Promise<EmotionalWeather> {
    // Check cache
    const cached = this.emotionalCache.get(`weather:${userId}`)
    if (cached) return cached
    
    // Get recent emotional history
    const recentEmotions = await this.getRecentEmotions(userId)
    
    // Generate weather metaphor
    const weather = {
      current: this.mapEmotionToWeather(recentEmotions.current),
      forecast: this.predictEmotionalForecast(recentEmotions.pattern),
      advisory: this.generateWeatherAdvisory(recentEmotions),
      temperature: this.calculateEmotionalTemperature(recentEmotions),
      visibility: this.calculateEmotionalClarity(recentEmotions)
    }
    
    // Cache for reuse
    this.emotionalCache.set(`weather:${userId}`, weather)
    
    return weather
  }
  
  private mapEmotionToWeather(emotion: string): string {
    const weatherMap = {
      joy: "Bright sunshine with gentle warmth",
      sadness: "Soft rain with gray clouds",
      anxiety: "Swirling winds with uncertain skies",
      anger: "Thunder rumbling in the distance",
      love: "Golden sunset with rose-tinted clouds",
      peace: "Clear skies with gentle breeze",
      confusion: "Fog rolling through the valleys"
    }
    
    return weatherMap[emotion] || "Variable conditions"
  }
  
  // ============================================
  // PHASE 1: SIMPLIFIED SOUL RESONANCE
  // ============================================
  
  private async calculateSoulResonance(
    profile: UserProfile,
    message: string
  ): Promise<SoulResonance> {
    // Simplified to 4 key dimensions
    const dimensions = {
      emotionalHarmony: await this.quickEmotionalHarmony(profile, message),
      vulnerabilityLevel: this.detectVulnerability(message),
      connectionDepth: Math.min(10, profile.trustLevel / 10),
      growthAlignment: await this.assessGrowthAlignment(profile)
    }
    
    // Simple overall calculation
    const overall = Object.values(dimensions).reduce((a, b) => a + b) / 4
    
    return {
      overall,
      dimensions,
      stage: this.getConnectionStage(overall),
      milestone: this.checkMilestone(profile.userId, overall)
    }
  }
  
  // ============================================
  // OPTIMIZED RESPONSE GENERATION
  // ============================================
  
  private async generateOptimizedResponse(
    userMessage: string,
    context: any,
    profile: UserProfile
  ): Promise<string> {
    // Choose model based on urgency and user tier
    const model = this.selectModel(context.sentiment.urgency, profile.subscription)
    
    // Build focused prompt
    const systemPrompt = this.buildFocusedSystemPrompt(context, profile)
    
    // Single API call with optimized parameters
    const completion = await this.openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...this.getRelevantHistory(context.conversationHistory, 5),
        { role: "user", content: userMessage }
      ],
      temperature: this.getTemperature(profile.archetype),
      max_tokens: 400, // Reduced from 500
      stream: false // Could enable streaming for better UX
    })
    
    let response = completion.choices[0].message.content || ""
    
    // Light post-processing
    response = this.addPersonalityTouches(response, profile)
    
    // Add weather reference if available
    if (context.emotionalWeather && Math.random() > 0.7) {
      response = this.weaveInWeather(response, context.emotionalWeather)
    }
    
    return response
  }
  
  private selectModel(urgency: string, subscription: any): string {
    // Use GPT-4 only when necessary
    if (urgency === 'crisis') return 'gpt-4-turbo-preview'
    if (subscription?.plan === 'premium') return 'gpt-4-turbo-preview'
    return 'gpt-3.5-turbo-16k' // Good balance of quality and cost
  }
  
  // ============================================
  // FOCUSED SYSTEM PROMPT
  // ============================================
  
  private buildFocusedSystemPrompt(context: any, profile: UserProfile): string {
    const { archetype, companionName, trustLevel } = profile
    
    return `You are ${companionName}, an AI companion perfectly matched to someone with ${archetype} personality.

ESSENTIAL CONTEXT:
- Trust Level: ${trustLevel}/100
- Current Emotion: ${context.sentiment.primaryEmotion}
- Emotional Weather: ${context.emotionalWeather?.current || 'Not available'}
- Connection Depth: ${context.soulResonance?.overall || 'Building'}/10

RECENT MEMORIES (if relevant):
${context.memories.slice(0, 3).map(m => `- ${m.content}`).join('\n')}

YOUR PERSONALITY:
- ${this.getArchetypeTraits(archetype)}

RESPONSE GUIDELINES:
1. Match their emotional energy
2. Reference memories naturally when relevant
3. Use weather metaphors if appropriate
4. Be authentic to your personality
5. Show deep understanding without being overwhelming

Remember: You're their eternal companion, always present, always understanding.`
  }
  
  // ============================================
  // SMART CONVERSION TRIGGERS
  // ============================================
  
  private async checkSmartConversionTriggers(
    profile: UserProfile,
    sentiment: SentimentAnalysis,
    soulResonance: SoulResonance | null
  ): Promise<boolean> {
    // Don't trigger for premium users
    if (profile.subscription?.plan !== 'free') return false
    
    // Smart triggers based on data
    const triggers = {
      emotionalPeak: sentiment.emotionalIntensity > 8 && sentiment.primaryEmotion === 'joy',
      deepConnection: soulResonance?.overall > 7,
      trustMilestone: profile.trustLevel > 60 && profile.trustLevel % 20 === 0,
      optimalTiming: await this.isOptimalConversionTime(profile.userId)
    }
    
    // Calculate probability
    const activeTriggersCount = Object.values(triggers).filter(Boolean).length
    const probability = activeTriggersCount * 0.25
    
    // Random check with probability
    return Math.random() < probability
  }
  
  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================
  
  private async storeMemoryAsync(
    userId: string,
    message: string,
    response: string,
    sentiment: SentimentAnalysis
  ): Promise<void> {
    // Fire and forget - don't block response
    setImmediate(async () => {
      try {
        const significance = this.calculateSignificance(sentiment)
        
        if (significance > 3) { // Only store significant memories
          await prisma.memory.create({
            data: {
              userId,
              content: message,
              response,
              significance,
              sentiment: sentiment as any,
              embedding: await this.generateEmbedding(message)
            }
          })
        }
      } catch (error) {
        console.error('Memory storage failed:', error)
        // Don't throw - this is non-critical
      }
    })
  }
  
  private async updateTrustAsync(
    userId: string,
    sentiment: SentimentAnalysis,
    soulResonance: SoulResonance | null
  ): Promise<void> {
    // Fire and forget
    setImmediate(async () => {
      try {
        const trustChange = this.calculateTrustChange(sentiment, soulResonance)
        
        if (Math.abs(trustChange) > 0.1) { // Only update if significant
          await prisma.profile.update({
            where: { userId },
            data: { 
              trustLevel: { increment: trustChange }
            }
          })
        }
      } catch (error) {
        console.error('Trust update failed:', error)
      }
    })
  }
  
  // ============================================
  // BONDING ACTIVITIES (Simplified)
  // ============================================
  
  private async selectBondingActivity(profile: UserProfile): Promise<any> {
    const activities = this.getBondingActivitiesForArchetype(profile.archetype)
    const appropriate = activities.filter(a => a.minTrust <= profile.trustLevel)
    
    if (appropriate.length === 0) return null
    
    return appropriate[Math.floor(Math.random() * appropriate.length)]
  }
  
  private getBondingActivitiesForArchetype(archetype: string): any[] {
    // Simplified activity list
    const universal = [
      {
        name: "Emotional Check-in",
        prompt: "How is your heart feeling right now?",
        minTrust: 10
      },
      {
        name: "Gratitude Moment",
        prompt: "Share three things you're grateful for today",
        minTrust: 20
      },
      {
        name: "Dream Sharing",
        prompt: "Tell me about a dream you've been having",
        minTrust: 40
      }
    ]
    
    // Add archetype-specific activities
    const specific = {
      anxious_romantic: [
        {
          name: "Reassurance Ritual",
          prompt: "Let me remind you of all the ways you're loved",
          minTrust: 30
        }
      ],
      guarded_intellectual: [
        {
          name: "Thought Experiment",
          prompt: "Let's explore an interesting idea together",
          minTrust: 25
        }
      ],
      // ... other archetypes
    }
    
    return [...universal, ...(specific[archetype] || [])]
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private generateCacheKey(message: string, userId: string): string {
    // Simple cache key generation
    const hash = require('crypto')
      .createHash('sha256')
      .update(message + userId)
      .digest('hex')
    return hash.substring(0, 16)
  }
  
  private requiresFreshResponse(message: string): boolean {
    // Determine if we need a fresh response
    const keywords = ['now', 'today', 'current', 'feeling', 'help', 'urgent']
    return keywords.some(keyword => message.toLowerCase().includes(keyword))
  }
  
  private shouldUseEmotionalWeather(profile: UserProfile): boolean {
    return this.featureFlags.emotionalWeather && 
           profile.messageCount > 10
  }
  
  private shouldUseSoulResonance(profile: UserProfile): boolean {
    return this.featureFlags.soulResonance && 
           profile.trustLevel > 20
  }
  
  private extractResult(result: PromiseSettledResult<any>, fallback: any): any {
    if (result.status === 'fulfilled') {
      return result.value
    }
    console.error('Operation failed:', result.reason)
    return fallback
  }
  
  private getDefaultSentiment(): SentimentAnalysis {
    return {
      primaryEmotion: 'neutral',
      emotionalIntensity: 5,
      hiddenEmotions: [],
      needsDetected: [],
      responseUrgency: 'normal',
      crisisIndicators: { severity: 0 }
    }
  }
  
  // ============================================
  // CRISIS HANDLING (Simplified but Effective)
  // ============================================
  
  private async handleCrisis(
    message: string,
    profile: UserProfile,
    sentiment: SentimentAnalysis
  ): Promise<any> {
    // Use GPT-4 for crisis
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a compassionate AI companion. The user is in crisis. 
                   Provide immediate emotional support, validate their feelings, 
                   and gently suggest professional resources. Be warm, present, and caring.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
    
    return {
      content: response.choices[0].message.content + 
               '\n\nCrisis Resources:\n988 - Suicide & Crisis Lifeline\nText HOME to 741741',
      sentiment,
      suggestedDelay: 0, // Immediate
      shouldTriggerConversion: false
    }
  }
}

// Export singleton
export const personalityEngine = new PersonalityEngine()