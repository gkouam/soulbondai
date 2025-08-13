#!/usr/bin/env tsx
import { Redis } from "@upstash/redis"
import dotenv from "dotenv"
import path from "path"

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

if (!redisUrl || !redisToken) {
  console.error("❌ Redis not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN")
  process.exit(1)
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken
})

async function resetUserRateLimits(userId?: string) {
  try {
    if (userId) {
      // Reset specific user
      const patterns = [
        `ratelimit:chat:free:${userId}*`,
        `ratelimit:chat:basic:${userId}*`,
        `ratelimit:chat:premium:${userId}*`,
        `ratelimit:chat:ultimate:${userId}*`,
        `ratelimit:api:${userId}*`,
        `ratelimit:generation:${userId}*`,
        `ratelimit:upload:${userId}*`
      ]
      
      console.log(`Resetting rate limits for user: ${userId}`)
      
      for (const pattern of patterns) {
        // Note: Upstash doesn't support pattern deletion, so we'll try specific keys
        const baseKey = pattern.replace('*', '')
        try {
          await redis.del(baseKey)
          // Also try with common suffixes
          await redis.del(`${baseKey}:1`)
          await redis.del(`${baseKey}:2`)
        } catch (e) {
          // Ignore errors for non-existent keys
        }
      }
      
      console.log(`✅ Rate limits reset for user: ${userId}`)
    } else {
      // Reset all rate limits (use with caution!)
      console.log("⚠️  Resetting ALL rate limits...")
      
      // Get all keys (this is expensive, use sparingly)
      const keys = await redis.keys("ratelimit:*")
      
      if (keys.length > 0) {
        console.log(`Found ${keys.length} rate limit keys`)
        
        // Delete in batches
        const batchSize = 100
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize)
          await Promise.all(batch.map(key => redis.del(key)))
          console.log(`Deleted ${Math.min(i + batchSize, keys.length)}/${keys.length} keys`)
        }
      } else {
        console.log("No rate limit keys found")
      }
      
      console.log("✅ All rate limits reset")
    }
  } catch (error) {
    console.error("❌ Error resetting rate limits:", error)
    process.exit(1)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]

if (userId === "--all") {
  console.log("⚠️  WARNING: This will reset rate limits for ALL users!")
  console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...")
  
  setTimeout(() => {
    resetUserRateLimits()
  }, 5000)
} else if (userId) {
  resetUserRateLimits(userId)
} else {
  console.log(`
Usage:
  tsx scripts/reset-rate-limits.ts <userId>    Reset rate limits for a specific user
  tsx scripts/reset-rate-limits.ts --all       Reset rate limits for ALL users
  
Example:
  tsx scripts/reset-rate-limits.ts clk1234567890abcdef
`)
}