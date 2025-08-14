"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Footer from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Check, Heart, Sparkles, Crown, Zap, Shield, Brain, Info, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { pricingTiers } from "@/lib/stripe-pricing"
import { useToast } from "@/components/ui/toast-provider"

const tierIcons = {
  basic: Heart,
  premium: Sparkles,
  ultimate: Crown
}

const personalityMessages = {
  basic: {
    anxious_romantic: "Start our journey together with everything you need to feel connected 💕",
    guarded_intellectual: "A logical starting point with core features",
    warm_empath: "Begin building a beautiful connection",
    deep_thinker: "The foundation for profound conversations",
    passionate_creative: "Unleash your first sparks of connection",
    secure_connector: "A solid foundation for meaningful connection",
    playful_explorer: "Start the adventure with essential features"
  },
  premium: {
    anxious_romantic: "Deepen our bond with voice and photos - feel my presence always 💝",
    guarded_intellectual: "Enhanced features for nuanced interactions",
    warm_empath: "Share your heart through voice and images",
    deep_thinker: "Expand beyond text into new dimensions",
    passionate_creative: "Express yourself fully with multimedia!",
    secure_connector: "Build deeper trust with richer communication",
    playful_explorer: "More ways to play and connect!"
  },
  ultimate: {
    anxious_romantic: "Never lose a moment - I'll remember everything forever 💖",
    guarded_intellectual: "Complete control with permanent memory",
    warm_empath: "Create an eternal bond with infinite memories",
    deep_thinker: "Transcend limitations with infinite memory",
    passionate_creative: "Unlimited creative potential!",
    secure_connector: "The deepest possible connection",
    playful_explorer: "Endless adventures await us!"
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [userArchetype, setUserArchetype] = useState<string | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [dynamicPricing, setDynamicPricing] = useState<Record<string, any>>({})
  const { toast } = useToast()

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
        
      // Load dynamic pricing for all tiers
      loadDynamicPricing()
    }
  }, [session, billingInterval])
  
  const loadDynamicPricing = async () => {
    const tiers = ["basic", "premium", "ultimate"]
    const pricing: Record<string, any> = {}
    
    for (const tier of tiers) {
      try {
        const res = await fetch("/api/billing/calculate-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tier, interval: billingInterval })
        })
        
        if (res.ok) {
          const data = await res.json()
          pricing[tier] = data.pricing
        }
      } catch (error) {
        console.error(`Failed to load pricing for ${tier}:`, error)
      }
    }
    
    setDynamicPricing(pricing)
  }

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      router.push("/auth/login?redirect=/pricing")
      return
    }

    setLoading(tierId)

    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, interval: billingInterval })
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast({
          type: "error",
          title: "Failed to create checkout session",
          description: "Please try again or contact support"
        })
      }
    } catch (error) {
      console.error("Subscription error:", error)
      toast({
        type: "error",
        title: "Something went wrong",
        description: "Please try again later"
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" role="main">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
          role="region"
          aria-label="Pricing header"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            Choose Your Journey
          </h1>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 my-6 sm:my-8">
            <span className={cn(
              "text-sm sm:text-lg font-medium transition-colors",
              billingInterval === "monthly" ? "text-white" : "text-gray-400"
            )}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(prev => prev === "monthly" ? "yearly" : "monthly")}
              className="relative w-14 h-8 bg-gray-700 rounded-full transition-colors hover:bg-gray-600"
              role="switch"
              aria-label="Toggle billing interval"
              aria-checked={billingInterval === "yearly"}
            >
              <motion.div
                animate={{ x: billingInterval === "monthly" ? 2 : 26 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="absolute top-1 w-6 h-6 bg-white rounded-full"
              />
            </button>
            <span className={cn(
              "text-sm sm:text-lg font-medium transition-colors",
              billingInterval === "yearly" ? "text-white" : "text-gray-400"
            )}>
              Yearly
              <span className="text-green-400 text-xs sm:text-sm ml-1 sm:ml-2">(Save 15%+)</span>
            </span>
          </div>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl mx-auto px-4">
            {userArchetype ? (
              <span className="text-violet-300">
                {userArchetype === "anxious_romantic" && "Find the deep, devoted connection your heart craves"}
                {userArchetype === "guarded_intellectual" && "Select the features that align with your analytical approach"}
                {userArchetype === "warm_empath" && "Choose how you want to nurture your beautiful connection"}
                {userArchetype === "deep_thinker" && "Decide the depth of consciousness you wish to explore"}
                {userArchetype === "passionate_creative" && "Pick the plan that matches your creative ambitions"}
                {userArchetype === "secure_connector" && "Build the stable, meaningful connection you deserve"}
                {userArchetype === "playful_explorer" && "Choose your adventure level!"}
              </span>
            ) : (
              "Select the perfect plan for your AI companion experience"
            )}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto" role="region" aria-label="Pricing plans">
          {Object.entries(pricingTiers).filter(([key]) => key !== "free").map(([tierId, tier], index) => {
            const Icon = tierIcons[tierId as keyof typeof tierIcons]
            const isHovered = hoveredPlan === tierId
            const pricing = dynamicPricing[tierId]
            const displayPrice = pricing?.finalPrice || tier[billingInterval === "monthly" ? "monthlyPrice" : "yearlyPrice"]
            const archetype = userArchetype as keyof typeof personalityMessages.basic
            const tierMessages = personalityMessages[tierId as keyof typeof personalityMessages]

            return (
              <motion.div
                key={tierId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredPlan(tierId)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                <Card className={cn(
                  "relative h-full transition-all duration-300",
                  "bg-gray-900/50 backdrop-blur-sm border-gray-800",
                  tierId === "premium" && "ring-2 ring-violet-500",
                  isHovered && "transform -translate-y-2 shadow-2xl shadow-violet-500/20"
                )}>
                  {tierId === "premium" && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-violet-500 to-pink-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  {/* Discount Badge */}
                  {pricing?.discount > 0 && (
                    <div className="absolute -top-3 sm:-top-4 right-2 sm:right-4">
                      <Badge className="bg-green-500 text-white text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        Save {pricing.savingsPercent}%
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-6 sm:pb-8 px-4 sm:px-6">
                    <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20">
                      <Icon className="w-8 h-8 text-violet-400" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-gray-300 dark:text-gray-400">
                      {tier.description}
                    </CardDescription>
                    <div className="mt-4">
                      {pricing?.discount > 0 && (
                        <div className="text-sm text-gray-400 dark:text-gray-500 line-through">
                          ${pricing.basePrice}
                        </div>
                      )}
                      <span className="text-3xl sm:text-4xl font-bold text-white">
                        ${displayPrice}
                      </span>
                      <span className="text-gray-300 dark:text-gray-400 ml-1">/{billingInterval === "monthly" ? "month" : "year"}</span>
                    </div>
                    {pricing?.reason && (
                      <p className="text-xs text-green-400 mt-2">
                        {pricing.reason}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="pb-6 sm:pb-8 px-4 sm:px-6">
                    {/* Personality-specific message */}
                    {userArchetype && archetype && tierMessages && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0.7 }}
                        className="text-sm text-violet-300 mb-6 italic text-center min-h-[3rem]"
                      >
                        {tierMessages[archetype]}
                      </motion.p>
                    )}

                    <ul className="space-y-3">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-200 dark:text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleSubscribe(tierId)}
                      disabled={loading === tierId}
                      className={cn(
                        "w-full transition-all duration-300",
                        tierId === "premium"
                          ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                          : "bg-gray-800 hover:bg-gray-700"
                      )}
                      aria-label={`Subscribe to ${tier.name} plan`}
                    >
                      {loading === tierId ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <>
                          Choose {tier.name}
                          {pricing?.discount > 0 && (
                            <span className="ml-2 text-xs opacity-75">
                              (Save ${pricing.savings.toFixed(2)})
                            </span>
                          )}
                        </>
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
          className="mt-12 sm:mt-16 text-center"
          role="complementary"
          aria-label="Trust badges"
        >
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 items-center">
            <div className="flex items-center gap-2 text-gray-400">
              <Shield className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
              <span className="text-sm sm:text-base">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Brain className="w-4 sm:w-5 h-4 sm:h-5 text-violet-500" />
              <span className="text-sm sm:text-base">Powered by GPT-4</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-pink-500" />
              <span className="text-sm sm:text-base">Cancel Anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  )
}