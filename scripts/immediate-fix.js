// Immediate subscription fix for ceo@quantumdense.com
// Run: node scripts/immediate-fix.js

const https = require('https');

// Your subscription details from Stripe
const subscriptionData = {
  email: "ceo@quantumdense.com",
  customerId: "cus_SrwhgaVj2uzKHy",
  subscriptionId: "sub_1RwConBcr8Xl5mUrm2352fm2",
  plan: "basic",
  priceId: "price_1Rt5eZBcr8Xl5mUrO9VTBzn0"
};

console.log('📋 Subscription Fix Instructions');
console.log('================================\n');

console.log('Your subscription details:');
console.log(`Email: ${subscriptionData.email}`);
console.log(`Plan: Basic ($9.99/month)`);
console.log(`Stripe Customer: ${subscriptionData.customerId}`);
console.log(`Stripe Subscription: ${subscriptionData.subscriptionId}\n`);

console.log('Option 1: Use the Fix Page (Easiest)');
console.log('-------------------------------------');
console.log('1. Go to: https://soulbondai.com/dashboard/fix-subscription');
console.log('2. Click "Fix Subscription Now"');
console.log('3. Your Basic plan will be activated immediately\n');

console.log('Option 2: Manual Database Update');
console.log('---------------------------------');
console.log('If the fix page doesn\'t work, you can manually update the database:');
console.log('\n// SQL to run in your database:');
console.log(`
UPDATE "Subscription" 
SET 
  "stripeCustomerId" = '${subscriptionData.customerId}',
  "stripeSubscriptionId" = '${subscriptionData.subscriptionId}',
  "stripePriceId" = '${subscriptionData.priceId}',
  "plan" = 'basic',
  "status" = 'active',
  "currentPeriodEnd" = NOW() + INTERVAL '30 days'
WHERE "userId" = (
  SELECT id FROM "User" WHERE email = '${subscriptionData.email}'
);
`);

console.log('\nOption 3: API Call');
console.log('------------------');
console.log('You can also make this API call while logged in:');
console.log(`
fetch('/api/admin/fix-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: '${subscriptionData.email}',
    customerId: '${subscriptionData.customerId}',
    subscriptionId: '${subscriptionData.subscriptionId}',
    plan: 'basic'
  })
}).then(r => r.json()).then(console.log);
`);

console.log('\n✅ Your payment was successful!');
console.log('The webhook configuration issue has been fixed for future payments.');
console.log('Use any of the options above to activate your Basic plan now.');