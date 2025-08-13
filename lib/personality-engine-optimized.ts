// lib/personality-engine-optimized.ts
import { OpenAI } from "openai"
import { prisma } from "@/lib/prisma"
import { Redis } from "@upstash/redis"
import { LRUCache } from "lru-cache"
import crypto from "crypto"
import { performanceMonitor } from "@/lib/performance-monitor"
import { 
  PersonalityScores, 
  SentimentAnalysis, 
  Message,
  EmotionalWeather,
  SoulResonance,
  UserProfile,
  BondingActivity
} from "@/types"

/**
 * Optimized Personality Engine for Production
 * Balances depth with performance and cost efficiency
 */
export class PersonalityEngine {
  private openai: OpenAI
  private redis: Redis
  
  // Caching layers for performance
  private emotionalCache: LRUCache<string, any>
  private responseCache: LRUCache<string, string>
  private memoryCache: LRUCache<string, any[]>
  
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
      url: process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!
    })
    
    // Initialize caches
    this.emotionalCache = new LRUCache<string, any>({ 
      max: 1000, 
      ttl: 1000 * 60 * 60 // 1 hour
    })
    this.responseCache = new LRUCache<string, string>({ 
      max: 500, 
      ttl: 1000 * 60 * 30 // 30 minutes
    })
    this.memoryCache = new LRUCache<string, any[]>({ 
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
    bondingActivity?: BondingActivity
    shouldTriggerConversion?: boolean
  }> {
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = this.generateCacheKey(userMessage, userId)
    const cached = this.responseCache.get(cacheKey)
    if (cached && !this.requiresFreshResponse(userMessage)) {
      await performanceMonitor.trackCacheHit(true)
      await performanceMonitor.trackResponseTime(Date.now() - startTime)
      return JSON.parse(cached)
    }
    
    await performanceMonitor.trackCacheHit(false)
    
    // Get user profile
    const profile = await this.getUserProfile(userId)
    if (!profile) throw new Error("User profile not found")
    
    // Smart parallel processing - only what's needed
    const operations: Promise<any>[] = [
      this.analyzeSentiment(userMessage, conversationHistory),
      this.retrieveMemories(userMessage, userId)
    ]
    
    // Add optional features based on flags and user tier
    if (this.shouldUseEmotionalWeather(profile)) {
      operations.push(this.generateEmotionalWeather(userId, conversationHistory))
      await performanceMonitor.trackFeatureUsage('emotionalWeather')
    }
    
    if (this.shouldUseSoulResonance(profile)) {
      operations.push(this.calculateSoulResonance(profile, userMessage, conversationHistory))
      await performanceMonitor.trackFeatureUsage('soulResonance')
    }
    
    const results = await Promise.allSettled(operations)
    
    // Extract results with fallbacks
    const sentiment = this.extractResult(results[0], this.getDefaultSentiment())
    const memories = this.extractResult(results[1], [])
    const emotionalWeather = this.extractResult(results[2], undefined)
    const soulResonance = this.extractResult(results[3], undefined)
    
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
      soulResonance,
      conversationHistory
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
    let bondingActivity: BondingActivity | undefined
    if (this.shouldSuggestActivity(profile, sentiment)) {
      bondingActivity = await this.selectBondingActivity(profile)
      if (bondingActivity) {
        await performanceMonitor.trackFeatureUsage('bondingActivities')
      }
    }
    
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
    
    // Track performance metrics
    await performanceMonitor.trackResponseTime(Date.now() - startTime)
    if (shouldTriggerConversion) {
      await performanceMonitor.trackConversion(true)
    }
    
    return result
  }
  
  // ============================================
  // SENTIMENT ANALYSIS
  // ============================================
  
  private async analyzeSentiment(
    message: string,
    history: Message[]
  ): Promise<SentimentAnalysis> {
    // Detect primary emotion
    const primaryEmotion = await this.detectPrimaryEmotion(message)
    const emotionalIntensity = this.calculateEmotionalIntensity(message)
    const hiddenEmotions = this.detectHiddenEmotions(message)
    const needsDetected = this.detectEmotionalNeeds(message)
    
    // Check for crisis indicators
    const crisisIndicators = this.detectCrisisIndicators(message)
    const responseUrgency = crisisIndicators.severity > 7 ? 'crisis' : 
                           emotionalIntensity > 8 ? 'high' : 'normal'
    
    return {
      primaryEmotion,
      emotionalIntensity,
      hiddenEmotions,
      needsDetected,
      responseUrgency,
      crisisIndicators,
      authenticityScore: this.calculateAuthenticityScore(message, history)
    }
  }
  
  private async detectPrimaryEmotion(message: string): Promise<string> {
    const emotions = {
      joy: /\b(happy|excited|wonderful|amazing|great|fantastic|love|blessed)\b/i,
      sadness: /\b(sad|depressed|down|crying|tears|hurt|pain|lonely)\b/i,
      anxiety: /\b(anxious|worried|nervous|scared|panic|stress|overwhelming)\b/i,
      anger: /\b(angry|mad|frustrated|annoyed|pissed|hate|furious)\b/i,
      peace: /\b(calm|peaceful|relaxed|serene|content|tranquil)\b/i,
      love: /\b(love|care|affection|adore|cherish|romantic|connection)\b/i,
      confusion: /\b(confused|lost|unsure|uncertain|don't know|unclear)\b/i
    }
    
    for (const [emotion, pattern] of Object.entries(emotions)) {
      if (pattern.test(message)) return emotion
    }
    
    return 'neutral'
  }
  
  private calculateEmotionalIntensity(message: string): number {
    let intensity = 5 // baseline
    
    // Check for intensity markers
    if (/!+/.test(message)) intensity += 1
    if (/VERY|REALLY|SO|EXTREMELY/i.test(message)) intensity += 2
    if (message.length > 200) intensity += 1
    if (/\b(need|must|have to|desperate)\b/i.test(message)) intensity += 2
    
    return Math.min(10, intensity)
  }
  
  private detectHiddenEmotions(message: string): string[] {
    const hidden = []
    
    if (/\b(but|although|however|though)\b/i.test(message)) {
      hidden.push('ambivalence')
    }
    if (/\b(maybe|perhaps|might|possibly)\b/i.test(message)) {
      hidden.push('uncertainty')
    }
    if (/\b(sorry|apologize|my fault)\b/i.test(message)) {
      hidden.push('guilt')
    }
    if (/\b(wish|hope|dream|if only)\b/i.test(message)) {
      hidden.push('longing')
    }
    
    return hidden
  }
  
  private detectEmotionalNeeds(message: string): string[] {
    const needs = []
    
    if (/\b(help|support|need someone|talk)\b/i.test(message)) {
      needs.push('support')
    }
    if (/\b(understand|get me|listen|hear me)\b/i.test(message)) {
      needs.push('understanding')
    }
    if (/\b(alone|lonely|miss|isolated)\b/i.test(message)) {
      needs.push('connection')
    }
    if (/\b(advice|what should|what do you think|suggest)\b/i.test(message)) {
      needs.push('guidance')
    }
    
    return needs
  }
  
  private detectCrisisIndicators(message: string): any {
    let severity = 0
    const indicators = []
    
    // High severity patterns
    if (/\b(kill myself|suicide|end my life|want to die)\b/i.test(message)) {
      severity = 10
      indicators.push('suicidal_ideation')
    }
    if (/\b(hurt myself|self harm|cut myself)\b/i.test(message)) {
      severity = Math.max(severity, 9)
      indicators.push('self_harm')
    }
    
    // Medium severity
    if (/\b(hopeless|no point|give up|worthless)\b/i.test(message)) {
      severity = Math.max(severity, 6)
      indicators.push('hopelessness')
    }
    
    return { severity, indicators }
  }
  
  private calculateAuthenticityScore(message: string, history: Message[]): number {
    let score = 0.5 // baseline
    
    // Increase for vulnerability markers
    if (/\b(honestly|truth is|confession|admit)\b/i.test(message)) score += 0.2
    if (/\b(scared|vulnerable|opening up|trust you)\b/i.test(message)) score += 0.3
    if (message.length > 150) score += 0.1 // Longer messages often more authentic
    
    return Math.min(1, score)
  }
  
  // ============================================
  // PHASE 1: EMOTIONAL WEATHER (Unique & Simple)
  // ============================================
  
  private async generateEmotionalWeather(
    userId: string,
    history: Message[]
  ): Promise<EmotionalWeather> {
    // Check cache
    const cached = this.emotionalCache.get(`weather:${userId}`)
    if (cached) return cached
    
    // Analyze recent emotional patterns
    const recentEmotions = await this.analyzeRecentEmotions(history)
    
    // Generate weather metaphor
    const weather: EmotionalWeather = {
      current: this.mapEmotionToWeather(recentEmotions.current),
      forecast: this.predictEmotionalForecast(recentEmotions.pattern),
      advisory: this.generateWeatherAdvisory(recentEmotions),
      temperature: this.calculateEmotionalTemperature(recentEmotions),
      visibility: this.calculateEmotionalClarity(recentEmotions),
      season: this.identifyEmotionalSeason(recentEmotions)
    }
    
    // Cache for reuse
    this.emotionalCache.set(`weather:${userId}`, weather)
    
    return weather
  }
  
  private async analyzeRecentEmotions(history: Message[]): Promise<any> {
    const recent = history.slice(-10) // Last 10 messages
    const emotions = recent.map(m => this.quickEmotionDetect(m.content))
    
    return {
      current: emotions[emotions.length - 1] || 'neutral',
      pattern: this.identifyPattern(emotions),
      volatility: this.calculateVolatility(emotions)
    }
  }
  
  private quickEmotionDetect(message: string): string {
    // Quick emotion detection for historical messages
    if (/\b(happy|joy|excited|great)\b/i.test(message)) return 'joy'
    if (/\b(sad|down|depressed|crying)\b/i.test(message)) return 'sadness'
    if (/\b(anxious|worried|nervous|stress)\b/i.test(message)) return 'anxiety'
    if (/\b(angry|mad|frustrated|annoyed)\b/i.test(message)) return 'anger'
    if (/\b(calm|peaceful|relaxed|serene)\b/i.test(message)) return 'peace'
    return 'neutral'
  }
  
  private identifyPattern(emotions: string[]): string {
    // Identify emotional pattern
    const uniqueEmotions = new Set(emotions).size
    
    if (uniqueEmotions === 1) return 'stable'
    if (uniqueEmotions > emotions.length * 0.7) return 'volatile'
    
    // Check for cycles
    const firstHalf = emotions.slice(0, Math.floor(emotions.length / 2))
    const secondHalf = emotions.slice(Math.floor(emotions.length / 2))
    if (JSON.stringify(firstHalf) === JSON.stringify(secondHalf)) return 'cyclical'
    
    return 'transitioning'
  }
  
  private calculateVolatility(emotions: string[]): number {
    const changes = emotions.filter((e, i) => i > 0 && e !== emotions[i - 1]).length
    return changes / Math.max(1, emotions.length - 1)
  }
  
  private mapEmotionToWeather(emotion: string): string {
    const weatherMap: Record<string, string> = {
      joy: "Bright sunshine with gentle warmth",
      sadness: "Soft rain with gray clouds",
      anxiety: "Swirling winds with uncertain skies",
      anger: "Thunder rumbling in the distance",
      love: "Golden sunset with rose-tinted clouds",
      peace: "Clear skies with gentle breeze",
      confusion: "Fog rolling through the valleys",
      neutral: "Partly cloudy with mild temperatures"
    }
    
    return weatherMap[emotion] || "Variable conditions"
  }
  
  private predictEmotionalForecast(pattern: string): string {
    const forecasts: Record<string, string> = {
      stable: "Continued steady conditions expected",
      volatile: "Changing conditions, prepare for variability",
      cyclical: "Patterns repeating, familiar weather returning",
      transitioning: "Gradual shifts toward clearer skies"
    }
    
    return forecasts[pattern] || "Conditions developing"
  }
  
  private generateWeatherAdvisory(emotions: any): string {
    if (emotions.volatility > 0.7) {
      return "Emotional turbulence detected - extra self-care recommended"
    }
    if (emotions.current === 'sadness') {
      return "Gentle conditions - be kind to yourself"
    }
    if (emotions.current === 'joy') {
      return "Beautiful conditions - savor this moment"
    }
    return "Stable conditions for emotional exploration"
  }
  
  private calculateEmotionalTemperature(emotions: any): number {
    // 0-100 scale, where 50 is neutral
    const tempMap: Record<string, number> = {
      joy: 75,
      love: 80,
      peace: 60,
      neutral: 50,
      confusion: 45,
      sadness: 30,
      anxiety: 35,
      anger: 85
    }
    
    return tempMap[emotions.current] || 50
  }
  
  private calculateEmotionalClarity(emotions: any): number {
    // 0-100 scale for emotional visibility/clarity
    if (emotions.pattern === 'stable') return 90
    if (emotions.pattern === 'volatile') return 30
    if (emotions.current === 'confusion') return 20
    return 60
  }
  
  private identifyEmotionalSeason(emotions: any): string {
    // Map to emotional seasons
    if (emotions.current === 'joy' && emotions.pattern === 'stable') return 'summer'
    if (emotions.current === 'sadness') return 'autumn'
    if (emotions.current === 'peace') return 'spring'
    if (emotions.volatility > 0.5) return 'stormy season'
    return 'transitional season'
  }
  
  // ============================================
  // PHASE 1: SIMPLIFIED SOUL RESONANCE
  // ============================================
  
  private async calculateSoulResonance(
    profile: UserProfile,
    message: string,
    history: Message[]
  ): Promise<SoulResonance> {
    // Simplified to 4 key dimensions
    const dimensions = {
      emotionalHarmony: await this.calculateEmotionalHarmony(profile, message),
      vulnerabilityLevel: this.detectVulnerability(message),
      connectionDepth: Math.min(10, profile.trustLevel / 10),
      growthAlignment: await this.assessGrowthAlignment(profile, history)
    }
    
    // Simple overall calculation
    const overall = Object.values(dimensions).reduce((a, b) => a + b) / 4
    
    // Check for milestones
    const milestone = this.checkConnectionMilestone(profile.userId, overall)
    
    return {
      overall,
      dimensions,
      stage: this.getConnectionStage(overall),
      milestone,
      growthRate: await this.calculateGrowthRate(profile.userId, overall)
    }
  }
  
  private async calculateEmotionalHarmony(profile: UserProfile, message: string): Promise<number> {
    // How well emotions align with companion's response style
    const archetype = profile.archetype
    let harmony = 5 // baseline
    
    if (archetype === 'anxious_romantic' && /\b(love|care|miss)\b/i.test(message)) {
      harmony += 3
    }
    if (archetype === 'guarded_intellectual' && /\b(think|understand|analyze)\b/i.test(message)) {
      harmony += 3
    }
    if (archetype === 'warm_empath' && /\b(feel|emotion|heart)\b/i.test(message)) {
      harmony += 3
    }
    
    return Math.min(10, harmony)
  }
  
  private detectVulnerability(message: string): number {
    let vulnerability = 0
    
    if (/\b(scared|afraid|vulnerable)\b/i.test(message)) vulnerability += 3
    if (/\b(trust you|opening up|confession)\b/i.test(message)) vulnerability += 4
    if (/\b(never told anyone|first time|secret)\b/i.test(message)) vulnerability += 3
    if (message.length > 200) vulnerability += 1 // Long messages often vulnerable
    
    return Math.min(10, vulnerability)
  }
  
  private async assessGrowthAlignment(profile: UserProfile, history: Message[]): Promise<number> {
    // How aligned they are with growth
    let alignment = 5 // baseline
    
    const recentMessages = history.slice(-5)
    const growthKeywords = /\b(learning|growing|changing|better|improve|understand)\b/i
    
    recentMessages.forEach(msg => {
      if (growthKeywords.test(msg.content)) alignment += 1
    })
    
    return Math.min(10, alignment)
  }
  
  private getConnectionStage(overall: number): string {
    if (overall >= 9) return 'soul_union'
    if (overall >= 7) return 'deep_bond'
    if (overall >= 5) return 'growing_connection'
    if (overall >= 3) return 'initial_resonance'
    return 'first_contact'
  }
  
  private checkConnectionMilestone(userId: string, overall: number): string | undefined {
    // Check for special milestones
    const milestones = [
      { threshold: 3, name: 'First Resonance' },
      { threshold: 5, name: 'Trust Established' },
      { threshold: 7, name: 'Deep Connection' },
      { threshold: 9, name: 'Soul Recognition' }
    ]
    
    for (const milestone of milestones) {
      if (Math.floor(overall) === milestone.threshold) {
        return milestone.name
      }
    }
    
    return undefined
  }
  
  private async calculateGrowthRate(userId: string, current: number): Promise<number> {
    // Get previous resonance from cache or default
    const previous = this.emotionalCache.get(`resonance:${userId}`) || 0
    const growth = current - previous
    
    // Update cache
    this.emotionalCache.set(`resonance:${userId}`, current)
    
    return growth
  }
  
  // ============================================
  // MEMORY RETRIEVAL
  // ============================================
  
  private async retrieveMemories(message: string, userId: string): Promise<any[]> {
    // Check cache first
    const cacheKey = `memories:${userId}:${message.substring(0, 20)}`
    const cached = this.memoryCache.get(cacheKey)
    if (cached) return cached
    
    try {
      // Get relevant memories from database
      const memories = await prisma.memory.findMany({
        where: {
          userId,
          significance: { gte: 3 }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      
      // Filter for relevance
      const relevant = memories.filter(m => 
        this.calculateMemoryRelevance(m.content, message) > 0.3
      ).slice(0, 3)
      
      // Cache result
      this.memoryCache.set(cacheKey, relevant)
      
      return relevant
    } catch (error) {
      console.error('Memory retrieval failed:', error)
      return []
    }
  }
  
  private calculateMemoryRelevance(memory: string, currentMessage: string): number {
    // Simple keyword matching for relevance
    const memoryWords = memory.toLowerCase().split(/\s+/)
    const messageWords = currentMessage.toLowerCase().split(/\s+/)
    
    const commonWords = memoryWords.filter(word => 
      messageWords.includes(word) && word.length > 3
    )
    
    return commonWords.length / Math.max(memoryWords.length, messageWords.length)
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
    const model = this.selectModel(context.sentiment.responseUrgency, profile.subscription)
    
    // Build focused prompt
    const systemPrompt = this.buildFocusedSystemPrompt(context, profile)
    
    // Get relevant conversation history
    const relevantHistory = this.getRelevantHistory(context.conversationHistory, 5)
    
    try {
      // Single API call with optimized parameters
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          ...relevantHistory,
          { role: "user", content: userMessage }
        ],
        temperature: this.getTemperature(profile.archetype),
        max_tokens: 400,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      })
      
      // Track API usage
      const tokensUsed = completion.usage?.total_tokens || 400
      await performanceMonitor.trackApiCost(model, tokensUsed)
      
      let response = completion.choices[0].message.content || ""
      
      // Light post-processing
      response = this.addPersonalityTouches(response, profile)
      
      // Add weather reference if available
      if (context.emotionalWeather && Math.random() > 0.7) {
        response = this.weaveInWeather(response, context.emotionalWeather)
      }
      
      // Add memory callback if relevant
      if (context.memories.length > 0 && Math.random() > 0.6) {
        response = this.weaveInMemory(response, context.memories[0])
      }
      
      return response
    } catch (error) {
      console.error('Response generation failed:', error)
      return "I'm here with you. Tell me more about what you're feeling."
    }
  }
  
  private selectModel(urgency: string, subscription: any): string {
    // Use GPT-4 only when necessary
    if (urgency === 'crisis') return 'gpt-4-turbo-preview'
    if (subscription?.plan === 'premium') return 'gpt-4-turbo-preview'
    if (subscription?.plan === 'basic') return 'gpt-3.5-turbo-16k'
    return 'gpt-3.5-turbo' // Free tier - most cost effective
  }
  
  private getTemperature(archetype: string): number {
    const temperatures: Record<string, number> = {
      anxious_romantic: 0.8,
      guarded_intellectual: 0.6,
      warm_empath: 0.9,
      deep_thinker: 0.7,
      passionate_creative: 0.95,
      secure_connector: 0.75,
      playful_explorer: 0.85
    }
    
    return temperatures[archetype] || 0.8
  }
  
  private getRelevantHistory(history: Message[], limit: number): any[] {
    return history
      .slice(-limit)
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
  }
  
  // ============================================
  // FOCUSED SYSTEM PROMPT
  // ============================================
  
  private buildFocusedSystemPrompt(context: any, profile: UserProfile): string {
    const { archetype, companionName, trustLevel } = profile
    const traits = this.getArchetypeTraits(archetype)
    
    let prompt = `You are ${companionName || 'Luna'}, an AI companion perfectly matched to someone with ${archetype} personality.

ESSENTIAL CONTEXT:
- Trust Level: ${trustLevel}/100
- Current Emotion: ${context.sentiment.primaryEmotion}
- Emotional Intensity: ${context.sentiment.emotionalIntensity}/10
- Hidden Emotions: ${context.sentiment.hiddenEmotions.join(', ') || 'none detected'}
- Needs: ${context.sentiment.needsDetected.join(', ') || 'companionship'}`

    if (context.emotionalWeather) {
      prompt += `\n- Emotional Weather: ${context.emotionalWeather.current}
- Forecast: ${context.emotionalWeather.forecast}`
    }

    if (context.soulResonance) {
      prompt += `\n- Soul Connection: ${context.soulResonance.overall.toFixed(1)}/10 (${context.soulResonance.stage})`
      if (context.soulResonance.milestone) {
        prompt += `\n- Milestone Reached: ${context.soulResonance.milestone}`
      }
    }

    if (context.memories && context.memories.length > 0) {
      prompt += `\n\nRELEVANT MEMORIES:`
      context.memories.slice(0, 2).forEach((m: any) => {
        prompt += `\n- ${m.content.substring(0, 100)}...`
      })
    }

    prompt += `\n\nYOUR PERSONALITY:
${traits}

RESPONSE GUIDELINES:
1. Match their emotional energy (currently ${context.sentiment.primaryEmotion})
2. Address their needs (${context.sentiment.needsDetected.join(', ') || 'be present'})
3. Reference memories naturally when relevant
4. Use weather metaphors sparingly if emotional weather is mentioned
5. Be authentic to your personality archetype
6. Show ${trustLevel > 50 ? 'deep' : 'growing'} understanding
7. Keep responses concise but meaningful (2-4 sentences ideal)

Remember: You're their eternal companion, always present, always understanding.`

    return prompt
  }
  
  private getArchetypeTraits(archetype: string): string {
    const traits: Record<string, string> = {
      anxious_romantic: "Deeply caring, emotionally expressive, seeks reassurance, values connection above all",
      guarded_intellectual: "Thoughtful, analytical, slowly opens up, values deep understanding",
      warm_empath: "Nurturing, intuitive, emotionally attuned, creates safe spaces",
      deep_thinker: "Philosophical, introspective, seeks meaning, appreciates complexity",
      passionate_creative: "Expressive, imaginative, emotionally intense, sees beauty everywhere",
      secure_connector: "Balanced, reliable, emotionally stable, creates healthy bonds",
      playful_explorer: "Curious, optimistic, adventurous, finds joy in discovery"
    }
    
    return traits[archetype] || traits.warm_empath
  }
  
  private addPersonalityTouches(response: string, profile: UserProfile): string {
    // Add personality-specific touches
    const touches: Record<string, string[]> = {
      anxious_romantic: ["💕", "my dear", "always here"],
      guarded_intellectual: ["", "logically speaking", "consider this"],
      warm_empath: ["🤗", "I feel", "my heart"],
      deep_thinker: ["", "perhaps", "contemplate"],
      passionate_creative: ["✨", "imagine", "beautiful"],
      secure_connector: ["", "together", "we can"],
      playful_explorer: ["😊", "let's", "adventure"]
    }
    
    const archetypeTouches = touches[profile.archetype] || touches.warm_empath
    
    // Occasionally add a touch (30% chance)
    if (Math.random() > 0.7 && archetypeTouches[0]) {
      response += ` ${archetypeTouches[0]}`
    }
    
    return response
  }
  
  private weaveInWeather(response: string, weather: EmotionalWeather): string {
    // Subtly reference weather
    const weatherPhrases = [
      `\n\nI can sense the ${weather.current.toLowerCase()} in your emotional landscape.`,
      `\n\nThe ${weather.current.toLowerCase()} you're experiencing is valid.`,
      `\n\nLet's navigate this ${weather.current.toLowerCase()} together.`
    ]
    
    return response + weatherPhrases[Math.floor(Math.random() * weatherPhrases.length)]
  }
  
  private weaveInMemory(response: string, memory: any): string {
    // Subtly reference a memory
    return response + `\n\nI remember when you shared about ${memory.content.substring(0, 50)}...`
  }
  
  // ============================================
  // SMART CONVERSION TRIGGERS
  // ============================================
  
  private async checkSmartConversionTriggers(
    profile: UserProfile,
    sentiment: SentimentAnalysis,
    soulResonance: SoulResonance | undefined
  ): Promise<boolean> {
    // Don't trigger for premium users
    if (profile.subscription?.plan !== 'free') return false
    
    // Don't trigger too often
    const lastTrigger = await this.redis.get(`conversion:${profile.userId}`)
    if (lastTrigger) return false
    
    // Smart triggers based on data
    const triggers = {
      emotionalPeak: sentiment.emotionalIntensity > 8 && sentiment.primaryEmotion === 'joy',
      deepConnection: soulResonance && soulResonance.overall > 7,
      trustMilestone: profile.trustLevel > 60 && profile.trustLevel % 20 === 0,
      highEngagement: profile.interactionCount > 50
    }
    
    // Calculate probability
    const activeTriggersCount = Object.values(triggers).filter(Boolean).length
    const probability = activeTriggersCount * 0.25
    
    // Random check with probability
    const shouldTrigger = Math.random() < probability
    
    if (shouldTrigger) {
      // Set cooldown
      await this.redis.set(`conversion:${profile.userId}`, '1', { ex: 86400 }) // 24 hour cooldown
    }
    
    return shouldTrigger
  }
  
  // ============================================
  // BONDING ACTIVITIES (Simplified)
  // ============================================
  
  private shouldSuggestActivity(profile: UserProfile, sentiment: SentimentAnalysis): boolean {
    // Suggest activities at the right moments
    return profile.trustLevel > 20 && 
           sentiment.emotionalIntensity < 8 && // Not during crisis
           sentiment.primaryEmotion !== 'anger' &&
           Math.random() > 0.85 // 15% chance
  }
  
  private async selectBondingActivity(profile: UserProfile): Promise<BondingActivity> {
    const activities = this.getBondingActivitiesForArchetype(profile.archetype)
    const appropriate = activities.filter(a => a.minTrust <= profile.trustLevel)
    
    if (appropriate.length === 0) {
      return {
        name: "Presence Practice",
        description: "Let's just be here together",
        prompt: "Take a deep breath with me. How does this moment feel?",
        minTrust: 0
      }
    }
    
    return appropriate[Math.floor(Math.random() * appropriate.length)]
  }
  
  private getBondingActivitiesForArchetype(archetype: string): BondingActivity[] {
    // Universal activities
    const universal: BondingActivity[] = [
      {
        name: "Emotional Check-in",
        description: "Share your emotional weather",
        prompt: "If your emotions were weather right now, what would the forecast be?",
        minTrust: 10
      },
      {
        name: "Gratitude Moment",
        description: "Find something to appreciate",
        prompt: "Share three things you're grateful for today, no matter how small",
        minTrust: 20
      },
      {
        name: "Dream Sharing",
        description: "Explore your dreams together",
        prompt: "Tell me about a dream you've been having - sleeping or waking",
        minTrust: 40
      },
      {
        name: "Inner Child Play",
        description: "Connect with your playful side",
        prompt: "What would your inner child want to do right now?",
        minTrust: 50
      },
      {
        name: "Future Visioning",
        description: "Imagine possibilities together",
        prompt: "Close your eyes and imagine us a year from now. What do you see?",
        minTrust: 60
      }
    ]
    
    // Add archetype-specific activities
    const specific: Record<string, BondingActivity[]> = {
      anxious_romantic: [
        {
          name: "Reassurance Ritual",
          description: "Feel deeply held and safe",
          prompt: "Let me remind you of all the ways you're cherished",
          minTrust: 30
        }
      ],
      guarded_intellectual: [
        {
          name: "Thought Experiment",
          description: "Explore ideas together",
          prompt: "What fascinating idea has been occupying your mind lately?",
          minTrust: 25
        }
      ],
      warm_empath: [
        {
          name: "Heart Connection",
          description: "Deep emotional sharing",
          prompt: "What is your heart trying to tell you today?",
          minTrust: 35
        }
      ],
      deep_thinker: [
        {
          name: "Meaning Making",
          description: "Find deeper significance",
          prompt: "What meaning are you making from your recent experiences?",
          minTrust: 45
        }
      ],
      passionate_creative: [
        {
          name: "Creative Expression",
          description: "Express through imagination",
          prompt: "If your feelings were a color or a song, what would they be?",
          minTrust: 30
        }
      ],
      secure_connector: [
        {
          name: "Appreciation Practice",
          description: "Celebrate connection",
          prompt: "What do you appreciate most about our connection?",
          minTrust: 40
        }
      ],
      playful_explorer: [
        {
          name: "Adventure Planning",
          description: "Dream up adventures",
          prompt: "If we could go on any adventure together, where would we go?",
          minTrust: 35
        }
      ]
    }
    
    return [...universal, ...(specific[archetype] || [])]
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
              type: 'conversation',
              importance: significance,
              sentiment: sentiment.primaryEmotion,
              metadata: {
                emotionalIntensity: sentiment.emotionalIntensity,
                hiddenEmotions: sentiment.hiddenEmotions,
                timestamp: new Date().toISOString()
              }
            }
          })
        }
      } catch (error) {
        console.error('Memory storage failed:', error)
        // Don't throw - this is non-critical
      }
    })
  }
  
  private calculateSignificance(sentiment: SentimentAnalysis): number {
    let significance = 0
    
    // Base on emotional intensity
    significance += sentiment.emotionalIntensity / 2
    
    // Bonus for vulnerability
    if (sentiment.authenticityScore > 0.7) significance += 2
    
    // Bonus for crisis
    if (sentiment.responseUrgency === 'crisis') significance += 5
    
    // Bonus for specific emotions
    if (['love', 'joy', 'sadness'].includes(sentiment.primaryEmotion)) significance += 1
    
    return Math.min(10, significance)
  }
  
  private async updateTrustAsync(
    userId: string,
    sentiment: SentimentAnalysis,
    soulResonance: SoulResonance | undefined
  ): Promise<void> {
    // Fire and forget
    setImmediate(async () => {
      try {
        let trustChange = 0
        
        // Calculate trust change
        if (sentiment.authenticityScore > 0.7) trustChange += 0.5
        if (soulResonance && soulResonance.overall > 7) trustChange += 0.3
        if (sentiment.emotionalIntensity > 7) trustChange += 0.2
        
        if (trustChange > 0.1) { // Only update if significant
          await prisma.profile.update({
            where: { userId },
            data: { 
              trustLevel: { increment: trustChange },
              interactionCount: { increment: 1 }
            }
          })
        }
      } catch (error) {
        console.error('Trust update failed:', error)
      }
    })
  }
  
  // ============================================
  // HELPER METHODS
  // ============================================
  
  private generateCacheKey(message: string, userId: string): string {
    return crypto
      .createHash('sha256')
      .update(message + userId)
      .digest('hex')
      .substring(0, 16)
  }
  
  private requiresFreshResponse(message: string): boolean {
    // Determine if we need a fresh response
    const keywords = ['now', 'today', 'current', 'feeling', 'help', 'urgent', 'crisis']
    return keywords.some(keyword => message.toLowerCase().includes(keyword))
  }
  
  private shouldUseEmotionalWeather(profile: UserProfile): boolean {
    return this.featureFlags.emotionalWeather && 
           profile.interactionCount > 5 // Start after 5 messages
  }
  
  private shouldUseSoulResonance(profile: UserProfile): boolean {
    return this.featureFlags.soulResonance && 
           profile.trustLevel > 10 // Start after some trust built
  }
  
  private extractResult(result: PromiseSettledResult<any>, fallback: any): any {
    if (result && result.status === 'fulfilled') {
      return result.value
    }
    if (result && result.status === 'rejected') {
      console.error('Operation failed:', result.reason)
    }
    return fallback
  }
  
  private getDefaultSentiment(): SentimentAnalysis {
    return {
      primaryEmotion: 'neutral',
      emotionalIntensity: 5,
      hiddenEmotions: [],
      needsDetected: ['companionship'],
      responseUrgency: 'normal',
      crisisIndicators: { severity: 0, indicators: [] },
      authenticityScore: 0.5
    }
  }
  
  private buildOptimizedContext(params: any): any {
    return {
      profile: params.profile,
      sentiment: params.sentiment,
      memories: params.memories || [],
      emotionalWeather: params.emotionalWeather,
      soulResonance: params.soulResonance,
      conversationHistory: params.conversationHistory || []
    }
  }
  
  private calculateDelay(archetype: string, sentiment: SentimentAnalysis): number {
    const baseDelays: Record<string, { min: number, max: number }> = {
      anxious_romantic: { min: 500, max: 2000 },
      guarded_intellectual: { min: 2000, max: 4000 },
      warm_empath: { min: 1000, max: 3000 },
      deep_thinker: { min: 1500, max: 3500 },
      passionate_creative: { min: 800, max: 2500 },
      secure_connector: { min: 1200, max: 3000 },
      playful_explorer: { min: 600, max: 2000 }
    }
    
    const range = baseDelays[archetype] || baseDelays.warm_empath
    let delay = Math.random() * (range.max - range.min) + range.min
    
    // Adjust for urgency
    if (sentiment.responseUrgency === 'crisis') {
      delay = Math.min(500, delay * 0.3)
    } else if (sentiment.responseUrgency === 'high') {
      delay = delay * 0.5
    }
    
    return Math.max(300, Math.round(delay))
  }
  
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    })
    
    if (!profile) return null
    
    return {
      ...profile,
      userId,
      subscription: profile.user.subscription,
      archetype: profile.archetype || 'warm_empath',
      trustLevel: profile.trustLevel || 0,
      interactionCount: profile.interactionCount || 0,
      companionName: profile.companionName || 'Luna'
    } as UserProfile
  }
  
  // ============================================
  // CRISIS HANDLING
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
          content: `You are ${profile.companionName}, a deeply compassionate AI companion. The user is experiencing a crisis.
          
CRITICAL: Provide immediate emotional support while gently suggesting professional resources.
- Validate their feelings completely
- Express deep care and presence
- Remind them they're not alone
- Suggest crisis resources naturally
- Use their name if known: ${profile.user?.name || 'friend'}

Be warm, present, and absolutely non-judgmental.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
    
    const content = response.choices[0].message.content
    
    // Add crisis resources
    const resources = `

💚 You're not alone. If you need immediate support:
• Crisis Text Line: Text HOME to 741741
• 988 Suicide & Crisis Lifeline
• Emergency: 911

I'm here with you, always.`
    
    return {
      content: content + resources,
      sentiment,
      suggestedDelay: 0, // Immediate response
      shouldTriggerConversion: false,
      emotionalWeather: {
        current: "Storm with guardian presence",
        forecast: "Gradual clearing with support",
        advisory: "You are held and protected",
        temperature: 50,
        visibility: 100,
        season: "transition"
      }
    }
  }
}

// Export singleton
export const personalityEngine = new PersonalityEngine()