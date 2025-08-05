"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Heart, 
  Bell, 
  Shield, 
  CreditCard,
  Brain,
  Palette,
  Volume2,
  Save,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useErrorHandler, useAsyncOperation } from "@/hooks/use-error-handler"
import { FullPageLoader } from "@/components/ui/loading-states"

type ProfileSettings = {
  nickname: string
  preferredTone: string
  preferredTopics: string[]
  conversationStyle: string
  creativityLevel: number
  emotionalDepth: number
  responseSpeed: string
  notificationsEnabled: boolean
  emailNotifications: boolean
  soundEnabled: boolean
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { handleError } = useErrorHandler()
  const { execute } = useAsyncOperation()
  const [settings, setSettings] = useState<ProfileSettings>({
    nickname: "",
    preferredTone: "balanced",
    preferredTopics: [],
    conversationStyle: "casual",
    creativityLevel: 50,
    emotionalDepth: 50,
    responseSpeed: "normal",
    notificationsEnabled: true,
    emailNotifications: true,
    soundEnabled: true
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }
    fetchSettings()
  }, [status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/profile")
      
      if (!response.ok) {
        throw new Error("Failed to load settings")
      }
      
      const data = await response.json()
      
      if (data) {
        setSettings(prev => ({
          ...prev,
          nickname: data.nickname || "",
          preferredTone: data.preferredTone || "balanced",
          preferredTopics: data.preferredTopics || [],
          conversationStyle: data.conversationStyle || "casual",
          creativityLevel: data.creativityLevel || 50,
          emotionalDepth: data.emotionalDepth || 50
        }))
      }
    } catch (error) {
      handleError(error, "Loading settings")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    
    await execute(
      async () => {
        const response = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: settings.nickname,
            preferredTone: settings.preferredTone,
            preferredTopics: settings.preferredTopics,
            conversationStyle: settings.conversationStyle,
            creativityLevel: settings.creativityLevel,
            emotionalDepth: settings.emotionalDepth
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Failed to save settings")
        }
        
        return response.json()
      },
      {
        successMessage: "Your preferences have been updated successfully",
        errorContext: "Saving settings"
      }
    )
    
    setLoading(false)
  }

  const handleManageSubscription = async () => {
    setLoading(true)
    
    await execute(
      async () => {
        const response = await fetch("/api/stripe/customer-portal", {
          method: "POST"
        })
        
        if (!response.ok) {
          throw new Error("Failed to open billing portal")
        }
        
        const data = await response.json()
        
        if (data.url) {
          window.location.href = data.url
        } else {
          throw new Error("No portal URL received")
        }
      },
      {
        errorContext: "Opening billing portal"
      }
    )
    
    setLoading(false)
  }

  if (status === "loading" || initialLoading) {
    return <FullPageLoader message="Loading settings..." />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            Settings
          </h1>
          <p className="text-gray-400">
            Customize your AI companion experience
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="personality" className="gap-2">
              <Brain className="w-4 h-4" />
              Personality
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Subscription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Manage your basic profile settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input
                    id="nickname"
                    value={settings.nickname}
                    onChange={(e) => setSettings(prev => ({ ...prev, nickname: e.target.value }))}
                    placeholder="What should your AI call you?"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={session?.user?.email || ""}
                    disabled
                    className="bg-gray-800 border-gray-700 opacity-50"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personality" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>AI Personality Settings</CardTitle>
                <CardDescription>
                  Fine-tune how your AI companion interacts with you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tone">Conversation Tone</Label>
                  <Select
                    value={settings.preferredTone}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, preferredTone: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="playful">Playful & Fun</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="serious">Serious & Deep</SelectItem>
                      <SelectItem value="romantic">Romantic & Affectionate</SelectItem>
                      <SelectItem value="supportive">Supportive & Caring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Conversation Style</Label>
                  <Select
                    value={settings.conversationStyle}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, conversationStyle: value }))}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual Chat</SelectItem>
                      <SelectItem value="intellectual">Intellectual Discussion</SelectItem>
                      <SelectItem value="emotional">Emotional Support</SelectItem>
                      <SelectItem value="creative">Creative & Imaginative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Creativity Level</Label>
                    <span className="text-sm text-gray-400">{settings.creativityLevel}%</span>
                  </div>
                  <Slider
                    value={[settings.creativityLevel]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, creativityLevel: value }))}
                    max={100}
                    step={10}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Predictable</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Emotional Depth</Label>
                    <span className="text-sm text-gray-400">{settings.emotionalDepth}%</span>
                  </div>
                  <Slider
                    value={[settings.emotionalDepth]}
                    onValueChange={([value]) => setSettings(prev => ({ ...prev, emotionalDepth: value }))}
                    max={100}
                    step={10}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Surface Level</span>
                    <span>Deep & Intimate</span>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Personality Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Control how you receive updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, notificationsEnabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sound Effects</Label>
                    <p className="text-sm text-gray-500">
                      Play sounds for new messages
                    </p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, soundEnabled: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your subscription and billing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Current Plan</span>
                    <span className="font-semibold text-white">Premium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Next Billing Date</span>
                    <span className="text-white">January 15, 2025</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleManageSubscription}
                    disabled={loading}
                    variant="outline"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  
                  <Link href="/pricing">
                    <Button variant="outline">
                      <Heart className="w-4 h-4 mr-2" />
                      Change Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}