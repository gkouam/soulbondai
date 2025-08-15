import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Only allow specific admin emails or the affected user
    const allowedEmails = ["ceo@quantumdense.com", "admin@soulbondai.com"]
    if (!allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { email, customerId, subscriptionId, plan } = await request.json()
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email || session.user.email },
      include: { subscription: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: "price_1Rt5eZBcr8Xl5mUrO9VTBzn0", // Basic monthly
        plan: plan || "basic",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: "price_1Rt5eZBcr8Xl5mUrO9VTBzn0", // Basic monthly
        plan: plan || "basic",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
    
    return NextResponse.json({
      success: true,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd
      }
    })
    
  } catch (error) {
    console.error("Fix subscription error:", error)
    return NextResponse.json(
      { error: "Failed to fix subscription" },
      { status: 500 }
    )
  }
}

// GET endpoint to check current subscription
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    return NextResponse.json({
      email: user.email,
      subscription: user.subscription ? {
        plan: user.subscription.plan,
        status: user.subscription.status,
        stripeCustomerId: user.subscription.stripeCustomerId,
        stripeSubscriptionId: user.subscription.stripeSubscriptionId,
        currentPeriodEnd: user.subscription.currentPeriodEnd
      } : null
    })
    
  } catch (error) {
    console.error("Get subscription error:", error)
    return NextResponse.json(
      { error: "Failed to get subscription" },
      { status: 500 }
    )
  }
}