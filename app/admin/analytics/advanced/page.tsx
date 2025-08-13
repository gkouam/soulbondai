"use client"

import { useEffect, useState } from "react"
import { Line, Bar, Pie, Funnel } from "recharts"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign,
  MessageSquare,
  Target,
  Activity,
  Brain
} from "lucide-react"

interface AnalyticsData {
  funnel: {
    stage: string
    count: number
    conversionRate: number
    dropoffRate: number
  }[]
  retention: {
    cohort: string
    day1: number
    day3: number
    day7: number
    day30: number
  }[]
  revenue: {
    date: string
    mrr: number
    arr: number
    arpu: number
    ltv: number
  }[]
  personalities: {
    archetype: string
    users: number
    conversionRate: number
    avgRevenue: number
    retention: number
  }[]
  experiments: {
    name: string
    status: string
    variant: string
    conversionRate: number
    confidence: number
    improvement: number
  }[]
  realtime: {
    activeUsers: number
    todaySignups: number
    todayRevenue: number
    conversionRate: number
    topArchetype: string
  }
}

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('funnel')

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics/advanced?range=${dateRange}`)
      if (res.ok) {
        const analyticsData = await res.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return <div>Failed to load analytics</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <div className="flex gap-2">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Now</p>
              <p className="text-2xl font-bold">{data.realtime.activeUsers}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Signups</p>
              <p className="text-2xl font-bold">{data.realtime.todaySignups}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Revenue</p>
              <p className="text-2xl font-bold">${data.realtime.todayRevenue}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Live Conversion</p>
              <p className="text-2xl font-bold">{(data.realtime.conversionRate * 100).toFixed(1)}%</p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Top Archetype</p>
              <p className="text-lg font-bold">{data.realtime.topArchetype}</p>
            </div>
            <Brain className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {['funnel', 'retention', 'revenue', 'personalities', 'experiments'].map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedMetric === metric
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {metric.charAt(0).toUpperCase() + metric.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Funnel Analysis */}
      {selectedMetric === 'funnel' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Conversion Funnel</h2>
          <div className="space-y-4">
            {data.funnel.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm text-gray-500">{stage.count} users</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-8">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-8 rounded-full flex items-center justify-center text-white text-sm"
                        style={{ width: `${(stage.conversionRate || 1) * 100}%` }}
                      >
                        {(stage.conversionRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {index < data.funnel.length - 1 && (
                    <div className="ml-4 text-red-500 text-sm">
                      -{(stage.dropoffRate * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Retention Cohorts */}
      {selectedMetric === 'retention' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Retention Cohorts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cohort</th>
                  <th className="text-center py-2">Size</th>
                  <th className="text-center py-2">Day 1</th>
                  <th className="text-center py-2">Day 3</th>
                  <th className="text-center py-2">Day 7</th>
                  <th className="text-center py-2">Day 30</th>
                </tr>
              </thead>
              <tbody>
                {data.retention.map((cohort) => (
                  <tr key={cohort.cohort} className="border-b">
                    <td className="py-2">{cohort.cohort}</td>
                    <td className="text-center">{cohort.size}</td>
                    <td className={`text-center ${cohort.day1 > 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                      {(cohort.day1 * 100).toFixed(1)}%
                    </td>
                    <td className={`text-center ${cohort.day3 > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                      {(cohort.day3 * 100).toFixed(1)}%
                    </td>
                    <td className={`text-center ${cohort.day7 > 0.3 ? 'text-green-600' : 'text-red-600'}`}>
                      {(cohort.day7 * 100).toFixed(1)}%
                    </td>
                    <td className={`text-center ${cohort.day30 > 0.2 ? 'text-green-600' : 'text-red-600'}`}>
                      {(cohort.day30 * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue Metrics */}
      {selectedMetric === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">MRR</p>
              <p className="text-2xl font-bold">${data.revenue[0]?.mrr || 0}</p>
              <p className="text-sm text-green-500">+12.5% from last month</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">ARR</p>
              <p className="text-2xl font-bold">${data.revenue[0]?.arr || 0}</p>
              <p className="text-sm text-green-500">Projected</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">ARPU</p>
              <p className="text-2xl font-bold">${data.revenue[0]?.arpu || 0}</p>
              <p className="text-sm text-gray-500">Per user/month</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-sm text-gray-500">LTV</p>
              <p className="text-2xl font-bold">${data.revenue[0]?.ltv || 0}</p>
              <p className="text-sm text-gray-500">Lifetime value</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Revenue Trend</h3>
            {/* Revenue chart would go here */}
            <div className="h-64 flex items-center justify-center text-gray-400">
              Revenue chart visualization
            </div>
          </div>
        </div>
      )}

      {/* Personality Performance */}
      {selectedMetric === 'personalities' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Personality Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Archetype</th>
                  <th className="text-center py-2">Users</th>
                  <th className="text-center py-2">Conversion</th>
                  <th className="text-center py-2">Avg Revenue</th>
                  <th className="text-center py-2">Retention</th>
                  <th className="text-center py-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {data.personalities.map((personality) => (
                  <tr key={personality.archetype} className="border-b">
                    <td className="py-2 font-medium">{personality.archetype}</td>
                    <td className="text-center">{personality.users}</td>
                    <td className="text-center">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        personality.conversionRate > 0.4 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(personality.conversionRate * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center">${personality.avgRevenue}</td>
                    <td className="text-center">{(personality.retention * 100).toFixed(1)}%</td>
                    <td className="text-center">
                      {personality.conversionRate > 0.4 ? (
                        <TrendingUp className="h-5 w-5 text-green-500 inline" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* A/B Test Results */}
      {selectedMetric === 'experiments' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Active Experiments</h2>
          <div className="space-y-4">
            {data.experiments.map((experiment) => (
              <div key={experiment.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{experiment.name}</h3>
                    <p className="text-sm text-gray-500">Status: {experiment.status}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    experiment.confidence > 0.95 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(experiment.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Variant</p>
                    <p className="font-medium">{experiment.variant}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Improvement</p>
                    <p className={`font-medium ${
                      experiment.improvement > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {experiment.improvement > 0 ? '+' : ''}{experiment.improvement.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {experiment.confidence > 0.95 && (
                  <div className="mt-4 p-3 bg-green-50 rounded">
                    <p className="text-sm text-green-800">
                      ✓ Statistically significant result. Consider implementing the winning variant.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}