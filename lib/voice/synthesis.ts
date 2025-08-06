import { openai } from '@/lib/openai'

interface SynthesizeSpeechParams {
  text: string
  voice: string
  speed?: number
}

export async function synthesizeSpeech(params: SynthesizeSpeechParams): Promise<Buffer> {
  const { text, voice, speed = 1.0 } = params
  
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any,
      input: text,
      speed: speed,
    })
    
    const buffer = Buffer.from(await mp3.arrayBuffer())
    return buffer
  } catch (error) {
    console.error('Voice synthesis error:', error)
    throw new Error('Failed to synthesize speech')
  }
}