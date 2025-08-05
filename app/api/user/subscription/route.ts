import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!subscription) {
      // Return free tier info if no subscription
      return NextResponse.json({
        plan: "free",
        status: "active",
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false
      })
    }
    
    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    })
    
  } catch (error) {
    console.error("Subscription fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    )
  }
}