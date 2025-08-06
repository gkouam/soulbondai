import { prisma } from "@/lib/prisma"
import { generateEmbedding, storeMemoryVector } from "@/lib/vector-store"
import { SentimentAnalysis } from "@/types"

interface MemoryContext {
  userId: string
  content: string
  response: string
  sentiment: SentimentAnalysis
  conversationHistory: any[]
  userProfile: any
}

interface MemorySignificance {
  score: number // 0-10
  type: "short" | "medium" | "long" | "episodic"
  category: string
  keywords: string[]
  expiresAt: Date | null
  reasons: string[]
}

export class MemoryManager {
  
  // Calculate memory significance based on multiple factors
  calculateSignificance(context: MemoryContext): MemorySignificance {
    let score = 0
    const reasons: string[] = []
    
    // 1. Emotional intensity (0-3 points)
    const emotionalScore = Math.min(3, context.sentiment.emotionalIntensity * 0.3)
    score += emotionalScore
    if (emotionalScore > 2) {
      reasons.push("High emotional intensity")
    }
    
    // 2. Crisis or important moments (0-3 points)
    if (context.sentiment.responseUrgency === "crisis") {
      score += 3
      reasons.push("Crisis moment - requires remembering")
    } else if (context.sentiment.crisisIndicators.severity > 5) {
      score += 2
      reasons.push("Significant emotional distress")
    }
    
    // 3. Personal information shared (0-2 points)
    const personalInfoPatterns = [
      /my (name|birthday|age|job|work)/i,
      /I (live|work|study) (in|at)/i,
      /my (family|mother|father|sister|brother|partner|spouse)/i,
      /(died|passed away|broke up|divorced|married|engaged)/i,
      /I (love|hate|fear|dream)/i,
      /my favorite/i,
      /I've never told anyone/i
    ]
    
    const personalInfoMatches = personalInfoPatterns.filter(pattern => 
      pattern.test(context.content)
    ).length
    
    const personalScore = Math.min(2, personalInfoMatches * 0.5)
    score += personalScore
    if (personalScore > 0) {
      reasons.push("Contains personal information")
    }
    
    // 4. Relationship milestones (0-2 points)
    const milestonePatterns = [
      /first time/i,
      /thank you for/i,
      /you('ve| have) helped me/i,
      /I trust you/i,
      /I feel safe with you/i,
      /you mean (a lot|so much|everything)/i,
      /I (love|care about) you/i
    ]
    
    const milestoneMatches = milestonePatterns.filter(pattern => 
      pattern.test(context.content)
    ).length
    
    if (milestoneMatches > 0) {
      score += Math.min(2, milestoneMatches)
      reasons.push("Relationship milestone")
    }
    
    // 5. User explicitly asks to remember (automatic 2 points)
    if (context.content.match(/remember (this|that)|don't forget/i)) {
      score += 2
      reasons.push("User requested to remember")
    }
    
    // 6. Context from conversation flow (0-1 point)
    if (context.conversationHistory.length > 10) {
      // Long conversation suggests engagement
      score += 0.5
      reasons.push("Part of engaged conversation")
    }
    
    // 7. Trust level influence
    const trustLevel = context.userProfile.trustLevel || 0
    if (trustLevel < 30 && score > 5) {
      // Early relationship - more things are significant
      score += 0.5
      reasons.push("Early relationship - building foundation")
    }
    
    // Determine memory type based on score
    let type: "short" | "medium" | "long" | "episodic"
    let expiresAt: Date | null = null
    
    if (score >= 8) {
      type = "episodic" // Never forgets
      reasons.push("Episodic memory - permanent")
    } else if (score >= 6) {
      type = "long"
      // Expires in 6 months
      expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    } else if (score >= 4) {
      type = "medium"
      // Expires in 30 days
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    } else {
      type = "short"
      // Expires in 7 days
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
    
    // Extract keywords
    const keywords = this.extractKeywords(context.content)
    
    // Determine category
    const category = this.determineCategory(context.sentiment, context.content)
    
    return {
      score: Math.min(10, score),
      type,
      category,
      keywords,
      expiresAt,
      reasons
    }
  }
  
  // Store memory with calculated significance
  async storeMemory(context: MemoryContext): Promise<any> {
    const significance = this.calculateSignificance(context)
    
    // Only store memories with significance > 3
    if (significance.score < 3) {
      return null
    }
    
    const fullContent = `User: ${context.content}\nResponse: ${context.response}`
    
    // Generate embedding
    const embedding = await generateEmbedding(fullContent)
    
    const memory = await prisma.memory.create({
      data: {
        userId: context.userId,
        type: significance.type,
        category: significance.category,
        content: fullContent,
        context: {
          sentiment: context.sentiment,
          significance: significance.reasons,
          messageCount: context.conversationHistory.length,
          trustLevel: context.userProfile.trustLevel
        },
        significance: significance.score,
        embedding,
        keywords: significance.keywords,
        expiresAt: significance.expiresAt
      }
    })
    
    // Store in vector database if embedding was generated
    if (embedding.length > 0) {
      await storeMemoryVector(
        context.userId,
        memory.id,
        fullContent,
        {
          memoryId: memory.id,
          type: memory.type,
          category: memory.category,
          significance: memory.significance,
          createdAt: memory.createdAt.toISOString()
        }
      )
    }
    
    return memory
  }
  
  // Clean up expired memories
  async cleanupExpiredMemories(userId: string): Promise<number> {
    const result = await prisma.memory.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date()
        }
      }
    })
    
