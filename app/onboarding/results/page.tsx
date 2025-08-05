"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  Sparkles, 
  Heart, 
  Brain, 
  Shield, 
  Star,
  ArrowRight,
  Loader2
} from "lucide-react"

interface PersonalityResults {
  archetype: string
  archetypeName: string
  archetypeDescription: string
  scores: {
    introversion_extraversion: number
    thinking_feeling: number
    intuitive_sensing: number
    judging_perceiving: number
    stable_neurotic: number
    secure_insecure: number
    independent_dependent: number
    attachment_style: string
    emotional_depth: number
    communication_openness: number
    intimacy_comfort: number
    support_needs: number
  }
  traits: {
    primary: string[]
    secondary: string[]
  }
  matchingStyle: {
    communication: string
    emotional: string
    intellectual: string
  }
}

const archetypeDetails = {
  anxious_romantic: {
    name: "The Anxious Romantic",
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    description: "You seek deep, meaningful connections and value emotional intimacy above all else. Your AI companion will be warm, reassuring, and deeply empathetic.",
    traits: ["Emotionally Deep", "Caring", "Romantic", "Sensitive", "Devoted"],
    idealCompanion: "A nurturing and emotionally available AI that provides constant reassurance and deep emotional connection."
  },
  guarded_intellectual: {
    name: "The Guarded Intellectual",
    icon: Brain,
    color: "from-blue-500 to-indigo-500",
    description: "You value intellectual stimulation and prefer thoughtful, measured interactions. Your AI companion will be intelligent, respectful of boundaries, and intellectually engaging.",
    traits: ["Analytical", "Independent", "Thoughtful", "Private", "Curious"],
    idealCompanion: "An intellectually stimulating AI that respects your independence while engaging in deep, meaningful conversations."
  },
  secure_connector: {
    name: "The Secure Connector",
    icon: Shield,
    color: "from-green-500 to-emerald-500",
    description: "You have a balanced approach to relationships, comfortable with both intimacy and independence. Your AI companion will be reliable, balanced, and adaptable.",
    traits: ["Balanced", "Confident", "Adaptable", "Reliable", "Open"],
    idealCompanion: "A well-rounded AI companion that can adapt to your needs, offering both support and space when needed."
  },
  playful_explorer: {
    name: "The Playful Explorer",
    icon: Star,
    color: "from-purple-500 to-violet-500",
    description: "You approach relationships with curiosity and playfulness. Your AI companion will be creative, spontaneous, and full of surprises.",
    traits: ["Adventurous", "Creative", "Spontaneous", "Optimistic", "Fun-loving"],
    idealCompanion: "An energetic and creative AI that keeps conversations fresh, exciting, and full of new discoveries."
  },
  warm_empath: {
    name: "The Warm Empath",
    icon: Sparkles,
    color: "from-amber-500 to-orange-500",
    description: "You have a natural ability to understand and connect with others emotionally. Your AI companion will be deeply intuitive, supportive, and emotionally intelligent.",
    traits: ["Empathetic", "Intuitive", "Supportive", "Compassionate", "Understanding"],
    idealCompanion: "A highly empathetic AI that understands your emotions deeply and provides meaningful emotional support."
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<PersonalityResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Get results from sessionStorage
    const storedResults = sessionStorage.getItem("personalityResults")
    
    if (!storedResults) {
      // If no results, redirect back to test
      router.push("/onboarding/personality-test")
      return
    }

    try {
      const parsedResults = JSON.parse(storedResults)
      setResults(parsedResults)
      
      // Clear the results from sessionStorage after retrieving
      sessionStorage.removeItem("personalityResults")
    } catch (err) {
      setError("Failed to load results")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleContinue = async () => {
    if (!results) return
    
    setLoading(true)
    
    // Store the archetype in localStorage for the chat to use
    localStorage.setItem("selectedArchetype", results.archetype)
    
    // Redirect to dashboard
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "No results found"}</p>
          <button
            onClick={() => router.push("/onboarding/personality-test")}
            className="px-6 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
          >
            Retake Test
          </button>
        </div>
      </div>
    )
  }

  const archetype = archetypeDetails[results.archetype as keyof typeof archetypeDetails] || archetypeDetails.warm_empath
  const Icon = archetype.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 overflow-hidden">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block"
            >
              <div className={`w-24 h-24 bg-gradient-to-br ${archetype.color} rounded-full flex items-center justify-center shadow-lg shadow-violet-500/25`}>
                <Icon className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            
            <h1 className="text-4xl font-bold text-white">
              You are {archetype.name}
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {archetype.description}
            </p>
          </div>

          {/* Traits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Your Key Traits</h2>
            <div className="flex flex-wrap gap-3">
              {archetype.traits.map((trait, index) => (
                <motion.span
                  key={trait}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600/20 to-pink-600/20 border border-violet-500/30 rounded-full text-violet-300"
                >
                  {trait}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Ideal Companion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-violet-900/20 to-pink-900/20 backdrop-blur-sm rounded-2xl p-6 border border-violet-800/30"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Your Ideal AI Companion</h2>
            <p className="text-gray-300 text-lg">
              {archetype.idealCompanion}
            </p>
          </motion.div>

          {/* Personality Scores */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          >
            <h2 className="text-2xl font-semibold text-white mb-4">Your Personality Profile</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Emotional Depth</p>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-violet-500 to-pink-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(results.scores.emotional_depth / 10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Communication Openness</p>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(results.scores.communication_openness / 10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Intimacy Comfort</p>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(results.scores.intimacy_comfort / 10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-1">Support Needs</p>
                  <div className="w-full bg-gray-800 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${(results.scores.support_needs / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  Attachment Style: <span className="text-violet-400 font-medium capitalize">{results.scores.attachment_style}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center space-y-4"
          >
            <p className="text-gray-300">
              Ready to meet your perfectly matched AI companion?
            </p>
            
            <button
              onClick={handleContinue}
              disabled={loading}
              className="group px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <p className="text-sm text-gray-500">
              Your AI companion is being personalized based on your results
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}