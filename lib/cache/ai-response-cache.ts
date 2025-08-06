import { aiCache } from './redis-cache'
import crypto from 'crypto'

interface AICacheKey {
  message: string
  characterId: string
  context?: any
}

export class AIResponseCache {
  private static generateKey(params: AICacheKey): string {
    // Create a deterministic hash from the parameters
    const data = JSON.stringify({
      m: params.message.toLowerCase().trim(),
      c: params.characterId,
      ctx: params.context
    })
    
    const hash = crypto.createHash('sha256').update(data).digest('hex')
    return `response:${hash.substring(0, 16)}`
  }

  static async get(params: AICacheKey): Promise<string | null> {
    const key = this.generateKey(params)
    const cached = await aiCache.get<{ response: string }>(key)
    
    if (cached) {
      console.log('AI response cache hit')
      return cached.response
    }
    
    return null
  }

  static async set(params: AICacheKey, response: string, ttl?: number): Promise<void> {
    const key = this.generateKey(params)
    await aiCache.set(
      key,
      { response, timestamp: new Date().toISOString() },
      ttl || 3600 // Default 1 hour
    )
  }

  static async invalidateForCharacter(characterId: string): Promise<void> {
    // This will require scanning keys, so use sparingly
    await aiCache.deletePattern(`response:*`)
    console.log(`Invalidated AI cache for character ${characterId}`)
  }
}

// Similar responses cache for reducing API calls
export class SimilarResponseCache {
  private static readonly SIMILARITY_THRESHOLD = 0.85

  static async findSimilar(message: string, characterId: string): Promise<string | null> {
    // This is a simplified version - in production, you'd use vector embeddings
    const normalizedMessage = message.toLowerCase().trim()
    
    // Check exact match first
    const exactMatch = await AIResponseCache.get({
      message: normalizedMessage,
      characterId
    })
    
    if (exactMatch) {
      return exactMatch
    }

    // For demo purposes, check some common variations
    const variations = [
      normalizedMessage.replace(/[?!.]+$/, ''),
      normalizedMessage.replace(/^(hey|hi|hello)\s+/i, ''),
      normalizedMessage.replace(/\s+/g, ' ')
    ]

    for (const variation of variations) {
      const cached = await AIResponseCache.get({
        message: variation,
        characterId
      })
      
      if (cached) {
        console.log('Found similar cached response')
        return cached
      }
    }

    return null
  }
}