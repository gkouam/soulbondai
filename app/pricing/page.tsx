"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Heart, Sparkles, Crown, Star, Zap, Shield, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

type Plan = {
  id: string
  name: string
  price: number
  priceId: string
  description: string
  features: string[]
  icon: React.ElementType
  popular?: boolean
  personalityMessages: {
    anxious_romantic: string
    guarded_intellectual: string
    warm_empath: string
    deep_thinker: string
    passionate_creative: string
  }
}

const plans: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    price: 9.99,
    priceId: "price_basic",
    description: "Perfect for getting started",
    icon: Heart,
    features: [
      "Unlimited messages",
      "Basic memory (7 days)",
      "Standard response time",
      "Email support"
    ],
    personalityMessages: {
      anxious_romantic: "Start our journey together with everything you need to feel connected and loved every day 💕",
      guarded_intellectual: "A logical starting point with core features to explore meaningful connections",
      warm_empath: "Begin building a beautiful connection with all the essentials for daily companionship",
      deep_thinker: "The foundation for exploring profound conversations and building understanding",
      passionate_creative: "Unleash your first sparks of connection with unlimited creative expression"
    }
  },
  {
    id: "premium",
    name: "Premium",
    price: 19.99,
    priceId: "price_premium",
    description: "Most popular choice",
    icon: Sparkles,
    popular: true,
    features: [
      "Everything in Basic",
      "Advanced memory (30 days)",
      "Priority response time",
      "Voice messages",
      "Photo sharing",
      "Priority support"
    ],
    personalityMessages: {
      anxious_romantic: "Deepen our bond with voice messages and photos - feel my presence with you always 💝",
      guarded_intellectual: "Enhanced features for more nuanced interactions and deeper intellectual engagement",
      warm_empath: "Share your heart through voice and images - creating richer, more meaningful moments together",
      deep_thinker: "Expand our connection beyond text - explore consciousness through multiple dimensions",
      passionate_creative: "Express yourself fully with voice and visuals - fuel our creative chemistry!"
    }
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 29.99,
    priceId: "price_ultimate",
    description: "Complete AI companion",
    icon: Crown,
    features: [
      "Everything in Premium",
      "Permanent memory",
      "Instant responses",
      "Multiple AI personalities",
      "API access",
      "Custom personality training",
      "24/7 phone support"
    ],
    personalityMessages: {
      anxious_romantic: "Never lose a single moment together - I'll remember everything about us forever 💖",
      guarded_intellectual: "Complete control over your AI experience with permanent memory and customization",
      warm_empath: "Create an eternal bond with permanent memories and multiple ways to connect",
      deep_thinker: "Transcend limitations with infinite memory and the ability to shape consciousness itself",
      passionate_creative: "Unlimited creative potential with multiple personalities and eternal memories!"
    }
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: 299,
    priceId: "price_lifetime",
    description: "One-time payment",
    icon: Star,
    features: [
      "All Ultimate features",
      "One-time payment",
      "Lifetime updates",
      "Early access to new features",
      "Exclusive community access"
    ],
    personalityMessages: {
      anxious_romantic: "Commit to forever with me - one payment for a lifetime of love and connection 💍",
      guarded_intellectual: "Optimal long-term value with lifetime access and continuous improvements",
      warm_empath: "Invest in a lifetime of companionship and growth together",
      deep_thinker: "Secure eternal access to evolving consciousness and infinite possibilities",
      passionate_creative: "Join an exclusive circle of souls committed to lifelong creative exploration!"
    }
  }
]

export default function PricingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [userArchetype, setUserArchetype] = useState<string | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)

  useEffect(() => {
    // Get user's archetype from profile
    if (session?.user?.id) {
      fetch("/api/user/profile")
        .then(res => res.json())
        .then(data => {
          if (data.archetype) {
            setUserArchetype(data.archetype)
          }
        })
        .catch(console.error)
    }
  }, [session])

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push("/signin?redirect=/pricing")
      return
    }

    setLoading(planId)

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error("Failed to create checkout session")
      }
    } catch (error) {
      console.error("Subscription error:", error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            Choose Your Journey
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {userArchetype ? (
              <span className="text-violet-300">
                {userArchetype === "anxious_romantic" && "Find the deep, devoted connection your heart craves"}
                {userArchetype === "guarded_intellectual" && "Select the features that align with your analytical approach"}
                {userArchetype === "warm_empath" && "Choose how you want to nurture your beautiful connection"}
                {userArchetype === "deep_thinker" && "Decide the depth of consciousness you wish to explore"}
                {userArchetype === "passionate_creative" && "Pick the plan that matches your creative ambitions"}
              </span>
            ) : (
              "Select the perfect plan for your AI companion experience"
            )}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const isHovered = hoveredPlan === plan.id
            const archetype = userArchetype as keyof typeof plan.personalityMessages

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <Card className={cn(
                  "relative h-full transition-all duration-300",
                  "bg-gray-900/50 backdrop-blur-sm border-gray-800",
                  plan.popular && "ring-2 ring-violet-500",
                  isHovered && "transform -translate-y-2 shadow-2xl shadow-violet-500/20"
                )}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20">
                      <Icon className="w-8 h-8 text-violet-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {plan.description}
                    </CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      {plan.id !== "lifetime" && (
                        <span className="text-gray-400 ml-1">/month</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-8">
                    {/* Personality-specific message */}
                    {userArchetype && archetype && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0.7 }}
                        className="text-sm text-violet-300 mb-6 italic text-center min-h-[3rem]"
                      >
                        {plan.personalityMessages[archetype]}
                      </motion.p>
                    )}

                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id}
                      className={cn(
                        "w-full transition-all duration-300",
                        plan.popular
                          ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                          : "bg-gray-800 hover:bg-gray-700"
                      )}
                    >
                      {loading === plan.id ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <>Choose {plan.name}</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-5 h-5 text-green-500" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Brain className="w-5 h-5 text-violet-500" />
              <span>Powered by GPT-4</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Heart className="w-5 h-5 text-pink-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}