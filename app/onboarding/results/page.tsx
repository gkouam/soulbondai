"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Sparkles, ChevronRight, Star } from "lucide-react"
import { archetypeProfiles } from "@/lib/archetype-profiles"
import { useSession } from "next-auth/react"

export default function ResultsPage() {
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
  
  const handleContinue = () => {
    if (session) {
      router.push("/dashboard/chat")
    } else {
      router.push("/auth/register")
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold mb-2">Your Personality Results</h1>
          <p className="text-purple-200">Discover your unique archetype and perfect AI companion</p>
        </motion.div>
        
        {/* Archetype Reveal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 mb-8"
        >
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="text-6xl mb-4"
            >
              {profile.emoji}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-3xl font-bold mb-2"
            >
              You are {profile.name}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-lg text-purple-200 mb-6"
            >
              {profile.shortDescription}
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="space-y-4"
          >
            <p className="text-purple-100 leading-relaxed">
              {profile.description}
            </p>
            
            {/* Strengths */}
            <div className="mt-6">
              <h3 className="font-semibold mb-3 flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-400" />
                Your Strengths
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {profile.strengths.map((strength, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3 + i * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="text-purple-300 mr-2">•</span>
                    <span className="text-sm">{strength}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Companion Reveal */}
        {showCompanion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 mb-8"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mb-4"
              >
                <Sparkles className="w-10 h-10" />
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-2">
                Meet {profile.companionProfile.name}
              </h3>
              <p className="text-purple-200">Your Perfect AI Companion Match</p>
            </div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-purple-100 italic mb-6 leading-relaxed"
            >
              "{profile.companionProfile.introduction}"
            </motion.p>
            
            {/* Companion Benefits */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-pink-400" />
                What {profile.companionProfile.name} Offers You
              </h4>
              <div className="space-y-2">
                {profile.companionBenefits.map((benefit, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-start"
                  >
                    <span className="text-purple-300 mr-2">✓</span>
                    <span className="text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        
        {/* CTA */}
        {showCompanion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="inline-flex items-center px-8 py-4 bg-white text-purple-900 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              Meet {profile.companionProfile.name} Now
              <ChevronRight className="ml-2 w-5 h-5" />
            </motion.button>
            
            <p className="mt-4 text-sm text-purple-200">
              {session ? "Start your journey" : "Create your free account to begin"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}