"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  MessageSquare, 
  DollarSign, 
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

interface DashboardStats {
  users: {
    total: number
    active: number
    new: number
    premium: number
  }
  messages: {
    total: number
    today: number
    avgPerUser: number
  }
  revenue: {
    mrr: number
    arr: number
    today: number
    growth: number
  }
  system: {
    health: string
    uptime: number
    apiCalls: number
    errors: number
  }
}

export default function AdminDashboard() {
  console.log('[ADMIN] AdminDashboard component rendering')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    console.log('[ADMIN] useEffect running - fetching data')
    fetchDashboardStats()
    fetchRecentActivity()
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchRecentActivity()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    console.log('[ADMIN] Fetching dashboard stats')
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        console.log('[ADMIN] Stats data received:', data)
        setStats(data)
      }
    } catch (error) {
      console.error("[ADMIN] Failed to fetch stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentActivity = async () => {
    console.log('[ADMIN] Fetching recent activity')
    try {
      const res = await fetch("/api/admin/activity")
      if (res.ok) {
        const data = await res.json()
        console.log('[ADMIN] Activity data received:', data)
        console.log('[ADMIN] Activities array:', data.activities)
        setRecentActivity(data.activities || [])
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-2">System overview and real-time statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-8 w-8 text-blue-500" />
            <span className="text-sm text-gray-500">Users</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.users.total.toLocaleString() || 0}
          </div>
          <div className="text-sm text-green-600 mt-2">
            +{stats?.users.new || 0} today
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.users.active || 0} active • {stats?.users.premium || 0} premium
          </div>
        </div>

        {/* Messages Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <MessageSquare className="h-8 w-8 text-purple-500" />
            <span className="text-sm text-gray-500">Messages</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.messages.total.toLocaleString() || 0}
          </div>
          <div className="text-sm text-green-600 mt-2">
            +{stats?.messages.today || 0} today
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.messages.avgPerUser || 0} avg/user
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-green-500" />
            <span className="text-sm text-gray-500">MRR</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${stats?.revenue.mrr.toLocaleString() || 0}
          </div>
          <div className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="h-4 w-4 mr-1" />
            {stats?.revenue.growth || 0}% growth
          </div>
          <div className="text-xs text-gray-500 mt-1">
            ${stats?.revenue.today || 0} today
          </div>
        </div>

        {/* System Health Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-orange-500" />
            <span className="text-sm text-gray-500">System</span>
          </div>
          <div className="flex items-center">
            {stats?.system.health === "healthy" ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <span className="text-lg font-semibold capitalize">
              {stats?.system.health || "Unknown"}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            {stats?.system.uptime || 0}% uptime
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats?.system.apiCalls || 0} API calls • {stats?.system.errors || 0} errors
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => {
              console.log('[ADMIN] Mapping activity item:', index, activity);
              return (
              <div key={index} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-3 ${
                      activity.type === 'user_signup' ? 'bg-green-500' :
                      activity.type === 'subscription' ? 'bg-blue-500' :
                      activity.type === 'error' ? 'bg-red-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                          {(() => {
                          console.log('[ADMIN] Rendering activity.user:', activity.user, 'Type:', typeof activity.user);
                          if (!activity.user) return 'System';
                          if (typeof activity.user === 'object') {
                            return activity.user.email || activity.user.name || 'Unknown User';
                          }
                          return activity.user;
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(activity.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )})
          ) : (
            <div className="px-6 py-8 text-center text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}