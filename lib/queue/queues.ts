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

// Create queues only if Redis connection is available
// Otherwise, create mock queues that do nothing
const createQueue = (name: string, options: any = {}) => {
  if (!connection) {
    // Return a mock queue object that doesn't do anything
    return {
      add: async () => ({ id: 'mock-job-id' }),
      remove: async () => {},
      pause: async () => {},
      resume: async () => {},
      getJobs: async () => [],
      getJobCounts: async () => ({ active: 0, completed: 0, failed: 0, delayed: 0, waiting: 0 }),
    } as any
  }
  return new Queue(name, {
    connection,
    ...defaultQueueOptions,
    ...options,
  })
}

// Create queues
export const emailQueue = createQueue(QUEUE_NAMES.EMAIL)

export const aiGenerationQueue = createQueue(QUEUE_NAMES.AI_GENERATION, {
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 2, // Less retries for AI due to cost
  },
})

export const voiceSynthesisQueue = createQueue(QUEUE_NAMES.VOICE_SYNTHESIS)

export const imageProcessingQueue = createQueue(QUEUE_NAMES.IMAGE_PROCESSING)

export const dataExportQueue = createQueue(QUEUE_NAMES.DATA_EXPORT, {
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    attempts: 5, // More retries for important data exports
  },
})

export const analyticsQueue = createQueue(QUEUE_NAMES.ANALYTICS, {
  defaultJobOptions: {
    ...defaultQueueOptions.defaultJobOptions,
    priority: 10, // Lower priority
  },
})

export const cleanupQueue = createQueue(QUEUE_NAMES.CLEANUP, {
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