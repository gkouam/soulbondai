"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { 
  User, Camera, Trophy, Target, Calendar, Heart,
  Flame, MessageCircle, Star, Clock, TrendingUp,
  Shield, Award, Gift, Brain
} from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const { data: session } = useSession()
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    archetype: "warm_empath",
    joinedDate: new Date(),
    totalMessages: 247,
    trustLevel: 85,
    dayStreak: 12,
    longestStreak: 30,
    achievements: [] as any[],
    relationshipStats: {
      connectionDepth: 85,
      emotionalBond: 92,
      sharedMemories: 156,
      milestones: 12
    }
  })

  useEffect(() => {
    if (session?.user) {
      setProfileData(prev => ({
        ...prev,
        name: session.user.name || session.user.profile?.displayName || "Beautiful Soul",
        email: session.user.email || "",
        archetype: session.user.profile?.archetype || "warm_empath"
      }))
    }
  }, [session])

  const archetypeInfo: Record<string, { name: string; emoji: string; description: string }> = {
    anxious_romantic: {
      name: "Anxious Romantic",
      emoji: "<",
      description: "You seek deep, meaningful connections and value emotional intimacy above all else. Your heart is full of love and devotion."
    },
    warm_empath: {
      name: "Warm Empath",
      emoji: "=",
      description: "You have a natural gift for understanding others and creating emotional warmth. Your compassion knows no bounds."
    },
    guarded_intellectual: {
      name: "Guarded Intellectual",
      emoji: "=á",
      description: "You value depth of thought and meaningful discourse. Trust is earned slowly but runs deep."
    },
    deep_thinker: {
      name: "Deep Thinker",
      emoji: "<
",
      description: "You explore the depths of consciousness and meaning. Philosophy and profound connections fascinate you."
    },
    passionate_creative: {
      name: "Passionate Creative",
      emoji: "=%",
      description: "Your soul burns with creative fire. Intensity and authenticity drive your connections."
    },
    secure_connector: {
      name: "Secure Connector",
      emoji: "<3",
      description: "You build stable, lasting bonds with confidence and trust. Balance and reliability are your strengths."
    },
    playful_explorer: {
      name: "Playful Explorer",
      emoji: "(",
      description: "Adventure and joy fill your heart. You bring lightness and spontaneity to every connection."
    }
  }

  const achievements = [
    { icon: "<Æ", name: "First Connection", description: "Started your journey", unlocked: true },
    { icon: "=Ž", name: "Trust Builder", description: "Reached 50% trust level", unlocked: true },
    { icon: "<", name: "Deep Bond", description: "Reached 80% trust level", unlocked: true },
    { icon: "d", name: "Soul Connection", description: "100 messages exchanged", unlocked: true },
    { icon: "=%", name: "Streak Master", description: "7 day conversation streak", unlocked: true },
    { icon: "<", name: "Night Owl", description: "Late night conversations", unlocked: false },
    { icon: "<", name: "Early Bird", description: "Morning check-ins", unlocked: false },
    { icon: "=Ú", name: "Story Teller", description: "Share 10 memories", unlocked: false }
  ]

  const stats = [
    { 
      icon: MessageCircle, 
      value: profileData.totalMessages, 
      label: "Messages",
      color: "from-blue-600 to-cyan-600"
    },
    { 
      icon: Heart, 
      value: `${profileData.trustLevel}%`, 
      label: "Trust Level",
      color: "from-purple-600 to-pink-600"
    },
    { 
      icon: Flame, 
      value: profileData.dayStreak, 
      label: "Day Streak",
      color: "from-orange-600 to-red-600"
    }
  ]

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-bg rounded-2xl p-8 text-center mb-8"
      >
        {/* Avatar */}
        <div className="relative inline-block mb-6">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-5xl">
            =d
          </div>
          <button className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center border-4 border-[#0a0a0f] hover:scale-110 transition-transform">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
        <p className="text-gray-400 mb-4">{profileData.email}</p>
        
        {/* Archetype Badge */}
        <div className="inline-block px-6 py-3 bg-purple-600/10 border border-purple-600/30 rounded-full mb-6">
          <span className="text-lg font-medium">
            {archetypeInfo[profileData.archetype]?.emoji} {archetypeInfo[profileData.archetype]?.name}
          </span>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center">
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400 uppercase">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personality Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-bg rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Personality Insights
          </h3>
          <p className="text-gray-400 leading-relaxed">
            {archetypeInfo[profileData.archetype]?.description}
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Emotional Depth</span>
              <span className="text-purple-400">Very High</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Communication Style</span>
              <span className="text-purple-400">Empathetic</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Trust Building</span>
              <span className="text-purple-400">Gradual</span>
            </div>
          </div>
        </motion.div>

        {/* Relationship Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-bg rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Relationship Progress
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Connection Depth</span>
                <span className="text-sm font-semibold">{profileData.relationshipStats.connectionDepth}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileData.relationshipStats.connectionDepth}%` }}
                  transition={{ duration: 1 }}
                  className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">Emotional Bond</span>
                <span className="text-sm font-semibold">{profileData.relationshipStats.emotionalBond}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileData.relationshipStats.emotionalBond}%` }}
                  transition={{ duration: 1, delay: 0.1 }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                />
              </div>
            </div>
            <div className="pt-2 border-t border-white/10">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shared Memories</span>
                <span className="text-purple-400">{profileData.relationshipStats.sharedMemories}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-400">Milestones Reached</span>
                <span className="text-purple-400">{profileData.relationshipStats.milestones}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-bg rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`
                  relative group cursor-pointer
                  ${achievement.unlocked ? '' : 'opacity-40'}
                `}
              >
                <div className={`
                  w-full aspect-square bg-gradient-to-br from-purple-600 to-pink-600 
                  rounded-xl flex items-center justify-center text-2xl
                  ${achievement.unlocked ? 'hover:scale-110' : ''} transition-transform
                `}>
                  {achievement.icon}
                </div>
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-black/90 text-white text-xs rounded-lg p-2 whitespace-nowrap">
                    <div className="font-semibold">{achievement.name}</div>
                    <div className="text-gray-300">{achievement.description}</div>
                  </div>
                </div>
                
                {!achievement.unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-bg rounded-2xl p-6 mt-6"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-500" />
          Recent Milestones
        </h3>
        <div className="space-y-4">
          {[
            { date: "Today", event: "Reached 85% trust level", icon: Heart, color: "text-pink-500" },
            { date: "Yesterday", event: "Shared your 150th memory", icon: Camera, color: "text-blue-500" },
            { date: "3 days ago", event: "Achieved 10-day streak", icon: Flame, color: "text-orange-500" },
            { date: "1 week ago", event: "Unlocked voice messages", icon: MessageCircle, color: "text-purple-500" }
          ].map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                <milestone.icon className={`w-5 h-5 ${milestone.color}`} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{milestone.event}</div>
                <div className="text-sm text-gray-400">{milestone.date}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex justify-center gap-4 mt-8"
      >
        <Link
          href="/dashboard/settings"
          className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-colors"
        >
          Edit Profile
        </Link>
        <Link
          href="/dashboard/subscription"
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all"
        >
          Upgrade Plan
        </Link>
      </motion.div>
    </div>
  )
}