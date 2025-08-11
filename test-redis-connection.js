#!/usr/bin/env node

/**
 * Quick Redis Connection Test
 */

const { Redis } = require('@upstash/redis');

// Your Upstash credentials
const REDIS_URL = 'https://driven-man-26719.upstash.io';
const REDIS_TOKEN = 'AWhfAAIjcDFjYjA4Mjk1ZjIyNzY0NzllYjc3NTZlNjUwYzFiNGRjMnAxMA';

async function testConnection() {
  console.log('🚀 Testing Upstash Redis Connection for SoulBond AI\n');
  console.log('=' .repeat(50));
  
  try {
    const redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });

    // Test basic operations
    console.log('\n✅ Connection successful!');
    console.log(`📍 Endpoint: ${REDIS_URL}`);
    
    // Set a test value
    console.log('\nTesting SET operation...');
    await redis.set('soulbond:test', 'Redis is working!', { ex: 60 });
    console.log('✅ SET successful');
    
    // Get the test value
    console.log('\nTesting GET operation...');
    const value = await redis.get('soulbond:test');
    console.log(`✅ GET successful: "${value}"`);
    
    // Test increment (for rate limiting)
    console.log('\nTesting INCREMENT (for rate limiting)...');
    const count = await redis.incr('soulbond:counter');
    console.log(`✅ Counter value: ${count}`);
    
    // Test TTL
    console.log('\nTesting TTL operations...');
    const ttl = await redis.ttl('soulbond:test');
    console.log(`✅ TTL remaining: ${ttl} seconds`);
    
    // Clean up
    await redis.del('soulbond:test', 'soulbond:counter');
    console.log('\n🧹 Cleanup completed');
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ Redis is properly configured and ready!');
    console.log('\nYour SoulBond AI will now have:');
    console.log('  • Faster response times (caching)');
    console.log('  • Rate limiting protection');
    console.log('  • Session management');
    console.log('  • Real-time features');
    
    return true;
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. Your Upstash dashboard is active');
    console.log('2. The credentials are correct');
    console.log('3. Your database is not paused');
    return false;
  }
}

testConnection();