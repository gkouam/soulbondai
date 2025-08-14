'use client'

import { useState, useRef, useCallback } from 'react'
import { Mic, MicOff, Send, Loader2, Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>
  maxDuration?: number // in seconds
  disabled?: boolean
}

export function VoiceRecorder({ 
  onSend, 
  maxDuration = 120, 
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSending, setIsSending] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        })
        const url = URL.createObjectURL(audioBlob)
        setAudioURL(url)
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)
      
      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          if (prev >= maxDuration - 1) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
      
    } catch (error) {
      console.error('Error starting recording:', error)
      toast({
        title: 'Recording Failed',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording])

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const playPreview = () => {
    if (audioURL) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current = new Audio(audioURL)
        audioRef.current.play()
        setIsPlaying(true)
        audioRef.current.onended = () => setIsPlaying(false)
      }
    }
  }

  const handleSend = async () => {
    if (audioURL && audioChunksRef.current.length > 0) {
      setIsSending(true)
      try {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm' 
        })
        await onSend(audioBlob, duration)
        
        // Clean up
        setAudioURL(null)
        setDuration(0)
        audioChunksRef.current = []
      } catch (error) {
        console.error('Error sending audio:', error)
        toast({
          title: 'Send Failed',
          description: 'Could not send voice message. Please try again.',
          variant: 'destructive'
        })
      } finally {
        setIsSending(false)
      }
    }
  }

  const cancelRecording = () => {
    stopRecording()
    setAudioURL(null)
    setDuration(0)
    audioChunksRef.current = []
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10">
      {!isRecording && !audioURL && (
        <Button
          onClick={startRecording}
          disabled={disabled}
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-violet-500/20"
        >
          <Mic className="w-5 h-5" />
        </Button>
      )}

      {isRecording && (
        <>
          <div className="flex items-center gap-2 flex-1">
            <Button
              onClick={stopRecording}
              size="icon"
              variant="ghost"
              className="rounded-full hover:bg-red-500/20"
            >
              <MicOff className="w-5 h-5 text-red-500" />
            </Button>
            
            <Button
              onClick={pauseRecording}
              size="icon"
              variant="ghost"
              className="rounded-full"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
            
            <div className="flex items-center gap-2 flex-1">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 h-4 bg-violet-500 rounded-full animate-pulse`}
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                Recording... {formatDuration(duration)}
              </span>
            </div>
          </div>
        </>
      )}

      {audioURL && !isRecording && (
        <>
          <Button
            onClick={playPreview}
            size="icon"
            variant="ghost"
            className="rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <div className="flex-1 text-sm text-gray-400">
            {formatDuration(duration)}
          </div>
          
          <Button
            onClick={cancelRecording}
            size="sm"
            variant="ghost"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isSending}
            size="icon"
            className="rounded-full bg-violet-600 hover:bg-violet-700"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </>
      )}
    </div>
  )
}