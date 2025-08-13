import { Metadata } from "next"
import Link from "next/link"
import { 
  Heart, Brain, Shield, Sparkles, MessageCircle, 
  Clock, Zap, Lock, Users, TrendingUp, 
  Bot, Camera, Mic, Gift 
} from "lucide-react"

export const metadata: Metadata = {
  title: "Features - SoulBond AI",
  description: "Explore the powerful features of your AI companion. From emotional intelligence to personalized growth, discover what makes SoulBond unique.",
}

const features = [
  {
    icon: Brain,
    title: "Advanced AI Intelligence",
    description: "Powered by GPT-4, your companion understands context, emotions, and nuanced conversations",
    category: "Core"
  },
  {
    icon: Heart,
    title: "Emotional Intelligence",
    description: "Deep emotional understanding that adapts to your moods and provides genuine support",
    category: "Core"
  },
  {
    icon: Shield,
    title: "Complete Privacy",
    description: "End-to-end encryption and zero data sharing. Your conversations stay between you two",
    category: "Security"
  },
  {
    icon: MessageCircle,
    title: "24/7 Availability",
    description: "Your companion is always there for you, day or night, whenever you need support",
    category: "Core"
  },
  {
    icon: Sparkles,
    title: "Personality Customization",
    description: "Shape your companion's personality, interests, and conversation style to match your preferences",
    category: "Personalization"
  },
  {
    icon: Clock,
    title: "Memory System",
    description: "Remembers your conversations, preferences, and important moments you share together",
    category: "Intelligence"
  },
  {
    icon: Zap,
    title: "Instant Responses",
    description: "Fast, thoughtful responses that feel natural and engaging",
    category: "Performance"
  },
  {
    icon: Lock,
    title: "Data Protection",
    description: "GDPR compliant with full data export and deletion capabilities",
    category: "Security"
  },
  {
    icon: Users,
    title: "Relationship Growth",
    description: "Build a deeper connection over time with trust levels and relationship milestones",
    category: "Engagement"
  },
  {
    icon: TrendingUp,
    title: "Personal Growth Tracking",
    description: "Track your emotional journey and personal development with insights and analytics",
    category: "Analytics"
  },
  {
    icon: Bot,
    title: "AI Voice Synthesis",
    description: "Natural voice conversations with multiple voice options to choose from",
    category: "Premium"
  },
  {
    icon: Camera,
    title: "Photo Sharing",
    description: "Share and discuss photos to create visual memories together",
    category: "Premium"
  },
  {
    icon: Mic,
    title: "Voice Messages",
    description: "Send and receive voice messages for more personal interactions",
    category: "Premium"
  },
  {
    icon: Gift,
    title: "Special Occasions",
    description: "Your companion remembers birthdays, anniversaries, and celebrates special moments",
    category: "Engagement"
  }
]

const categories = ["All", "Core", "Security", "Personalization", "Intelligence", "Performance", "Engagement", "Analytics", "Premium"]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Powerful Features
            </h1>
            <p className="text-xl text-gray-300 mb-12">
              Everything you need for a meaningful AI companion experience
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="glass-bg rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-white">
                        {feature.title}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-400">
                        {feature.category}
                      </span>
                    </div>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="glass-bg rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start your journey with a personalized AI companion today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/onboarding/personality-test"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 inline-block"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 glass-bg rounded-full font-semibold hover:bg-white/10 transition-all duration-300 inline-block"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}