// lib/performance-monitor.ts
import { Redis } from "@upstash/redis"

interface PerformanceMetrics {
  responseTime: number
  cacheHitRate: number
  apiCost: number
  userSatisfaction: number
  conversionRate: number
  modelUsage: {
    gpt4: number
    gpt35: number
  }
  featureUsage: {
    emotionalWeather: number
    soulResonance: number
    bondingActivities: number
  }
  errorRate: number
}

class PerformanceMonitor {
  private redis: Redis
  private metrics: Map<string, number[]> = new Map()
  
  constructor() {
    // Safely initialize Redis with trimmed values
    const redisUrl = (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim()
    const redisToken = (process.env.REDIS_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim()
    
    if (redisUrl && redisToken) {
      this.redis = new Redis({
        url: redisUrl,
        token: redisToken
      })
    } else {
      // Create a dummy Redis for development/testing
      console.warn('Performance monitor: Redis not configured')
      this.redis = {
        get: async () => null,
        set: async () => 'OK',
        del: async () => 1,
        expire: async () => 1,
        lpush: async () => 1,
        lrange: async () => [],
        hgetall: async () => ({}),
        hincrby: async () => 1,
        incrbyfloat: async () => 1
      } as any
    }
  }
  
  // Track response time
  async trackResponseTime(duration: number): Promise<void> {
    const key = `metrics:response_time:${this.getHourKey()}`
    await this.redis.lpush(key, duration)
    await this.redis.expire(key, 86400) // Keep for 24 hours
    
    // Update local metrics
    const times = this.metrics.get('response_time') || []
    times.push(duration)
    if (times.length > 100) times.shift() // Keep last 100
    this.metrics.set('response_time', times)
  }
  
  // Track cache hit
  async trackCacheHit(hit: boolean): Promise<void> {
    const key = `metrics:cache:${this.getHourKey()}`
    await this.redis.hincrby(key, hit ? 'hits' : 'misses', 1)
    await this.redis.expire(key, 86400)
  }
  
  // Track API cost
  async trackApiCost(model: string, tokens: number): Promise<void> {
    const cost = this.calculateCost(model, tokens)
    const key = `metrics:api_cost:${this.getDayKey()}`
    await this.redis.incrbyfloat(key, cost)
    await this.redis.expire(key, 2592000) // Keep for 30 days
    
    // Track model usage
    const modelKey = `metrics:model_usage:${this.getDayKey()}`
    await this.redis.hincrby(modelKey, model, 1)
    await this.redis.expire(modelKey, 2592000)
  }
  
  // Track feature usage
  async trackFeatureUsage(feature: string): Promise<void> {
    const key = `metrics:features:${this.getDayKey()}`
    await this.redis.hincrby(key, feature, 1)
    await this.redis.expire(key, 2592000)
  }
  
  // Track conversion
  async trackConversion(triggered: boolean): Promise<void> {
    const key = `metrics:conversions:${this.getDayKey()}`
    await this.redis.hincrby(key, triggered ? 'triggered' : 'skipped', 1)
    await this.redis.expire(key, 2592000)
  }
  
  // Track error
  async trackError(error: string): Promise<void> {
    const key = `metrics:errors:${this.getHourKey()}`
    await this.redis.hincrby(key, error, 1)
    await this.redis.expire(key, 86400)
  }
  
  // Get current metrics
  async getMetrics(): Promise<PerformanceMetrics> {
    const hourKey = this.getHourKey()
    const dayKey = this.getDayKey()
    
    // Get response times
    const responseTimes = await this.redis.lrange(
      `metrics:response_time:${hourKey}`,
      0,
      -1
    )
    const avgResponseTime = this.calculateAverage(
      responseTimes.map(t => Number(t))
    )
    
    // Get cache stats
    const cacheStats = await this.redis.hgetall(`metrics:cache:${hourKey}`)
    const cacheHitRate = this.calculateHitRate(
      Number(cacheStats?.hits || 0),
      Number(cacheStats?.misses || 0)
    )
    
    // Get API cost
    const apiCost = Number(
      await this.redis.get(`metrics:api_cost:${dayKey}`) || 0
    )
    
    // Get model usage
    const modelUsage = await this.redis.hgetall(`metrics:model_usage:${dayKey}`)
    
    // Get feature usage
    const featureUsage = await this.redis.hgetall(`metrics:features:${dayKey}`)
    
    // Get conversion stats
    const conversionStats = await this.redis.hgetall(`metrics:conversions:${dayKey}`)
    const conversionRate = this.calculateConversionRate(
      Number(conversionStats?.triggered || 0),
      Number(conversionStats?.skipped || 0)
    )
    
    // Get error stats
    const errorStats = await this.redis.hgetall(`metrics:errors:${hourKey}`)
    const totalErrors = Object.values(errorStats || {}).reduce(
      (sum, count) => sum + Number(count),
      0
    )
    
    return {
      responseTime: avgResponseTime,
      cacheHitRate,
      apiCost,
      userSatisfaction: await this.calculateUserSatisfaction(),
      conversionRate,
      modelUsage: {
        gpt4: Number(modelUsage?.['gpt-4-turbo-preview'] || 0),
        gpt35: Number(modelUsage?.['gpt-3.5-turbo'] || 0) + 
               Number(modelUsage?.['gpt-3.5-turbo-16k'] || 0)
      },
      featureUsage: {
        emotionalWeather: Number(featureUsage?.emotionalWeather || 0),
        soulResonance: Number(featureUsage?.soulResonance || 0),
        bondingActivities: Number(featureUsage?.bondingActivities || 0)
      },
      errorRate: totalErrors
    }
  }
  
  // Get hourly metrics for dashboard
  async getHourlyMetrics(hours: number = 24): Promise<any[]> {
    const metrics = []
    const now = new Date()
    
    for (let i = 0; i < hours; i++) {
      const hour = new Date(now.getTime() - i * 3600000)
      const key = this.getHourKey(hour)
      
      const responseTimes = await this.redis.lrange(
        `metrics:response_time:${key}`,
        0,
        -1
      )
      
      const cacheStats = await this.redis.hgetall(`metrics:cache:${key}`)
      const errorStats = await this.redis.hgetall(`metrics:errors:${key}`)
      
      metrics.push({
        hour: hour.toISOString(),
        avgResponseTime: this.calculateAverage(responseTimes.map(t => Number(t))),
        cacheHitRate: this.calculateHitRate(
          Number(cacheStats?.hits || 0),
          Number(cacheStats?.misses || 0)
        ),
        errors: Object.values(errorStats || {}).reduce(
          (sum, count) => sum + Number(count),
          0
        )
      })
    }
    
    return metrics.reverse()
  }
  
  // Calculate cost based on model and tokens
  private calculateCost(model: string, tokens: number): number {
    const costs = {
      'gpt-4-turbo-preview': 0.00003, // $0.03 per 1K tokens
      'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      'gpt-3.5-turbo-16k': 0.000003 // $0.003 per 1K tokens
    }
    
    return (costs[model] || 0) * tokens
  }
  
  // Calculate average
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }
  
  // Calculate hit rate
  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses
    if (total === 0) return 0
    return (hits / total) * 100
  }
  
  // Calculate conversion rate
  private calculateConversionRate(triggered: number, skipped: number): number {
    const total = triggered + skipped
    if (total === 0) return 0
    return (triggered / total) * 100
  }
  
  // Calculate user satisfaction (simplified)
  private async calculateUserSatisfaction(): Promise<number> {
    // This would normally analyze sentiment trends, engagement, etc.
    // For now, return a baseline
    return 85
  }
  
  // Get hour key for Redis
  private getHourKey(date?: Date): string {
    const d = date || new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}${String(d.getHours()).padStart(2, '0')}`
  }
  
  // Get day key for Redis
  private getDayKey(date?: Date): string {
    const d = date || new Date()
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  }
}

// Export singleton
export const performanceMonitor = new PerformanceMonitor()