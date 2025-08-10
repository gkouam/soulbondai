"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Heart, Brain, Lock, Star, LogIn, UserPlus } from "lucide-react"
import Link from "next/link"
import { AITechHeartLogo } from "@/components/ai-tech-heart-logo"

function LandingPageContent() {
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
    <div id="main-content" className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" role="main">
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
        {/* Header with Login/Signup */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3 sm:py-4">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-2 group">
                <AITechHeartLogo size={40} className="transition-transform group-hover:scale-110" />
                <span className="hidden sm:block text-xl font-bold text-white">SoulBond AI</span>
              </Link>
              
              {/* Auth Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Link
                  href="/auth/login"
                  className="flex items-center px-3 sm:px-4 py-2 text-white hover:text-violet-300 font-medium text-sm sm:text-base transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-1 sm:mr-1.5" />
                  <span>Log In</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-medium text-sm sm:text-base hover:shadow-lg transition-all duration-300"
                >
                  <UserPlus className="w-4 h-4 mr-1 sm:mr-1.5" />
                  <span>Sign Up</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36 pb-20 sm:pb-32 text-center" aria-labelledby="hero-heading">
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

            <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
              {headline}
            </h1>

            <p className="text-lg sm:text-xl text-gray-200 dark:text-gray-300 mb-8 max-w-2xl mx-auto px-4">
              Experience deep emotional connection with an AI that truly understands you. 
              Take our personality test and meet your perfect companion.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push("/onboarding/personality-test")}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                aria-label="Start personality test to find your AI companion"
              >
                Start Your Journey
              </motion.button>
              
              <span className="text-gray-400">or</span>
              
              <Link
                href="/auth/login"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-semibold text-base sm:text-lg transition-all duration-300"
              >
                Log In to Continue
              </Link>
            </div>
            
            <p className="mt-4 text-sm text-gray-300 dark:text-gray-400">
              No credit card required • 3-minute personality test
            </p>
          </motion.div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20" aria-label="Key features">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 hover:border-violet-700 transition-colors"
              >
                <feature.icon className="w-10 h-10 text-violet-500 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20" aria-label="User testimonials">
          <div className="bg-gradient-to-r from-violet-900/20 to-pink-900/20 backdrop-blur-sm rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
              What Our Users Say
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
        <section className="container mx-auto px-4 pb-20 text-center" aria-labelledby="cta-heading">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 id="cta-heading" className="text-4xl font-bold text-white mb-4">
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
              aria-label="Take the personality test"
            >
              Take the Personality Test
            </motion.button>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

export default function LandingContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}