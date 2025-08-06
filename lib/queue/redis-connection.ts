import Redis from 'ioredis'

// Create Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

connection.on('error', (error) => {
  console.error('Redis connection error:', error)
})

connection.on('connect', () => {
  console.log('Connected to Redis')
})

export { connection }