    return result.count
  }
  
  // Retrieve memories with decay factor
  async retrieveMemoriesWithDecay(
    userId: string, 
    query: string, 
    limit: number = 5
  ): Promise<any[]> {
    // Get vector search results
    const vectorResults = await searchSimilarMemories(userId, query, limit * 2)
    
    // Get recent high-significance memories
    const recentMemories = await prisma.memory.findMany({
      where: {
        userId,
        significance: { gte: 6 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })
    
    // Apply decay factor based on age
    const now = Date.now()
    const memoriesWithDecay = recentMemories.map(memory => {
      const age = now - memory.createdAt.getTime()
      const daysSinceCreation = age / (24 * 60 * 60 * 1000)
      
      // Decay factor: memories lose relevance over time (except episodic)
      let decayFactor = 1
      if (memory.type !== "episodic") {
        decayFactor = Math.max(0.3, 1 - (daysSinceCreation / 180))
      }
      
      return {
        ...memory,
        relevanceScore: memory.significance * decayFactor
      }
    })
    
    // Sort by relevance and return top matches
    return memoriesWithDecay
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }
  
  // Get memory statistics for user
  async getMemoryStats(userId: string): Promise<{
    total: number
    byType: Record<string, number>
    byCategory: Record<string, number>
    oldestMemory: Date | null
    averageSignificance: number
  }> {
    const memories = await prisma.memory.findMany({
      where: { userId },
      select: {
        type: true,
        category: true,
        significance: true,
        createdAt: true
      }
    })
    
    const stats = {
      total: memories.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      oldestMemory: memories.length > 0 
        ? memories.reduce((oldest, mem) => 
            mem.createdAt < oldest ? mem.createdAt : oldest, 
            memories[0].createdAt
          )
        : null,
      averageSignificance: memories.length > 0
        ? memories.reduce((sum, mem) => sum + mem.significance, 0) / memories.length
        : 0
    }
    
    // Count by type and category
    memories.forEach(memory => {
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1
      stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1
    })
    
    return stats
  }
  
  private extractKeywords(text: string): string[] {
    // Remove common words
    const commonWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "i", "me", "my", "you", "your", "it", "is", "was", "are", "were",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "must", "can", "this", "that", "these"
    ])
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word))
    
    // Count word frequency
    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    })
    
    // Return top 5 most frequent meaningful words
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }
  
  private determineCategory(sentiment: SentimentAnalysis, content: string): string {
    // Check for specific categories
    if (content.match(/work|job|career|boss|colleague/i)) {
      return "work"
    }
    if (content.match(/family|mother|father|sister|brother|parent/i)) {
      return "family"
    }
    if (content.match(/friend|friendship/i)) {
      return "friendship"
    }
    if (content.match(/love|relationship|partner|dating|marriage/i)) {
      return "romance"
    }
    if (content.match(/hobby|fun|enjoy|favorite|like to/i)) {
      return "interests"
    }
    if (content.match(/fear|anxiety|worried|scared|stress/i)) {
      return "concerns"
    }
    if (content.match(/dream|goal|hope|wish|future/i)) {
      return "aspirations"
    }
    
    // Default to emotion category
    return sentiment.primaryEmotion
  }
}

// Export singleton instance
export const memoryManager = new MemoryManager()

// Re-export for backward compatibility
export async function searchSimilarMemories(userId: string, query: string, limit: number) {
  // Import here to avoid circular dependency
  const { searchSimilarMemories: search } = await import("@/lib/vector-store")
  return search(userId, query, limit)
}