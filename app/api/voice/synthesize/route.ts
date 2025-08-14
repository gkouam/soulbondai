import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { getOpenAIClient } from "@/lib/vector-store"
import { prisma } from "@/lib/prisma"
import { featureGate } from "@/lib/feature-gates"
import { VOCAL_PERSONALITIES } from "@/lib/voice/personality-voices"
import { SentimentVoiceModulator, EmotionalContext } from "@/lib/voice/sentiment-voice"
import { getElevenLabsService } from "@/lib/elevenlabs"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    // Check feature access
    const access = await featureGate.checkAndLog(session.user.id, "voice_messages")
    if (!access.allowed) {
      throw new AppError(access.message || "Voice messages not available", 403, "FEATURE_LOCKED")
    }

    const { text, voice = "alloy", personality, emotionalContext } = await req.json()

    if (!text || typeof text !== "string") {
      throw new AppError("Invalid text provided", 400)
    }

    // Limit text length to prevent abuse
    if (text.length > 1000) {
      throw new AppError("Text too long. Maximum 1000 characters allowed", 400)
    }

    const openai = getOpenAIClient()
    if (!openai) {
      throw new AppError("Voice synthesis not available", 503)
    }

    // Get user's companion personality
    let userPersonality = personality
    if (!userPersonality) {
      const profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        select: { personalityType: true }
      })
      userPersonality = profile?.personalityType || "The Gentle"
    }

    // Get personality-based voice parameters
    const vocalPersonality = VOCAL_PERSONALITIES[userPersonality]
    let voiceParams = {
      voice: vocalPersonality?.baseVoice || voice,
      speed: 1.0,
      pitch: 1.0
    }

    // Apply emotional modulation if context provided
    if (emotionalContext && vocalPersonality) {
      const modulator = new SentimentVoiceModulator(vocalPersonality)
      const params = modulator.getVoiceParameters(text, emotionalContext as EmotionalContext)
      
      voiceParams = {
        voice: params.voice as any,
        speed: params.rate,
        pitch: params.pitch
      }
    }

    // Try ElevenLabs first for premium voice synthesis
    const elevenLabs = getElevenLabsService()
    let buffer: Buffer
    
    if (elevenLabs && process.env.ELEVENLABS_API_KEY) {
      try {
        // Use ElevenLabs for higher quality, personality-driven voices
        buffer = await elevenLabs.synthesizeSpeech(
          text,
          userPersonality,
          {
            voice: voiceParams.voice,
            pitch: voiceParams.pitch,
            rate: voiceParams.speed,
            emotion: emotionalContext?.userEmotion?.primaryEmotion,
            emotionIntensity: emotionalContext?.userEmotion?.intensity || 0.5,
            soundscape: vocalPersonality?.characteristics?.preferredSoundscape
          }
        )
      } catch (error) {
        console.error("ElevenLabs synthesis failed, falling back to OpenAI:", error)
        // Fallback to OpenAI TTS
        const mp3 = await openai.audio.speech.create({
          model: "tts-1-hd",
          voice: voiceParams.voice as any,
          input: text,
          speed: voiceParams.speed,
        })
        buffer = Buffer.from(await mp3.arrayBuffer())
      }
    } else {
      // Use OpenAI TTS as default
      const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: voiceParams.voice as any,
        input: text,
        speed: voiceParams.speed,
      })
      buffer = Buffer.from(await mp3.arrayBuffer())
    }

    // Return the audio file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}