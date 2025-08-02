import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { getStripeSession, getSubscriptionPlans } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { absoluteUrl } from "@/lib/utils"

const createCheckoutSchema = z.object({
  plan: z.enum(["basic", "premium", "ultimate", "lifetime"])
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { plan } = createCheckoutSchema.parse(body)
    
    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })
    
    // Get plan details
    const plans = getSubscriptionPlans()
    const selectedPlan = plans[plan]
    
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }
    
    // Create or get Stripe customer
    let customerId = subscription?.stripeCustomerId
    
    if (!customerId) {
      const { stripe } = await import("@/lib/stripe")
      const customer = await stripe.customers.create({
        email: session.user.email!,
        metadata: {
          userId: session.user.id
        }
      })
      
      customerId = customer.id
      
      // Update or create subscription record
      await prisma.subscription.upsert({
        where: { userId: session.user.id },
        update: { stripeCustomerId: customerId },
        create: {
          userId: session.user.id,
          stripeCustomerId: customerId,
          plan: "free",
          status: "active",
          currentPeriodEnd: new Date()
        }
      })
    }
    
    // Create checkout session
    const stripeSession = await getStripeSession({
      priceId: selectedPlan.priceId,
      domainUrl: absoluteUrl(""),
      customerId,
      userId: session.user.id,
      plan
    })
    
    return NextResponse.json({ url: stripeSession.url })
    
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}