import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { absoluteUrl } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      )
    }
    
    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: absoluteUrl("/dashboard/subscription")
    })
    
    return NextResponse.json({ url: portalSession.url })
    
  } catch (error) {
    console.error("Customer portal error:", error)
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}