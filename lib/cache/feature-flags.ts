import { cache } from './redis-cache'

interface FeatureFlag {
  key: string
  enabled: boolean
  rolloutPercentage?: number
  userIds?: string[]
  metadata?: any
}

export class FeatureFlagCache {
  private static readonly CACHE_KEY = 'feature-flags'
  private static readonly TTL = 300 // 5 minutes

  static async getAll(): Promise<Record<string, FeatureFlag>> {
    const cached = await cache.get<Record<string, FeatureFlag>>(this.CACHE_KEY)
    
    if (cached) {
      return cached
    }

    // If not cached, return default flags
    const defaultFlags = this.getDefaultFlags()
    await cache.set(this.CACHE_KEY, defaultFlags, this.TTL)
    
    return defaultFlags
  }

  static async get(key: string): Promise<FeatureFlag | null> {
    const flags = await this.getAll()
    return flags[key] || null
  }

  static async isEnabled(key: string, userId?: string): Promise<boolean> {
    const flag = await this.get(key)
    
    if (!flag) {
      return false
    }

    if (!flag.enabled) {
      return false
    }

    // Check user-specific access
    if (flag.userIds && userId) {
      return flag.userIds.includes(userId)
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && userId) {
      const hash = this.hashUserId(userId)
      const percentage = (hash % 100) + 1
      return percentage <= flag.rolloutPercentage
    }

    return true
  }

  static async set(key: string, flag: FeatureFlag): Promise<void> {
    const flags = await this.getAll()
    flags[key] = flag
    await cache.set(this.CACHE_KEY, flags, this.TTL)
  }

  static async invalidate(): Promise<void> {
    await cache.delete(this.CACHE_KEY)
  }

  private static hashUserId(userId: string): number {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  private static getDefaultFlags(): Record<string, FeatureFlag> {
    return {
      'new-ai-model': {
        key: 'new-ai-model',
        enabled: true,
        rolloutPercentage: 20 // 20% of users
      },
      'voice-messages': {
        key: 'voice-messages',
        enabled: true
      },
      'advanced-memory': {
        key: 'advanced-memory',
        enabled: true,
        rolloutPercentage: 50
      },
      'group-chats': {
        key: 'group-chats',
        enabled: false
      },
      'custom-characters': {
        key: 'custom-characters',
        enabled: true,
        userIds: [] // Beta testers
      },
      'ai-queue': {
        key: 'ai-queue',
        enabled: true
      },
      'redis-cache': {
        key: 'redis-cache',
        enabled: true
      }
    }
  }
}