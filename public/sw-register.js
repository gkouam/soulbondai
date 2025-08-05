// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('ServiceWorker registration successful:', registration.scope);
      
      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            if (confirm('New version available! Refresh to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
      
      // Handle offline/online status
      window.addEventListener('online', () => {
        console.log('Back online');
        document.body.classList.remove('offline');
      });
      
      window.addEventListener('offline', () => {
        console.log('Gone offline');
        document.body.classList.add('offline');
      });
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
      
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
  
  // Handle messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'RELOAD') {
      window.location.reload();
    }
  });
}

// Install prompt handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Show custom install button
  const installButton = document.getElementById('install-button');
  if (installButton) {
    installButton.style.display = 'block';
    
    installButton.addEventListener('click', async () => {
      // Hide the button
      installButton.style.display = 'none';
      
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // Clear the deferred prompt
      deferredPrompt = null;
    });
  }
});

// Track app install
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  
  // Track installation analytics
  if (window.gtag) {
    window.gtag('event', 'app_installed', {
      event_category: 'PWA',
      event_label: 'Install'
    });
  }
});