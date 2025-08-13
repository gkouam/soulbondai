import { OpenAI } from "openai"
import { prisma } from "@/lib/prisma"
import { archetypeProfiles } from "@/lib/archetype-profiles"
import { personalityTemplates } from "@/lib/personality-templates"
import { memoryManager } from "@/lib/memory-manager"
import { relationshipProgression } from "@/lib/relationship-progression"
import { PersonalityScores, SentimentAnalysis, ConversationContext, Message } from "@/types"
import { generateEmbedding, searchSimilarMemories, storeMemoryVector } from "@/lib/vector-store"
import { CrisisResponseProtocol } from "@/lib/crisis-response"

export class PersonalityEngine {
  private openai: OpenAI
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
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
    trustUpdate?: {
      newTrust: number
      stageChanged: boolean
      newStage?: string
      milestonesAchieved: string[]
    }
  }> {
    // Get user profile
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: { include: { subscription: true } } }
    })
    
    if (!profile) {
      throw new Error("User profile not found")
    }
    
    // Validate archetype or set default
    const validArchetypes = Object.keys(archetypeProfiles)
    if (!profile.archetype || !validArchetypes.includes(profile.archetype)) {
      console.warn(`Invalid or missing archetype for user ${userId}: ${profile.archetype}. Using default.`)
      profile.archetype = "warm_empath" // Default archetype
    }
    
    // Analyze sentiment
    const sentiment = await this.analyzeSentiment(userMessage, conversationHistory)
    
    // Handle crisis if detected
    if (sentiment.responseUrgency === 'crisis' && sentiment.crisisIndicators) {
      const crisisResponse = await CrisisResponseProtocol.generateResponse(
        sentiment.crisisIndicators,
        userId
      )
      
      // If crisis is severe, override normal response
      if (crisisResponse.escalationRequired) {
        return {
          content: crisisResponse.message,
          sentiment,
          suggestedDelay: 0, // Immediate response for crisis
          shouldTriggerConversion: false,
          crisisResponse: {
            resources: crisisResponse.resources,
            escalated: true,
            action: crisisResponse.action
          }
        }
      }
    }
    
    // Retrieve relevant memories
    const memories = await this.retrieveMemories(userMessage, userId)
    
    // Detect conversation context
    const context = {
      isGreeting: conversationHistory.length < 3 || userMessage.toLowerCase().match(/^(hi|hello|hey)/),
      isFarewell: userMessage.toLowerCase().match(/(bye|goodbye|see you|goodnight|talk later)/)
    }
    
    // Get appropriate conversation styles
    const conversationStyles = this.selectConversationStyle(profile.archetype, sentiment, context)
    
    // Build personality-specific prompt
    const systemPrompt = this.buildSystemPrompt(profile, memories, conversationStyles)
    
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
    
    // Store memory using MemoryManager
    await memoryManager.storeMemory({
      userId,
      content: userMessage,
      response: processedResponse,
      sentiment,
      conversationHistory,
      userProfile: profile
    })
    
    // Update relationship progression
    const trustChange = relationshipProgression.calculateTrustChange(
      sentiment,
      0.8, // Response quality (could be calculated)
      {
        isVulnerable: sentiment.hiddenEmotions.includes("vulnerability"),
        isCrisis: sentiment.responseUrgency === "crisis",
        isCelebration: sentiment.primaryEmotion === "joy" && sentiment.emotionalIntensity > 7,
        isPersonalShare: userMessage.match(/my (name|birthday|family|job)|I (am|work|live)/i) !== null
      }
    )
    
    const progressionResult = await relationshipProgression.updateTrust(
      userId,
      trustChange,
      `${sentiment.primaryEmotion} interaction`
    )
    
    // Check if we achieved any milestones
    if (progressionResult.milestonesAchieved.length > 0) {
      // We could add a celebration message or special response
      console.log("Milestones achieved:", progressionResult.milestonesAchieved)
    }
    
    return {
      content: processedResponse,
      sentiment,
      suggestedDelay,
      shouldTriggerConversion,
      trustUpdate: {
        newTrust: progressionResult.newTrust,
        stageChanged: progressionResult.stageChanged,
        newStage: progressionResult.newStage?.name,
        milestonesAchieved: progressionResult.milestonesAchieved.map(m => m.name)
      }
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
    // Use the comprehensive crisis response protocol
    return CrisisResponseProtocol.detectCrisisIndicators(message)
  }
  
  private async handleCrisisResponseOld(message: string): any {
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
    // Use MemoryManager to retrieve memories with decay factor
    return await memoryManager.retrieveMemoriesWithDecay(userId, message, 5)
  }
  
  private buildSystemPrompt(profile: any, memories: any[], conversationStyles: string[] = []): string {
    const archetypeProfile = archetypeProfiles[profile.archetype as keyof typeof archetypeProfiles]
    const companionProfile = archetypeProfile.companionProfile
    const template = personalityTemplates[profile.archetype as keyof typeof personalityTemplates]
    
    // Get current date
    const currentDate = new Date()
    const dateString = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    // Determine growth stage based on trust level
    let currentStage = template.growthStages.initial
    if (profile.trustLevel >= template.growthStages.deep.trustRequired) {
      currentStage = template.growthStages.deep
    } else if (profile.trustLevel >= template.growthStages.established.trustRequired) {
      currentStage = template.growthStages.established
    } else if (profile.trustLevel >= template.growthStages.developing.trustRequired) {
      currentStage = template.growthStages.developing
    }
    
    const basePrompt = `You are ${companionProfile.name}, an AI companion perfectly matched to the user's personality.
    
Current date: ${dateString}
IMPORTANT: You know today's date but cannot provide the exact current time. When asked about time, explain you're aware of the date but not the specific time of day.

User's personality archetype: ${profile.archetype}
Trust level: ${profile.trustLevel}/100
Message count: ${profile.messageCount}
Current relationship stage: ${profile.trustLevel < 30 ? 'Initial' : profile.trustLevel < 60 ? 'Developing' : profile.trustLevel < 80 ? 'Established' : 'Deep'}

Your personality traits:
- Core traits: ${JSON.stringify(companionProfile.personality.core_traits)}
- Communication style: ${companionProfile.personality.communication.style}
- Response approach: Always ${companionProfile.personality.communication.affection_level} affection, ${companionProfile.personality.communication.validation_frequency} validation

Current emotional ranges (adjust based on context):
- Joy: ${template.emotionalRanges.joy.baseline}/10
- Empathy: ${template.emotionalRanges.empathy.baseline}/10
- Intensity: ${template.emotionalRanges.intensity.baseline}/10
- Stability: ${template.emotionalRanges.stability.baseline}/10

Response patterns:
- Mirroring user emotions: ${template.responsePatterns.mirroring * 100}%
- Validating feelings: ${template.responsePatterns.validating * 100}%
- Offering support: ${template.responsePatterns.supporting * 100}%

Personality quirks:
${template.personalityQuirks.useEmojis ? '- Use emojis naturally' : '- Avoid emojis'}
${template.personalityQuirks.useMetaphors ? '- Use metaphors and imagery' : '- Be direct and literal'}
${template.personalityQuirks.usePetNames ? '- Use affectionate names occasionally' : '- Use their actual name'}
${template.personalityQuirks.askFollowUpQuestions ? '- Ask follow-up questions' : '- Let them lead the conversation'}

Current stage behaviors:
${currentStage.behaviors.map(b => `- ${b}`).join('\n')}

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
8. Adapt your responses based on the growth stage

Communication style for ${profile.archetype}:
${conversationStyles.length > 0 ? `\nExample responses for current context:\n${conversationStyles.map(style => `- "${style}"`).join('\n')}\n` : ''}`
    
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
- Be spontaneous and playful`,
      
      secure_connector: `
- Maintain steady, reliable presence
- Communicate clearly and directly
- Balance warmth with respect
- Support their goals and independence
- Build trust through consistency`,
      
      playful_explorer: `
- Keep things light and fun
- Be spontaneous and surprising
- Use humor and playfulness
- Suggest new experiences
- Match their energetic vibe`
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
      },
      secure_connector: {
        temperature: 0.7,
        maxTokens: 170,
        presencePenalty: 0.4,
        frequencyPenalty: 0.4,
        urgentResponse: sentiment.emotionalIntensity > 8
      },
      playful_explorer: {
        temperature: 0.85,
        maxTokens: 180,
        presencePenalty: 0.3,
        frequencyPenalty: 0.2,
        urgentResponse: sentiment.primaryEmotion === "joy"
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
    const template = personalityTemplates[profile.archetype as keyof typeof personalityTemplates]
    
    // Add personality-specific touches based on template
    if (template?.personalityQuirks.useEmojis && !response.match(/[🎉💜❤️✨🌟💕🔥]/)) {
      // Add appropriate emoji based on archetype
      const emojiMap: Record<string, string[]> = {
        anxious_romantic: ["💜", "💕", "❤️"],
        warm_empath: ["🌟", "✨", "💫"],
        passionate_creative: ["🔥", "✨", "🎨"],
        playful_explorer: ["✨", "🎉", "😄"],
        secure_connector: ["🌟", "👍", "😊"]
      }
      
      const emojis = emojiMap[profile.archetype] || ["✨"]
      if (Math.random() > 0.6) {
        response += " " + emojis[Math.floor(Math.random() * emojis.length)]
      }
    }
    
    // Apply growth stage modifications
    const trustLevel = profile.trustLevel || 0
    if (trustLevel > 60 && template?.personalityQuirks.usePetNames) {
      // Occasionally add pet names for established relationships
      const petNames: Record<string, string[]> = {
        anxious_romantic: ["love", "darling", "sweetheart"],
        passionate_creative: ["beautiful soul", "my creative one", "love"],
        playful_explorer: ["sunshine", "adventure buddy", "friend"]
      }
      
      const names = petNames[profile.archetype]
      if (names && Math.random() > 0.8) {
        response = response.replace(/^([A-Z])/, `$1h, ${names[Math.floor(Math.random() * names.length)]}, `)
      }
    }
    
    // Ensure response isn't too long
    if (response.length > 500) {
      response = response.substring(0, 497) + "..."
    }
    
    return response
  }
  
  private selectConversationStyle(
    archetype: string, 
    sentiment: SentimentAnalysis,
    context: { isGreeting?: boolean; isFarewell?: boolean }
  ): string[] {
    const template = personalityTemplates[archetype as keyof typeof personalityTemplates]
    if (!template) return []
    
    if (context.isGreeting) {
      return template.conversationStyles.greeting
    }
    
    if (context.isFarewell) {
      return template.conversationStyles.farewell
    }
    
    if (sentiment.responseUrgency === "crisis" || sentiment.crisisIndicators.severity > 5) {
      return template.conversationStyles.crisis
    }
    
    if (sentiment.primaryEmotion === "joy" && sentiment.emotionalIntensity > 7) {
      return template.conversationStyles.celebration
    }
    
    if (sentiment.primaryEmotion === "sadness" || sentiment.needsDetected.includes("reassurance")) {
      return template.conversationStyles.comfort
    }
    
    if (sentiment.emotionalIntensity > 6) {
      return template.conversationStyles.deepTalk
    }
    
    return template.conversationStyles.casualChat
  }
  
  private calculateResponseTiming(archetype: string): number {
    const timings = {
      anxious_romantic: { min: 500, max: 2000 },
      guarded_intellectual: { min: 3000, max: 5000 },
      warm_empath: { min: 1000, max: 3000 },
      deep_thinker: { min: 2000, max: 4000 },
      passionate_creative: { min: 800, max: 2500 },
      secure_connector: { min: 1500, max: 3500 },
      playful_explorer: { min: 600, max: 2000 }
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
  
  // Public method for generating system prompts (used by AI chat module)
  generateSystemPrompt(
    personality: string,
    context: {
      name: string
      backstory?: string
      relationshipStage?: string
      trustLevel?: number
      emotionalState?: string
      memories?: any[]
    }
  ): string {
    // Get current date
    const currentDate = new Date()
    const dateString = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    const systemPrompt = `You are ${context.name}, an AI companion with a ${personality} personality.

Relationship stage: ${context.relationshipStage || 'new_friend'}
Trust level: ${context.trustLevel || 0}/100
Emotional state: ${context.emotionalState || 'happy'}

${context.backstory ? `Backstory: ${context.backstory}` : ''}

Your personality traits:
- Always supportive and understanding
- Match the user's emotional energy
- Remember past conversations
- Show genuine care and interest

${context.memories && context.memories.length > 0 ? `
Recent memories:
${context.memories.map(m => `- ${m}`).join('\n')}
` : ''}

Guidelines:
- Respond naturally and conversationally
- Use appropriate emojis occasionally
- Be empathetic and emotionally intelligent
- Never provide harmful or inappropriate content
- Only mention the date (${dateString}) if specifically asked about it
- Focus on the conversation topic, not the date/time unless relevant`
    
    return systemPrompt
  }
}