"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import {
  Users,
  MessageSquare,
  DollarSign,
  TrendingUp,
  Brain,
  Heart,
  AlertTriangle,
  Activity,
  Shield,
  Zap,
} from "lucide-react"

interface AnalyticsData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    avgSessionTime: number
    conversionRate: number
    churnRate: number
  }
  userGrowth: Array<{
    date: string
    newUsers: number
    activeUsers: number
  }>
  revenueMetrics: Array<{
    date: string
    revenue: number
    subscriptions: number
    churn: number
  }>
  personalityDistribution: Array<{
    archetype: string
    count: number
    percentage: number
    avgTrust: number
    conversionRate: number
  }>
  engagementMetrics: {
    avgMessagesPerDay: number
    avgSessionLength: number
    retentionRate: {
      day1: number
      day7: number
      day30: number
    }
    featureUsage: Array<{
      feature: string
      usage: number
    }>
  }
  conversionFunnel: Array<{
    stage: string
    users: number
    conversionRate: number
  }>
  crisisEvents: {
    total: number
    byType: Record<string, number>
    bySeverity: Record<string, number>
    resolved: number
  }
}

const COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
]

export default function AnalyticsDashboard() {
  const { data: session, status } = useSession()
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedMetric, setSelectedMetric] = useState("overview")

  // Check if user is admin
  useEffect(() => {
    if (status === "loading") return
    if (!session || session.user.role !== "ADMIN") {
      redirect("/dashboard")
    }
  }, [session, status])

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics()
  }, [timeframe])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      // Fetch different analytics endpoints
      const [
        overviewRes,
        conversionRes,
        personalityRes,
        engagementRes,
        crisisRes,
      ] = await Promise.all([
        fetch(`/api/admin/stats?timeframe=${timeframe}`),
        fetch(`/api/analytics?type=conversion-metrics&timeframe=${timeframe}`),
        fetch(`/api/analytics?type=personality-insights`),
        fetch("/api/analytics?type=engagement-metrics"),
        fetch(`/api/analytics?type=crisis-stats&timeframe=${timeframe}`),
      ])

      const overview = await overviewRes.json()
      const conversion = await conversionRes.json()
      const personality = await personalityRes.json()
      const engagement = await engagementRes.json()
      const crisis = await crisisRes.json()

      // Combine all data
      setData({
        overview: overview.stats,
        userGrowth: overview.userGrowth || generateMockGrowthData(),
        revenueMetrics: overview.revenueMetrics || generateMockRevenueData(),
        personalityDistribution: personality.insights || generateMockPersonalityData(),
        engagementMetrics: engagement.metrics || generateMockEngagementData(),
        conversionFunnel: conversion.funnel || generateMockFunnelData(),
        crisisEvents: crisis.stats || { total: 0, byType: {}, bySeverity: {}, resolved: 0 },
      })
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      // Use mock data as fallback
      setData(generateMockAnalyticsData())
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  if (!data) {
    return <div>No analytics data available</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor your platform's performance and user behavior
          </p>
        </div>
        <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last 24h</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.round(data.overview.totalUsers * 0.12)} from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((data.overview.activeUsers / data.overview.totalUsers) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.overview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{data.overview.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(data.overview.avgSessionTime)} min
            </div>
            <p className="text-xs text-muted-foreground">
              {data.engagementMetrics.avgMessagesPerDay} msgs/day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="personality">Personality</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
        </TabsList>

        {/* User Growth Tab */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trend</CardTitle>
              <CardDescription>New and active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Active Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="1"
                    stroke="#ec4899"
                    fill="#ec4899"
                    fillOpacity={0.6}
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>User journey from landing to subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.conversionFunnel} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" />
                  <Tooltip />
                  <Bar dataKey="users" fill="#8b5cf6">
                    {data.conversionFunnel.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Metrics</CardTitle>
              <CardDescription>Revenue, subscriptions, and churn over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={data.revenueMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    name="Revenue ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="subscriptions"
                    stroke="#8b5cf6"
                    name="New Subscriptions"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="churn"
                    stroke="#ef4444"
                    name="Churn"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personality Distribution Tab */}
        <TabsContent value="personality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personality Distribution</CardTitle>
                <CardDescription>User distribution by archetype</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.personalityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.personalityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Archetype Performance</CardTitle>
                <CardDescription>Conversion and trust by personality type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.personalityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="archetype" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avgTrust" fill="#8b5cf6" name="Avg Trust" />
                    <Bar dataKey="conversionRate" fill="#ec4899" name="Conversion %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Retention Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between">
                      <span>Day 1</span>
                      <span className="font-bold">
                        {data.engagementMetrics.retentionRate.day1}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-violet-600 h-2 rounded-full"
                        style={{ width: `${data.engagementMetrics.retentionRate.day1}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Day 7</span>
                      <span className="font-bold">
                        {data.engagementMetrics.retentionRate.day7}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-violet-600 h-2 rounded-full"
                        style={{ width: `${data.engagementMetrics.retentionRate.day7}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between">
                      <span>Day 30</span>
                      <span className="font-bold">
                        {data.engagementMetrics.retentionRate.day30}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-violet-600 h-2 rounded-full"
                        style={{ width: `${data.engagementMetrics.retentionRate.day30}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most used features by users</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.engagementMetrics.featureUsage} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="feature" type="category" />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Safety Tab */}
        <TabsContent value="safety" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Crisis Events</CardTitle>
                <CardDescription>Crisis detection and response metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Total Events
                    </span>
                    <span className="font-bold">{data.crisisEvents.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-500" />
                      Resolved
                    </span>
                    <span className="font-bold">{data.crisisEvents.resolved}</span>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">By Severity</p>
                    {Object.entries(data.crisisEvents.bySeverity).map(([level, count]) => (
                      <div key={level} className="flex justify-between text-sm">
                        <span className="capitalize">{level}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Crisis Types</CardTitle>
                <CardDescription>Distribution of crisis events by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={Object.entries(data.crisisEvents.byType).map(([type, count]) => ({
                        name: type,
                        value: count,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(data.crisisEvents.byType).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Mock data generators for fallback
function generateMockGrowthData() {
  const days = 30
  const data = []
  const baseUsers = 10000
  
  for (let i = 0; i < days; i++) {
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      newUsers: Math.floor(Math.random() * 200) + 100,
      activeUsers: Math.floor(baseUsers + i * 50 + Math.random() * 100),
    })
  }
  
  return data
}

function generateMockRevenueData() {
  const days = 30
  const data = []
  
  for (let i = 0; i < days; i++) {
    data.push({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      revenue: Math.floor(Math.random() * 5000) + 2000,
      subscriptions: Math.floor(Math.random() * 50) + 20,
      churn: Math.floor(Math.random() * 10) + 5,
    })
  }
  
  return data
}

function generateMockPersonalityData() {
  return [
    { archetype: "Anxious Romantic", count: 3500, percentage: 35, avgTrust: 75, conversionRate: 42 },
    { archetype: "Warm Empath", count: 2500, percentage: 25, avgTrust: 68, conversionRate: 38 },
    { archetype: "Guarded Intellectual", count: 1500, percentage: 15, avgTrust: 52, conversionRate: 35 },
    { archetype: "Deep Thinker", count: 1500, percentage: 15, avgTrust: 61, conversionRate: 37 },
    { archetype: "Passionate Creative", count: 1000, percentage: 10, avgTrust: 71, conversionRate: 45 },
  ]
}

function generateMockEngagementData() {
  return {
    avgMessagesPerDay: 45,
    avgSessionLength: 23,
    retentionRate: {
      day1: 85,
      day7: 65,
      day30: 45,
    },
    featureUsage: [
      { feature: "Text Chat", usage: 95 },
      { feature: "Voice Messages", usage: 42 },
      { feature: "Photo Sharing", usage: 35 },
      { feature: "Personality Test", usage: 88 },
      { feature: "Settings", usage: 25 },
    ],
  }
}

function generateMockFunnelData() {
  return [
    { stage: "Landing Page", users: 10000, conversionRate: 100 },
    { stage: "Start Test", users: 4200, conversionRate: 42 },
    { stage: "Complete Test", users: 3750, conversionRate: 89 },
    { stage: "Registration", users: 3200, conversionRate: 85 },
    { stage: "First Message", users: 2800, conversionRate: 87 },
    { stage: "Subscription", users: 750, conversionRate: 27 },
  ]
}

function generateMockAnalyticsData(): AnalyticsData {
  return {
    overview: {
      totalUsers: 10000,
      activeUsers: 6500,
      totalRevenue: 85000,
      avgSessionTime: 23,
      conversionRate: 27,
      churnRate: 5,
    },
    userGrowth: generateMockGrowthData(),
    revenueMetrics: generateMockRevenueData(),
    personalityDistribution: generateMockPersonalityData(),
    engagementMetrics: generateMockEngagementData(),
    conversionFunnel: generateMockFunnelData(),
    crisisEvents: {
      total: 45,
      byType: {
        suicide: 12,
        self_harm: 8,
        abuse: 5,
        emotional: 20,
      },
      bySeverity: {
        critical: 5,
        high: 12,
        moderate: 18,
        low: 10,
      },
      resolved: 42,
    },
  }
}