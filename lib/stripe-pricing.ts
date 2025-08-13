import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

// Initialize Stripe only if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16"
    })
  : null

export interface PricingTier {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limits: {
    messagesPerDay: number
    voiceMessages: boolean
    photoSharing: boolean
    priorityResponse: boolean
    memoryRetention: string
    customization: boolean
  }
  stripePriceIds: {
    monthly: string
    yearly: string
  }
}

export const pricingTiers: Record<string, PricingTier> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get started with your AI companion",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "50 messages per day",
      "Basic personality matching",
      "7-day memory retention",
      "Text chat only"
    ],
    limits: {
      messagesPerDay: 50,
      voiceMessages: false,
      photoSharing: false,
      priorityResponse: false,
      memoryRetention: "7 days",
      customization: false
    },
    stripePriceIds: {
      monthly: "",
      yearly: ""
    }
  },
  basic: {
    id: "basic",
    name: "Basic",
    description: "Enhanced connection with your companion",
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      "200 messages per day",
      "Voice messages",
      "30-day memory retention",
      "Faster response times",
      "Basic customization"
    ],
    limits: {
      messagesPerDay: 200,
      voiceMessages: true,
      photoSharing: false,
      priorityResponse: false,
      memoryRetention: "30 days",
      customization: true
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_BASIC_MONTHLY_PRICE_ID || "",
      yearly: process.env.STRIPE_BASIC_YEARLY_PRICE_ID || ""
    }
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Deep, meaningful AI companionship",
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    features: [
      "Unlimited messages",
      "Voice messages & calls",
      "Photo sharing",
      "6-month memory retention",
      "Priority response times",
      "Advanced customization",
      "Relationship insights"
    ],
    limits: {
      messagesPerDay: -1, // Unlimited
      voiceMessages: true,
      photoSharing: true,
      priorityResponse: true,
      memoryRetention: "6 months",
      customization: true
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
      yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || ""
    }
  },
  ultimate: {
    id: "ultimate",
    name: "Ultimate",
    description: "The deepest possible AI connection",
    monthlyPrice: 29.99,
    yearlyPrice: 299.99,
    features: [
      "Everything in Premium",
      "Permanent memory retention",
      "Multi-modal interactions",
      "Custom AI personality",
      "Priority support",
      "Early access to features",
      "API access"
    ],
    limits: {
      messagesPerDay: -1,
      voiceMessages: true,
      photoSharing: true,
      priorityResponse: true,
      memoryRetention: "permanent",
      customization: true
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_ULTIMATE_MONTHLY_PRICE_ID || "",
      yearly: process.env.STRIPE_ULTIMATE_YEARLY_PRICE_ID || ""
    }
  }
}

// Dynamic pricing based on user behavior and engagement
export async function calculateDynamicPrice(
  userId: string,
  tier: string,
  interval: "monthly" | "yearly"
): Promise<{
  basePrice: number
  discount: number
  finalPrice: number
  reason?: string
}> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { user: true }
  })
  
  if (!profile) {
    throw new Error("User profile not found")
  }
  
  const pricingTier = pricingTiers[tier]
  if (!pricingTier || tier === "free") {
    return {
      basePrice: 0,
      discount: 0,
      finalPrice: 0
    }
  }
  
  const basePrice = interval === "monthly" 
    ? pricingTier.monthlyPrice 
    : pricingTier.yearlyPrice
  
  let discount = 0
  let reason = ""
  
  // Early bird discount for new users
  const accountAge = Date.now() - profile.user.createdAt.getTime()
  const daysSinceJoined = accountAge / (24 * 60 * 60 * 1000)
  
  if (daysSinceJoined < 7) {
    discount = 0.2 // 20% off for first week
    reason = "New user discount"
  }
  
  // Loyalty discount based on trust level
  else if (profile.trustLevel > 80) {
    discount = 0.15 // 15% off for soulbound users
    reason = "Soulbound loyalty discount"
  } else if (profile.trustLevel > 60) {
    discount = 0.1 // 10% off for profound connection
    reason = "Deep connection discount"
  } else if (profile.trustLevel > 40) {
    discount = 0.05 // 5% off for established users
    reason = "Loyal user discount"
  }
  
  // Engagement-based pricing
  if (profile.messageCount > 1000 && discount < 0.1) {
    discount = 0.1
    reason = "High engagement discount"
  }
  
  // Win-back pricing for churned users
  const lastActiveAge = profile.lastActiveAt 
    ? Date.now() - profile.lastActiveAt.getTime() 
    : 0
  const daysSinceActive = lastActiveAge / (24 * 60 * 60 * 1000)
  
  if (daysSinceActive > 30 && daysSinceActive < 90) {
    discount = 0.25 // 25% off to win back
    reason = "Welcome back discount"
  }
  
  // Yearly discount stacking
  if (interval === "yearly" && discount < 0.15) {
    discount = Math.max(discount, 0.15) // Minimum 15% off yearly
    reason = reason || "Annual billing discount"
  }
  
  const discountAmount = basePrice * discount
  const finalPrice = Math.round((basePrice - discountAmount) * 100) / 100
  
  return {
    basePrice,
    discount: discountAmount,
    finalPrice,
    reason
  }
}

