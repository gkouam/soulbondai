// Run this in your browser console to fix session and limits
// This will refresh your session and clear cached limits

async function fixSession() {
  console.log('🔄 Refreshing session and clearing limits...');
  
  try {
    // First, refresh the session
    const refreshRes = await fetch('/api/auth/refresh-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!refreshRes.ok) {
      throw new Error('Failed to refresh session');
    }
    
    const sessionData = await refreshRes.json();
    console.log('✅ Session refreshed:', sessionData);
    
    // Clear localStorage cache
    localStorage.removeItem('rateLimitInfo');
    localStorage.removeItem('userPlan');
    localStorage.removeItem('messageCount');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 Cache cleared');
    
    // Force reload with fresh data
    console.log('📊 Your actual limits:');
    console.log(`Plan: ${sessionData.limits.messages.plan}`);
    console.log(`Messages: ${sessionData.limits.messages.remaining} of ${sessionData.limits.messages.limit}`);
    
    // Reload the page to get fresh session
    console.log('🔄 Reloading page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('Try manually refreshing: Ctrl+F5 or Cmd+Shift+R');
  }
}

// Run the fix
fixSession();