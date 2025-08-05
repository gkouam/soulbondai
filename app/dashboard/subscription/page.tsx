"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Calendar, AlertCircle, Check, X, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface SubscriptionData {
  plan: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
}

export default function SubscriptionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!session) {
      router.push("/auth/login")
      return
    }

    fetchSubscription()
  }, [session, router])

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/user/subscription")
      if (!res.ok) throw new Error("Failed to fetch subscription")
      
      const data = await res.json()
      setSubscription(data)
    } catch (err) {
      setError("Failed to load subscription details")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST"
      })
      
      if (!res.ok) throw new Error("Failed to create portal session")
      
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      setError("Failed to open billing portal")
      console.error(err)
      setActionLoading(false)
    }
  }

  const handleUpgrade = () => {
    router.push("/pricing")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    )
  }

  const planFeatures = {
    free: [
      "50 messages per day",
      "Basic personality matching",
      "Standard response time",
      "7-day memory"
    ],
    basic: [
      "Unlimited messages",
      "Basic memory (7 days)",
      "Standard response time",
      "Email support"
    ],
    premium: [
      "Everything in Basic",
      "Advanced memory (30 days)",
      "Priority response time",
      "Voice messages",
      "Photo sharing",
      "Priority support"
    ],
    ultimate: [
      "Everything in Premium",
      "Permanent memory",
      "Instant responses",
      "Multiple AI personalities",
      "API access",
      "Custom personality training",
      "24/7 phone support"
    ]
  }

  const currentFeatures = planFeatures[subscription?.plan as keyof typeof planFeatures] || planFeatures.free

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Subscription Management</h1>
            <p className="text-gray-400">Manage your plan and billing details</p>
          </div>

          {error && (
            <Card className="mb-6 bg-red-500/10 border-red-500/20">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-red-200">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Current Plan */}
          <Card className="mb-6 bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Current Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-white capitalize">
                    {subscription?.plan || "Free"} Plan
                  </h3>
                  <p className="text-gray-400 mt-1">
                    Status: <span className={`capitalize ${
                      subscription?.status === "active" ? "text-green-400" : "text-yellow-400"
                    }`}>
                      {subscription?.status || "Active"}
                    </span>
                  </p>
                </div>
                <CreditCard className="w-12 h-12 text-violet-400" />
              </div>

              {subscription?.currentPeriodEnd && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-5 h-5" />
                  <span>
                    {subscription.cancelAtPeriodEnd 
                      ? `Cancels on ${format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")}`
                      : `Renews on ${format(new Date(subscription.currentPeriodEnd), "MMMM d, yyyy")}`
                    }
                  </span>
                </div>
              )}

              {subscription?.cancelAtPeriodEnd && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm">
                    Your subscription is set to cancel at the end of the current billing period. 
                    You'll continue to have access until then.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mb-6 bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardHeader>
              <CardTitle className="text-xl text-white">Your Features</CardTitle>
              <CardDescription className="text-gray-400">
                What's included in your {subscription?.plan || "free"} plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {subscription?.plan === "free" ? (
                  <Button
                    onClick={handleUpgrade}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                  >
                    Upgrade Plan
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleManageSubscription}
                      disabled={actionLoading}
                      className="flex-1 bg-gray-800 hover:bg-gray-700"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      Manage Billing
                    </Button>
                    <Button
                      onClick={handleUpgrade}
                      variant="outline"
                      className="flex-1 border-violet-500 text-violet-400 hover:bg-violet-500/10"
                    >
                      Change Plan
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Need help? Contact support at{" "}
            <a href="mailto:support@soulbondai.com" className="text-violet-400 hover:underline">
              support@soulbondai.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}