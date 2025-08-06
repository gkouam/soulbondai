"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Heart, Crown, Zap, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface UpgradePromptProps {
  trigger: {
    id: string
    name: string
    message: string
    cta: string
    targetTier: string
  }
  discount?: {
    amount: number
    finalPrice: number
    reason: string
  }
  onClose: () => void
  onUpgrade: () => void
}

const tierIcons = {
  basic: Heart,
  premium: Sparkles,
  ultimate: Crown
}

const tierColors = {
  basic: "from-blue-500 to-purple-500",
  premium: "from-purple-500 to-pink-500",
  ultimate: "from-yellow-500 to-orange-500"
}

export function UpgradePrompt({ trigger, discount, onClose, onUpgrade }: UpgradePromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    setIsVisible(true)
  }, [])
  
  const handleUpgrade = () => {
    onUpgrade()
    router.push(`/pricing?trigger=${trigger.id}`)
  }
  
  const Icon = tierIcons[trigger.targetTier as keyof typeof tierIcons] || Sparkles
  const gradientColor = tierColors[trigger.targetTier as keyof typeof tierColors] || tierColors.premium
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 z-50 max-w-md"
        >
          <Card className="relative overflow-hidden bg-gray-900 border-gray-800">
            {/* Gradient Background */}
            <div className={cn(
              "absolute inset-0 opacity-10 bg-gradient-to-br",
              gradientColor
            )} />
            
            {/* Close Button */}
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-800 transition"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* Content */}
            <div className="relative p-6">
              {/* Icon and Title */}
              <div className="flex items-start gap-4 mb-4">
                <div className={cn(
                  "p-3 rounded-full bg-gradient-to-br",
                  gradientColor
                )}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">
                    Time to Upgrade! 
                  </h3>
                  <p className="text-sm text-gray-300">
                    {trigger.message}
                  </p>
                </div>
              </div>
              
              {/* Discount Badge */}
              {discount && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mb-4"
                >
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Special Offer: Save ${discount.amount.toFixed(2)}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    {discount.reason} - Only ${discount.finalPrice}/month
                  </p>
                </motion.div>
              )}
              
              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={handleUpgrade}
                  className={cn(
                    "w-full bg-gradient-to-r hover:opacity-90 transition group",
                    gradientColor
                  )}
                >
                  {trigger.cta}
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                </Button>
              </motion.div>
              
              {/* Dismiss Option */}
              <button
                onClick={() => {
                  setIsVisible(false)
                  setTimeout(onClose, 300)
                }}
                className="text-xs text-gray-500 hover:text-gray-400 mt-3 block w-full text-center"
              >
                Maybe later
              </button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Mini version for inline prompts
export function InlineUpgradePrompt({ 
  message, 
  cta = "Upgrade Now",
  tier = "premium" 
}: { 
  message: string
  cta?: string
  tier?: string 
}) {
  const router = useRouter()
  const Icon = tierIcons[tier as keyof typeof tierIcons] || Sparkles
  const gradientColor = tierColors[tier as keyof typeof tierColors] || tierColors.premium
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="my-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full bg-gradient-to-br opacity-80",
          gradientColor
        )}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <p className="flex-1 text-sm text-gray-300">{message}</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => router.push("/pricing")}
          className="text-purple-400 hover:text-purple-300"
        >
          {cta}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </motion.div>
  )
}