const CACHE_NAME = 'soulbondai-v1'
const STATIC_CACHE_NAME = 'soulbondai-static-v1'
const DYNAMIC_CACHE_NAME = 'soulbondai-dynamic-v1'

// Assets to cache on install - only cache what actually exists
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
]

// Install event - cache static assets with error handling
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      console.log('Service Worker: Caching static assets')
      
      // Try to cache each asset individually to avoid complete failure
      const cachePromises = STATIC_ASSETS.map(async (url) => {
        try {
          const request = new Request(url, { cache: 'no-cache' })
          const response = await fetch(request)
          if (response.ok) {
            await cache.put(request, response)
            console.log('Cached:', url)
          } else {
            console.warn('Failed to cache (not ok):', url, response.status)
          }
        } catch (error) {
          console.warn('Failed to cache (error):', url, error.message)
        }
      })
      
      await Promise.all(cachePromises)
      console.log('Service Worker: Static caching complete')
    }).catch((error) => {
      console.error('Service Worker: Cache installation failed:', error)
    })
  )
  
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && 
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName.startsWith('soulbondai-')) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }
  
  // Skip API requests and server-sent events
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/_next/')) {
    return
  }
  
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response and update cache in background
        fetchAndCache(request)
        return cachedResponse
      }
      
      // Try network
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseToCache = response.clone()
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }
        return response
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html').then((response) => {
            return response || new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/html'
              })
            })
          })
        }
        // Return empty response for other failed requests
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable'
        })
      })
    })
  )
})

// Background sync for messages
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event', event.tag)
  
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New message from your AI companion',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Chat',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('SoulBond AI', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard/chat')
    )
  }
})

// Helper functions
async function fetchAndCache(request) {
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('Fetch and cache error:', error)
  }
}

async function syncMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages()
    
    for (const message of pendingMessages) {
      await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      })
      
      // Remove from pending after successful send
      await removePendingMessage(message.id)
    }
  } catch (error) {
    console.error('Sync messages error:', error)
  }
}

// IndexedDB operations (simplified)
async function getPendingMessages() {
  // Implementation would use IndexedDB
  return []
}

async function removePendingMessage(id) {
  // Implementation would use IndexedDB
}