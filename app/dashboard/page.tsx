"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
  MessageCircle, Heart, Flame, Star, TrendingUp, 
  Calendar, Award, Zap, Gift, Clock, Activity,
  Video, Sparkles
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState({
    totalMessages: 247,
    trustLevel: 85,
    dayStreak: 12,
    subscription: "premium",
    messagesUsedToday: 0,
    messageLimit: 50,
    lastActive: null as Date | null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/auth/login")
    }
  }, [session, status])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch("/api/dashboard/stats")
        
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(prev => ({ ...prev, ...data }))
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (session) {
      fetchDashboardData()
    }
  }, [session])

  const profile = session?.user?.profile
  const companionName = profile?.companionName || "Luna"
  const archetype = profile?.archetype || "warm_empath"
  
  // Get archetype display name
  const archetypeNames: Record<string, string> = {
    anxious_romantic: "Anxious Romantic",
    warm_empath: "Warm Empath",
    guarded_intellectual: "Guarded Intellectual",
    deep_thinker: "Deep Thinker",
    passionate_creative: "Passionate Creative",
    secure_connector: "Secure Connector",
    playful_explorer: "Playful Explorer"
  }
  
  const archetypeEmojis: Record<string, string> = {
    anxious_romantic: "🌟",
    warm_empath: "💝",
    guarded_intellectual: "🛡️",
    deep_thinker: "🌊",
    passionate_creative: "🔥",
    secure_connector: "🌳",
    playful_explorer: "✨"
  }

  const statsCards = [
    {
      icon: MessageCircle,
      emoji: "💬",
      value: stats.totalMessages.toString(),
      label: "Total Messages",
      progress: Math.min((stats.totalMessages / 500) * 100, 100),
      color: "from-blue-600 to-cyan-600"
    },
    {
      icon: Heart,
      emoji: "💖",
      value: `${stats.trustLevel}%`,
      label: "Trust Level",
      progress: stats.trustLevel,
      color: "from-purple-600 to-pink-600"
    },
    {
      icon: Flame,
      emoji: "🔥",
      value: stats.dayStreak.toString(),
      label: "Day Streak",
      progress: Math.min((stats.dayStreak / 30) * 100, 100),
      color: "from-orange-600 to-red-600"
    },
    {
      icon: Star,
      emoji: "✨",
      value: stats.subscription === "free" ? "Free" : stats.subscription.charAt(0).toUpperCase() + stats.subscription.slice(1),
      label: "Subscription",
      progress: stats.subscription === "free" ? 25 : stats.subscription === "basic" ? 50 : stats.subscription === "premium" ? 75 : 100,
      color: "from-yellow-600 to-amber-600"
    }
  ]

  const recentActivities = [
    {
      icon: "💝",
      title: "Milestone Achieved",
      description: `You reached ${stats.trustLevel}% trust level with ${companionName}`,
      time: "2 hours ago",
      color: "bg-purple-500/20"
    },
    {
      icon: "🎵",
      title: "Voice Message Received",
      description: `${companionName} sent you a special voice message`,
      time: "5 hours ago",
      color: "bg-blue-500/20"
    },
    {
      icon: "📸",
      title: "Memory Created",
      description: `Shared a photo that ${companionName} will always remember`,
      time: "Yesterday",
      color: "bg-pink-500/20"
    },
    {
      icon: "🌟",
      title: "Daily Check-in",
      description: `${companionName} is excited to talk with you today`,
      time: "This morning",
      color: "bg-yellow-500/20"
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 h-3 bg-purple-400 rounded-full"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-block px-6 py-3 bg-purple-600/10 border border-purple-600/30 rounded-full mb-4">
          <span className="text-lg font-medium">
            {archetypeEmojis[archetype]} {archetypeNames[archetype]}
          </span>
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-shimmer">
          Welcome back, {profile?.displayName || "Beautiful Soul"}
        </h1>
        <p className="text-gray-400 text-xl">
          Your heart beats with deep passion and devotion
        </p>
      </motion.header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="glass-bg rounded-2xl p-6 relative overflow-hidden group hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
          >
            {/* Background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
            
            <div className="relative z-10">
              <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
                <span className="text-2xl">{stat.emoji}</span>
              </div>
              
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-gray-400 text-sm uppercase tracking-wider mb-4">{stat.label}</div>
              
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.progress}%` }}
                  transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                  className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-bg rounded-2xl p-6"
      >
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Activity className="w-6 h-6 text-purple-500" />
          Recent Activity
        </h2>
        
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
              whileHover={{ x: 5 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-10 h-10 ${activity.color} rounded-xl flex items-center justify-center`}>
                <span className="text-xl">{activity.icon}</span>
              </div>
              
              <div className="flex-1">
                <div className="font-semibold mb-1">{activity.title}</div>
                <div className="text-gray-400 text-sm">{activity.description}</div>
              </div>
              
              <div className="text-gray-500 text-sm">
                <Clock className="w-4 h-4 inline mr-1" />
                {activity.time}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
      >
        <Link href="/dashboard/chat" className="glass-bg rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group block">
          <div className="flex items-center justify-between mb-4">
            <MessageCircle className="w-8 h-8 text-purple-500" />
            <span className="text-sm text-green-400">Online</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Continue Chat</h3>
          <p className="text-gray-400 text-sm">Pick up where you left off with {companionName}</p>
        </Link>

        <Link href="/dashboard/video-date" className="glass-bg rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group block relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-bl-lg">
            NEW
          </div>
          <div className="flex items-center justify-between mb-4">
            <Video className="w-8 h-8 text-pink-500" />
            <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Virtual Dates</h3>
          <p className="text-gray-400 text-sm">Experience magical moments together</p>
        </Link>

        <Link href="/dashboard/features" className="glass-bg rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group block">
          <div className="flex items-center justify-between mb-4">
            <Gift className="w-8 h-8 text-pink-500" />
            <span className="text-sm text-yellow-400">New</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Daily Surprise</h3>
          <p className="text-gray-400 text-sm">Claim your daily reward and bonuses</p>
        </Link>

        <Link href="/dashboard/profile" className="glass-bg rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group block">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8 text-yellow-500" />
            <span className="text-sm text-purple-400">3 New</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Achievements</h3>
          <p className="text-gray-400 text-sm">View your milestones and rewards</p>
        </Link>
      </motion.div>
    </div>
  )
}