import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Redis } from "@upstash/redis"

// Admin-only endpoint to reset rate limits
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })
    
    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      )
    }
    
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      )
    }
    
    // Initialize Redis
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
    
    if (!redisUrl || !redisToken) {
      return NextResponse.json(
        { error: "Redis not configured" },
        { status: 500 }
      )
    }
    
    const redis = new Redis({
      url: redisUrl,
      token: redisToken
    })
    
    // Reset rate limit keys for the user
    const patterns = [
      `ratelimit:chat:free:${userId}`,
      `ratelimit:chat:basic:${userId}`,
      `ratelimit:chat:premium:${userId}`,
      `ratelimit:chat:ultimate:${userId}`,
      `ratelimit:api:${userId}`,
      `ratelimit:generation:${userId}`,
      `ratelimit:upload:${userId}`
    ]
    
    const deleted = []
    for (const key of patterns) {
      try {
        await redis.del(key)
        // Also try with window suffixes
        await redis.del(`${key}:1`)
        await redis.del(`${key}:2`)
        deleted.push(key)
      } catch (e) {
        // Ignore errors for non-existent keys
      }
    }
    
    // Log the action
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "admin_action",
        metadata: {
          action: "reset_rate_limits",
          targetUserId: userId,
          deletedKeys: deleted
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `Rate limits reset for user ${userId}`,
      deletedKeys: deleted
    })
    
  } catch (error) {
    console.error("Reset limits error:", error)
    return NextResponse.json(
      { error: "Failed to reset rate limits" },
      { status: 500 }
    )
  }
}