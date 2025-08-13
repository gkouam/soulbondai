"use client"

import { useEffect, useState } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  Award,
  Zap,
  AlertCircle
} from "lucide-react"

interface InvestorMetrics {
  kpis: {
    mrr: number
    mrrGrowth: number
    arr: number
    users: number
    paidUsers: number
    conversionRate: number
    churnRate: number
    ltv: number
    cac: number
    ltvCacRatio: number
  }
  growth: {
    month: string
    users: number
    revenue: number
    conversions: number
  }[]
  cohorts: {
    month: string
    size: number
    revenue: number
    retention: number[]
  }[]
  unitEconomics: {
    avgRevenuePerUser: number
    avgCostPerUser: number
    paybackPeriod: number
    grossMargin: number
  }
  personalityPerformance: {
    archetype: string
    users: number
    revenue: number
    ltv: number
    conversionRate: number
  }[]
  forecasts: {
    month: string
    projectedMRR: number
    projectedUsers: number
    confidence: number
  }[]
  keyHighlights: string[]
  risks: string[]
}

export default function InvestorDashboard() {
  const [metrics, setMetrics] = useState<InvestorMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('3m')

  useEffect(() => {
    fetchInvestorMetrics()
    const interval = setInterval(fetchInvestorMetrics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [timeframe])

  const fetchInvestorMetrics = async () => {
    try {
      const res = await fetch(`/api/admin/investor/metrics?timeframe=${timeframe}`)
      if (res.ok) {
        const data = await res.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error('Failed to fetch investor metrics:', error)
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

  if (!metrics) {
    return <div>Failed to load investor metrics</div>
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value.toFixed(0)}`
  }

  const formatPercentage = (value: number) => {
    const formatted = (value * 100).toFixed(1)
    return value >= 0 ? `+${formatted}%` : `${formatted}%`
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Investor Dashboard</h1>
          <p className="text-gray-600 mt-2">SoulBondAI Performance Metrics</p>
        </div>
        <div className="flex gap-4">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last 12 Months</option>
          </select>
          <button className="px-4 py-2 bg-primary text-white rounded-lg">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(metrics.kpis.mrr)}</p>
              <p className={`text-sm mt-2 ${metrics.kpis.mrrGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(metrics.kpis.mrrGrowth)} MoM
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold mt-2">{metrics.kpis.users.toLocaleString()}</p>
              <p className="text-sm text-gray-600 mt-2">
                {metrics.kpis.paidUsers} paid ({(metrics.kpis.conversionRate * 100).toFixed(1)}%)
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">LTV:CAC Ratio</p>
              <p className="text-3xl font-bold mt-2">{metrics.kpis.ltvCacRatio.toFixed(1)}x</p>
              <p className={`text-sm mt-2 ${metrics.kpis.ltvCacRatio > 3 ? 'text-green-600' : 'text-yellow-600'}`}>
                {metrics.kpis.ltvCacRatio > 3 ? 'Healthy' : 'Needs Improvement'}
              </p>
            </div>
            <Target className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Annual Run Rate</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(metrics.kpis.arr)}</p>
              <p className="text-sm text-gray-600 mt-2">
                Projected from MRR
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Unit Economics */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Unit Economics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">LTV</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.kpis.ltv)}</p>
            <p className="text-xs text-gray-600 mt-1">Per customer lifetime value</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CAC</p>
            <p className="text-2xl font-bold">{formatCurrency(metrics.kpis.cac)}</p>
            <p className="text-xs text-gray-600 mt-1">Customer acquisition cost</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payback Period</p>
            <p className="text-2xl font-bold">{metrics.unitEconomics.paybackPeriod} months</p>
            <p className="text-xs text-gray-600 mt-1">Time to recover CAC</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gross Margin</p>
            <p className="text-2xl font-bold">{(metrics.unitEconomics.grossMargin * 100).toFixed(0)}%</p>
            <p className="text-xs text-gray-600 mt-1">After direct costs</p>
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Growth Trajectory</h2>
        <div className="space-y-4">
          {metrics.growth.map((month, index) => (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-20 text-sm font-medium">{month.month}</div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Revenue: {formatCurrency(month.revenue)}</span>
                  <span className="text-sm">{month.users} users</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-6">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ width: `${(month.revenue / Math.max(...metrics.growth.map(g => g.revenue))) * 100}%` }}
                  >
                    {month.conversions} conversions
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Personality Performance */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Performance by Personality Type</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Archetype</th>
                <th className="text-center py-3">Users</th>
                <th className="text-center py-3">Revenue</th>
                <th className="text-center py-3">LTV</th>
                <th className="text-center py-3">Conversion</th>
                <th className="text-center py-3">Performance</th>
              </tr>
            </thead>
            <tbody>
              {metrics.personalityPerformance.map((personality) => (
                <tr key={personality.archetype} className="border-b">
                  <td className="py-3 font-medium">{personality.archetype}</td>
                  <td className="text-center">{personality.users.toLocaleString()}</td>
                  <td className="text-center">{formatCurrency(personality.revenue)}</td>
                  <td className="text-center">{formatCurrency(personality.ltv)}</td>
                  <td className="text-center">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      personality.conversionRate > 0.4 
                        ? 'bg-green-100 text-green-800' 
                        : personality.conversionRate > 0.25
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(personality.conversionRate * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center">
                    {personality.conversionRate > 0.4 ? (
                      <Award className="h-5 w-5 text-green-500 inline" />
                    ) : personality.conversionRate > 0.25 ? (
                      <Zap className="h-5 w-5 text-yellow-500 inline" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Cohort Retention Analysis</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Cohort</th>
                <th className="text-center py-3">Size</th>
                <th className="text-center py-3">Revenue</th>
                <th className="text-center py-3">M1</th>
                <th className="text-center py-3">M2</th>
                <th className="text-center py-3">M3</th>
                <th className="text-center py-3">M6</th>
              </tr>
            </thead>
            <tbody>
              {metrics.cohorts.map((cohort) => (
                <tr key={cohort.month} className="border-b">
                  <td className="py-3 font-medium">{cohort.month}</td>
                  <td className="text-center">{cohort.size}</td>
                  <td className="text-center">{formatCurrency(cohort.revenue)}</td>
                  {cohort.retention.map((ret, idx) => (
                    <td key={idx} className={`text-center ${
                      ret > 0.7 ? 'text-green-600' : 
                      ret > 0.5 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {(ret * 100).toFixed(0)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecasts */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold mb-6">Revenue Forecasts</h2>
        <div className="space-y-4">
          {metrics.forecasts.map((forecast) => (
            <div key={forecast.month} className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{forecast.month}</p>
                  <p className="text-sm text-gray-600">
                    {forecast.projectedUsers.toLocaleString()} projected users
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{formatCurrency(forecast.projectedMRR)}</p>
                  <p className="text-sm text-gray-600">
                    {(forecast.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Highlights & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-green-600">Key Highlights</h2>
          <ul className="space-y-2">
            {metrics.keyHighlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                <span className="text-sm">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold mb-4 text-red-600">Risk Factors</h2>
          <ul className="space-y-2">
            {metrics.risks.map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <span className="text-sm">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}