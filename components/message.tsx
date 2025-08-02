import { motion } from "framer-motion"
import { format } from "date-fns"

interface MessageProps {
  message: {
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: Date | string
  }
  companionName: string
}

export function Message({ message, companionName }: MessageProps) {
  const isUser = message.role === "user"
  
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
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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