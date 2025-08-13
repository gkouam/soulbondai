import { Redis } from "@upstash/redis"

// Create Redis client using Upstash (serverless Redis)
// This is optional - the app will work without Redis
// Supports both REDIS_URL and UPSTASH_REDIS_REST_URL formats
const redisUrl = (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL)?.trim()
const redisToken = (process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)?.trim()

export const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

// Cache helpers
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null
    try {
      const data = await redis.get(key)
      return data as T
    } catch (error) {
      console.error("Redis get error:", error)
      return null
    }
  },

  async set(key: string, value: any, expirationInSeconds?: number): Promise<boolean> {
    if (!redis) return false
    try {
      if (expirationInSeconds) {
        await redis.setex(key, expirationInSeconds, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error("Redis set error:", error)
      return false
    }
  },

  async delete(key: string): Promise<boolean> {
    if (!redis) return false
    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error("Redis delete error:", error)
      return false
    }
  },

  async exists(key: string): Promise<boolean> {
    if (!redis) return false
    try {
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error("Redis exists error:", error)
      return false
    }
  },

  async increment(key: string, amount = 1): Promise<number | null> {
    if (!redis) return null
    try {
      const result = await redis.incrby(key, amount)
      return result
    } catch (error) {
      console.error("Redis increment error:", error)
      return null
    }
  },

  async expire(key: string, seconds: number): Promise<boolean> {
    if (!redis) return false
    try {
      await redis.expire(key, seconds)
      return true
    } catch (error) {
      console.error("Redis expire error:", error)
      return false
    }
  }
}

// Session management helpers
export const sessions = {
  async store(sessionId: string, userId: string, data: any, ttl = 3600) {
    return cache.set(`session:${sessionId}`, { userId, ...data }, ttl)
  },

  async get(sessionId: string) {
    return cache.get<{ userId: string; [key: string]: any }>(`session:${sessionId}`)
  },

  async destroy(sessionId: string) {
    return cache.delete(`session:${sessionId}`)
  },

  async extend(sessionId: string, ttl = 3600) {
    return cache.expire(`session:${sessionId}`, ttl)
  }
}

// Rate limiting helpers
export const rateLimiter = {
  async check(identifier: string, limit: number, windowInSeconds: number): Promise<boolean> {
    if (!redis) return true // Allow if Redis is not available
    
    const key = `rate:${identifier}`
    const current = await cache.increment(key)
    
    if (current === 1) {
      await cache.expire(key, windowInSeconds)
    }
    
    return current !== null && current <= limit
  },

  async reset(identifier: string) {
    return cache.delete(`rate:${identifier}`)
  }
}

// Message queue helpers (for background jobs)
export const queue = {
  async push(queueName: string, data: any): Promise<boolean> {
    if (!redis) return false
    try {
      await redis.lpush(`queue:${queueName}`, JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Queue push error:", error)
      return false
    }
  },

  async pop<T>(queueName: string): Promise<T | null> {
    if (!redis) return null
    try {
      const data = await redis.rpop(`queue:${queueName}`)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error("Queue pop error:", error)
      return null
    }
  },

  async length(queueName: string): Promise<number> {
    if (!redis) return 0
    try {
      return await redis.llen(`queue:${queueName}`)
    } catch (error) {
      console.error("Queue length error:", error)
      return 0
    }
  }
}

// User presence tracking
export const presence = {
  async setOnline(userId: string, socketId?: string) {
    const data = {
      status: "online",
      lastSeen: new Date().toISOString(),
      socketId
    }
    return cache.set(`presence:${userId}`, data, 300) // 5 minutes TTL
  },

  async setOffline(userId: string) {
    const data = {
      status: "offline",
      lastSeen: new Date().toISOString()
    }
    return cache.set(`presence:${userId}`, data, 300)
  },

  async get(userId: string) {
    return cache.get<{
      status: "online" | "offline"
      lastSeen: string
      socketId?: string
    }>(`presence:${userId}`)
  },

  async isOnline(userId: string): Promise<boolean> {
    const presence = await this.get(userId)
    return presence?.status === "online"
  }
}