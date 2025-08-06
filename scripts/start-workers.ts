import { queueManager } from '@/lib/queue/queue-manager'

async function startWorkers() {
  console.log('🚀 Starting queue workers...')
  
  try {
    await queueManager.start()
    
    console.log('✅ Queue workers started successfully')
    console.log('📊 Workers are now processing jobs')
    
    // Keep the process running
    process.on('SIGTERM', async () => {
      console.log('📛 SIGTERM received, shutting down workers...')
      await queueManager.stop()
      process.exit(0)
    })
    
    process.on('SIGINT', async () => {
      console.log('📛 SIGINT received, shutting down workers...')
      await queueManager.stop()
      process.exit(0)
    })
    
    // Log stats every 30 seconds
    setInterval(async () => {
      const stats = await queueManager.getQueueStats()
      console.log('📊 Queue Statistics:', JSON.stringify(stats, null, 2))
    }, 30000)
    
  } catch (error) {
    console.error('❌ Failed to start workers:', error)
    process.exit(1)
  }
}

// Start workers
startWorkers()