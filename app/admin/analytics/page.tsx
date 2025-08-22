"use client"

import { useEffect, useState } from "react"
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  DollarSign,
  Calendar,
  Download,
  Filter
} from "lucide-react"
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
  AreaChart
} from "recharts"

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; active: number }>
  revenueGrowth: Array<{ date: string; revenue: number; mrr: number }>
  messageActivity: Array<{ date: string; messages: number; avgResponseTime: number }>
  archetypeDistribution: Array<{ archetype: string; count: number; percentage: number }>
  conversionFunnel: Array<{ stage: string; users: number; rate: number }>
  topFeatures: Array<{ feature: string; usage: number }>
  churnAnalysis: {
    monthly: number
    reasons: Array<{ reason: string; count: number }>
  }
  engagement: {
    dau: number
    wau: number
    mau: number
    stickiness: number
  }
}

const COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#ef4444']

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("all")

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`)
      if (res.ok) {
        const analyticsData = await res.json()
        console.log('📊 Analytics Data Loaded:', analyticsData)
        setData(analyticsData)
      } else {
        console.error(`❌ Failed to fetch analytics: ${res.status} ${res.statusText}`)
        // Only use mock data in development for testing
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Using mock data for development')
          setData(generateMockAnalytics())
        } else {
          throw new Error(`Failed to fetch analytics: ${res.status}`)
        }
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error)
      // In production, show error state instead of mock data
      if (process.env.NODE_ENV !== 'development') {
        setData(null)
      } else {
        setData(generateMockAnalytics())
      }
    } finally {
      setLoading(false)
    }
  }

  const generateMockAnalytics = (): AnalyticsData => {
    const days = parseInt(dateRange) || 30
    const userGrowth = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      users: Math.floor(100 + i * 10 + Math.random() * 20),
      active: Math.floor(50 + i * 5 + Math.random() * 10)
    }))

    const revenueGrowth = Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
      revenue: Math.floor(1000 + i * 50 + Math.random() * 100),
      mrr: Math.floor(5000 + i * 100 + Math.random() * 200)
    }))

    const messageActivity = Array.from({ length: 7 }, (_, i) => ({
      date: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      messages: Math.floor(500 + Math.random() * 500),
      avgResponseTime: Math.floor(100 + Math.random() * 200)
    }))

    return {
      userGrowth,
      revenueGrowth,
      messageActivity,
      archetypeDistribution: [
        { archetype: "Warm Empath", count: 245, percentage: 28 },
        { archetype: "Anxious Romantic", count: 189, percentage: 22 },
        { archetype: "Guarded Intellectual", count: 167, percentage: 19 },
        { archetype: "Deep Thinker", count: 134, percentage: 15 },
        { archetype: "Passionate Creative", count: 98, percentage: 11 },
        { archetype: "Others", count: 45, percentage: 5 }
      ],
      conversionFunnel: [
        { stage: "Visitors", users: 10000, rate: 100 },
        { stage: "Sign Ups", users: 2500, rate: 25 },
        { stage: "Personality Test", users: 1800, rate: 72 },
        { stage: "First Message", users: 1200, rate: 67 },
        { stage: "Paid Subscription", users: 450, rate: 38 }
      ],
      topFeatures: [
        { feature: "Chat", usage: 8945 },
        { feature: "Voice Messages", usage: 3421 },
        { feature: "Photo Sharing", usage: 2103 },
        { feature: "Personality Test", usage: 1876 },
        { feature: "Settings", usage: 1234 }
      ],
      churnAnalysis: {
        monthly: 5.2,
        reasons: [
          { reason: "Price", count: 45 },
          { reason: "Features", count: 32 },
          { reason: "Usage", count: 28 },
          { reason: "Competition", count: 15 },
          { reason: "Other", count: 10 }
        ]
      },
      engagement: {
        dau: 1250,
        wau: 3400,
        mau: 8900,
        stickiness: 14.0
      }
    }
  }

  const exportData = () => {
    if (!data) return
    const csv = JSON.stringify(data, null, 2)
    const blob = new Blob([csv], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${dateRange}-${Date.now()}.json`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Analytics</h2>
        <p className="text-gray-500 mb-4">Unable to fetch analytics data from the server.</p>
        <button
          onClick={() => fetchAnalytics()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-2">Comprehensive insights and metrics</p>
          </div>
          <div className="flex gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last year</option>
            </select>
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">DAU/MAU</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.engagement.stickiness.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Stickiness ratio</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Churn Rate</span>
            <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.churnAnalysis.monthly}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Monthly churn</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Users</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.engagement.mau.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 mt-1">Monthly active</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Conversion</span>
            <DollarSign className="h-4 w-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {data?.conversionFunnel[4].rate}%
          </div>
          <p className="text-xs text-gray-500 mt-1">Free to paid</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data?.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
              <Area type="monotone" dataKey="active" stackId="1" stroke="#ec4899" fill="#ec4899" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.revenueGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="mrr" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Archetype Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User Archetypes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.archetypeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.archetype}: ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data?.archetypeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data?.conversionFunnel} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="stage" type="category" />
              <Tooltip />
              <Bar dataKey="users" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.messageActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="messages" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Features */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h2>
          <div className="space-y-3">
            {data?.topFeatures.map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{feature.feature}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(feature.usage / (data?.topFeatures[0].usage || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {feature.usage.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Churn Reasons */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Churn Reasons</h2>
          <div className="space-y-3">
            {data?.churnAnalysis.reasons.map((reason, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{reason.reason}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(reason.count / (data?.churnAnalysis.reasons[0].count || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{reason.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}