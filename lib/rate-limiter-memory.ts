// In-memory rate limiter for development/testing when Redis is not available
interface RateLimitEntry {
  count: number
  resetAt: number
}

class InMemoryRateLimiter {
  private limits = new Map<string, RateLimitEntry>()
  
  async limit(identifier: string, limit: number, windowMs: number) {
    const now = Date.now()
    const key = identifier
    
    let entry = this.limits.get(key)
    
    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup()
    }
    
    if (!entry || entry.resetAt < now) {
      // Create new window
      entry = {
        count: 1,
        resetAt: now + windowMs
      }
      this.limits.set(key, entry)
      
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: entry.resetAt
      }
    }
    
    // Increment counter
    entry.count++
    
    const success = entry.count <= limit
    const remaining = Math.max(0, limit - entry.count)
    
    return {
      success,
      limit,
      remaining,
      reset: entry.resetAt
    }
  }
  
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key)
      }
    }
  }
}

// Export a singleton instance
export const memoryRateLimiter = new InMemoryRateLimiter()

// Wrapper to match Upstash interface
export class MemoryRatelimit {
  constructor(
    private config: {
      limiter: { limit: number; window: string }
      prefix?: string
    }
  ) {}
  
  async limit(identifier: string, options?: { rate?: number }) {
    // Parse window string (e.g., "1 m", "15 m", "1 h", "1 d")
    const windowMatch = this.config.limiter.window.match(/(\d+)\s*([mhd])/)
    if (!windowMatch) {
      throw new Error(`Invalid window format: ${this.config.limiter.window}`)
    }
    
    const [, amount, unit] = windowMatch
    const multipliers = { m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 }
    const windowMs = parseInt(amount) * multipliers[unit as keyof typeof multipliers]
    
    const key = this.config.prefix ? `${this.config.prefix}:${identifier}` : identifier
    
    // If rate is 0, just check without incrementing
    if (options?.rate === 0) {
      const testResult = await memoryRateLimiter.limit(key, this.config.limiter.limit, windowMs)
      // Restore the count since we're just checking
      const entry = (memoryRateLimiter as any).limits.get(key)
      if (entry) entry.count--
      return testResult
    }
    
    return memoryRateLimiter.limit(key, this.config.limiter.limit, windowMs)
  }
  
  static slidingWindow(limit: number, window: string) {
    return { limit, window }
  }
}