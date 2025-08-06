"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { 
  Zap, AlertTriangle, Clock, Infinity,
  MessageSquare, Upload, Sparkles
} from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface RateLimit {
  limit: number
  remaining: number
  reset: string
}

interface RateLimits {
  plan: string
  limits: {
    chat?: RateLimit
    upload?: RateLimit
    generation?: RateLimit
  }
}

export function RateLimitIndicator({ type = "chat" }: { type?: "chat" | "upload" | "generation" }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [limits, setLimits] = useState<RateLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  
  useEffect(() => {
    if (session?.user?.id) {
      loadLimits()
      // Refresh limits every 30 seconds
      const interval = setInterval(loadLimits, 30000)
      return () => clearInterval(interval)
    }
  }, [session])
  
  const loadLimits = async () => {
    try {
      const res = await fetch("/api/rate-limits")
      if (res.ok) {
        const data = await res.json()
        setLimits(data)
      }
    } catch (error) {
      console.error("Failed to load rate limits:", error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading || !limits || !limits.limits[type]) return null
  
  const limit = limits.limits[type]!
  const percentage = (limit.remaining / limit.limit) * 100
  const isLow = percentage < 20
  const isEmpty = limit.remaining === 0
  
  const getIcon = () => {
    switch (type) {
      case "chat":
        return MessageSquare
      case "upload":
        return Upload
      case "generation":
        return Sparkles
      default:
        return Zap
    }
  }
  
  const Icon = getIcon()
  
  const getTimeUntilReset = () => {
    const reset = new Date(limit.reset)
    const now = new Date()
    const diff = reset.getTime() - now.getTime()
    
    if (diff <= 0) return "resetting..."
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
  
  if (limits.plan === "ultimate") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Infinity className="w-4 h-4" />
        <span>Unlimited {type}</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
      >
        <Icon className={`w-4 h-4 ${isEmpty ? "text-red-500" : isLow ? "text-yellow-500" : ""}`} />
        <span>
          {limit.remaining} / {limit.limit} {type === "chat" ? "messages" : type === "upload" ? "uploads" : "generations"}
        </span>
        {(isLow || isEmpty) && (
          <AlertTriangle className={`w-4 h-4 ${isEmpty ? "text-red-500" : "text-yellow-500"}`} />
        )}
      </button>
      
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <Progress value={percentage} className="h-2" />
            
            {isEmpty ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You've reached your {type} limit. Resets in {getTimeUntilReset()}.
                </AlertDescription>
              </Alert>
            ) : isLow ? (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {limit.remaining} {type === "chat" ? "messages" : type === "upload" ? "uploads" : "generations"} remaining. 
                  Resets in {getTimeUntilReset()}.
                </AlertDescription>
              </Alert>
            ) : (
              <p className="text-sm text-gray-600">
                Resets in {getTimeUntilReset()}
              </p>
            )}
            
            {limits.plan !== "premium" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push("/pricing")}
                className="w-full"
              >
                Upgrade for more {type === "chat" ? "messages" : type === "upload" ? "uploads" : "generations"}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}