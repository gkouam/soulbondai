import { Queue } from 'bullmq'
import { connection } from './redis-connection'

// Define queue names
export const QUEUE_NAMES = {
  EMAIL: 'email',
  AI_GENERATION: 'ai-generation',
  VOICE_SYNTHESIS: 'voice-synthesis',
  IMAGE_PROCESSING: 'image-processing',
  DATA_EXPORT: 'data-export',
  ANALYTICS: 'analytics',
  CLEANUP: 'cleanup',
} as const

// Queue options with different priorities
const defaultQueueOptions = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // 24 hours
      count: 100,
    },
    removeOnFail: {
      age: 24 * 3600 * 7, // 7 days
    },
  },
}

// Create queues
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection,
  ...defaultQueueOptions,
})

export const aiGenerationQueue = new Queue(QUEUE_NAMES.AI_GENERATION, {
  connection,
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 2, // Less retries for AI due to cost
  },
})

export const voiceSynthesisQueue = new Queue(QUEUE_NAMES.VOICE_SYNTHESIS, {
  connection,
  ...defaultQueueOptions,
})

export const imageProcessingQueue = new Queue(QUEUE_NAMES.IMAGE_PROCESSING, {
  connection,
  ...defaultQueueOptions,
})

export const dataExportQueue = new Queue(QUEUE_NAMES.DATA_EXPORT, {
  connection,
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for important data exports
  },
})

export const analyticsQueue = new Queue(QUEUE_NAMES.ANALYTICS, {
  connection,
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 10, // Lower priority
  },
})

export const cleanupQueue = new Queue(QUEUE_NAMES.CLEANUP, {
  connection,
  ...defaultQueueOptions,
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 5, // Lowest priority
    repeat: {
      pattern: '0 3 * * *', // Run at 3 AM daily
    },
  },
})

// Export all queues
export const queues = {
  email: emailQueue,
  aiGeneration: aiGenerationQueue,
  voiceSynthesis: voiceSynthesisQueue,
  imageProcessing: imageProcessingQueue,
  dataExport: dataExportQueue,
  analytics: analyticsQueue,
  cleanup: cleanupQueue,
}