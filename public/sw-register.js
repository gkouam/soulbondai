if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope)
        
        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60000) // Check every minute
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              console.log('New service worker available')
              
              // Show update notification
              if (window.showUpdateNotification) {
                window.showUpdateNotification()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error)
      })
  })
}