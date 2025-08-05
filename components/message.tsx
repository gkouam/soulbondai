import { motion } from "framer-motion"
import { format } from "date-fns"
import { Volume2, Loader2 } from "lucide-react"
import { useState } from "react"
import { VoiceMessage } from "@/components/voice-message"
import { PhotoMessage } from "@/components/photo-message"
import { useToast } from "@/components/ui/toast-provider"

interface MessageProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: Date | string
    audioUrl?: string
    imageUrl?: string
  }
  companionName: string
  voiceEnabled?: boolean
  selectedVoice?: string
}

export function Message({ message, companionName, voiceEnabled = false, selectedVoice = "alloy" }: MessageProps) {
  const isUser = message.role === "user"
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [audioUrl, setAudioUrl] = useState(message.audioUrl)
  const { toast } = useToast()
  
  const generateAudio = async () => {
    if (isUser || !message.content) return
    
    setIsGeneratingAudio(true)
    try {
      const response = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: message.content,
          voice: selectedVoice
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        if (error.code === "PREMIUM_REQUIRED") {
          toast({
            type: "warning",
            title: "Premium Feature",
            description: "Voice messages require a premium subscription"
          })
        } else {
          throw new Error(error.error || "Failed to generate audio")
        }
        return
      }
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setAudioUrl(url)
      
      // Clean up old URL if it exists
      if (audioUrl && audioUrl.startsWith("blob:")) {
        URL.revokeObjectURL(audioUrl)
      }
    } catch (error) {
      console.error("Failed to generate audio:", error)
      toast({
        type: "error",
        title: "Audio Generation Failed",
        description: "Unable to create voice message"
      })
    } finally {
      setIsGeneratingAudio(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div className={`flex max-w-[70%] ${isUser ? "flex-row-reverse" : "flex-row"} items-end space-x-2`}>
        {!isUser && (
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs">✨</span>
          </div>
        )}
        
        <div
          className={`px-4 py-2 rounded-2xl ${
            isUser 
              ? "bg-purple-600 text-white rounded-br-sm" 
              : "bg-white text-gray-800 rounded-bl-sm shadow-sm"
          }`}
        >
          {!isUser && (
            <p className="text-xs font-medium text-purple-600 mb-1">{companionName}</p>
          )}
          
          {/* Photo Message */}
          {message.imageUrl && (
            <PhotoMessage 
              url={message.imageUrl} 
              alt={isUser ? "Your photo" : `Photo from ${companionName}`}
              className="mb-2 max-w-xs"
            />
          )}
          
          {/* Text Content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
          
          {/* Voice Message */}
          {!isUser && voiceEnabled && (
            <div className="mt-2">
              {audioUrl ? (
                <VoiceMessage audioUrl={audioUrl} className="max-w-full" />
              ) : (
                <button
                  onClick={generateAudio}
                  disabled={isGeneratingAudio}
                  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3" />
                      Play voice
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          
          <p className={`text-xs mt-1 ${isUser ? "text-purple-200" : "text-gray-400"}`}>
            {format(new Date(message.createdAt), "h:mm a")}
          </p>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xs">👤</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}