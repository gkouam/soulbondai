import { emailWorker } from './workers/email-worker'
import { aiGenerationWorker } from './workers/ai-generation-worker'
import { voiceSynthesisWorker } from './workers/voice-synthesis-worker'
import { queues } from './queues'

export class QueueManager {
  private static instance: QueueManager
  private workers = [
    emailWorker,
    aiGenerationWorker,
    voiceSynthesisWorker,
  ]

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager()
    }
    return QueueManager.instance
  }

  async start() {
    console.log('Starting queue workers...')
    
    // Workers are automatically started when imported
    console.log('Queue workers started successfully')
  }

  async stop() {
    console.log('Stopping queue workers...')
    
    await Promise.all(
      this.workers.map(worker => worker.close())
    )
    
    console.log('Queue workers stopped')
  }

  async getQueueStats() {
    const stats: Record<string, any> = {}
    
    for (const [name, queue] of Object.entries(queues)) {
      const counts = await queue.getJobCounts()
      stats[name] = {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      }
    }
    
    return stats
  }

  // Helper methods to add jobs
  async addEmailJob(data: any, options?: any) {
    return queues.email.add('send-email', data, options)
  }

  async addAIGenerationJob(data: any, options?: any) {
    return queues.aiGeneration.add('generate-response', data, {
      priority: options?.priority || 1,
      ...options
    })
  }

  async addVoiceSynthesisJob(data: any, options?: any) {
    return queues.voiceSynthesis.add('synthesize-voice', data, options)
  }

  async addImageProcessingJob(data: any, options?: any) {
    return queues.imageProcessing.add('process-image', data, options)
  }

  async addDataExportJob(data: any, options?: any) {
    return queues.dataExport.add('export-data', data, {
      priority: 2, // Higher priority for data exports
      ...options
    })
  }

  async addAnalyticsJob(data: any, options?: any) {
    return queues.analytics.add('track-event', data, {
      delay: 5000, // Delay analytics by 5 seconds
      ...options
    })
  }
}

// Export singleton instance
export const queueManager = QueueManager.getInstance()