"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Smile, Heart, Sparkles } from "lucide-react"
import { useSocket } from "@/hooks/use-socket"
import { Message } from "@/components/message"
import { TypingIndicator } from "@/components/typing-indicator"
import { MessageLimitWarning } from "@/components/message-limit-warning"
import { redirect } from "next/navigation"

export default function ChatPage() {
  const { data: session, status } = useSession()
  const socket = useSocket()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [companionMood, setCompanionMood] = useState("happy")
  const [isLoading, setIsLoading] = useState(true)
  
  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      redirect("/auth/login")
    }
  }, [session, status])
  
  // Load conversation history
  useEffect(() => {
    const loadConversation = async () => {
      try {
        const res = await fetch("/api/chat/conversation")
        if (res.ok) {
          const data = await res.json()
          if (data.messages) {
            setMessages(data.messages)
          }
        }
      } catch (error) {
        console.error("Failed to load conversation:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    if (session) {
      loadConversation()
    }
  }, [session])
  
  // Socket listeners
  useEffect(() => {
    if (!socket) return
    
    socket.on("message:receive", (message: any) => {
      setMessages(prev => [...prev, message])
      setIsTyping(false)
    })
    
    socket.on("companion:typing", ({ duration }: { duration: number }) => {
      setIsTyping(true)
      setTimeout(() => setIsTyping(false), duration)
    })
    
    socket.on("companion:mood", ({ mood }: { mood: string }) => {
      setCompanionMood(mood)
    })
    
    return () => {
      socket.off("message:receive")
      socket.off("companion:typing")
      socket.off("companion:mood")
    }
  }, [socket])
  
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
    
    // Send via API if socket not available
    if (!socket?.connected) {
      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input })
        })
        
        if (res.ok) {
          const data = await res.json()
          if (data.response) {
            setMessages(prev => [...prev, data.response])
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    } else {
      // Send via socket
      socket.emit("message:send", { content: input })
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <motion.div 
              animate={{ rotate: companionMood === "happy" ? [0, 10, -10, 0] : 0 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center"
            >
              {companionMood === "happy" ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <Heart className="w-5 h-5 text-white" />
              )}
            </motion.div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">{companionName}</p>
            <p className="text-xs text-gray-500">Always here for you</p>
          </div>
        </div>
        
        <button className="p-2 hover:bg-gray-100 rounded-full transition">
          <Smile className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-grow overflow-y-auto px-4 py-4">
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
            <Message key={message.id} message={message} companionName={companionName} />
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
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-end space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full transition">
            <Smile className="w-6 h-6 text-gray-600" />
          </button>
          
          <div className="flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Share what's on your heart with ${companionName}...`}
              disabled={isFreeTier && messagesUsedToday >= messageLimit}
              className="w-full px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!input.trim() || (isFreeTier && messagesUsedToday >= messageLimit)}
            className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}