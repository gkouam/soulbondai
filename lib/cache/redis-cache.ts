import Redis from 'ioredis'
import { connection } from '@/lib/queue/redis-connection'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

export class RedisCache {
  private redis: Redis
  private defaultTTL: number = 3600 // 1 hour default
  private prefix: string = 'cache:'

  constructor(options?: CacheOptions) {
    // Use the existing Redis connection
    this.redis = connection
    
    if (options?.ttl) {
      this.defaultTTL = options.ttl
    }
    
    if (options?.prefix) {
      this.prefix = options.prefix
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.getKey(key))
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      const expiry = ttl || this.defaultTTL
      
      await this.redis.setex(this.getKey(key), expiry, serialized)
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key))
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}${pattern}`)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key))
      return result === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(this.getKey(key))
    } catch (error) {
      console.error('Cache ttl error:', error)
      return -1
    }
  }

  async increment(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.getKey(key), by)
    } catch (error) {
      console.error('Cache increment error:', error)
      return 0
    }
  }

  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      return await this.redis.decrby(this.getKey(key), by)
    } catch (error) {
      console.error('Cache decrement error:', error)
      return 0
    }
  }

  // Hash operations
  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redis.hget(this.getKey(key), field)
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      console.error('Cache hget error:', error)
      return null
    }
  }

  async hset(key: string, field: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      await this.redis.hset(this.getKey(key), field, serialized)
      
      if (ttl || this.defaultTTL) {
        await this.redis.expire(this.getKey(key), ttl || this.defaultTTL)
      }
    } catch (error) {
      console.error('Cache hset error:', error)
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T> | null> {
    try {
      const values = await this.redis.hgetall(this.getKey(key))
      if (!values || Object.keys(values).length === 0) return null
      
      const result: Record<string, T> = {}
      for (const [field, value] of Object.entries(values)) {
        result[field] = JSON.parse(value) as T
      }
      
      return result
    } catch (error) {
      console.error('Cache hgetall error:', error)
      return null
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serialized = values.map(v => JSON.stringify(v))
      return await this.redis.lpush(this.getKey(key), ...serialized)
    } catch (error) {
      console.error('Cache lpush error:', error)
      return 0
    }
  }

  async lrange<T = any>(key: string, start: number, stop: number): Promise<T[]> {
    try {
      const values = await this.redis.lrange(this.getKey(key), start, stop)
      return values.map(v => JSON.parse(v) as T)
    } catch (error) {
      console.error('Cache lrange error:', error)
      return []
    }
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serialized = members.map(m => JSON.stringify(m))
      return await this.redis.sadd(this.getKey(key), ...serialized)
    } catch (error) {
      console.error('Cache sadd error:', error)
      return 0
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const values = await this.redis.smembers(this.getKey(key))
      return values.map(v => JSON.parse(v) as T)
    } catch (error) {
      console.error('Cache smembers error:', error)
      return []
    }
  }

  async sismember(key: string, member: any): Promise<boolean> {
    try {
      const serialized = JSON.stringify(member)
      const result = await this.redis.sismember(this.getKey(key), serialized)
      return result === 1
    } catch (error) {
      console.error('Cache sismember error:', error)
      return false
    }
  }
}

// Create singleton instances for different cache types
export const cache = new RedisCache()
export const sessionCache = new RedisCache({ prefix: 'session:', ttl: 1800 }) // 30 minutes
export const userCache = new RedisCache({ prefix: 'user:', ttl: 600 }) // 10 minutes
export const aiCache = new RedisCache({ prefix: 'ai:', ttl: 3600 }) // 1 hour