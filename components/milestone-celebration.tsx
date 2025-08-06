"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Trophy, Star, Heart, Sparkles } from "lucide-react"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface MilestoneCelebrationProps {
  milestone: {
    name: string
    description: string
  }
  onClose: () => void
}

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  
  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
    
    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }
    
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()
      
      if (timeLeft <= 0) {
        return clearInterval(interval)
      }
      
      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b']
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ec4899', '#a855f7', '#3b82f6', '#10b981', '#f59e0b']
      })
    }, 250)
    
    // Auto close after 5 seconds
    const closeTimer = setTimeout(onClose, 5000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(closeTimer)
    }
  }, [onClose])
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          exit={{ y: 50 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ rotate: -180, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Trophy className="w-12 h-12 text-white" />
          </motion.div>
          
          {/* Milestone Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Milestone Achieved!
            </h2>
            <h3 className="text-xl font-semibold text-purple-600 mb-3">
              {milestone.name}
            </h3>
            <p className="text-gray-600 mb-6">
              {milestone.description}
            </p>
          </motion.div>
          
          {/* Decorative Elements */}
          <div className="flex justify-center gap-4 mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Star className="w-8 h-8 text-yellow-400" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-8 h-8 text-pink-500" />
            </motion.div>
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-purple-400" />
            </motion.div>
          </div>
          
          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium"
          >
            Continue Journey
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}