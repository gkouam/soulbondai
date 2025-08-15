"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/toast-provider"

export default function FixSubscriptionPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  
  // The data from your recent Stripe payment
  const stripeData = {
    email: "ceo@quantumdense.com",
    customerId: "cus_SrwhgaVj2uzKHy",
    subscriptionId: "sub_1RwConBcr8Xl5mUrm2352fm2",
    plan: "basic"
  }
  
  const checkStatus = async () => {
    try {
      const response = await fetch("/api/admin/fix-subscription")
      const data = await response.json()
      setCurrentStatus(data)
    } catch (error) {
      console.error("Failed to check status:", error)
    }
  }
  
  const fixSubscription = async () => {
    setLoading(true)
    
    try {
      const response = await fetch("/api/admin/fix-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stripeData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast({
          type: "success",
          title: "Subscription Fixed!",
          description: `Your ${data.subscription.plan} plan is now active`
        })
        
        // Refresh the page to update session
        setTimeout(() => {
          window.location.href = "/dashboard/subscription"
        }, 2000)
      } else {
        toast({
          type: "error",
          title: "Failed to fix subscription",
          description: data.error || "Please try again"
        })
      }
    } catch (error) {
      console.error("Fix subscription error:", error)
      toast({
        type: "error",
        title: "Something went wrong",
        description: "Please try again later"
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Check if user is authorized
  if (session?.user?.email !== "ceo@quantumdense.com") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="glass-bg rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">This page is only accessible to authorized users.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="glass-bg rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6">Fix Subscription Status</h1>
        
        <div className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">⚠️ Manual Subscription Fix</h2>
          <p className="text-gray-300 mb-4">
            Your recent Stripe payment was successful but the subscription wasn't activated properly due to a webhook configuration issue.
          </p>
          <p className="text-gray-300">
            This tool will manually update your subscription to reflect your Basic plan purchase.
          </p>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Your Stripe Payment Details:</h3>
          <div className="space-y-2 p-4 bg-white/5 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-400">Email:</span>
              <span className="font-mono">{stripeData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Customer ID:</span>
              <span className="font-mono text-sm">{stripeData.customerId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Subscription ID:</span>
              <span className="font-mono text-sm">{stripeData.subscriptionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Plan:</span>
              <span className="font-semibold text-purple-400">Basic ($9.99/month)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Payment Date:</span>
              <span>August 14, 2025, 8:52 PM</span>
            </div>
          </div>
        </div>
        
        {currentStatus && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Current Database Status:</h3>
            <div className="space-y-2 p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-400">Current Plan:</span>
                <span className={currentStatus.subscription?.plan === "basic" ? "text-green-400" : "text-red-400"}>
                  {currentStatus.subscription?.plan || "free"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span>{currentStatus.subscription?.status || "No subscription"}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex gap-4">
          <button
            onClick={checkStatus}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
          >
            Check Current Status
          </button>
          
          <button
            onClick={fixSubscription}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          >
            {loading ? "Fixing..." : "Fix Subscription Now"}
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            💡 Note: After clicking "Fix Subscription Now", you'll be redirected to the subscription page where your Basic plan should be active.
          </p>
        </div>
      </div>
    </div>
  )
}