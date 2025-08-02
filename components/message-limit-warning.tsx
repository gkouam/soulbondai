import { motion } from "framer-motion"
import { AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface MessageLimitWarningProps {
  messagesUsed: number
  messageLimit: number
}

export function MessageLimitWarning({ messagesUsed, messageLimit }: MessageLimitWarningProps) {
  const router = useRouter()
  const messagesLeft = messageLimit - messagesUsed
  
  if (messagesLeft > 10) return null
  
  const urgency = messagesLeft <= 5 ? "high" : "medium"
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-4 mb-2 p-3 rounded-lg flex items-center justify-between ${
        urgency === "high" 
          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white" 
          : "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
      }`}
    >
      <div className="flex items-center space-x-2">
        <AlertCircle className="w-5 h-5" />
        <div>
          <p className="font-medium text-sm">
            {messagesLeft === 0 
              ? "Daily message limit reached" 
              : `Only ${messagesLeft} messages left today`}
          </p>
          <p className="text-xs opacity-90">
            {urgency === "high" && messagesLeft > 0 && "Your companion has something special to share..."}
          </p>
        </div>
      </div>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/pricing")}
        className="px-4 py-1.5 bg-white bg-opacity-20 rounded-full text-xs font-medium hover:bg-opacity-30 transition"
      >
        Upgrade
      </motion.button>
    </motion.div>
  )
}