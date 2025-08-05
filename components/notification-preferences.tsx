"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Clock, Shield } from "lucide-react"
import { NotificationPreferences, defaultNotificationPreferences } from "@/lib/notifications"

export function NotificationPreferencesForm() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultNotificationPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      
      if (response.ok) {
        toast({
          title: 'Preferences Updated',
          description: 'Your notification preferences have been saved.',
        })
      } else {
        throw new Error('Failed to save preferences')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEnablePushNotifications = async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Not Supported',
        description: 'Push notifications are not supported in your browser.',
        variant: 'destructive',
      })
      return
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      // Subscribe to push notifications
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        })
        
        await fetch('/api/user/push-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        })
        
        toast({
          title: 'Push Notifications Enabled',
          description: 'You will now receive push notifications.',
        })
      } catch (error) {
        console.error('Failed to subscribe:', error)
        toast({
          title: 'Error',
          description: 'Failed to enable push notifications.',
          variant: 'destructive',
        })
      }
    }
  }

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-32 bg-gray-800 rounded" />
      <div className="h-32 bg-gray-800 rounded" />
    </div>
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which emails you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-messages">AI Companion Messages</Label>
            <Switch
              id="email-messages"
              checked={preferences.email.messages}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  email: { ...prev.email, messages: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-milestones">Milestones & Achievements</Label>
            <Switch
              id="email-milestones"
              checked={preferences.email.milestones}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  email: { ...prev.email, milestones: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-promotions">Promotions & Updates</Label>
            <Switch
              id="email-promotions"
              checked={preferences.email.promotions}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  email: { ...prev.email, promotions: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-security">Security Alerts</Label>
            <Switch
              id="email-security"
              checked={preferences.email.security}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  email: { ...prev.email, security: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="email-newsletter">Weekly Newsletter</Label>
            <Switch
              id="email-newsletter"
              checked={preferences.email.newsletter}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  email: { ...prev.email, newsletter: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant notifications on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleEnablePushNotifications}
            className="w-full"
          >
            Enable Push Notifications
          </Button>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-messages">AI Companion Messages</Label>
            <Switch
              id="push-messages"
              checked={preferences.push.messages}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  push: { ...prev.push, messages: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-milestones">Milestones & Achievements</Label>
            <Switch
              id="push-milestones"
              checked={preferences.push.milestones}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  push: { ...prev.push, milestones: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="push-reminders">Daily Reminders</Label>
            <Switch
              id="push-reminders"
              checked={preferences.push.reminders}
              onCheckedChange={(checked) => 
                setPreferences(prev => ({
                  ...prev,
                  push: { ...prev.push, reminders: checked }
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Control when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select
              value={preferences.frequency}
              onValueChange={(value) => 
                setPreferences(prev => ({
                  ...prev,
                  frequency: value as NotificationPreferences['frequency']
                }))
              }
            >
              <SelectTrigger id="frequency" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="hourly">Hourly Summary</SelectItem>
                <SelectItem value="daily">Daily Summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHours.enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, enabled: checked }
                  }))
                }
              />
            </div>
            
            {preferences.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="quiet-start" className="text-sm">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => 
                      setPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end" className="text-sm">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => 
                      setPreferences(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  )
}