'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Shield, AlertTriangle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

interface ActivitySummary {
  totalActions: number
  summary: Record<string, number>
  firstActivity?: string
  lastActivity?: string
  recentLogs: Array<{
    id: string
    action: string
    createdAt: string
    metadata?: any
  }>
}

interface SecurityEvent {
  id: string
  action: string
  createdAt: string
  metadata?: any
  errorMessage?: string
}

export function UserActivity() {
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      const response = await fetch('/api/user/activity')
      if (!response.ok) throw new Error('Failed to fetch activity')
      
      const data = await response.json()
      setActivity(data.activity)
      setSecurityEvents(data.securityEvents)
    } catch (error) {
      console.error('Fetch activity error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      USER_LOGIN: 'Logged in',
      USER_LOGOUT: 'Logged out',
      USER_REGISTER: 'Account created',
      PASSWORD_RESET: 'Password reset',
      PASSWORD_CHANGE: 'Password changed',
      OAUTH_LOGIN: 'OAuth login',
      PROFILE_UPDATE: 'Profile updated',
      PHONE_VERIFY: 'Phone verified',
      DEVICE_TRUST: 'Device trusted',
      DEVICE_REMOVE: 'Device removed',
      DATA_EXPORT: 'Data exported',
      DATA_DELETE: 'Data deleted',
      CONSENT_UPDATE: 'Consent updated',
      SUBSCRIPTION_CREATE: 'Subscription created',
      SUBSCRIPTION_UPDATE: 'Subscription updated',
      SUBSCRIPTION_CANCEL: 'Subscription cancelled',
      CHARACTER_CREATE: 'Character created',
      CHARACTER_UPDATE: 'Character updated',
      CHARACTER_DELETE: 'Character deleted',
      PHOTO_UPLOAD: 'Photo uploaded',
      PHOTO_DELETE: 'Photo deleted',
      CONVERSATION_START: 'Conversation started',
      VOICE_GENERATE: 'Voice generated',
      FAILED_LOGIN: 'Failed login attempt',
      SUSPICIOUS_ACTIVITY: 'Suspicious activity',
      RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    }
    return labels[action] || action
  }

  const getActionIcon = (action: string) => {
    if (action.includes('FAILED') || action.includes('SUSPICIOUS')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />
    }
    if (action.includes('DEVICE') || action.includes('PASSWORD')) {
      return <Shield className="h-4 w-4 text-blue-500" />
    }
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  if (loading) {
    return (
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Activity Summary */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Account Activity
          </CardTitle>
          <CardDescription>
            Your account activity over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold">{activity.totalActions}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="text-sm">
                    {activity.lastActivity
                      ? formatDistanceToNow(new Date(activity.lastActivity), { addSuffix: true })
                      : 'No activity'}
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Recent Activity</h4>
                <div className="space-y-2">
                  {activity.recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm">{getActionLabel(log.action)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      {securityEvents.length > 0 && (
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500">
              <Shield className="h-5 w-5" />
              Security Events
            </CardTitle>
            <CardDescription>
              Recent security-related activities on your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    {getActionIcon(event.action)}
                    <div>
                      <span className="text-sm">{getActionLabel(event.action)}</span>
                      {event.errorMessage && (
                        <p className="text-xs text-red-400">{event.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}