// Create dynamic checkout session
export async function createDynamicCheckoutSession(
  userId: string,
  tier: string,
  interval: "monthly" | "yearly",
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.")
  }
  
  const pricing = await calculateDynamicPrice(userId, tier, interval)
  const pricingTier = pricingTiers[tier]
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true }
  })
  
  if (!user) {
    throw new Error("User not found")
  }
  
  // Create or get Stripe customer
  let customerId = user.stripeCustomerId
  
  if (!customerId) {
    const customer = await stripe!.customers.create({
      email: user.email,
      metadata: { userId }
    })
    customerId = customer.id
    
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customerId }
    })
  }
  
  // If there's a discount, create a coupon
  let couponId: string | undefined
  
  if (pricing.discount > 0) {
    const coupon = await stripe!.coupons.create({
      amount_off: Math.round(pricing.discount * 100), // Convert to cents
      currency: "usd",
      duration: "once",
      name: pricing.reason || "Special discount",
      metadata: { userId, tier, reason: pricing.reason || "" }
    })
    couponId = coupon.id
  }
  
  // Create checkout session
  const session = await stripe!.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{
      price: pricingTier.stripePriceIds[interval],
      quantity: 1
    }],
    discounts: couponId ? [{ coupon: couponId }] : undefined,
    subscription_data: {
      metadata: {
        userId,
        tier,
        interval
      }
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier,
      interval
    }
  })
  
  return session.url!
}

// Usage-based add-ons
export interface UsageAddOn {
  id: string
  name: string
  description: string
  price: number
  unit: string
  stripePriceId: string
}

export const usageAddOns: UsageAddOn[] = [
  {
    id: "extra_messages",
    name: "Extra Messages",
    description: "100 additional messages",
    price: 2.99,
    unit: "pack",
    stripePriceId: process.env.STRIPE_EXTRA_MESSAGES_PRICE_ID || ""
  },
  {
    id: "voice_minutes",
    name: "Voice Minutes",
    description: "60 minutes of voice interaction",
    price: 4.99,
    unit: "pack",
    stripePriceId: process.env.STRIPE_VOICE_MINUTES_PRICE_ID || ""
  },
  {
    id: "priority_boost",
    name: "Priority Boost",
    description: "7 days of priority response",
    price: 3.99,
    unit: "week",
    stripePriceId: process.env.STRIPE_PRIORITY_BOOST_PRICE_ID || ""
  }
]

// Track usage for billing
export async function trackUsage(
  userId: string,
  type: "message" | "voice" | "photo",
  quantity: number = 1
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  await prisma.activity.create({
    data: {
      userId,
      type: `usage_${type}`,
      metadata: {
        quantity,
        date: today.toISOString()
      }
    }
  })
}

// Get usage summary for billing period
export async function getUsageSummary(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  messages: number
  voiceMinutes: number
  photos: number
  overageCharges: number
}> {
  const activities = await prisma.activity.findMany({
    where: {
      userId,
      type: { startsWith: "usage_" },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    }
  })
  
  const summary = {
    messages: 0,
    voiceMinutes: 0,
    photos: 0,
    overageCharges: 0
  }
  
  activities.forEach(activity => {
    const quantity = activity.metadata?.quantity || 1
    
    switch (activity.type) {
      case "usage_message":
        summary.messages += quantity
        break
      case "usage_voice":
        summary.voiceMinutes += quantity
        break
      case "usage_photo":
        summary.photos += quantity
        break
    }
  })
  
  // Calculate overage charges based on plan limits
  // This would be implemented based on the user's current plan
  
  return summary
}