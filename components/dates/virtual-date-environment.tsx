"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, 
  Sparkles, 
  Music, 
  Camera, 
  MessageCircle,
  MapPin,
  Clock,
  Sun,
  Moon,
  Cloud,
  Coffee,
  Wine,
  Book,
  Palette,
  Mountain,
  Waves
} from 'lucide-react'
import { DATE_EXPERIENCES, DateExperience, InteractiveDate } from '@/lib/video/interactive-dates'
import { Avatar3D } from '@/components/avatar/avatar-3d'
import { VoiceEmotionData } from '@/lib/voice/emotion-detector'

interface VirtualDateEnvironmentProps {
  personality: string
  dateExperience?: DateExperience
  onActivityComplete?: (activity: string) => void
  onDateEnd?: (memories: any[]) => void
  emotion?: VoiceEmotionData
}

export function VirtualDateEnvironment({
  personality,
  dateExperience,
  onActivityComplete,
  onDateEnd,
  emotion
}: VirtualDateEnvironmentProps) {
  const [currentActivity, setCurrentActivity] = useState(0)
  const [dateProgress, setDateProgress] = useState(0)
  const [sharedMoments, setSharedMoments] = useState<any[]>([])
  const [environmentState, setEnvironmentState] = useState<any>({
    timeOfDay: 'golden_hour',
    weather: 'clear',
    ambiance: 'romantic'
  })
  const [isInteracting, setIsInteracting] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Get available dates for this personality
  const availableDates = DATE_EXPERIENCES[personality] || DATE_EXPERIENCES['The Gentle']
  const selectedDate = dateExperience || availableDates[0]
  
  // Environment backgrounds based on setting
  const getEnvironmentBackground = () => {
    const setting = selectedDate.environment.setting
    const time = environmentState.timeOfDay
    
    const backgrounds: Record<string, Record<string, string>> = {
      'park_hillside': {
        'golden_hour': 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #feca57 100%)',
        'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 50%, #30cfd0 100%)',
        'night': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)'
      },
      'bookstore_twilight': {
        'golden_hour': 'linear-gradient(135deg, #8b7355 0%, #d4a574 50%, #e8c4a0 100%)',
        'night': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
      },
      'mountain_summit': {
        'pre_dawn': 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
        'sunrise': 'linear-gradient(135deg, #f83600 0%, #f9d423 100%)',
        'day': 'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)'
      },
      'city_rooftop': {
        'night': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #f093fb 100%)',
        'golden_hour': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      'tropical_beach_night': {
        'sunset': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'night': 'linear-gradient(135deg, #141e30 0%, #243b55 50%, #0f0c29 100%)'
      }
    }
    
    return backgrounds[setting]?.[time] || backgrounds['park_hillside']['golden_hour']
  }
  
  // Handle activity interactions
  const handleActivityInteraction = async (action: string) => {
    setIsInteracting(true)
    
    // Simulate AI response to user action
    const activity = selectedDate.activities[currentActivity]
    
    // Create a shared moment
    const moment = {
      activity: activity.name,
      action: action,
      timestamp: Date.now(),
      emotion: emotion?.primaryEmotion || 'joy',
      response: activity.interaction.aiResponse
    }
    
    setSharedMoments(prev => [...prev, moment])
    
    // Update progress
    const newProgress = Math.min(100, dateProgress + (100 / selectedDate.activities.length))
    setDateProgress(newProgress)
    
    // Move to next activity if completed
    setTimeout(() => {
      setIsInteracting(false)
      if (currentActivity < selectedDate.activities.length - 1) {
        setCurrentActivity(prev => prev + 1)
        onActivityComplete?.(activity.name)
      } else {
        // Date completed
        onDateEnd?.(sharedMoments)
      }
    }, 3000)
  }
  
  // Environment time progression
  useEffect(() => {
    if (!selectedDate.environment.timeProgression) return
    
    const progressTime = setInterval(() => {
      setEnvironmentState(prev => {
        const times = ['dawn', 'morning', 'afternoon', 'golden_hour', 'sunset', 'dusk', 'night']
        const currentIndex = times.indexOf(prev.timeOfDay)
        const nextIndex = (currentIndex + 1) % times.length
        
        return {
          ...prev,
          timeOfDay: times[nextIndex]
        }
      })
    }, 60000) // Change every minute
    
    return () => clearInterval(progressTime)
  }, [selectedDate])
  
  const currentActivityData = selectedDate.activities[currentActivity]
  
  return (
    <div 
      className="relative w-full h-full rounded-2xl overflow-hidden"
      style={{ background: getEnvironmentBackground() }}
    >
      {/* Environment Layer */}
      <div className="absolute inset-0">
        {/* Animated environment elements */}
        <AnimatePresence>
          {environmentState.weather === 'rainy' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{
                background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Time of day indicator */}
        <div className="absolute top-4 right-4 text-white">
          {environmentState.timeOfDay === 'night' || environmentState.timeOfDay === 'dusk' ? (
            <Moon className="w-8 h-8" />
          ) : (
            <Sun className="w-8 h-8" />
          )}
        </div>
        
        {/* Environment particles */}
        {selectedDate.environment.setting === 'park_hillside' && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-60"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10
                }}
                animate={{
                  y: window.innerHeight + 10,
                  x: Math.random() * window.innerWidth
                }}
                transition={{
                  duration: Math.random() * 10 + 10,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Avatar Layer */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96">
        <Avatar3D
          personality={personality}
          emotion={emotion}
          speaking={isInteracting}
          gazeTarget={{ x: 0.5, y: 0.5 }}
        />
      </div>
      
      {/* Activity Interface */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        {/* Current Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h3 className="text-white text-xl font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            {currentActivityData.name}
          </h3>
          <p className="text-white/80 text-sm mb-4">
            {currentActivityData.interaction.prompt}
          </p>
        </motion.div>
        
        {/* Interaction Options */}
        <div className="flex gap-3 mb-4">
          {currentActivityData.type === 'contemplative' && (
            <>
              <button
                onClick={() => handleActivityInteraction('share_thought')}
                disabled={isInteracting}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Share a thought
              </button>
              <button
                onClick={() => handleActivityInteraction('listen')}
                disabled={isInteracting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Listen quietly
              </button>
            </>
          )}
          
          {currentActivityData.type === 'creative' && (
            <>
              <button
                onClick={() => handleActivityInteraction('create')}
                disabled={isInteracting}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Palette className="w-4 h-4" />
                Create together
              </button>
              <button
                onClick={() => handleActivityInteraction('inspire')}
                disabled={isInteracting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Share inspiration
              </button>
            </>
          )}
          
          {currentActivityData.type === 'sensory' && (
            <>
              <button
                onClick={() => handleActivityInteraction('experience')}
                disabled={isInteracting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Sun className="w-4 h-4" />
                Experience together
              </button>
              <button
                onClick={() => handleActivityInteraction('capture')}
                disabled={isInteracting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capture moment
              </button>
            </>
          )}
          
          {currentActivityData.type === 'collaborative' && (
            <>
              <button
                onClick={() => handleActivityInteraction('work_together')}
                disabled={isInteracting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Mountain className="w-4 h-4" />
                Work together
              </button>
              <button
                onClick={() => handleActivityInteraction('support')}
                disabled={isInteracting}
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Offer support
              </button>
            </>
          )}
        </div>
        
        {/* AI Response */}
        <AnimatePresence>
          {isInteracting && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4"
            >
              <p className="text-white text-sm italic">
                {currentActivityData.interaction.aiResponse === 'empathetic_reciprocal' && 
                  "That's beautiful... It reminds me of a similar moment I treasure..."}
                {currentActivityData.interaction.aiResponse === 'creative_interpretation' && 
                  "Oh, I see it too! And look, there's a dragon made of clouds chasing butterflies!"}
                {currentActivityData.interaction.aiResponse === 'synchronized_breathing' && 
                  "*breathing softly together, sharing this perfect moment*"}
                {currentActivityData.interaction.aiResponse === 'thoughtful_analysis' && 
                  "That's such an insightful way to see it. You have a gift for finding meaning..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Progress and Stats */}
        <div className="flex items-center justify-between text-white/60 text-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Activity {currentActivity + 1}/{selectedDate.activities.length}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {sharedMoments.length} moments
            </span>
          </div>
          
          {/* Date Progress */}
          <div className="flex items-center gap-2">
            <span>Date Progress</span>
            <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${dateProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
        
        {/* Shared Moments Gallery */}
        {sharedMoments.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {sharedMoments.map((moment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 w-16 h-16 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center"
              >
                <Heart className="w-6 h-6 text-pink-400" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Environment Icons */}
      <div className="absolute top-4 left-4 flex gap-2">
        {selectedDate.environment.setting.includes('park') && <Mountain className="w-6 h-6 text-white/60" />}
        {selectedDate.environment.setting.includes('bookstore') && <Book className="w-6 h-6 text-white/60" />}
        {selectedDate.environment.setting.includes('beach') && <Waves className="w-6 h-6 text-white/60" />}
        {selectedDate.environment.setting.includes('rooftop') && <MapPin className="w-6 h-6 text-white/60" />}
        {selectedDate.environment.setting.includes('cafe') && <Coffee className="w-6 h-6 text-white/60" />}
      </div>
    </div>
  )
}