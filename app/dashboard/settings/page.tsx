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
  ArrowLeft,
  Phone
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/components/ui/use-toast"
import { useErrorHandler, useAsyncOperation } from "@/hooks/use-error-handler"
import { FullPageLoader } from "@/components/ui/loading-states"
import { PhoneVerification } from "@/components/phone-verification"
import { DeviceManagement } from "@/components/device-management"
import { UserActivity } from "@/components/user-activity"

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
  voiceEnabled: boolean
  selectedVoice: string
  autoPlayVoice: boolean
  voiceSpeed: number
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
    soundEnabled: true,
    voiceEnabled: false,
    selectedVoice: "alloy",
    autoPlayVoice: false,
    voiceSpeed: 1.0
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
          emotionalDepth: data.emotionalDepth || 50,
          voiceEnabled: data.voiceEnabled || false,
          selectedVoice: data.selectedVoice || "alloy",
          autoPlayVoice: data.autoPlayVoice || false,
          voiceSpeed: data.voiceSpeed || 1.0
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
            emotionalDepth: settings.emotionalDepth,
            voiceEnabled: settings.voiceEnabled,
            selectedVoice: settings.selectedVoice,
            autoPlayVoice: settings.autoPlayVoice,
            voiceSpeed: settings.voiceSpeed
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
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
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
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Customize your AI companion experience
          </p>
        </motion.div>

        {/* Settings Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="bg-gray-900/50 backdrop-blur-sm border-gray-800 w-full overflow-x-auto flex-nowrap">
            <TabsTrigger value="profile" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <User className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="personality" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Personality</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Subscription</span>
              <span className="sm:hidden">Sub</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription className="text-sm">
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
                <CardDescription className="text-sm">
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
                    <span className="text-right">Creative</span>
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
                    <span className="text-right">Deep & Intimate</span>
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
                <CardDescription className="text-sm">
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

          <TabsContent value="voice" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription className="text-sm">
                  Configure voice playback for AI messages (Premium feature)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Voice Messages</Label>
                    <p className="text-sm text-gray-500">
                      Convert AI messages to speech
                    </p>
                  </div>
                  <Switch
                    checked={settings.voiceEnabled || false}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, voiceEnabled: checked }))
                    }
                  />
                </div>

                {settings.voiceEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="voice-selection">AI Voice</Label>
                      <Select
                        value={settings.selectedVoice || "alloy"}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, selectedVoice: value }))}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                          <SelectItem value="echo">Echo (Masculine)</SelectItem>
                          <SelectItem value="fable">Fable (British)</SelectItem>
                          <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                          <SelectItem value="nova">Nova (Feminine)</SelectItem>
                          <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Auto-play Voice</Label>
                        <p className="text-sm text-gray-500">
                          Automatically play voice for new messages
                        </p>
                      </div>
                      <Switch
                        checked={settings.autoPlayVoice || false}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, autoPlayVoice: checked }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Voice Speed</Label>
                        <span className="text-sm text-gray-400">{settings.voiceSpeed || 1.0}x</span>
                      </div>
                      <Slider
                        value={[settings.voiceSpeed || 1.0]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, voiceSpeed: value }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Slower</span>
                        <span className="text-center">Normal</span>
                        <span className="text-right">Faster</span>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  onClick={() => handleSaveProfile()}
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Voice Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-4">
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription className="text-sm">
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

                <div className="flex flex-col sm:flex-row gap-2">
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
          
          <TabsContent value="security" className="space-y-4">
            <PhoneVerification 
              currentPhone={session?.user?.phoneNumber}
              isVerified={session?.user?.phoneVerified || false}
              onUpdate={fetchSettings}
            />
            
            <DeviceManagement />
            
            <UserActivity />
            
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription className="text-sm">
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">
                  Two-factor authentication will be available soon. Phone verification is the first step.
                </p>
                <Button disabled variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}