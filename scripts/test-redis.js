#!/usr/bin/env node

/**
 * Test Redis Connection Script
 * Usage: node scripts/test-redis.js
 */

require('dotenv').config({ path: '.env.local' });

async function testUpstashRedis() {
  console.log('Testing Upstash Redis connection...\n');
  
  const { Redis } = require('@upstash/redis');
  
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
    console.error('❌ Missing REDIS_URL or REDIS_TOKEN in environment variables');
    console.log('\nPlease add to .env.local:');
    console.log('REDIS_URL=https://your-endpoint.upstash.io');
    console.log('REDIS_TOKEN=your-token-here');
    return false;
  }

  try {
    const redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });

    // Test basic operations
    console.log('1. Testing SET operation...');
    await redis.set('test:key', 'Hello from SoulBond AI!');
    console.log('✅ SET successful');

    console.log('\n2. Testing GET operation...');
    const value = await redis.get('test:key');
    console.log(`✅ GET successful: "${value}"`);

    console.log('\n3. Testing EXPIRE operation...');
    await redis.expire('test:key', 60);
    console.log('✅ EXPIRE successful (60 seconds)');

    console.log('\n4. Testing INCREMENT operation...');
    const count = await redis.incr('test:counter');
    console.log(`✅ INCREMENT successful: ${count}`);

    console.log('\n5. Testing LIST operations...');
    await redis.lpush('test:queue', 'job1', 'job2', 'job3');
    const jobs = await redis.lrange('test:queue', 0, -1);
    console.log(`✅ LIST successful: ${JSON.stringify(jobs)}`);

    console.log('\n6. Testing HASH operations...');
    await redis.hset('test:user', {
      name: 'Test User',
      email: 'test@soulbondai.com',
      role: 'USER'
    });
    const user = await redis.hgetall('test:user');
    console.log(`✅ HASH successful: ${JSON.stringify(user)}`);

    // Clean up test keys
    console.log('\n7. Cleaning up test keys...');
    await redis.del('test:key', 'test:counter', 'test:queue', 'test:user');
    console.log('✅ Cleanup successful');

    // Get database info
    console.log('\n📊 Redis Info:');
    console.log(`- Endpoint: ${process.env.REDIS_URL}`);
    console.log(`- Status: Connected`);
    
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

async function testTraditionalRedis() {
  console.log('Testing traditional Redis connection...\n');
  
  const Redis = require('ioredis');
  
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    console.log('✅ Connected to Redis');
    
    await redis.set('test', 'Hello');
    const value = await redis.get('test');
    console.log(`✅ Test successful: ${value}`);
    
    await redis.del('test');
    await redis.quit();
    
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 SoulBond AI - Redis Connection Test\n');
  console.log('=' .repeat(50));
  
  let success = false;
  
  // Check which type of Redis to test
  if (process.env.REDIS_URL && process.env.REDIS_URL.includes('upstash')) {
    success = await testUpstashRedis();
  } else if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    success = await testTraditionalRedis();
  } else {
    console.log('ℹ️  No Redis configuration found');
    console.log('\nThe application will work without Redis, but with reduced performance.');
    console.log('To enable Redis, follow the setup guide in REDIS_SETUP.md');
  }
  
  console.log('\n' + '=' .repeat(50));
  
  if (success) {
    console.log('✅ Redis is properly configured and working!');
    console.log('\nYour application will benefit from:');
    console.log('- Faster response times (caching)');
    console.log('- Rate limiting protection');
    console.log('- Background job processing');
    console.log('- Real-time user presence');
  } else {
    console.log('⚠️  Redis is not configured or not working');
    console.log('\nThe application will still work but without:');
    console.log('- Response caching (slower)');
    console.log('- Advanced rate limiting');
    console.log('- Background job queues');
    console.log('\nTo enable Redis, see REDIS_SETUP.md');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);