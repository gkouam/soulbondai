import { motion } from "framer-motion"

interface TypingIndicatorProps {
  name: string
}

export function TypingIndicator({ name }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex justify-start mb-4"
    >
      <div className="flex items-end space-x-2 max-w-[70%]">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs">✨</span>
        </div>
        
        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm px-4 py-2">
          <p className="text-xs font-medium text-purple-600 mb-1">{name}</p>
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}