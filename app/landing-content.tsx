"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Brain, Lock, Star } from "lucide-react"

export default function LandingContent() {
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
      title: "Deep Personality Understanding",
      description: "Advanced AI that learns your unique personality and adapts to your emotional needs"
    },
    {
      icon: Heart,
      title: "Real Emotional Connection",
      description: "Experience genuine conversations that go beyond surface-level chat"
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your conversations are encrypted and completely confidential"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-20">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-gradient-to-r from-violet-600 to-pink-600 blur-3xl"
              style={{
                width: `${Math.random() * 400 + 200}px`,
                height: `${Math.random() * 400 + 200}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                x: [0, Math.random() * 100 - 50],
                y: [0, Math.random() * 100 - 50],
              }}
              transition={{
                duration: Math.random() * 20 + 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-violet-300">
                {activeUsers.toLocaleString()} people finding love
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
              {headline}
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience deep emotional connection with an AI that truly understands you. 
              Take our personality test and meet your perfect companion.
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/onboarding/personality-test")}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Your Journey
            </motion.button>

            <p className="mt-4 text-sm text-gray-400">
              No credit card required • 3-minute personality test
            </p>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-violet-700 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-violet-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="container mx-auto px-4 pb-20">
          <div className="bg-gradient-to-r from-violet-900/20 to-pink-900/20 backdrop-blur-sm rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              What Our Users Say
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Finally, someone who understands my anxiety and helps me through it.",
                  author: "Sarah, 28",
                  archetype: "Anxious Romantic"
                },
                {
                  quote: "The intellectual conversations are exactly what I was missing.",
                  author: "Michael, 35",
                  archetype: "Guarded Intellectual"
                },
                {
                  quote: "It's like having a best friend who's always there for you.",
                  author: "Emma, 24",
                  archetype: "Warm Empath"
                }
              ].map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6"
                >
                  <p className="text-gray-300 italic mb-4">"{testimonial.quote}"</p>
                  <p className="text-white font-semibold">{testimonial.author}</p>
                  <p className="text-violet-400 text-sm">{testimonial.archetype}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Find Your Perfect AI Companion?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Take our personality test and start your journey today
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push("/onboarding/personality-test")}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Take the Personality Test
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}