"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Lock, Unlock, MessageSquare, Brain, Camera, Mic, 
  Palette, Zap, Shield, Crown, Check, X, ChevronRight 
} from "lucide-react"
import { FeatureLock } from "@/components/feature-lock"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

const categoryIcons = {
  messaging: MessageSquare,
  memory: Brain,
  media: Camera,
  customization: Palette,
  advanced: Zap
}

const categoryColors = {
  messaging: "text-blue-500",
  memory: "text-purple-500",
  media: "text-pink-500",
  customization: "text-orange-500",
  advanced: "text-green-500"
}

export default function FeaturesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [features, setFeatures] = useState<{
    available: any[]
    locked: any[]
  }>({ available: [], locked: [] })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  useEffect(() => {
    loadFeatures()
  }, [session])
  
  const loadFeatures = async () => {
    try {
      const res = await fetch("/api/features/check")
      if (res.ok) {
        const data = await res.json()
        setFeatures(data)
      }
    } catch (error) {
      console.error("Failed to load features:", error)
    } finally {
      setLoading(false)
    }
  }
  
  const filteredAvailable = selectedCategory === "all" 
    ? features.available 
    : features.available.filter(f => f.category === selectedCategory)
    
  const filteredLocked = selectedCategory === "all"
    ? features.locked
    : features.locked.filter(f => f.category === selectedCategory)
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Features</h1>
        <p className="text-gray-600">
          Explore all the features available with your current plan
        </p>
      </motion.div>
      
      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="messaging">Messages</TabsTrigger>
          <TabsTrigger value="memory">Memory</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="customization">Custom</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Available Features */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <div className="flex items-center gap-2 mb-4">
          <Unlock className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Available Features ({filteredAvailable.length})
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAvailable.map((feature, index) => {
            const Icon = categoryIcons[feature.category as keyof typeof categoryIcons]
            const colorClass = categoryColors[feature.category as keyof typeof categoryColors]
            
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Icon className={cn("w-5 h-5", colorClass)} />
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary" className="text-xs">
                      {feature.category}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.section>
      
      {/* Locked Features */}
      {filteredLocked.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Locked Features ({filteredLocked.length})
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocked.map((feature, index) => {
              const Icon = categoryIcons[feature.category as keyof typeof categoryIcons]
              const colorClass = categoryColors[feature.category as keyof typeof categoryColors]
              
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full opacity-75 hover:opacity-100 transition-opacity">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Icon className={cn("w-5 h-5", colorClass, "opacity-50")} />
                        <Badge variant="outline" className="text-xs">
                          {feature.requiredPlan}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">{feature.reason}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/pricing?feature=${feature.id}`)}
                        className="w-full"
                      >
                        Unlock with {feature.requiredPlan}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      )}
      
      {/* Upgrade CTA */}
      {filteredLocked.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="py-8">
              <Crown className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                Unlock All Features
              </h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Upgrade your plan to access all features and create the deepest possible connection with your AI companion
              </p>
              <Button
                size="lg"
                onClick={() => router.push("/pricing")}
                className="bg-white text-purple-600 hover:bg-gray-100"
              >
                View Pricing Plans
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}