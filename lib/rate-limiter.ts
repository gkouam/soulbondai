import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { MemoryRatelimit } from "./rate-limiter-memory"

// Check if Redis is configured
const isRedisConfigured = !!(
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
)

// Initialize Redis client if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

// Helper to create rate limiter with fallback
function createRateLimiter(config: {
  limiter: any
  analytics?: boolean
  prefix: string
}) {
  if (redis) {
    return new Ratelimit({
      redis,
      ...config
    })
  }
  
  // Fallback to in-memory rate limiter
  console.warn(`Using in-memory rate limiter for ${config.prefix} (Redis not configured)`)
  return new MemoryRatelimit({
    limiter: config.limiter,
    prefix: config.prefix
  }) as any
}

// Different rate limiters for different purposes
export const rateLimiters = {
  // General API rate limiter - 100 requests per minute
  api: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(100, "1 m") : MemoryRatelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:api",
  }),
  
  // Auth rate limiter - 5 attempts per 15 minutes
  auth: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(5, "15 m") : MemoryRatelimit.slidingWindow(5, "15 m"),
    analytics: true,
    prefix: "ratelimit:auth",
  }),
  
  // Chat message rate limiter - depends on plan
  chat: {
    free: createRateLimiter({
      limiter: redis ? Ratelimit.slidingWindow(50, "1 d") : MemoryRatelimit.slidingWindow(50, "1 d"), // 50 messages per day
      analytics: true,
      prefix: "ratelimit:chat:free",
    }),
    basic: createRateLimiter({
      limiter: redis ? Ratelimit.slidingWindow(1000, "1 d") : MemoryRatelimit.slidingWindow(1000, "1 d"), // 1000 messages per day
      analytics: true,
      prefix: "ratelimit:chat:basic",
    }),
    premium: createRateLimiter({
      limiter: redis ? Ratelimit.slidingWindow(10000, "1 d") : MemoryRatelimit.slidingWindow(10000, "1 d"), // 10000 messages per day
      analytics: true,
      prefix: "ratelimit:chat:premium",
    }),
    // Ultimate has no limits
  },
  
  // File upload rate limiter
  upload: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(10, "1 h") : MemoryRatelimit.slidingWindow(10, "1 h"), // 10 uploads per hour
    analytics: true,
    prefix: "ratelimit:upload",
  }),
  
  // AI generation rate limiter (voice, images, etc)
  generation: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(50, "1 h") : MemoryRatelimit.slidingWindow(50, "1 h"), // 50 generations per hour
    analytics: true,
    prefix: "ratelimit:generation",
  }),
  
  // Password reset rate limiter
  passwordReset: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(3, "1 h") : MemoryRatelimit.slidingWindow(3, "1 h"), // 3 attempts per hour
    analytics: true,
    prefix: "ratelimit:password-reset",
  }),
  
  // Data export rate limiter
  dataExport: createRateLimiter({
    limiter: redis ? Ratelimit.slidingWindow(5, "24 h") : MemoryRatelimit.slidingWindow(5, "24 h"), // 5 exports per day
    analytics: true,
    prefix: "ratelimit:data-export",
  }),
}

// Helper to get identifier from request
export function getIdentifier(req: Request, userId?: string): string {
  const headersList = headers()
  
  // Prefer user ID if available
  if (userId) return userId
  
  // Try to get IP from various headers
  const forwardedFor = headersList.get("x-forwarded-for")
  const realIp = headersList.get("x-real-ip")
  const cfIp = headersList.get("cf-connecting-ip")
  
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }
  
  if (realIp) return realIp
  if (cfIp) return cfIp
  
  // Fallback to a hash of headers if no IP found
  return "anonymous"
}

// Rate limit response helper
export function rateLimitResponse(
  remaining: number,
  reset: number,
  limit: number
) {
  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Rate limit exceeded. Please try again later.",
      limit,
      remaining,
      reset: new Date(reset).toISOString(),
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.floor((reset - Date.now()) / 1000).toString(),
      },
    }
  )
}

// Middleware helper for rate limiting
export async function withRateLimit(
  req: Request,
  limiter: Ratelimit,
  identifier?: string
) {
  const id = identifier || getIdentifier(req)
  const { success, limit, reset, remaining } = await limiter.limit(id)
  
  if (!success) {
    return rateLimitResponse(remaining, reset, limit)
  }
  
  return null // Continue with request
}

// Plan-based chat rate limiter
export async function withChatRateLimit(
  req: Request,
  userId: string,
  plan: string = "free"
) {
  // Ultimate plan has no limits
  if (plan === "ultimate") return null
  
  const limiter = rateLimiters.chat[plan as keyof typeof rateLimiters.chat] || rateLimiters.chat.free
  return withRateLimit(req, limiter, userId)
}

// Get remaining limits for a user
export async function getRemainingLimits(userId: string, plan: string = "free") {
  const limits: Record<string, any> = {}
  
  // Chat limits
  if (plan !== "ultimate") {
    const chatLimiter = rateLimiters.chat[plan as keyof typeof rateLimiters.chat] || rateLimiters.chat.free
    const chatIdentifier = userId
    const chatLimit = await chatLimiter.limit(chatIdentifier, { rate: 0 }) // Check without consuming
    
    limits.chat = {
      limit: chatLimit.limit,
      remaining: chatLimit.remaining,
      reset: new Date(chatLimit.reset).toISOString(),
    }
  }
  
  // Upload limits
  const uploadLimit = await rateLimiters.upload.limit(userId, { rate: 0 })
  limits.upload = {
    limit: uploadLimit.limit,
    remaining: uploadLimit.remaining,
    reset: new Date(uploadLimit.reset).toISOString(),
  }
  
  // Generation limits
  const generationLimit = await rateLimiters.generation.limit(userId, { rate: 0 })
  limits.generation = {
    limit: generationLimit.limit,
    remaining: generationLimit.remaining,
    reset: new Date(generationLimit.reset).toISOString(),
  }
  
  return limits
}

// Reset limits for a user (useful for testing or special cases)
export async function resetLimits(userId: string, limiterKey: string) {
  if (!redis) {
    console.warn("Cannot reset limits: Redis not configured")
    return
  }
  
  const key = `ratelimit:${limiterKey}:${userId}`
  await redis.del(key)
}