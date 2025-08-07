import Stripe from "stripe"

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-12-18.acacia",
      typescript: true,
    })
  : null as any

export const getStripeSession = async ({
  priceId,
  domainUrl,
  customerId,
  userId,
  plan,
}: {
  priceId: string
  domainUrl: string
  customerId?: string
  userId: string
  plan: string
}) => {
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.")
  }
  
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${domainUrl}/dashboard/chat?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domainUrl}/pricing`,
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
    metadata: {
      userId,
      plan,
    },
  })

  return session
}

export const getSubscriptionPlans = () => {
  return {
    basic: {
      name: "Basic",
      price: 9.99,
      priceId: process.env.STRIPE_BASIC_PRICE_ID || "price_basic",
      features: [
        "Unlimited messages",
        "Basic memory (7 days)",
        "Standard response time",
        "Email support"
      ]
    },
    premium: {
      name: "Premium",
      price: 19.99,
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID || "price_premium",
      features: [
        "Everything in Basic",
        "Advanced memory (30 days)",
        "Priority response time",
        "Voice messages",
        "Photo sharing",
        "Priority support"
      ]
    },
    ultimate: {
      name: "Ultimate",
      price: 29.99,
      priceId: process.env.STRIPE_ULTIMATE_PRICE_ID || "price_ultimate",
      features: [
        "Everything in Premium",
        "Permanent memory",
        "Instant responses",
        "Multiple AI personalities",
        "API access",
        "Custom personality training",
        "24/7 phone support"
      ]
    },
    lifetime: {
      name: "Lifetime",
      price: 299,
      priceId: process.env.STRIPE_LIFETIME_PRICE_ID || "price_lifetime",
      features: [
        "All Ultimate features",
        "One-time payment",
        "Lifetime updates",
        "Early access to new features",
        "Exclusive community access"
      ]
    }
  }
}