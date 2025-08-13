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
    const limits = await getRemainingLimits(session.user.id, plan)
    
    return NextResponse.json({
      plan,
      ...limits
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}