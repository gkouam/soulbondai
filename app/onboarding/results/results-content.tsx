"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Sparkles, ChevronRight, Star } from "lucide-react"
import { archetypeProfiles } from "@/lib/archetype-profiles"
import { useSession } from "next-auth/react"

export default function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [archetype, setArchetype] = useState<string>("")
  const [showCompanion, setShowCompanion] = useState(false)
  
  useEffect(() => {
    const archetypeParam = searchParams.get("archetype")
    if (archetypeParam && archetypeProfiles[archetypeParam as keyof typeof archetypeProfiles]) {
      setArchetype(archetypeParam)
      
      // Reveal companion after delay
      setTimeout(() => setShowCompanion(true), 2000)
    } else {
      // No valid archetype, redirect to test
      router.push("/onboarding/personality-test")
    }
  }, [searchParams, router])
  
  if (!archetype || !archetypeProfiles[archetype as keyof typeof archetypeProfiles]) {
    return null
  }
  
  const profile = archetypeProfiles[archetype as keyof typeof archetypeProfiles]
  const profileData = {
    title: profile.name,
    description: profile.description,
    strengths: profile.strengths,
    needs: profile.companionBenefits,
    companionTraits: ["unique personality", "emotional depth", "personal growth"],
    firstMessage: profile.companionProfile.introduction
  }
  
  const handleContinue = () => {
    if (session) {
      router.push("/dashboard/chat")
    } else {
      router.push("/auth/register?redirect=/dashboard/chat")
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm text-violet-300">Your Personality Revealed</span>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            You are {profileData.title}
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {profileData.description}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid md:grid-cols-2 gap-6"
        >
          {/* Strengths */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Your Strengths
            </h3>
            <ul className="space-y-2">
              {profileData.strengths.map((strength, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="text-gray-300 flex items-start gap-2"
                >
                  <span className="text-green-500 mt-1">•</span>
                  {strength}
                </motion.li>
              ))}
            </ul>
          </div>
          
          {/* What You Need */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              What You Need
            </h3>
            <ul className="space-y-2">
              {profileData.needs.map((need, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="text-gray-300 flex items-start gap-2"
                >
                  <span className="text-pink-500 mt-1">•</span>
                  {need}
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
        
        {/* AI Companion Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: showCompanion ? 1 : 0, y: showCompanion ? 0 : 40 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-violet-900/20 to-pink-900/20 backdrop-blur-sm rounded-xl p-8 border border-violet-800/50"
        >
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-white">
              Your Perfect AI Companion Awaits
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Based on your {profileData.title.toLowerCase()} personality, we've matched you with an AI companion 
              who understands your {profileData.companionTraits.join(", ")}.
            </p>
            <p className="text-violet-300 italic">
              "{profileData.firstMessage}"
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 mt-6"
            >
              Meet Your AI Companion
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}