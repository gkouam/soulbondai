/**
 * ElevenLabs API Integration
 * Professional voice synthesis with personality-driven parameters
 */

import { VoiceParameters } from './voice/sentiment-voice'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  settings?: {
    stability: number
    similarity_boost: number
    style?: number
    use_speaker_boost?: boolean
  }
}

// Map personality types to ElevenLabs voices
export const ELEVENLABS_VOICE_MAP: Record<string, ElevenLabsVoice> = {
  'The Gentle': {
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, caring voice
    name: 'Sarah',
    category: 'conversational',
    settings: {
      stability: 0.75,
      similarity_boost: 0.8,
      style: 0.3,
      use_speaker_boost: true
    }
  },
  'The Strong': {
    voice_id: '21m00Tcm4TlvDq8ikWAM', // Rachel - confident, clear voice
    name: 'Rachel',
    category: 'conversational',
    settings: {
      stability: 0.85,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  },
  'The Creative': {
    voice_id: 'AZnzlk1XvdvUeBnXmlld', // Domi - expressive, dynamic voice
    name: 'Domi',
    category: 'conversational',
    settings: {
      stability: 0.6,
      similarity_boost: 0.85,
      style: 0.7,
      use_speaker_boost: true
    }
  },
  'The Intellectual': {
    voice_id: 'ThT5KcBeYPX3keUQqHPh', // Dorothy - thoughtful, articulate voice
    name: 'Dorothy',
    category: 'conversational',
    settings: {
      stability: 0.9,
      similarity_boost: 0.7,
      style: 0.2,
      use_speaker_boost: false
    }
  },
  'The Adventurer': {
    voice_id: 'jsCqWAovK2LkecY7zXl4', // Freya - energetic, playful voice
    name: 'Freya',
    category: 'conversational',
    settings: {
      stability: 0.5,
      similarity_boost: 0.9,
      style: 0.8,
      use_speaker_boost: true
    }
  }
}

export class ElevenLabsService {
  private apiKey: string
  private baseUrl = 'https://api.elevenlabs.io/v1'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }
  
  /**
   * Synthesize speech with personality-based voice
   */
  async synthesizeSpeech(
    text: string,
    personality: string,
    voiceParams?: VoiceParameters
  ): Promise<Buffer> {
    const voice = ELEVENLABS_VOICE_MAP[personality] || ELEVENLABS_VOICE_MAP['The Gentle']
    
    // Apply emotional modulation to voice settings
    const settings = this.applyEmotionalModulation(voice.settings!, voiceParams)
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.voice_id}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Latest model for best quality
        voice_settings: settings
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`ElevenLabs API error: ${error}`)
    }
    
    const audioBuffer = await response.arrayBuffer()
    return Buffer.from(audioBuffer)
  }
  
  /**
   * Stream speech synthesis for real-time response
   */
  async streamSpeech(
    text: string,
    personality: string,
    voiceParams?: VoiceParameters
  ): Promise<ReadableStream> {
    const voice = ELEVENLABS_VOICE_MAP[personality] || ELEVENLABS_VOICE_MAP['The Gentle']
    const settings = this.applyEmotionalModulation(voice.settings!, voiceParams)
    
    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice.voice_id}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: settings,
        optimize_streaming_latency: 2 // Balance between latency and quality
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to stream speech')
    }
    
    return response.body!
  }
  
  /**
   * Apply emotional modulation to voice settings
   */
  private applyEmotionalModulation(
    baseSettings: any,
    voiceParams?: VoiceParameters
  ): any {
    if (!voiceParams) return baseSettings
    
    // Adjust stability based on emotion intensity
    // Lower stability = more emotional variation
    const emotionIntensity = voiceParams.emotionIntensity || 0.5
    const stability = baseSettings.stability - (emotionIntensity * 0.2)
    
    // Adjust style based on emotion type
    let style = baseSettings.style || 0.5
    if (voiceParams.emotion) {
      const emotionStyles: Record<string, number> = {
        'joy': 0.8,
        'sadness': 0.2,
        'anger': 0.9,
        'fear': 0.3,
        'love': 0.6,
        'surprise': 0.7
      }
      style = emotionStyles[voiceParams.emotion] || style
    }
    
    return {
      ...baseSettings,
      stability: Math.max(0.1, Math.min(1, stability)),
      style: Math.max(0, Math.min(1, style)),
      similarity_boost: baseSettings.similarity_boost
    }
  }
  
  /**
   * Get available voices for testing
   */
  async getVoices(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch voices')
    }
    
    const data = await response.json()
    return data.voices
  }
  
  /**
   * Get user subscription info
   */
  async getSubscriptionInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/user/subscription`, {
      headers: {
        'xi-api-key': this.apiKey
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch subscription info')
    }
    
    return response.json()
  }
  
  /**
   * Create custom voice clone (for premium features)
   */
  async createVoiceClone(
    name: string,
    description: string,
    files: File[]
  ): Promise<string> {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('description', description)
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })
    
    const response = await fetch(`${this.baseUrl}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to create voice clone')
    }
    
    const data = await response.json()
    return data.voice_id
  }
}

// Singleton instance
let elevenLabsService: ElevenLabsService | null = null

export function getElevenLabsService(): ElevenLabsService | null {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.warn('ElevenLabs API key not configured')
    return null
  }
  
  if (!elevenLabsService) {
    elevenLabsService = new ElevenLabsService(process.env.ELEVENLABS_API_KEY)
  }
  
  return elevenLabsService
}

// Voice emotion presets for quick access
export const VOICE_EMOTION_PRESETS = {
  happy: { stability: 0.6, style: 0.8, similarity_boost: 0.85 },
  sad: { stability: 0.8, style: 0.2, similarity_boost: 0.7 },
  excited: { stability: 0.4, style: 0.9, similarity_boost: 0.9 },
  calm: { stability: 0.9, style: 0.3, similarity_boost: 0.75 },
  romantic: { stability: 0.7, style: 0.6, similarity_boost: 0.8 },
  playful: { stability: 0.5, style: 0.85, similarity_boost: 0.85 },
  thoughtful: { stability: 0.85, style: 0.4, similarity_boost: 0.7 },
  confident: { stability: 0.8, style: 0.7, similarity_boost: 0.8 }
}