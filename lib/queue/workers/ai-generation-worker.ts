import { Worker } from 'bullmq'
import { connection } from '../redis-connection'
import { QUEUE_NAMES } from '../queues'
import { generateAIResponse } from '@/lib/ai/chat'
import { prisma } from '@/lib/prisma'

interface AIGenerationJobData {
  conversationId: string
  userId: string
  message: string
  characterId: string
  context?: any
}

export const aiGenerationWorker = new Worker<AIGenerationJobData>(
  QUEUE_NAMES.AI_GENERATION,
  async (job) => {
    const { conversationId, userId, message, characterId, context } = job.data
    
    console.log(`Processing AI generation job ${job.id} for conversation ${conversationId}`)
    
    try {
      // Update job progress
      await job.updateProgress(10)
      
      // Get conversation history
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          character: true,
        }
      })
      
      if (!conversation) {
        throw new Error('Conversation not found')
      }
      
      await job.updateProgress(30)
      
      // Generate AI response
      const aiResponse = await generateAIResponse({
        message,
        conversation,
        character: conversation.character,
        context,
      })
      
      await job.updateProgress(70)
      
      // Save the response
      const savedMessage = await prisma.message.create({
        data: {
          conversationId,
          content: aiResponse.content,
          role: 'assistant',
          metadata: aiResponse.metadata,
        }
      })
      
      await job.updateProgress(90)
      
      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        }
      })
      
      await job.updateProgress(100)
      
      return {
        messageId: savedMessage.id,
        content: savedMessage.content,
        metadata: savedMessage.metadata,
      }
    } catch (error) {
      console.error(`AI generation job ${job.id} failed:`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 3, // Process 3 AI requests concurrently
    limiter: {
      max: 10,
      duration: 60000, // 10 requests per minute
    },
  }
)

aiGenerationWorker.on('completed', (job) => {
  console.log(`AI generation job ${job.id} completed`)
})

aiGenerationWorker.on('failed', (job, err) => {
  console.error(`AI generation job ${job?.id} failed:`, err)
})

aiGenerationWorker.on('progress', (job, progress) => {
  console.log(`AI generation job ${job.id} progress: ${progress}%`)
})