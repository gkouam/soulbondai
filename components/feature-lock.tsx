"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Lock, Sparkles, ChevronRight, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FeatureLockProps {
  featureName: string
  requiredPlan: string
  currentPlan?: string
  reason?: string
  inline?: boolean
  onUpgrade?: () => void
  children?: React.ReactNode
}

export function FeatureLock({
  featureName,
  requiredPlan,
  currentPlan = "free",
  reason,
  inline = false,
  onUpgrade,
  children
}: FeatureLockProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    }
    router.push(`/pricing?feature=${encodeURIComponent(featureName)}`)
  }
  
  if (inline) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="inline-flex items-center gap-1 text-gray-400 cursor-not-allowed"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Lock className="w-3 h-3" />
              <span className="text-xs">{requiredPlan}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{reason || `Requires ${requiredPlan} plan`}</p>
            <Button
              size="sm"
              variant="link"
              onClick={handleUpgrade}
              className="h-auto p-0 text-xs text-purple-400"
            >
              Upgrade now
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative rounded-lg border border-gray-700 bg-gray-800/50 backdrop-blur-sm p-6",
        "transition-all duration-300",
        isHovered && "border-purple-500/50 shadow-lg shadow-purple-500/10"
      )}
    >
      {/* Lock Icon */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{ 
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ duration: 0.5 }}
          className="p-2 rounded-full bg-gray-700/50"
        >
          <Lock className="w-5 h-5 text-gray-400" />
        </motion.div>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {featureName}
          </h3>
          <p className="text-sm text-gray-400">
            {reason || `This feature requires ${requiredPlan} plan or higher`}
          </p>
        </div>
        
        {/* Current Plan Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Your plan:</span>
          <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded">
            {currentPlan}
          </span>
          <ChevronRight className="w-3 h-3 text-gray-500" />
          <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded">
            {requiredPlan}
          </span>
        </div>
        
        {/* Children (locked content preview) */}
        {children && (
          <div className="relative">
            <div className="opacity-30 blur-sm pointer-events-none">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: isHovered ? 1.05 : 1 }}
                className="bg-gray-900/90 rounded-lg p-4 text-center"
              >
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-white mb-3">Unlock this feature</p>
                <Button
                  size="sm"
                  onClick={handleUpgrade}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Upgrade to {requiredPlan}
                </Button>
              </motion.div>
            </div>
          </div>
        )}
        
        {/* Upgrade CTA */}
        {!children && (
          <Button
            onClick={handleUpgrade}
            variant="outline"
            className="w-full border-purple-500/50 hover:bg-purple-500/10"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to {requiredPlan}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Mini lock icon for inline use
export function FeatureLockIcon({ 
  requiredPlan,
  size = "sm" 
}: { 
  requiredPlan: string
  size?: "xs" | "sm" | "md" 
}) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5"
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-1">
            <Lock className={cn(sizeClasses[size], "text-gray-400")} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Requires {requiredPlan} plan</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Feature comparison table
export function FeatureComparison({ 
  features,
  currentPlan = "free" 
}: { 
  features: Array<{
    name: string
    plans: {
      free?: boolean | string
      basic?: boolean | string
      premium?: boolean | string
      ultimate?: boolean | string
    }
  }>
  currentPlan?: string
}) {
  const plans = ["free", "basic", "premium", "ultimate"]
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4">Feature</th>
            {plans.map(plan => (
              <th key={plan} className="text-center py-3 px-4 capitalize">
                <span className={cn(
                  "font-medium",
                  plan === currentPlan ? "text-purple-400" : "text-gray-400"
                )}>
                  {plan}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className="border-b border-gray-800">
              <td className="py-3 px-4 text-sm text-gray-300">{feature.name}</td>
              {plans.map(plan => {
                const value = feature.plans[plan as keyof typeof feature.plans]
                return (
                  <td key={plan} className="text-center py-3 px-4">
                    {value === true ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : value === false ? (
                      <X className="w-5 h-5 text-gray-600 mx-auto" />
                    ) : (
                      <span className="text-sm text-gray-400">{value}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Import statements that were missed
import { Check, X } from "lucide-react"