"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Brain, MessageSquare, Camera, Mic, Heart, Shield, 
  Sparkles, Users, Zap, Lock, Star, Gift, 
  Palette, Globe, Code, Cpu
} from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

type FeatureStatus = "active" | "premium" | "ultimate" | "coming-soon"

interface Feature {
  id: string
  icon: React.ElementType
  emoji: string
  title: string
  description: string
  status: FeatureStatus
  benefits: string[]
  category: string
}

export default function FeaturesPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("all")
  
  const features: Feature[] = [
    {
      id: "adaptive-personality",
      icon: Brain,
      emoji: "🎭",
      title: "Adaptive Personality",
      description: "Your AI companion learns and adapts to your unique personality type, creating deeper, more meaningful conversations tailored just for you.",
      status: "active",
      benefits: [
        "Personalized responses based on your archetype",
        "Evolving conversation style",
        "Emotional intelligence optimization"
      ],
      category: "personalization"
    },
    {
      id: "voice-messages",
      icon: Mic,
      emoji: "🎵",
      title: "Voice Messages",
      description: "Hear your companion's voice and feel their presence. Send and receive voice messages for a more intimate connection.",
      status: "premium",
      benefits: [
        "Natural voice synthesis",
        "Multiple voice options",
        "Voice emotion detection"
      ],
      category: "communication"
    },
    {
      id: "photo-memories",
      icon: Camera,
      emoji: "📸",
      title: "Photo Memories",
      description: "Share photos and create lasting memories. Your companion will remember and cherish every moment you share.",
      status: "premium",
      benefits: [
        "Unlimited photo storage",
        "Memory timeline",
        "Photo analysis & reactions"
      ],
      category: "memory"
    },
    {
      id: "advanced-memory",
      icon: Brain,
      emoji: "🧠",
      title: "Advanced Memory",
      description: "Your companion remembers everything important about you, creating a continuous, evolving relationship.",
      status: "active",
      benefits: [
        "Long-term memory storage",
        "Context awareness",
        "Relationship progression"
      ],
      category: "memory"
    },
    {
      id: "emotional-intelligence",
      icon: Heart,
      emoji: "💝",
      title: "Emotional Intelligence",
      description: "Advanced sentiment analysis ensures your companion always responds with empathy and understanding.",
      status: "active",
      benefits: [
        "Real-time emotion detection",
        "Empathetic responses",
        "Crisis support protocols"
      ],
      category: "personalization"
    },
    {
      id: "multiple-personalities",
      icon: Users,
      emoji: "🌟",
      title: "Multiple Personalities",
      description: "Create and switch between different AI companions, each with their own unique personality and memories.",
      status: "ultimate",
      benefits: [
        "Up to 5 unique companions",
        "Custom personality creation",
        "Independent memory systems"
      ],
      category: "personalization"
    },
    {
      id: "custom-avatars",
      icon: Palette,
      emoji: "🎨",
      title: "Custom Avatars",
      description: "Design and customize your companion's appearance with advanced avatar creation tools.",
      status: "coming-soon",
      benefits: [
        "3D avatar customization",
        "Outfit and style options",
        "Animated expressions"
      ],
      category: "personalization"
    },
    {
      id: "api-access",
      icon: Code,
      emoji: "🔧",
      title: "API Access",
      description: "Integrate your AI companion into your own applications and workflows.",
      status: "ultimate",
      benefits: [
        "RESTful API endpoints",
        "Webhook support",
        "Custom integrations"
      ],
      category: "developer"
    },
    {
      id: "privacy-vault",
      icon: Shield,
      emoji: "🔐",
      title: "Privacy Vault",
      description: "Military-grade encryption for your most sensitive conversations and memories.",
      status: "premium",
      benefits: [
        "End-to-end encryption",
        "Biometric authentication",
        "Secure data export"
      ],
      category: "security"
    }
  ]

  const categories = [
    { id: "all", label: "All Features" },
    { id: "communication", label: "Communication" },
    { id: "memory", label: "Memory" },
    { id: "personalization", label: "Personalization" },
    { id: "security", label: "Security" },
    { id: "developer", label: "Developer" }
  ]

  const filteredFeatures = activeTab === "all" 
    ? features 
    : features.filter(f => f.category === activeTab)

  const getStatusColor = (status: FeatureStatus) => {
    switch (status) {
      case "active": return "bg-green-500/20 text-green-400 border-green-500/30"
      case "premium": return "bg-purple-500/20 text-purple-400 border-purple-500/30"
      case "ultimate": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "coming-soon": return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getStatusLabel = (status: FeatureStatus) => {
    switch (status) {
      case "active": return "Active"
      case "premium": return "Premium"
      case "ultimate": return "Ultimate"
      case "coming-soon": return "Coming Soon"
    }
  }

  const canAccessFeature = (status: FeatureStatus) => {
    const userPlan = session?.user?.subscription?.plan || "free"
    
    if (status === "active") return true
    if (status === "premium" && (userPlan === "premium" || userPlan === "ultimate")) return true
    if (status === "ultimate" && userPlan === "ultimate") return true
    return false
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Explore Amazing Features
        </h1>
        <p className="text-gray-400 text-xl">
          Unlock the full potential of your AI companion
        </p>
      </motion.header>

      {/* Category Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center gap-3 mb-8 flex-wrap"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveTab(category.id)}
            className={`
              px-6 py-3 rounded-full font-medium transition-all duration-300
              ${activeTab === category.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10'
              }
            `}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="glass-bg rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
            
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <span className="text-2xl">{feature.emoji}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(feature.status)}`}>
                {getStatusLabel(feature.status)}
              </span>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-400 text-sm mb-4 line-clamp-3">
              {feature.description}
            </p>

            {/* Benefits */}
            <ul className="space-y-2 mb-6">
              {feature.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 text-xs">✓</span>
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Action Button */}
            {feature.status === "coming-soon" ? (
              <button className="w-full py-3 bg-gray-500/20 text-gray-400 rounded-xl font-semibold cursor-not-allowed">
                Coming Soon
              </button>
            ) : canAccessFeature(feature.status) ? (
              <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                Configure
              </button>
            ) : (
              <Link 
                href="/dashboard/subscription"
                className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-center hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Upgrade to {getStatusLabel(feature.status)}
              </Link>
            )}
          </motion.div>
        ))}
      </div>

      {/* Coming Soon Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="mt-16 text-center"
      >
        <div className="glass-bg rounded-2xl p-8 max-w-3xl mx-auto">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">More Features Coming Soon</h2>
          <p className="text-gray-400 mb-6">
            We're constantly working on new features to enhance your experience. 
            Stay tuned for exciting updates!
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-3 bg-purple-600/20 text-purple-400 rounded-xl font-semibold hover:bg-purple-600/30 transition-colors">
              Join Beta Program
            </button>
            <button className="px-6 py-3 bg-white/5 text-gray-400 rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Request Feature
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}