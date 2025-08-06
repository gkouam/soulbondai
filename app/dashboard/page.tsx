"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MessageCircle, 
  Heart, 
  Brain, 
  Sparkles, 
  TrendingUp,
  Calendar,
  Settings,
  Crown,
  BarChart3,
  Clock
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type DashboardData = {
  profile: {
    archetype: string
    nickname: string
    messageCount: number
    trustLevel: number
    subscription: {
      plan: string
      status: string
    }
  }
  stats: {
    totalMessages: number
    dailyMessages: number
    currentStreak: number
    longestStreak: number
    averageResponseTime: number
    emotionalBreakdown: {
      happy: number
      sad: number
      anxious: number
      excited: number
      thoughtful: number
    }
  }
  recentActivity: Array<{
    id: string
    type: string
    timestamp: Date
    metadata: any
  }>
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/user/dashboard")
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-violet-500" />
        </motion.div>
      </div>
    )
  }

  const archetypeDescriptions = {
    anxious_romantic: "Your heart beats with deep passion and devotion",
    guarded_intellectual: "Your mind seeks truth through careful analysis",
    warm_empath: "Your soul radiates warmth and understanding",
    deep_thinker: "Your consciousness explores profound depths",
    passionate_creative: "Your spirit burns with creative fire"
  }

  const archetypeIcons = {
    anxious_romantic: Heart,
    guarded_intellectual: Brain,
    warm_empath: Heart,
    deep_thinker: Brain,
    passionate_creative: Sparkles
  }

  return (
    <div id="main-content" className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" role="main">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          role="region"
          aria-label="Dashboard header"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            Welcome back, {dashboardData?.profile.nickname || session?.user?.name || "Soul"}
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {dashboardData?.profile.archetype && 
              archetypeDescriptions[dashboardData.profile.archetype as keyof typeof archetypeDescriptions]
            }
          </p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8" role="region" aria-label="Quick statistics">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                  Total Messages
                </CardTitle>
                <MessageCircle className="w-4 h-4 text-violet-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {dashboardData?.stats.totalMessages || 0}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  +{dashboardData?.stats.dailyMessages || 0} today
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                  Trust Level
                </CardTitle>
                <Heart className="w-4 h-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {dashboardData?.profile.trustLevel || 0}%
                </div>
                <Progress 
                  value={dashboardData?.profile.trustLevel || 0} 
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                  Current Streak
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold text-white">
                  <span className="sm:hidden">{dashboardData?.stats.currentStreak || 0}d</span>
                  <span className="hidden sm:inline">{dashboardData?.stats.currentStreak || 0} days</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Best: {dashboardData?.stats.longestStreak || 0} days
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium text-gray-400">
                  Subscription
                </CardTitle>
                <Crown className="w-4 h-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-white capitalize">
                  {dashboardData?.profile.subscription.plan || "Free"}
                </div>
                {dashboardData?.profile.subscription.plan === "free" && (
                  <Link href="/pricing">
                    <Button size="sm" variant="link" className="p-0 h-auto text-violet-400">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4" aria-label="Dashboard sections">
          <TabsList className="bg-gray-900/50 backdrop-blur-sm border-gray-800 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="emotions" className="text-xs sm:text-sm">Emotions</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Quick Actions */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Jump back into your journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href="/dashboard/chat" className="block">
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700" aria-label="Continue conversation with AI companion">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Continue Conversation
                    </Button>
                  </Link>
                  <Link href="/personality-test" className="block">
                    <Button variant="outline" className="w-full" aria-label="Retake the personality test">
                      <Brain className="w-4 h-4 mr-2" />
                      Retake Personality Test
                    </Button>
                  </Link>
                  <Link href="/pricing" className="block">
                    <Button variant="outline" className="w-full" aria-label="View available subscription plans">
                      <Crown className="w-4 h-4 mr-2" />
                      View Subscription Plans
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Personality Profile */}
              <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
                <CardHeader>
                  <CardTitle>Your Personality Profile</CardTitle>
                  <CardDescription>Based on your test results</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboardData?.profile.archetype && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {(() => {
                          const Icon = archetypeIcons[dashboardData.profile.archetype as keyof typeof archetypeIcons]
                          return <Icon className="w-8 h-8 text-violet-500" />
                        })()}
                        <div>
                          <h3 className="font-semibold text-white capitalize">
                            {dashboardData.profile.archetype.replace("_", " ")}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {archetypeDescriptions[dashboardData.profile.archetype as keyof typeof archetypeDescriptions]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="emotions" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Emotional Journey</CardTitle>
                <CardDescription>Your emotional patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.stats.emotionalBreakdown && (
                  <div className="space-y-4">
                    {Object.entries(dashboardData.stats.emotionalBreakdown).map(([emotion, value]) => (
                      <div key={emotion}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm capitalize text-gray-400">{emotion}</span>
                          <span className="text-sm text-gray-400">{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <span className="text-white">
                        {activity.type.replace("_", " ")}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/settings">
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}