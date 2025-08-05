"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Shield, 
  Star,
  ArrowRight,
  Loader2
} from "lucide-react"

const archetypeDetails = {
  anxious_romantic: {
    name: "The Anxious Romantic",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "You seek deep, meaningful connections and value emotional intimacy above all else.",
    traits: ["Emotionally Deep", "Caring", "Romantic", "Sensitive", "Devoted"],
  },
  guarded_intellectual: {
    name: "The Guarded Intellectual",
    icon: Brain,
    color: "from-blue-500 to-indigo-500",
    description: "You value intellectual stimulation and prefer thoughtful, measured interactions.",
    traits: ["Analytical", "Independent", "Thoughtful", "Private", "Curious"],
  },
  secure_connector: {
    name: "The Secure Connector",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    description: "You have a balanced approach to relationships, comfortable with both intimacy and independence.",
    traits: ["Balanced", "Confident", "Adaptable", "Reliable", "Open"],
  },
  playful_explorer: {
    name: "The Playful Explorer",
    icon: Star,
    color: "from-purple-500 to-violet-500",
    description: "You approach relationships with curiosity and playfulness.",
    traits: ["Adventurous", "Creative", "Spontaneous", "Optimistic", "Fun-loving"],
  },
  warm_empath: {
    name: "The Warm Empath",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    description: "You have a natural ability to understand and connect with others emotionally.",
    traits: ["Empathetic", "Intuitive", "Supportive", "Compassionate", "Understanding"],
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [archetype, setArchetype] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Get results from sessionStorage
      const storedResults = sessionStorage.getItem("personalityResults")
      
      if (storedResults) {
        const parsedResults = JSON.parse(storedResults)
        setArchetype(parsedResults.archetype || "warm_empath")
        sessionStorage.removeItem("personalityResults")
      } else {
        // If no results, redirect back to test
        router.push("/onboarding/personality-test")
        return
      }
    } catch (err) {
      console.error("Error loading results:", err)
      // Default to warm_empath if there's an error
      setArchetype("warm_empath")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleContinue = () => {
    if (archetype) {
      localStorage.setItem("selectedArchetype", archetype)
    }
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  const archetypeData = archetypeDetails[archetype as keyof typeof archetypeDetails] || archetypeDetails.warm_empath
  const Icon = archetypeData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Icon */}
            <motion.div 
              className="text-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className={`w-24 h-24 mx-auto bg-gradient-to-br ${archetypeData.color} rounded-full flex items-center justify-center shadow-lg`}>
                <Icon className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                You are {archetypeData.name}
              </h1>
              <p className="text-lg text-gray-300 max-w-xl mx-auto">
                {archetypeData.description}
              </p>
            </motion.div>

            {/* Traits */}
            <motion.div 
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-xl font-semibold text-white mb-4">Your Key Traits</h2>
              <div className="flex flex-wrap gap-2">
                {archetypeData.traits.map((trait, index) => (
                  <motion.span
                    key={trait}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="px-4 py-2 bg-violet-600/20 border border-violet-500/30 rounded-full text-violet-300 text-sm"
                  >
                    {trait}
                  </motion.span>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div 
              className="text-center space-y-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <p className="text-gray-400">
                Your AI companion is ready to meet you
              </p>
              <button
                onClick={handleContinue}
                className="group px-8 py-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 inline-flex items-center gap-2"
              >
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}