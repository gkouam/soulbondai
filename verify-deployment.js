#!/usr/bin/env node
/**
 * Production Deployment Verification
 * Tests all critical production services
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 SoulBondAI Production Deployment Verification');
console.log('================================================\n');

// Load production environment
const envPath = path.join(__dirname, '.env.production');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📋 Environment Configuration:');
  console.log('-----------------------------');
  
  lines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        // Mask sensitive values
        let displayValue = value;
        if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
          displayValue = value.substring(0, 10) + '...[MASKED]';
        } else if (key.includes('URL') && value.includes('@')) {
          // Mask database passwords in URLs
          displayValue = value.replace(/:([^:@]+)@/, ':****@');
        }
        console.log(`  ${key}: ${displayValue}`);
      }
    }
  });
  
  console.log('\n✅ Environment file loaded successfully');
} else {
  console.log('❌ Production environment file not found!');
  console.log('   Please create .env.production with required variables');
}

console.log('\n📊 Checking Required Services:');
console.log('------------------------------');

// Check for required environment variables
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PINECONE_API_KEY',
  'UPSTASH_REDIS_REST_URL'
];

const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
}

let allPresent = true;
requiredVars.forEach(varName => {
  if (envVars[varName] && envVars[varName] !== '${' + varName + '}') {
    console.log(`  ✅ ${varName}: Configured`);
  } else {
    console.log(`  ❌ ${varName}: Missing or placeholder`);
    allPresent = false;
  }
});

console.log('\n📁 Checking Critical Files:');
console.log('---------------------------');

const criticalFiles = [
  'package.json',
  'next.config.ts',
  'prisma/schema.prisma',
  'vercel.json',
  'lib/stripe-pricing.ts',
  'lib/analytics-service.ts',
  'app/api/admin/analytics/route.ts',
  'app/api/stripe/webhook/route.ts'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`  ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`  ❌ ${file}: Not found`);
  }
});

console.log('\n💰 Checking Pricing Configuration:');
console.log('-----------------------------------');

const pricingPath = path.join(__dirname, 'lib/stripe-pricing.ts');
if (fs.existsSync(pricingPath)) {
  const pricingContent = fs.readFileSync(pricingPath, 'utf8');
  
  // Check for correct Ultimate tier pricing
  if (pricingContent.includes('monthlyPrice: 29.99')) {
    console.log('  ✅ Ultimate tier: $29.99/month (Correct)');
  } else if (pricingContent.includes('monthlyPrice: 39.99')) {
    console.log('  ❌ Ultimate tier: $39.99/month (Should be $29.99)');
  } else {
    console.log('  ⚠️  Ultimate tier pricing not found');
  }
  
  // Check other tiers
  if (pricingContent.includes('monthlyPrice: 9.99')) {
    console.log('  ✅ Basic tier: $9.99/month');
  }
  if (pricingContent.includes('monthlyPrice: 19.99')) {
    console.log('  ✅ Premium tier: $19.99/month');
  }
}

console.log('\n🔒 Security Configuration:');
console.log('--------------------------');

const vercelConfigPath = path.join(__dirname, 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  if (vercelConfig.headers && vercelConfig.headers.length > 0) {
    console.log('  ✅ Security headers configured');
    const securityHeaders = vercelConfig.headers[0].headers;
    const importantHeaders = [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Frame-Options'
    ];
    
    importantHeaders.forEach(header => {
      const found = securityHeaders.find(h => h.key === header);
      if (found) {
        console.log(`     ✓ ${header}`);
      }
    });
  } else {
    console.log('  ❌ Security headers not configured');
  }
}

console.log('\n📊 Analytics Service Check:');
console.log('---------------------------');

const analyticsPath = path.join(__dirname, 'lib/analytics-service.ts');
if (fs.existsSync(analyticsPath)) {
  const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
  
  // Check for real database queries
  if (analyticsContent.includes('prisma.user.count()') && 
      analyticsContent.includes('prisma.payment.findMany')) {
    console.log('  ✅ Real database queries implemented');
  } else {
    console.log('  ❌ Still using mock data');
  }
  
  // Check for key metrics
  const metrics = ['DAU', 'WAU', 'MAU', 'MRR', 'ARR'];
  metrics.forEach(metric => {
    if (analyticsContent.toLowerCase().includes(metric.toLowerCase())) {
      console.log(`     ✓ ${metric} calculation present`);
    }
  });
}

console.log('\n🎯 Deployment Readiness Summary:');
console.log('================================');

const checks = {
  'Environment Configuration': fs.existsSync(envPath),
  'Required Variables': allPresent,
  'Pricing Fixed ($29.99)': fs.existsSync(pricingPath) && 
    fs.readFileSync(pricingPath, 'utf8').includes('monthlyPrice: 29.99'),
  'Analytics Connected': fs.existsSync(analyticsPath) && 
    fs.readFileSync(analyticsPath, 'utf8').includes('prisma.user.count()'),
  'Security Headers': fs.existsSync(vercelConfigPath) && 
    JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8')).headers?.length > 0
};

let readyCount = 0;
Object.entries(checks).forEach(([check, status]) => {
  console.log(`  ${status ? '✅' : '❌'} ${check}`);
  if (status) readyCount++;
});

const readyPercentage = Math.round((readyCount / Object.keys(checks).length) * 100);
console.log(`\n🎯 Overall Readiness: ${readyPercentage}%`);

if (readyPercentage === 100) {
  console.log('\n✨ Application is READY for production deployment!');
  console.log('\nNext steps:');
  console.log('1. Set environment variables in Vercel dashboard');
  console.log('2. Run: vercel --prod');
  console.log('3. Configure Stripe webhook endpoint');
  console.log('4. Test all features on production');
} else if (readyPercentage >= 80) {
  console.log('\n⚠️  Application is mostly ready but needs some fixes');
} else {
  console.log('\n❌ Application needs significant work before deployment');
}

console.log('\n================================================');
console.log('Verification completed at:', new Date().toISOString());