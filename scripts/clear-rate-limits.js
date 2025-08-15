// Script to clear rate limits for a user
// Run in browser console while logged in

fetch('/api/admin/reset-user-limits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'ceo@quantumdense.com' })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Rate limits cleared:', data);
  
  // Now check your current limits
  return fetch('/api/rate-limits');
})
.then(r => r.json())
.then(limits => {
  console.log('📊 Current limits:', limits);
  console.log(`Messages: ${limits.chat?.remaining || 200} remaining of ${limits.chat?.limit || 200}`);
  console.log(`Plan: ${limits.plan}`);
  
  // Check feature access
  return fetch('/api/features/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      features: ['voice_messages', 'photo_sharing']
    })
  });
})
.then(r => r.json())
.then(features => {
  console.log('🎯 Feature access:', features);
  console.log('Voice messages:', features.access?.voice_messages ? '✅ Enabled' : '❌ Disabled');
  console.log('Photo sharing:', features.access?.photo_sharing ? '✅ Enabled' : '❌ Disabled');
})
.catch(error => {
  console.error('❌ Error:', error);
});