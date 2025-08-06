'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Smartphone, Monitor, Tablet, Shield, ShieldOff, Trash2, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Device {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  trusted: boolean
  lastActiveAt: string
  lastIp?: string
  createdAt: string
}

interface DeviceStats {
  total: number
  trusted: number
  untrusted: number
  byType: {
    desktop: number
    mobile: number
    tablet: number
  }
  recentlyActive: number
}

interface SuspiciousActivity {
  suspicious: boolean
  reasons: string[]
}

export function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([])
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity | null>(null)
  const [loading, setLoading] = useState(true)
  const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices')
      if (!response.ok) throw new Error('Failed to fetch devices')
      
      const data = await response.json()
      setDevices(data.devices)
      setStats(data.stats)
      setSuspiciousActivity(data.suspiciousActivity)
    } catch (error) {
      toast.error('Failed to load devices')
      console.error('Fetch devices error:', error)
    } finally {
      setLoading(false)
    }
  }

  const trustDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trust' })
      })

      if (!response.ok) throw new Error('Failed to trust device')
      
      toast.success('Device trusted successfully')
      await fetchDevices()
    } catch (error) {
      toast.error('Failed to trust device')
      console.error('Trust device error:', error)
    }
  }

  const removeDevice = async (deviceId: string) => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove device')
      
      toast.success('Device removed successfully')
      setDeviceToRemove(null)
      await fetchDevices()
    } catch (error) {
      toast.error('Failed to remove device')
      console.error('Remove device error:', error)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />
      case 'tablet':
        return <Tablet className="h-5 w-5" />
      default:
        return <Monitor className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Suspicious Activity Alert */}
      {suspiciousActivity?.suspicious && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Activity Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-600 dark:text-yellow-300">
              {suspiciousActivity.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Device Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Devices</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Trusted</CardDescription>
              <CardTitle className="text-2xl text-green-600">{stats.trusted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Untrusted</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">{stats.untrusted}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recently Active</CardDescription>
              <CardTitle className="text-2xl">{stats.recentlyActive}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Devices</CardTitle>
          <CardDescription>
            Manage devices that have access to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No devices found
              </p>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getDeviceIcon(device.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{device.name}</h4>
                        {device.trusted ? (
                          <Badge variant="success" className="gap-1">
                            <Shield className="h-3 w-3" />
                            Trusted
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <ShieldOff className="h-3 w-3" />
                            Untrusted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {device.browser} on {device.os}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {formatDistanceToNow(new Date(device.lastActiveAt), { addSuffix: true })}
                        {device.lastIp && ` • IP: ${device.lastIp}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!device.trusted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => trustDevice(device.id)}
                      >
                        Trust Device
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeviceToRemove(device.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove Device Confirmation */}
      <AlertDialog open={!!deviceToRemove} onOpenChange={() => setDeviceToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this device? This action will revoke its access to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deviceToRemove && removeDevice(deviceToRemove)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}