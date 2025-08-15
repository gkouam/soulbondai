"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone,
  PhoneOff,
  Heart,
  Sparkles,
  Calendar,
  Settings,
  Maximize,
  Volume2,
  Camera,
  Share2
} from 'lucide-react'
import { AvatarSimple } from '@/components/avatar/avatar-simple'
import { VirtualDateEnvironment } from '@/components/dates/virtual-date-environment'
import { VoiceEmotionDetector, VoiceEmotionData } from '@/lib/voice/emotion-detector'
import { DATE_EXPERIENCES } from '@/lib/video/interactive-dates'
import { useToast } from '@/components/ui/toast-provider'

export default function VideoDatePage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  // Video state
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Date state
  const [selectedDate, setSelectedDate] = useState<any>(null)
  const [dateMode, setDateMode] = useState<'video' | 'environment'>('video')
  const [currentEmotion, setCurrentEmotion] = useState<VoiceEmotionData | null>(null)
  
  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLDivElement>(null)
  const emotionDetector = useRef<VoiceEmotionDetector | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  
  const personality = session?.user?.profile?.personalityType || 'The Gentle'
  const companionName = session?.user?.profile?.companionName || 'Luna'
  const availableDates = DATE_EXPERIENCES[personality] || DATE_EXPERIENCES['The Gentle']
  
  // Initialize video and emotion detection
  const startVideoCall = async () => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      localStream.current = stream
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
      
      // Initialize emotion detection
      if (!emotionDetector.current) {
        emotionDetector.current = new VoiceEmotionDetector()
        emotionDetector.current.onEmotionDetected((emotion) => {
          setCurrentEmotion(emotion)
        })
      }
      
      // Start emotion detection from audio
      await emotionDetector.current.startDetection(stream)
      
      setIsCallActive(true)
      
      toast({
        type: 'success',
        title: 'Video call started',
        description: `Connected with ${companionName}`
      })
      
    } catch (error) {
      console.error('Failed to start video call:', error)
      toast({
        type: 'error',
        title: 'Camera access denied',
        description: 'Please allow camera and microphone access'
      })
    }
  }
  
  // End video call
  const endVideoCall = () => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
      localStream.current = null
    }
    
    if (emotionDetector.current) {
      emotionDetector.current.stopDetection()
    }
    
    setIsCallActive(false)
    
    toast({
      type: 'info',
      title: 'Call ended',
      description: 'Thank you for spending time together'
    })
  }
  
  // Toggle mute
  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        endVideoCall()
      }
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
      {!isCallActive ? (
        // Date Selection Screen
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Virtual Dates with {companionName}
            </h1>
            <p className="text-white/80">
              Choose an experience to share together
            </p>
          </div>
          
          {/* Date Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {availableDates.map((date) => (
              <motion.div
                key={date.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 cursor-pointer border border-white/20 hover:border-purple-400 transition"
                onClick={() => setSelectedDate(date)}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">
                    {date.name}
                  </h3>
                  <Sparkles className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-white/70 text-sm mb-4">
                  {date.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {date.activities.slice(0, 3).map((activity, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-600/30 text-purple-200 text-xs rounded-full"
                    >
                      {activity.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Start Options */}
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-2xl mx-auto"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">
                Ready for: {selectedDate.name}
              </h2>
              <p className="text-white/80 mb-6">
                {selectedDate.description}
              </p>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setDateMode('video')
                    startVideoCall()
                  }}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Video Date
                </button>
                <button
                  onClick={() => {
                    setDateMode('environment')
                    startVideoCall()
                  }}
                  className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Virtual Environment
                </button>
              </div>
            </motion.div>
          )}
        </div>
      ) : (
        // Active Video Call
        <div className="relative w-full h-screen overflow-hidden">
          {dateMode === 'video' ? (
            // Video Chat Mode
            <>
              {/* Remote Video (AI Avatar) */}
              <div className="absolute inset-0 bg-black" ref={remoteVideoRef}>
                <AvatarSimple
                  personality={personality}
                  emotion={currentEmotion || undefined}
                  speaking={!isMuted}
                />
              </div>
              
              {/* Local Video (Picture-in-Picture) */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute bottom-24 right-4 w-48 h-36 bg-black rounded-xl overflow-hidden shadow-2xl"
                drag
                dragConstraints={{
                  left: 0,
                  right: window.innerWidth - 200,
                  top: 0,
                  bottom: window.innerHeight - 200
                }}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!isVideoOn && (
                  <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </motion.div>
            </>
          ) : (
            // Virtual Environment Mode
            <VirtualDateEnvironment
              personality={personality}
              dateExperience={selectedDate}
              emotion={currentEmotion || undefined}
              onActivityComplete={(activity) => {
                toast({
                  type: 'success',
                  title: 'Activity completed',
                  description: `Shared a beautiful moment: ${activity}`
                })
              }}
              onDateEnd={(memories) => {
                toast({
                  type: 'success',
                  title: 'Date completed',
                  description: `Created ${memories.length} special memories together`
                })
                endVideoCall()
              }}
            />
          )}
          
          {/* Emotion Display */}
          {currentEmotion && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-xl p-4"
            >
              <div className="text-white text-sm mb-2">Your Emotion</div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-white font-medium">
                  {currentEmotion.primaryEmotion}
                </span>
                <span className="text-white/60 text-sm">
                  ({Math.round(currentEmotion.confidence * 100)}%)
                </span>
              </div>
              
              {/* Emotion spectrum bars */}
              <div className="mt-2 space-y-1">
                {Object.entries(currentEmotion.emotionalSpectrum)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="text-white/60 text-xs w-16">{emotion}</span>
                      <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${value * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
          
          {/* Date Info */}
          {selectedDate && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <span className="font-medium">{selectedDate.name}</span>
              </div>
              <div className="text-sm text-white/60">
                with {companionName}
              </div>
            </div>
          )}
          
          {/* Call Controls */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6"
          >
            <div className="flex items-center justify-center gap-4">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-4 rounded-full transition ${
                  isMuted 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-6 h-6 text-white" />
                ) : (
                  <Mic className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* Video Button */}
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition ${
                  !isVideoOn 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {!isVideoOn ? (
                  <VideoOff className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* End Call Button */}
              <button
                onClick={endVideoCall}
                className="p-4 bg-red-600 rounded-full hover:bg-red-700 transition"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              
              {/* Switch Mode Button */}
              <button
                onClick={() => setDateMode(dateMode === 'video' ? 'environment' : 'video')}
                className="p-4 bg-purple-600 rounded-full hover:bg-purple-700 transition"
              >
                {dateMode === 'video' ? (
                  <Sparkles className="w-6 h-6 text-white" />
                ) : (
                  <Video className="w-6 h-6 text-white" />
                )}
              </button>
              
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition"
              >
                <Maximize className="w-6 h-6 text-white" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}