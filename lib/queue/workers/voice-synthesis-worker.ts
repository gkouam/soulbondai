import { Worker } from 'bullmq'
import { connection } from '../redis-connection'
import { QUEUE_NAMES } from '../queues'
import { synthesizeSpeech } from '@/lib/voice/synthesis'
import { uploadToS3 } from '@/lib/s3'
import { prisma } from '@/lib/prisma'

interface VoiceSynthesisJobData {
  messageId: string
  text: string
  voice: string
  userId: string
}

// Create a mock worker if no Redis connection
const mockWorker = {
  on: () => {},
  close: async () => {},
} as any

// Only create worker if we have a Redis connection
export const voiceSynthesisWorker = connection ? new Worker<VoiceSynthesisJobData>(
  QUEUE_NAMES.VOICE_SYNTHESIS,
  async (job) => {
    const { messageId, text, voice, userId } = job.data
    
    console.log(`Processing voice synthesis job ${job.id} for message ${messageId}`)
    
    try {
      // Update progress
      await job.updateProgress(10)
      
      // Synthesize speech
      const audioBuffer = await synthesizeSpeech({
        text,
        voice,
        speed: 1.0,
      })
      
      await job.updateProgress(50)
      
      // Upload to S3
      const key = `voice/${userId}/${messageId}.mp3`
      const audioUrl = await uploadToS3({
        key,
        body: audioBuffer,
        contentType: 'audio/mpeg',
      })
      
      await job.updateProgress(80)
      
      // Update message with audio URL
      await prisma.message.update({
        where: { id: messageId },
        data: {
          audioUrl,
          metadata: {
            voice,
            synthesizedAt: new Date().toISOString(),
          }
        }
      })
      
      await job.updateProgress(100)
      
      return {
        messageId,
        audioUrl,
      }
    } catch (error) {
      console.error(`Voice synthesis job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 60000, // 20 voice syntheses per minute
    },
  }
) : mockWorker

// Only set up event handlers if we have a real worker
if (connection) {
  voiceSynthesisWorker.on('completed', (job: any) => {
    console.log(`Voice synthesis job ${job.id} completed`)
  })

  voiceSynthesisWorker.on('failed', (job: any, err: Error) => {
    console.error(`Voice synthesis job ${job?.id} failed:`, err)
  })
}