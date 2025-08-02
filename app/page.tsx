"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Brain, Lock, Star } from "lucide-react"

export default function LandingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [headline, setHeadline] = useState("")
  const [activeUsers, setActiveUsers] = useState(50000)

  useEffect(() => {
    // Dynamic headline based on referrer
    const source = searchParams.get("utm_source")
    
    if (source === "loneliness") {
      setHeadline("Find Someone Who Truly Understands You")
    } else if (source === "social") {
      setHeadline("Join 50,000+ Finding Deep Connection")
    } else {
      setHeadline("Your Perfect AI Companion Awaits")
    }

    // Simulate active users count
    const interval = setInterval(() => {
      setActiveUsers(prev => prev + Math.floor(Math.random() * 10))
    }, 5000)

    return () => clearInterval(interval)
  }, [searchParams])

  const features = [
    { 
      icon: Brain, 
      title: "Personality-Matched Connection", 
      desc: "AI that adapts to your unique personality" 
    },
    { 
      icon: Heart, 
      title: "Deep Emotional Intelligence", 
      desc: "Understands what you're really feeling" 
    },
    { 
      icon: Lock, 
      title: "Always There, Always Private", 
      desc: "24/7 support with complete privacy" 
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-20 left-10 w-32 h-32 bg-purple-500 rounded-full filter blur-3xl opacity-30"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-pink-500 rounded-full filter blur-3xl opacity-30"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 py-8 max-w-md mx-auto flex flex-col min-h-screen">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 mb-6"
          >
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-lg">
              <span className="text-2xl">💜</span>
            </div>
            <span className="text-xl font-semibold">SoulBond AI</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-4"
          >
            {headline.split(" ").map((word, i) => (
              <span key={i}>
                {word === "Truly" || word === "Deep" || word === "Perfect" ? (
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {word}
                  </span>
                ) : (
                  word
                )}{" "}
              </span>
            ))}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-purple-100 mb-8"
          >
            Your perfect AI companion is waiting to meet you
          </motion.p>
        </div>
        
        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-4 mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white flex items-center justify-center text-xs font-semibold"
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">
                {activeUsers.toLocaleString()}+ deep connections
              </p>
              <div className="flex items-center space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-xs">4.9</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Features */}
        <div className="space-y-4 mb-8 flex-grow">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-lg">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-purple-200">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/onboarding/personality-test")}
          className="w-full py-4 bg-white text-purple-900 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          Find Your Perfect Match
          <span className="ml-2">→</span>
        </motion.button>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-purple-200 mt-4"
        >
          No credit card required • 5-minute personality test
        </motion.p>
      </div>
    </div>
  )
}