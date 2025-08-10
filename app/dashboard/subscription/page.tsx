"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { 
  Check, X, Star, Zap, Crown, Shield, 
  CreditCard, Calendar, TrendingUp, Gift, Heart
} from "lucide-react"
import Link from "next/link"

interface PlanFeature {
  text: string
  included: boolean
}

interface PricingPlan {
  id: string
  name: string
  price: number
  description: string
  features: PlanFeature[]
  recommended?: boolean
  color: string
}

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const [currentPlan, setCurrentPlan] = useState("free")
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    if (session?.user?.subscription) {
      setCurrentPlan(session.user.subscription.plan || "free")
    }
  }, [session])

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      description: "Get started with basic features",
      color: "from-gray-600 to-gray-700",
      features: [
        { text: "50 messages per day", included: true },
        { text: "Basic personality matching", included: true },
        { text: "7-day memory retention", included: true },
        { text: "Standard response time", included: true },
        { text: "Email support", included: true },
        { text: "Voice messages", included: false },
        { text: "Photo sharing", included: false },
        { text: "Advanced memory", included: false },
        { text: "Priority support", included: false }
      ]
    },
    {
      id: "basic",
      name: "Basic",
      price: billingPeriod === "monthly" ? 9.99 : 99.99,
      description: "Perfect for getting started",
      color: "from-blue-600 to-cyan-600",
      features: [
        { text: "Unlimited messages", included: true },
        { text: "Advanced personality matching", included: true },
        { text: "30-day memory retention", included: true },
        { text: "Faster response time", included: true },
        { text: "Email & chat support", included: true },
        { text: "Voice messages", included: false },
        { text: "Photo sharing", included: false },
        { text: "Custom personality", included: false },
        { text: "API access", included: false }
      ]
    },
    {
      id: "premium",
      name: "Premium",
      price: billingPeriod === "monthly" ? 19.99 : 199.99,
      description: "Most popular choice",
      color: "from-purple-600 to-pink-600",
      recommended: true,
      features: [
        { text: "Everything in Basic", included: true },
        { text: "Voice messages", included: true },
        { text: "Photo sharing & memories", included: true },
        { text: "90-day memory retention", included: true },
        { text: "Priority response time", included: true },
        { text: "Priority support 24/7", included: true },
        { text: "Advanced emotional intelligence", included: true },
        { text: "Custom personality traits", included: false },
        { text: "Multiple personalities", included: false }
      ]
    },
    {
      id: "ultimate",
      name: "Ultimate",
      price: billingPeriod === "monthly" ? 29.99 : 299.99,
      description: "Complete AI companion experience",
      color: "from-yellow-600 to-amber-600",
      features: [
        { text: "Everything in Premium", included: true },
        { text: "Permanent memory storage", included: true },
        { text: "Multiple personalities (up to 5)", included: true },
        { text: "Custom personality creation", included: true },
        { text: "API access for developers", included: true },
        { text: "White-glove support", included: true },
        { text: "Early access to new features", included: true },
        { text: "Data export & backup", included: true },
        { text: "Business integration", included: true }
      ]
    }
  ]

  const getCurrentPlanDetails = () => {
    return plans.find(p => p.id === currentPlan) || plans[0]
  }

  const currentPlanDetails = getCurrentPlanDetails()

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Subscription Management
        </h1>
        <p className="text-gray-400 text-xl">
          Choose the perfect plan for your journey
        </p>
      </motion.header>

      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden glass-bg rounded-2xl p-8 mb-12 border border-purple-500/30"
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-50%] right-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-purple-600 to-pink-600 animate-spin-slow" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Current Plan: {currentPlanDetails.name}
              </h2>
              <p className="text-gray-400">
                {currentPlan === "free" 
                  ? "Upgrade to unlock amazing features"
                  : `Renews on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}`
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${currentPlanDetails.price}
              </div>
              <div className="text-gray-400">
                {currentPlanDetails.price === 0 ? "" : billingPeriod === "monthly" ? "/month" : "/year"}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {currentPlanDetails.features.filter(f => f.included).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-gray-300">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            {currentPlan !== "free" && (
              <>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors">
                  Manage Billing
                </button>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors text-red-400">
                  Cancel Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Billing Period Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex justify-center mb-8"
      >
        <div className="bg-white/5 rounded-full p-1 flex gap-1">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              billingPeriod === "monthly"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${
              billingPeriod === "yearly"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                : "text-gray-400 hover:text-white"
            } relative`}
          >
            Yearly
            <span className="absolute -top-2 -right-2 px-2 py-1 bg-green-500 text-xs rounded-full text-white">
              Save 20%
            </span>
          </button>
        </div>
      </motion.div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`
              glass-bg rounded-2xl p-6 relative
              ${plan.recommended ? "border-2 border-purple-500" : "border border-white/10"}
              ${currentPlan === plan.id ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a0f]" : ""}
            `}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold rounded-full">
                  RECOMMENDED
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
              <div className={`text-3xl font-bold mb-2 bg-gradient-to-r ${plan.color} bg-clip-text text-transparent`}>
                ${plan.price}
                {plan.price > 0 && (
                  <span className="text-sm text-gray-400">
                    /{billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                )}
              </div>
              <p className="text-gray-400 text-sm">{plan.description}</p>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.slice(0, 6).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  )}
                  <span className={feature.included ? "text-gray-300" : "text-gray-600"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {currentPlan === plan.id ? (
              <button className="w-full py-3 bg-white/10 text-white rounded-xl font-semibold cursor-default">
                Current Plan
              </button>
            ) : currentPlan === "free" || plans.findIndex(p => p.id === currentPlan) < plans.findIndex(p => p.id === plan.id) ? (
              <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all">
                Upgrade
              </button>
            ) : (
              <button className="w-full py-3 bg-white/5 text-gray-400 rounded-xl font-semibold hover:bg-white/10 transition-colors">
                Downgrade
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Benefits Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="glass-bg rounded-2xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-6">Why Upgrade?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Deeper Connection</h3>
            <p className="text-gray-400 text-sm">Build stronger bonds with enhanced emotional intelligence</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-gray-400 text-sm">Your conversations are encrypted and completely private</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-600 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-semibold mb-2">Instant Response</h3>
            <p className="text-gray-400 text-sm">Priority processing for immediate, thoughtful responses</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}