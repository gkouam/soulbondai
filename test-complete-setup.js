// Test Complete SoulBondAI Setup
// Run with: node test-complete-setup.js

require('dotenv').config({ path: '.env.local' });

async function testSetup() {
  console.log('🔍 Testing SoulBondAI Configuration...\n');
  
  let errors = [];
  let warnings = [];
  
  // 1. Check Critical Environment Variables
  console.log('1️⃣  Checking Environment Variables...');
  const requiredVars = {
    'DATABASE_URL': 'Database connection',
    'NEXTAUTH_SECRET': 'Authentication',
    'OPENAI_API_KEY': 'AI responses',
    'PINECONE_API_KEY': 'Vector memory',
    'PINECONE_INDEX_NAME': 'Memory storage',
    'STRIPE_SECRET_KEY': 'Payments',
    'STRIPE_WEBHOOK_SECRET': 'Payment webhooks',
    'RESEND_API_KEY': 'Email service'
  };
  
  for (const [key, description] of Object.entries(requiredVars)) {
    if (!process.env[key]) {
      errors.push(`❌ Missing ${key} (${description})`);
    } else {
      console.log(`   ✅ ${key} configured`);
    }
  }
  
  // 2. Test Pinecone Connection
  if (process.env.PINECONE_API_KEY) {
    console.log('\n2️⃣  Testing Pinecone Connection...');
    try {
      const { Pinecone } = require('@pinecone-database/pinecone');
      const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY
      });
      
      const index = pc.index('soulbond-memories');
      const stats = await index.describeIndexStats();
      console.log(`   ✅ Connected to Pinecone (${stats.totalRecordCount || 0} vectors stored)`);
    } catch (error) {
      errors.push(`❌ Pinecone connection failed: ${error.message}`);
    }
  }
  
  // 3. Test Database Connection
  if (process.env.DATABASE_URL) {
    console.log('\n3️⃣  Testing Database Connection...');
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      const userCount = await prisma.user.count();
      console.log(`   ✅ Database connected (${userCount} users)`);
      await prisma.$disconnect();
    } catch (error) {
      errors.push(`❌ Database connection failed: ${error.message}`);
    }
  }
  
  // 4. Check Optional but Recommended Variables
  console.log('\n4️⃣  Checking Optional Services...');
  const optionalVars = {
    'REDIS_URL': 'Caching (improves performance)',
    'PINECONE_HOST': 'Direct Pinecone connection',
    'DIRECT_URL': 'Database migrations',
    'ELEVENLABS_API_KEY': 'Voice synthesis'
  };
  
  for (const [key, description] of Object.entries(optionalVars)) {
    if (!process.env[key]) {
      warnings.push(`⚠️  ${key} not configured (${description})`);
    } else {
      console.log(`   ✅ ${key} configured`);
    }
  }
  
  // 5. Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CONFIGURATION SUMMARY\n');
  
  if (errors.length === 0) {
    console.log('✅ All critical services configured!');
    console.log('🚀 Your app is ready for production!');
  } else {
    console.log('❌ Critical Issues Found:\n');
    errors.forEach(e => console.log(`   ${e}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Optional Improvements:\n');
    warnings.forEach(w => console.log(`   ${w}`));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n📌 Next Steps:');
  console.log('1. Fix any critical issues above');
  console.log('2. Run: vercel --prod');
  console.log('3. Test at: https://soulbondai.com');
  console.log('4. Monitor logs: vercel logs --follow');
}

testSetup().catch(console.error);