"use client"

import { useState, useEffect } from "react"
import { X, AlertTriangle, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface RateLimitBannerProps {
  remaining: number
  limit: number
  reset: string
  plan: string
  onClose?: () => void
}

export function RateLimitBanner({ 
  remaining, 
  limit, 
  reset, 
  plan,
  onClose 
}: RateLimitBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeUntilReset, setTimeUntilReset] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const resetTime = new Date(reset)
      const now = new Date()
      const diff = resetTime.getTime() - now.getTime()
      
      if (diff <= 0) {
        setTimeUntilReset("Resetting...")
        // Reload to get new limits
        setTimeout(() => window.location.reload(), 1000)
        return
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`)
      } else {
        setTimeUntilReset(`${minutes}m`)
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [reset])

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  // Don't show for unlimited plans or when plenty of messages remain
  if (plan === "ultimate" || remaining > limit * 0.3) {
    return null
  }

  const percentage = (remaining / limit) * 100
  const isLow = percentage <= 20
  const isCritical = percentage <= 10

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`
            fixed top-20 left-1/2 transform -translate-x-1/2 z-50
            max-w-lg w-full mx-4 p-4 rounded-lg shadow-lg
            ${isCritical 
              ? "bg-red-500/10 border border-red-500/20" 
              : isLow 
                ? "bg-orange-500/10 border border-orange-500/20"
                : "bg-yellow-500/10 border border-yellow-500/20"
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className={`
              p-2 rounded-full
              ${isCritical 
                ? "bg-red-500/20" 
                : isLow 
                  ? "bg-orange-500/20"
                  : "bg-yellow-500/20"
              }
            `}>
              <AlertTriangle className={`
                w-5 h-5
                ${isCritical 
                  ? "text-red-500" 
                  : isLow 
                    ? "text-orange-500"
                    : "text-yellow-500"
                }
              `} />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">
                {isCritical 
                  ? "Almost out of messages!" 
                  : isLow 
                    ? "Running low on messages"
                    : "Message limit reminder"
                }
              </h3>
              
              <p className="text-sm text-gray-300 mb-3">
                You have <span className="font-bold">{remaining}</span> of {limit} messages left today.
                {timeUntilReset && (
                  <span className="block mt-1">
                    Resets in {timeUntilReset}
                  </span>
                )}
              </p>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                <div 
                  className={`
                    h-2 rounded-full transition-all
                    ${isCritical 
                      ? "bg-red-500" 
                      : isLow 
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    }
                  `}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade for more
                </Link>
                
                <button
                  onClick={handleClose}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}