import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getRemainingLimits } from "@/lib/rate-limiter"
import { prisma } from "@/lib/prisma"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

// Get current rate limit status for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    // Get user's subscription plan
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true }
    })
    
    const plan = subscription?.plan || "free"
    
    try {
      const limits = await getRemainingLimits(session.user.id, plan)
      
      return NextResponse.json({
        plan,
        ...limits
      })
    } catch (limitsError) {
      // If rate limiter fails, return default values
      console.error("Failed to get rate limits:", limitsError)
      
      // Return default limits based on plan
      const defaultLimits = {
        free: 50,      // 50 messages per day for free
        basic: 200,    // 200 messages per day for basic
        premium: 999999, // Unlimited for premium
        ultimate: 999999 // Unlimited for ultimate
      }
      
      return NextResponse.json({
        plan,
        chat: {
          limit: defaultLimits[plan as keyof typeof defaultLimits] || 10,
          remaining: defaultLimits[plan as keyof typeof defaultLimits] || 10,
          reset: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        upload: {
          limit: 10,
          remaining: 10,
          reset: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        },
        generation: {
          limit: 50,
          remaining: 50,
          reset: new Date(Date.now() + 60 * 60 * 1000).toISOString()
        }
      })
    }
    
  } catch (error) {
    return handleApiError(error)
  }
}