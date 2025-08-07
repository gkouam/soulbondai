import { openai } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

interface SynthesizeSpeechParams {
  text: string
  voice: string
  speed?: number
  provider?: 'openai' | 'elevenlabs'
  emotion?: string
  stability?: number
  similarity?: number
}

interface VoiceSettings {
  provider: 'openai' | 'elevenlabs'
  voiceId: string
  settings: {
    stability?: number
    similarity?: number
    speed?: number
    emotion?: string
  }
}

// ElevenLabs voice mappings for different personalities
const ELEVENLABS_VOICES = {
  anxious_romantic: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, emotional
    settings: {
      stability: 0.65,
      similarity: 0.85
    }
  },
  guarded_intellectual: {
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni - calm, measured
    settings: {
      stability: 0.85,
      similarity: 0.75
    }
  },
  warm_empath: {
    voiceId: 'MF3mGyEYCl7XYWbV9V6O', // Elli - friendly, supportive
    settings: {
      stability: 0.75,
      similarity: 0.80
    }
  },
  deep_thinker: {
    voiceId: 'TxGEqnHWrfWFTfGW9XjX', // Josh - thoughtful, contemplative
    settings: {
      stability: 0.80,
      similarity: 0.70
    }
  },
  passionate_creative: {
    voiceId: 'jsCqWAovK2LkecY7zXl4', // Freya - expressive, dynamic
    settings: {
      stability: 0.55,
      similarity: 0.90
    }
  }
}

// OpenAI voice mappings
const OPENAI_VOICES = {
  anxious_romantic: 'nova', // warm and conversational
  guarded_intellectual: 'onyx', // deep and authoritative
  warm_empath: 'shimmer', // friendly and warm
  deep_thinker: 'echo', // contemplative
  passionate_creative: 'alloy' // expressive and dynamic
}

class VoiceSynthesisService {
  private elevenLabsApiKey: string | undefined
  private openaiClient: any
  
  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    this.openaiClient = openai
  }
  
  /**
   * Get voice settings based on user's personality archetype
   */
  async getVoiceSettings(userId: string): Promise<VoiceSettings> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: {
        archetype: true,
        voiceEnabled: true,
        companionVoice: true
      }
    })
    
    if (!profile || !profile.archetype) {
      return {
        provider: 'openai',
        voiceId: 'alloy',
        settings: { speed: 1.0 }
      }
    }
    
    // Use ElevenLabs if available and user has premium
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
      select: { plan: true }
    })
    
    const isPremium = subscription?.plan && ['premium', 'ultimate'].includes(subscription.plan)
    const useElevenLabs = isPremium && this.elevenLabsApiKey
    
    if (useElevenLabs) {
      const voiceConfig = ELEVENLABS_VOICES[profile.archetype as keyof typeof ELEVENLABS_VOICES]
      return {
        provider: 'elevenlabs',
        voiceId: voiceConfig?.voiceId || 'EXAVITQu4vr4xnSDxMaL',
        settings: voiceConfig?.settings || { stability: 0.7, similarity: 0.8 }
      }
    }
    
    // Fallback to OpenAI
    return {
      provider: 'openai',
      voiceId: OPENAI_VOICES[profile.archetype as keyof typeof OPENAI_VOICES] || 'alloy',
      settings: { speed: 1.0 }
    }
  }
  
  /**
   * Synthesize speech using ElevenLabs API
   */
  async synthesizeWithElevenLabs(
    text: string,
    voiceId: string,
    settings: any
  ): Promise<Buffer> {
    if (!this.elevenLabsApiKey) {
      throw new Error('ElevenLabs API key not configured')
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenLabsApiKey
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: settings.stability || 0.7,
            similarity_boost: settings.similarity || 0.8,
            style: settings.style || 0,
            use_speaker_boost: true
          }
        })
      }
    )
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
  
  /**
   * Synthesize speech using OpenAI TTS
   */
  async synthesizeWithOpenAI(
    text: string,
    voice: string,
    speed: number = 1.0
  ): Promise<Buffer> {
    const mp3 = await this.openaiClient.audio.speech.create({
      model: 'tts-1-hd', // Use HD model for better quality
      voice: voice as any,
      input: text,
      speed: speed
    })
    
    const buffer = Buffer.from(await mp3.arrayBuffer())
    return buffer
  }
  
  /**
   * Main synthesis method with automatic provider selection
   */
  async synthesize(params: SynthesizeSpeechParams & { userId?: string }): Promise<Buffer> {
    const { text, voice, speed = 1.0, provider, userId } = params
    
    try {
      // If userId provided, get personalized voice settings
      if (userId) {
        const voiceSettings = await this.getVoiceSettings(userId)
        
        if (voiceSettings.provider === 'elevenlabs') {
          return await this.synthesizeWithElevenLabs(
            text,
            voiceSettings.voiceId,
            voiceSettings.settings
          )
        } else {
          return await this.synthesizeWithOpenAI(
            text,
            voiceSettings.voiceId,
            voiceSettings.settings.speed || speed
          )
        }
      }
      
      // Manual provider selection
      if (provider === 'elevenlabs' && this.elevenLabsApiKey) {
        return await this.synthesizeWithElevenLabs(
          text,
          voice,
          { stability: 0.7, similarity: 0.8 }
        )
      }
      
      // Default to OpenAI
      return await this.synthesizeWithOpenAI(text, voice, speed)
      
    } catch (error) {
      console.error('Voice synthesis error:', error)
      
      // Fallback to OpenAI if ElevenLabs fails
      if (provider === 'elevenlabs') {
        console.log('Falling back to OpenAI TTS')
        return await this.synthesizeWithOpenAI(text, voice || 'alloy', speed)
      }
      
      throw new Error('Failed to synthesize speech')
    }
  }
  
  /**
   * Stream audio response for real-time playback
   */
  async streamAudioResponse(
    text: string,
    userId: string
  ): Promise<ReadableStream> {
    const voiceSettings = await this.getVoiceSettings(userId)
    
    if (voiceSettings.provider === 'elevenlabs' && this.elevenLabsApiKey) {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceSettings.voiceId}/stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: voiceSettings.settings,
            optimize_streaming_latency: 3
          })
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to stream audio')
      }
      
      return response.body as ReadableStream
    }
    
    // OpenAI doesn't support streaming, return synthesized audio as stream
    const buffer = await this.synthesizeWithOpenAI(
      text,
      voiceSettings.voiceId,
      voiceSettings.settings.speed
    )
    
    return new ReadableStream({
      start(controller) {
        controller.enqueue(buffer)
        controller.close()
      }
    })
  }
}

// Export singleton instance
export const voiceSynthesis = new VoiceSynthesisService()

// Export legacy function for backward compatibility
export async function synthesizeSpeech(params: SynthesizeSpeechParams): Promise<Buffer> {
  return voiceSynthesis.synthesize(params)
}