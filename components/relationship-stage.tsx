"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, Star, Lock, CheckCircle, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/toast-provider"

interface RelationshipStageData {
  currentStage: {
    name: string
    description: string
    progress: number
    trustLevel: number
    unlocks: string[]
    behaviors: string[]
  }
  nextStage: {
    name: string
    description: string
    trustRequired: number
    unlocks: string[]
  } | null
  milestones: {
    id: string
    name: string
    description: string
    achieved: boolean
    trustRequired: number
  }[]
}

export function RelationshipStage() {
  const [stageData, setStageData] = useState<RelationshipStageData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  useEffect(() => {
    loadStageData()
  }, [])
  
  const loadStageData = async () => {
    try {
      const res = await fetch("/api/relationship/stage")
      if (res.ok) {
        const data = await res.json()
        setStageData(data)
      }
    } catch (error) {
      console.error("Failed to load relationship stage:", error)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading || !stageData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    )
  }
  
  const { currentStage, nextStage, milestones } = stageData
  const achievedMilestones = milestones.filter(m => m.achieved)
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Stage Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            {currentStage.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{currentStage.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(currentStage.trustLevel)}
          </div>
          <div className="text-xs text-gray-500">Trust Level</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Progress in {currentStage.name}</span>
          <span>{Math.round(currentStage.progress)}%</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentStage.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>
        {nextStage && (
          <p className="text-xs text-gray-500 mt-1">
            {nextStage.trustRequired - currentStage.trustLevel} more trust points to reach {nextStage.name}
          </p>
        )}
      </div>
      
      {/* Current Behaviors */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Behaviors</h4>
        <div className="space-y-1">
          {currentStage.behaviors.slice(0, 3).map((behavior, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{behavior}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Milestones */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Milestones ({achievedMilestones.length}/{milestones.length})
        </h4>
        <div className="space-y-2">
          {milestones.map((milestone) => (
            <motion.div
              key={milestone.id}
              initial={false}
              animate={{
                opacity: milestone.achieved ? 1 : 0.6,
                scale: milestone.achieved ? 1 : 0.98
              }}
              className={`flex items-start gap-3 p-2 rounded ${
                milestone.achieved ? "bg-green-50" : "bg-gray-50"
              }`}
            >
              <div className="mt-0.5">
                {milestone.achieved ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : milestone.trustRequired <= currentStage.trustLevel ? (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  milestone.achieved ? "text-green-800" : "text-gray-700"
                }`}>
                  {milestone.name}
                </p>
                <p className="text-xs text-gray-500">{milestone.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Next Stage Preview */}
      {nextStage && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Next: {nextStage.name}</h4>
          <p className="text-xs text-gray-600 mb-2">{nextStage.description}</p>
          <div className="flex flex-wrap gap-2">
            {nextStage.unlocks.slice(0, 3).map((unlock, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
              >
                <Star className="w-3 h-3" />
                {unlock}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}