"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, Download } from "lucide-react"

interface VoiceMessageProps {
  audioUrl: string
  duration?: number
  className?: string
}

export function VoiceMessage({ audioUrl, duration = 0, className = "" }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(duration)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setTotalDuration(audio.duration)
      setIsLoading(false)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setError(true)
      setIsLoading(false)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * totalDuration

    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  if (error) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl border border-gray-800 ${className}`}>
        <Volume2 className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-500">Unable to load audio</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 ${className}`}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={togglePlayPause}
        disabled={isLoading}
        className="flex-shrink-0 w-10 h-10 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div
              key="pause"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Pause className="w-4 h-4 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="play"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Play className="w-4 h-4 text-white ml-0.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Progress Bar */}
      <div className="flex-1 flex items-center gap-2">
        <div 
          className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <motion.div
            className="absolute inset-y-0 left-0 bg-violet-500 rounded-full"
            style={{ width: `${progress}%` }}
            layout
          />
          {isLoading && (
            <div className="absolute inset-0 bg-gray-600 rounded-full animate-pulse" />
          )}
        </div>

        {/* Duration */}
        <span className="text-xs text-gray-400 font-mono min-w-[45px]">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </span>
      </div>

      {/* Download Button */}
      <motion.a
        href={audioUrl}
        download
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
      >
        <Download className="w-4 h-4" />
      </motion.a>
    </div>
  )
}