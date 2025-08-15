"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { VoiceEmotionData } from '@/lib/voice/emotion-detector'
import { AVATAR_PERSONALITIES } from '@/lib/avatar/emotive-avatar'

interface AvatarSimpleProps {
  personality: string
  emotion?: VoiceEmotionData
  speaking?: boolean
}

export function AvatarSimple({
  personality,
  emotion,
  speaking
}: AvatarSimpleProps) {
  const [blinkTimer, setBlinkTimer] = useState(0)
  const avatarPersonality = AVATAR_PERSONALITIES[personality] || AVATAR_PERSONALITIES['The Gentle']
  
  // Get emotion-based expression
  const getExpression = () => {
    if (!emotion) return '😊'
    
    const expressions: Record<string, string> = {
      joy: '😄',
      sadness: '😢',
      anger: '😠',
      fear: '😨',
      surprise: '😮',
      disgust: '🤢',
      love: '🥰',
      excitement: '🤩',
      calm: '😌',
      anxiety: '😰'
    }
    
    return expressions[emotion.primaryEmotion] || '😊'
  }
  
  // Blinking animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinkTimer(prev => prev + 1)
    }, 3000 + Math.random() * 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 rounded-2xl overflow-hidden">
      {/* Background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            animate={{
              x: [Math.random() * 400, Math.random() * 400],
              y: [Math.random() * 400, Math.random() * 400],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        ))}
      </div>
      
      {/* Avatar container */}
      <motion.div
        animate={{
          scale: speaking ? [1, 1.05, 1] : 1,
          rotate: speaking ? [0, 1, -1, 0] : 0
        }}
        transition={{
          duration: speaking ? 0.3 : 2,
          repeat: speaking ? Infinity : 0
        }}
        className="relative"
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.9, 1.1, 0.9]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
        />
        
        {/* Avatar face */}
        <motion.div
          className="relative w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full shadow-2xl flex items-center justify-center"
          animate={{
            y: [0, -5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity
          }}
        >
          {/* Expression */}
          <motion.div
            key={blinkTimer}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 0.15, times: [0, 0.5, 1] }}
            className="text-8xl select-none"
          >
            {getExpression()}
          </motion.div>
          
          {/* Speaking indicator */}
          {speaking && (
            <motion.div
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity
              }}
            >
              <div className="w-8 h-2 bg-white rounded-full" />
            </motion.div>
          )}
        </motion.div>
        
        {/* Personality indicator */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
          <span className="text-white text-xs font-medium">
            {personality}
          </span>
        </div>
      </motion.div>
      
      {/* Emotion confidence */}
      {emotion && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {emotion.primaryEmotion} ({Math.round(emotion.confidence * 100)}%)
        </div>
      )}
    </div>
  )
}