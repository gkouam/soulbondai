# Redis Setup Guide for SoulBond AI

## Overview
SoulBond AI uses Redis for caching, session management, rate limiting, and job queues. The application works without Redis but performs better with it enabled.

## Option 1: Upstash Redis (Recommended for Production)

### Step 1: Create Upstash Account
1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Verify your email

### Step 2: Create Redis Database
1. Click "Create Database"
2. Configure your database:
   - **Name**: `soulbondai-redis`
   - **Type**: Select "Global" for better performance
   - **Region**: Choose closest to your Vercel deployment (e.g., US-East-1)
   - **Plan**: Free tier (10,000 commands/day)
3. Click "Create"

### Step 3: Get Your Credentials
From your Upstash dashboard, copy:
- **REST URL**: `https://your-endpoint.upstash.io`
- **REST Token**: `AX...` (long token string)

### Step 4: Add to Environment Variables

#### Local Development (.env.local)
```env
# Upstash Redis
REDIS_URL=https://your-endpoint.upstash.io
REDIS_TOKEN=your-rest-token-here
```

#### Vercel Production
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `soulbondai` project
3. Go to Settings → Environment Variables
4. Add:
   - `REDIS_URL` = Your Upstash REST URL
   - `REDIS_TOKEN` = Your Upstash REST Token

## Option 2: Local Redis (Development Only)

### Install Redis Locally
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (WSL)
sudo apt-get install redis-server
redis-server
```

### Configure for Local Redis
```env
# Local Redis (development only)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD= # Leave empty for local
```

## Option 3: Redis Cloud (Alternative)

1. Sign up at [Redis Cloud](https://redis.com/cloud/sign-up/)
2. Create a free database
3. Get connection string
4. Add to environment:
```env
REDIS_URL=redis://default:password@redis-endpoint.com:port
```

## Features Enabled by Redis

### With Redis Enabled:
- ✅ **Session Caching**: Faster session lookups
- ✅ **Rate Limiting**: API protection (100 requests/minute)
- ✅ **Response Caching**: AI responses cached for 1 hour
- ✅ **User Presence**: Real-time online/offline status
- ✅ **Job Queues**: Background email and voice processing
- ✅ **Analytics**: Faster dashboard stats

### Without Redis:
- ✅ **App Still Works**: Falls back to database
- ⚠️ **Slower Performance**: No caching
- ⚠️ **No Rate Limiting**: Relies on Vercel limits
- ⚠️ **No Background Jobs**: Synchronous processing only

## Verification

### Test Redis Connection
```javascript
// test-redis.js
const { Redis } = require('@upstash/redis')

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

async function test() {
  try {
    await redis.set('test', 'Hello Redis!')
    const value = await redis.get('test')
    console.log('Redis working:', value)
  } catch (error) {
    console.error('Redis error:', error)
  }
}

test()
```

Run: `node test-redis.js`

### Check in Application
1. Deploy to Vercel
2. Check logs: `vercel logs`
3. Look for: "Connected to Redis" or "Using Upstash Redis"

## Monitoring

### Upstash Dashboard
- View metrics at [console.upstash.com](https://console.upstash.com)
- Monitor:
  - Commands per day
  - Data usage
  - Latency
  - Error rate

### Application Metrics
Check `/admin/analytics` when logged in as admin to see:
- Cache hit rate
- Queue sizes
- Rate limit stats

## Troubleshooting

### Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Redis is not configured. Either:
1. Set up Upstash Redis (recommended)
2. Start local Redis server
3. App will work without Redis (with reduced performance)

### Authentication Failed
```
Error: ERR wrong password
```
**Solution**: Check your `REDIS_TOKEN` or `REDIS_PASSWORD`

### Rate Limit Exceeded
```
Error: Free tier limit exceeded
```
**Solution**: 
1. Upgrade Upstash plan
2. Optimize cache usage
3. Reduce TTL for cached items

## Cost Optimization

### Free Tier Limits
- **Upstash**: 10,000 commands/day
- **Redis Cloud**: 30MB storage

### Tips to Stay Within Limits
1. Set appropriate TTLs (5-60 minutes)
2. Cache only expensive operations
3. Use database for persistent data
4. Clear cache periodically

## Security Best Practices

1. **Never commit Redis credentials**
2. **Use different Redis instances for dev/prod**
3. **Enable SSL/TLS (automatic with Upstash)**
4. **Rotate tokens regularly**
5. **Monitor for unusual activity**

## Support

- **Upstash Docs**: [docs.upstash.com](https://docs.upstash.com)
- **Redis Docs**: [redis.io/docs](https://redis.io/docs)
- **SoulBond AI Issues**: [GitHub Issues](https://github.com/yourusername/soulbondai/issues)