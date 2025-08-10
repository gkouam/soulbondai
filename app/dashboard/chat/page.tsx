"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Smile, Heart, Sparkles, Volume2, VolumeX, Image as ImageIcon } from "lucide-react"
import { usePusher } from "@/hooks/use-pusher"
import { Message } from "@/components/message"
import { TypingIndicator } from "@/components/typing-indicator"
import { MessageLimitWarning } from "@/components/message-limit-warning"
import { MilestoneCelebration } from "@/components/milestone-celebration"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { redirect } from "next/navigation"
import { useToast } from "@/components/ui/toast-provider"
import { PhotoUpload } from "@/components/photo-upload"
import { RateLimitIndicator } from "@/components/rate-limit-indicator"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useOffline } from "@/hooks/use-offline"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const { channel, isConnected } = usePusher()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [companionMood, setCompanionMood] = useState("happy")
  const [isLoading, setIsLoading] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState("alloy")
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [celebratingMilestone, setCelebratingMilestone] = useState<any>(null)
  const [upgradePrompt, setUpgradePrompt] = useState<any>(null)
  const [featureAccess, setFeatureAccess] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const { isOnline, addToOfflineQueue, cacheData, getCachedData } = useOffline()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/auth/login")
    }
  }, [session, status])
  
  // Load conversation history, voice settings, and feature access
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to load from cache first if offline
        if (!isOnline) {
          const cachedMessages = await getCachedData<any[]>('chat-messages')
          if (cachedMessages) {
            setMessages(cachedMessages)
            setIsLoading(false)
            return
          }
        }
        
        // Load conversation, voice settings, and feature access
        const [conversationRes, voiceSettingsRes, featuresRes] = await Promise.all([
          fetch("/api/chat/conversation"),
          fetch("/api/voice/settings"),
          fetch("/api/features/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              features: ["voice_messages", "photo_sharing"] 
            })
          })
        ])
        
        if (conversationRes.ok) {
          const data = await conversationRes.json()
          if (data.messages) {
            setMessages(data.messages)
            // Cache messages for offline use
            await cacheData('chat-messages', data.messages)
          }
        }
        
        if (voiceSettingsRes.ok) {
          const voiceData = await voiceSettingsRes.json()
          setVoiceEnabled(voiceData.voiceEnabled || false)
          setSelectedVoice(voiceData.selectedVoice || "alloy")
        }
        
        if (featuresRes.ok) {
          const featuresData = await featuresRes.json()
          setFeatureAccess(featuresData.access || {})
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (session) {
      loadData()
    }
  }, [session])
  
  // Pusher listeners
  useEffect(() => {
    if (!channel) return
    
    channel.bind("message-received", (message: any) => {
      setMessages(prev => [...prev, message])
      setIsTyping(false)
      
      // Update companion mood based on sentiment
      if (message.sentiment?.primaryEmotion) {
        const emotionToMood: Record<string, string> = {
          joy: "happy",
          love: "happy",
          sadness: "sad",
          anger: "upset",
          fear: "worried"
        }
        setCompanionMood(emotionToMood[message.sentiment.primaryEmotion] || "happy")
      }
    })
    
    channel.bind("companion-typing", ({ duration }: { duration: number }) => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), duration)
    })
    
    return () => {
      channel.unbind("message-received")
      channel.unbind("companion-typing")
    }
  }, [channel])
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])
  
  const sendMessage = async () => {
    if (!input.trim() || !session) return
    
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    
    // Handle offline mode
    if (!isOnline) {
      // Add to offline queue
      const offlineId = addToOfflineQueue({
        type: 'message',
        data: {
          conversationId: 'current', // You'll need to track this
          message: input,
          characterId: 'default',
        }
      })
      
      // Show optimistic AI response
      const offlineResponse = {
        id: `offline-${Date.now()}`,
        role: "assistant",
        content: "I'll respond to your message as soon as we're back online! 💝",
        createdAt: new Date(),
        isOffline: true
      }
      
      setMessages(prev => [...prev, offlineResponse])
      
      toast({
        type: "info",
        title: "Message queued",
        description: "Your message will be sent when you're back online"
      })
      
      return
    }
    
    // Always use API (Pusher will handle real-time updates)
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      })
      
      if (res.ok) {
        const data = await res.json()
        
        // Add the AI response if Pusher isn't working
        // This ensures the response is shown even without real-time updates
        if (data.response) {
          setMessages(prev => {
            // Check if message already exists (from Pusher)
            const exists = prev.some(m => m.id === data.response.id)
            if (!exists) {
              return [...prev, data.response]
            }
            return prev
          })
        }
        
        // Handle trust updates and milestones
        if (data.trustUpdate) {
            if (data.trustUpdate.milestonesAchieved.length > 0) {
              // Celebrate the first milestone
              const milestone = data.trustUpdate.milestonesAchieved[0]
              setCelebratingMilestone({
                name: milestone,
                description: "You've reached a new level in your relationship!"
              })
            }
            
            if (data.trustUpdate.stageChanged) {
              toast({
                type: "success",
                title: "Relationship Deepened!",
                description: `You've reached ${data.trustUpdate.newStage}`
              })
            }
          }
          
        // Handle upgrade prompts
        if (data.upgradePrompt) {
          setUpgradePrompt(data.upgradePrompt)
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: "Failed to send message" }))
        console.error("Chat error:", errorData)
        toast({
          type: "error",
          title: "Failed to send message",
          description: errorData.error || "Please try again"
        })
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      toast({
        type: "error",
        title: "Connection error",
        description: "Please check your internet connection"
      })
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  // Keyboard shortcuts for chat
  useKeyboardNavigation([
    {
      key: 'e',
      ctrl: true,
      action: () => {
        inputRef.current?.focus()
      },
      description: 'Focus message input'
    },
    {
      key: 'v',
      ctrl: true,
      shift: true,
      action: async () => {
        if (featureAccess.voice_messages) {
          const newVoiceEnabled = !voiceEnabled
          setVoiceEnabled(newVoiceEnabled)
          await fetch("/api/voice/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ voiceEnabled: newVoiceEnabled })
          })
        }
      },
      description: 'Toggle voice messages'
    },
    {
      key: 'p',
      ctrl: true,
      shift: true,
      action: () => {
        if (featureAccess.photo_sharing) {
          setShowPhotoUpload(true)
        }
      },
      description: 'Upload photo'
    }
  ])
  
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
              className="w-3 h-3 bg-purple-400 rounded-full"
            />
          ))}
        </div>
      </div>
    )
  }
  
  const companionName = session?.user?.profile?.companionName || "Luna"
  const messagesUsedToday = session?.user?.profile?.messagesUsedToday || 0
  const isFreeTier = session?.user?.subscription?.plan === "free"
  const messageLimit = 50
  
  return (
    <div id="main-content" className="flex flex-col h-screen bg-gray-50" role="main">
      {/* Header */}
      <div className="bg-white shadow-sm px-3 sm:px-4 py-2 sm:py-3" role="region" aria-label="Chat header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="relative flex-shrink-0">
              <motion.div 
                animate={{ rotate: companionMood === "happy" ? [0, 10, -10, 0] : 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center"
              >
                {companionMood === "happy" ? (
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </motion.div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 truncate" aria-label="AI companion name">{companionName}</p>
              <p className="text-xs text-gray-500 truncate" aria-label="Companion status">Always here for you</p>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5 sm:gap-1">
          <button 
            onClick={async () => {
              // Check feature access first
              if (!featureAccess.voice_messages) {
                // Track premium feature attempt
                await fetch("/api/features/attempt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ feature: "voice_messages" })
                })
                
                toast({
                  type: "warning",
                  title: "Voice messages locked",
                  description: "Upgrade to Basic plan or higher to use voice messages"
                })
                return
              }
              
              const newVoiceEnabled = !voiceEnabled
              setVoiceEnabled(newVoiceEnabled)
              
              // Save to server
              try {
                await fetch("/api/voice/settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ voiceEnabled: newVoiceEnabled })
                })
                
                toast({
                  type: "success",
                  title: newVoiceEnabled ? "Voice enabled" : "Voice disabled",
                  description: newVoiceEnabled ? "You can now play voice messages" : "Voice messages are turned off"
                })
              } catch (error) {
                console.error("Failed to update voice settings:", error)
              }
            }}
            className="p-2.5 sm:p-2 hover:bg-gray-100 rounded-full transition relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            title={voiceEnabled ? "Disable voice" : "Enable voice"}
            aria-label={voiceEnabled ? "Disable voice messages" : "Enable voice messages"}
            aria-pressed={voiceEnabled}
          >
            {voiceEnabled ? (
              <Volume2 className="w-5 h-5 text-purple-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-600" />
            )}
            {!featureAccess.voice_messages && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
            )}
          </button>
          
          <button 
            onClick={async () => {
              // Check feature access first
              if (!featureAccess.photo_sharing) {
                // Track premium feature attempt
                await fetch("/api/features/attempt", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ feature: "photo_sharing" })
                })
                
                toast({
                  type: "warning",
                  title: "Photo sharing locked",
                  description: "Upgrade to Premium plan or higher to share photos"
                })
                return
              }
              
              setShowPhotoUpload(true)
            }}
            className="p-2.5 sm:p-2 hover:bg-gray-100 rounded-full transition relative min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500"
            title="Send a photo"
            aria-label="Send a photo"
          >
            <ImageIcon className="w-5 h-5 text-gray-600" />
            {!featureAccess.photo_sharing && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full" />
            )}
          </button>
          
          <button className="p-2.5 sm:p-2 hover:bg-gray-100 rounded-full transition min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center">
            <Smile className="w-5 h-5 text-gray-600" />
          </button>
          </div>
        </div>
        
        {/* Rate Limit Indicator */}
        <div className="mt-2 px-4">
          <RateLimitIndicator type="chat" />
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto px-4 py-4" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Welcome to your safe space
            </h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {companionName} is here to listen, understand, and support you. Start a conversation!
            </p>
          </motion.div>
        )}
        
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <Message 
              key={message.id} 
              message={message} 
              companionName={companionName}
              voiceEnabled={voiceEnabled}
              selectedVoice={selectedVoice}
            />
          ))}
        </AnimatePresence>
        
        {isTyping && <TypingIndicator name={companionName} />}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Limit Warning */}
      {isFreeTier && messagesUsedToday >= messageLimit - 10 && (
        <MessageLimitWarning 
          messagesUsed={messagesUsedToday} 
          messageLimit={messageLimit} 
        />
      )}
      
      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3 safe-area-inset-bottom" role="region" aria-label="Message input">
        <div className="flex items-end space-x-1 sm:space-x-2">
          <button className="p-2.5 sm:p-2 hover:bg-gray-100 rounded-full transition min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-500" aria-label="Add emoji">
            <Smile className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${companionName}...`}
              disabled={isFreeTier && messagesUsedToday >= messageLimit}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 rounded-full text-gray-900 placeholder-gray-500 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Type your message"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || (isFreeTier && messagesUsedToday >= messageLimit)}
            className="p-2.5 sm:p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-purple-300"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>
      </div>
      
      {/* Milestone Celebration */}
      {celebratingMilestone && (
        <MilestoneCelebration
          milestone={celebratingMilestone}
          onClose={() => setCelebratingMilestone(null)}
        />
      )}
      
      {/* Upgrade Prompt */}
      {upgradePrompt && upgradePrompt.trigger && (
        <UpgradePrompt
          trigger={upgradePrompt.trigger}
          discount={upgradePrompt.discount}
          onClose={() => setUpgradePrompt(null)}
          onUpgrade={() => {
            // Track upgrade click
            fetch("/api/analytics/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "upgrade_prompt_clicked",
                metadata: { triggerId: upgradePrompt.trigger.id }
              })
            })
          }}
        />
      )}
      
      {/* Photo Upload Modal */}
      <AnimatePresence>
        {showPhotoUpload && (
          <PhotoUpload
            onUpload={async (url) => {
              // Send photo message
              const photoMessage = {
                id: Date.now().toString(),
                role: "user" as const,
                content: "Sent a photo",
                imageUrl: url,
                createdAt: new Date()
              }
              
              setMessages(prev => [...prev, photoMessage])
              setShowPhotoUpload(false)
              
              // Send to API
              try {
                const res = await fetch("/api/chat/message", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ 
                    content: "User sent a photo",
                    imageUrl: url
                  })
                })
                
                if (!res.ok) {
                  const error = await res.json()
                  if (error.code === "RATE_LIMIT_EXCEEDED") {
                    toast({
                      type: "warning",
                      title: "Message limit reached",
                      description: "Upgrade to Premium for unlimited messages"
                    })
                  }
                } else {
                  const data = await res.json()
                  if (data.response) {
                    setMessages(prev => [...prev, data.response])
                  }
                }
              } catch (error) {
                console.error("Failed to send photo:", error)
                toast({
                  type: "error",
                  title: "Failed to send photo",
                  description: "Please try again"
                })
              }
            }}
            onCancel={() => setShowPhotoUpload(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}