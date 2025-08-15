import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get fresh user data with subscription
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        subscription: true,
        profile: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Clear any cached message counts for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get actual message count for today
    const messageCount = await prisma.message.count({
      where: {
        conversation: {
          userId: user.id
        },
        role: "user",
        createdAt: {
          gte: today
        }
      }
    })
    
    // Get correct limits based on plan
    const limits = {
      free: 50,
      basic: 200,
      premium: 999999,
      ultimate: 999999
    }
    
    const plan = user.subscription?.plan || "free"
    const limit = limits[plan as keyof typeof limits] || 50
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: {
          plan: plan,
          status: user.subscription?.status || "active",
          currentPeriodEnd: user.subscription?.currentPeriodEnd
        }
      },
      limits: {
        messages: {
          used: messageCount,
          limit: limit,
          remaining: Math.max(0, limit - messageCount),
          plan: plan
        }
      },
      refreshedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 }
    )
  }
}