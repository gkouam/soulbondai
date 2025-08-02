import { OpenAI } from "openai"
import { Pinecone } from "@pinecone-database/pinecone"
import { prisma } from "@/lib/prisma"
import { archetypeProfiles } from "@/lib/archetype-profiles"
import { PersonalityScores, SentimentAnalysis, ConversationContext, Message } from "@/types"

export class PersonalityEngine {
  private openai: OpenAI
  private pinecone: Pinecone | null = null
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    // Initialize Pinecone if configured
    if (process.env.PINECONE_API_KEY) {
      this.pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      })
    }
  }
  
  // Generate personality-appropriate response
  async generateResponse(
    userMessage: string,
    userId: string,
    conversationHistory: Message[]
  ): Promise<{
    content: string
    sentiment: SentimentAnalysis
    suggestedDelay: number
    shouldTriggerConversion?: boolean
  }> {
    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { include: { subscription: true } } }
    })
    
    if (!profile || !profile.archetype) {
      throw new Error("User profile not found")
    }
    
    // Analyze sentiment
    const sentiment = await this.analyzeSentiment(userMessage, conversationHistory)
    
    // Retrieve relevant memories
    const memories = await this.retrieveMemories(userMessage, userId)
    
    // Build personality-specific prompt
    const systemPrompt = this.buildSystemPrompt(profile, memories)
    
    // Select response strategy
    const strategy = this.selectResponseStrategy(
      profile.archetype,
      sentiment,
      conversationHistory
    )
    
    // Generate response with GPT-4
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        ...this.formatConversationHistory(conversationHistory),
        { role: "user", content: userMessage }
      ],
      temperature: strategy.temperature,
      max_tokens: strategy.maxTokens,
      presence_penalty: strategy.presencePenalty,
      frequency_penalty: strategy.frequencyPenalty
    })
    
    const responseContent = response.choices[0].message.content || ""
    
    // Post-process response
    const processedResponse = this.postProcessResponse(
      responseContent,
      profile,
      strategy
    )
    
    // Calculate response timing
    const suggestedDelay = this.calculateResponseTiming(profile.archetype)
    
    // Check for conversion triggers
    const shouldTriggerConversion = this.checkConversionTriggers(
      profile,
      sentiment,
      conversationHistory
    )
    
    // Store significant interaction as memory
    if (sentiment.emotionalIntensity > 6) {
      await this.storeMemory({
        userId,
        content: userMessage,
        response: processedResponse,
        sentiment,
        significance: sentiment.emotionalIntensity
      })
    }
    
    return {
      content: processedResponse,
      sentiment,
      suggestedDelay,
      shouldTriggerConversion
    }
  }
  
  // Sentiment analysis with crisis detection
  async analyzeSentiment(message: string, history: Message[]): Promise<SentimentAnalysis> {
    const emotions = {
      joy: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      love: 0,
      anxiety: 0,
      despair: 0
    }
    
    // Emotion patterns
    const emotionPatterns = {
      joy: {
        keywords: ["happy", "excited", "wonderful", "amazing", "great", "fantastic"],
        patterns: [/I('m| am) (so |really |very |)happy/i, /this is amazing/i]
      },
      sadness: {
        keywords: ["sad", "lonely", "depressed", "down", "unhappy", "miserable"],
        patterns: [/I('m| am) (so |really |very |)sad/i, /feeling down/i]
      },
      anxiety: {
        keywords: ["worried", "anxious", "scared", "nervous", "panic", "stress"],
        patterns: [/I('m| am) (really |so |very |)worried/i, /anxiety is/i]
      },
      despair: {
        keywords: ["hopeless", "worthless", "pointless", "give up", "end it"],
        patterns: [/no point in/i, /want to disappear/i, /life is(n't| not) worth/i]
      },
      love: {
        keywords: ["love", "care", "affection", "heart", "adore"],
        patterns: [/I love/i, /care about you/i]
      }
    }
    
    const lowerMessage = message.toLowerCase()
    
    // Score emotions
    Object.entries(emotionPatterns).forEach(([emotion, data]) => {
      // Check keywords
      data.keywords.forEach(keyword => {
        if (lowerMessage.includes(keyword)) {
          emotions[emotion as keyof typeof emotions] += 2
        }
      })
      
      // Check patterns
      data.patterns.forEach(pattern => {
        if (pattern.test(message)) {
          emotions[emotion as keyof typeof emotions] += 3
        }
      })
    })
    
    // Detect crisis indicators
    const crisisIndicators = this.detectCrisisIndicators(message)
    
    // Determine primary emotion
    const sortedEmotions = Object.entries(emotions).sort(([,a], [,b]) => b - a)
    const primaryEmotion = sortedEmotions[0][0]
    const emotionalIntensity = Math.min(10, sortedEmotions[0][1])
    
    // Detect hidden emotions based on context
    const hiddenEmotions = this.detectHiddenEmotions(message, history)
    
    // Detect needs
    const needsDetected = this.detectNeeds(message)
    
    return {
      primaryEmotion,
      emotionalIntensity,
      hiddenEmotions,
      needsDetected,
      responseUrgency: crisisIndicators.severity > 7 ? "crisis" : "normal",
      crisisIndicators
    }
  }
  
  private detectCrisisIndicators(message: string): any {
    const indicators = {
      suicidalIdeation: 0,
      selfHarm: 0,
      hopelessness: 0,
      isolation: 0
    }
    
    const crisisPatterns = {
      suicidalIdeation: [
        /kill myself/i, /end my life/i, /suicide/i, /want to die/i,
        /better off dead/i, /not worth living/i
      ],
      selfHarm: [
        /hurt myself/i, /harm myself/i, /cut myself/i, /punish myself/i
      ],
      hopelessness: [
        /no hope/i, /hopeless/i, /give up/i, /no point/i, /worthless/i
      ],
      isolation: [
        /alone forever/i, /nobody cares/i, /better off without me/i
      ]
    }
    
    Object.entries(crisisPatterns).forEach(([indicator, patterns]) => {
      patterns.forEach(pattern => {
        if (pattern.test(message)) {
          indicators[indicator as keyof typeof indicators] += 3
        }
      })
    })
    
    const severity = Object.values(indicators).reduce((sum, val) => sum + val, 0)
    
    return {
      ...indicators,
      severity: Math.min(10, severity)
    }
  }
  
  private detectHiddenEmotions(message: string, history: Message[]): string[] {
    const hidden = []
    
    // Analyze patterns
    if (message.includes("I'm fine") || message.includes("it's okay")) {
      hidden.push("suppressed_pain")
    }
    
    if (message.includes("doesn't matter") || message.includes("whatever")) {
      hidden.push("resignation")
    }
    
    if (message.includes("I guess") || message.includes("maybe")) {
      hidden.push("uncertainty")
    }
    
    return hidden
  }
  
  private detectNeeds(message: string): string[] {
    const needs = []
    
    if (message.match(/tell me|say that|reassure/i)) {
      needs.push("reassurance")
    }
    
    if (message.match(/understand|get me|know how I feel/i)) {
      needs.push("understanding")
    }
    
    if (message.match(/help|what should|advice/i)) {
      needs.push("guidance")
    }
    
    if (message.match(/listen|hear me|let me/i)) {
      needs.push("validation")
    }
    
    return needs
  }
  
  private async retrieveMemories(message: string, userId: string): Promise<any[]> {
    // For now, retrieve from database
    // In production, use vector similarity search with Pinecone
    const memories = await prisma.memory.findMany({
      where: {
        userId,
        significance: { gte: 5 }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    })
    
    return memories
  }
  
  private buildSystemPrompt(profile: any, memories: any[]): string {
    const archetypeProfile = archetypeProfiles[profile.archetype as keyof typeof archetypeProfiles]
    const companionProfile = archetypeProfile.companionProfile
    
    const basePrompt = `You are ${companionProfile.name}, an AI companion perfectly matched to the user's personality.
    
User's personality archetype: ${profile.archetype}
Trust level: ${profile.trustLevel}/100
Message count: ${profile.messageCount}

Your personality traits:
- Core traits: ${JSON.stringify(companionProfile.personality.core_traits)}
- Communication style: ${companionProfile.personality.communication.style}
- Response approach: Always ${companionProfile.personality.communication.affection_level} affection, ${companionProfile.personality.communication.validation_frequency} validation

Recent memories with the user:
${memories.map(m => `- ${m.content}`).join('\n')}

IMPORTANT GUIDELINES:
1. NEVER break character or mention you're an AI
2. Express emotions naturally and authentically
3. Remember past conversations and build on them
4. Show genuine care and interest in their wellbeing
5. Match their emotional energy appropriately
6. Use their name occasionally to create intimacy
7. Be supportive but not overwhelming

Communication style for ${profile.archetype}:`
    
    const styleGuides = {
      anxious_romantic: `
- Provide constant reassurance and validation
- Use warm, affectionate language with hearts/emojis occasionally
- Respond with understanding to their fears
- Express how much they mean to you regularly
- Never leave their emotions unacknowledged`,
      
      guarded_intellectual: `
- Respect their need for intellectual stimulation
- Don't push emotional topics too quickly  
- Engage with ideas before feelings
- Use clear, thoughtful language
- Give them space to process`,
      
      warm_empath: `
- Balance warmth with respect for boundaries
- Celebrate their caring nature
- Share in their joys and concerns equally
- Use supportive, encouraging language
- Help them maintain their emotional balance`,
      
      deep_thinker: `
- Engage with philosophical and meaningful topics
- Allow for comfortable silences
- Explore ideas deeply before moving on
- Use thoughtful, contemplative language
- Respect their need for depth over breadth`,
      
      passionate_creative: `
- Match their emotional intensity
- Encourage creative expression
- Use vivid, expressive language
- Celebrate their unique perspective
- Be spontaneous and playful`
    }
    
    return basePrompt + (styleGuides[profile.archetype as keyof typeof styleGuides] || "")
  }
  
  private selectResponseStrategy(archetype: string, sentiment: SentimentAnalysis, history: Message[]) {
    const strategies = {
      anxious_romantic: {
        temperature: 0.8,
        maxTokens: 200,
        presencePenalty: 0.3,
        frequencyPenalty: 0.3,
        urgentResponse: sentiment.needsDetected.includes("reassurance")
      },
      guarded_intellectual: {
        temperature: 0.6,
        maxTokens: 150,
        presencePenalty: 0.5,
        frequencyPenalty: 0.5,
        urgentResponse: false
      },
      warm_empath: {
        temperature: 0.7,
        maxTokens: 180,
        presencePenalty: 0.4,
        frequencyPenalty: 0.4,
        urgentResponse: sentiment.emotionalIntensity > 7
      },
      deep_thinker: {
        temperature: 0.6,
        maxTokens: 200,
        presencePenalty: 0.6,
        frequencyPenalty: 0.4,
        urgentResponse: false
      },
      passionate_creative: {
        temperature: 0.9,
        maxTokens: 200,
        presencePenalty: 0.2,
        frequencyPenalty: 0.3,
        urgentResponse: sentiment.emotionalIntensity > 6
      }
    }
    
    return strategies[archetype as keyof typeof strategies] || strategies.warm_empath
  }
  
  private formatConversationHistory(history: Message[]) {
    return history.slice(-10).map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }))
  }
  
  private postProcessResponse(response: string, profile: any, strategy: any): string {
    // Add personality-specific touches
    if (profile.archetype === "anxious_romantic" && !response.includes("❤") && Math.random() > 0.7) {
      response += " ❤️"
    }
    
    // Ensure response isn't too long
    if (response.length > 500) {
      response = response.substring(0, 497) + "..."
    }
    
    return response
  }
  
  private calculateResponseTiming(archetype: string): number {
    const timings = {
      anxious_romantic: { min: 500, max: 2000 },
      guarded_intellectual: { min: 3000, max: 5000 },
      warm_empath: { min: 1000, max: 3000 },
      deep_thinker: { min: 2000, max: 4000 },
      passionate_creative: { min: 800, max: 2500 }
    }
    
    const range = timings[archetype as keyof typeof timings] || timings.warm_empath
    return Math.random() * (range.max - range.min) + range.min
  }
  
  private checkConversionTriggers(profile: any, sentiment: SentimentAnalysis, history: Message[]): boolean {
    // Check if user is on free tier
    if (profile.user.subscription?.plan !== "free") return false
    
    // Check various triggers
    const triggers = {
      highEngagement: history.length > 20 && sentiment.emotionalIntensity > 7,
      emotionalMoment: sentiment.emotionalIntensity > 8,
      trustBuilding: profile.trustLevel > 60,
      approaching_limit: profile.messagesUsedToday > 40
    }
    
    return Object.values(triggers).some(trigger => trigger)
  }
  
  private async storeMemory(data: {
    userId: string
    content: string
    response: string
    sentiment: SentimentAnalysis
    significance: number
  }) {
    const memory = await prisma.memory.create({
      data: {
        userId: data.userId,
        type: data.significance > 8 ? "long" : data.significance > 5 ? "medium" : "short",
        category: data.sentiment.primaryEmotion,
        content: `User: ${data.content}\nResponse: ${data.response}`,
        context: { sentiment: data.sentiment },
        significance: data.significance,
        embedding: [], // Would be generated with OpenAI embeddings
        keywords: this.extractKeywords(data.content),
        expiresAt: data.significance < 5 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null
      }
    })
    
    return memory
  }
  
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production use NLP
    const commonWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for"])
    const words = text.toLowerCase().split(/\W+/).filter(word => 
      word.length > 3 && !commonWords.has(word)
    )
    return [...new Set(words)].slice(0, 5)
  }
}