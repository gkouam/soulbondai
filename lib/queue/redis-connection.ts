import Redis from 'ioredis'

// Create Redis connection only if Redis URL is provided
// For Upstash, use the Redis URL from environment
let connection: Redis | null = null

if (process.env.REDIS_URL && !process.env.REDIS_URL.includes('upstash')) {
  // Traditional Redis connection
  connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true, // Don't connect immediately
  })

  connection.on('error', (error) => {
    // Suppress connection errors in development/production without Redis
    if (process.env.NODE_ENV === 'development') {
      console.log('Redis not available - running without Redis cache')
    }
  })

  connection.on('connect', () => {
    console.log('Connected to Redis')
  })
} else {
  // For Upstash or no Redis, we'll use the REST API approach
  console.log('Using Upstash Redis or running without Redis cache')
}

// Export a mock connection if Redis is not available
export { connection }