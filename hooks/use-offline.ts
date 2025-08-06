import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

interface OfflineQueueItem {
  id: string
  type: 'message' | 'update' | 'delete'
  data: any
  timestamp: number
}

export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([])

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine)

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          setIsServiceWorkerReady(true)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('You're back online!')
      syncOfflineQueue()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You're offline. Messages will be sent when you reconnect.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load offline queue from localStorage
    const savedQueue = localStorage.getItem('offline-queue')
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Save offline queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('offline-queue', JSON.stringify(offlineQueue))
  }, [offlineQueue])

  const addToOfflineQueue = useCallback((item: Omit<OfflineQueueItem, 'id' | 'timestamp'>) => {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `offline-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }

    setOfflineQueue((prev) => [...prev, queueItem])
    
    // Request background sync if available
    if ('sync' in navigator.serviceWorker.registration) {
      navigator.serviceWorker.registration.sync.register('sync-messages')
    }

    return queueItem.id
  }, [])

  const removeFromOfflineQueue = useCallback((id: string) => {
    setOfflineQueue((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const syncOfflineQueue = useCallback(async () => {
    if (!isOnline || offlineQueue.length === 0) return

    console.log(`Syncing ${offlineQueue.length} offline items...`)

    for (const item of offlineQueue) {
      try {
        switch (item.type) {
          case 'message':
            await fetch('/api/chat/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            })
            break
          
          case 'update':
            await fetch(item.data.url, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data.body)
            })
            break
          
          case 'delete':
            await fetch(item.data.url, {
              method: 'DELETE'
            })
            break
        }

        // Remove successfully synced item
        removeFromOfflineQueue(item.id)
      } catch (error) {
        console.error('Failed to sync offline item:', error)
        // Keep in queue for next sync attempt
      }
    }
  }, [isOnline, offlineQueue, removeFromOfflineQueue])

  // Attempt to sync when coming back online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      syncOfflineQueue()
    }
  }, [isOnline, syncOfflineQueue])

  const cacheData = useCallback(async (key: string, data: any) => {
    if ('caches' in window) {
      const cache = await caches.open('soulbondai-data-v1')
      const response = new Response(JSON.stringify(data))
      await cache.put(key, response)
    }
  }, [])

  const getCachedData = useCallback(async <T = any>(key: string): Promise<T | null> => {
    if ('caches' in window) {
      const cache = await caches.open('soulbondai-data-v1')
      const response = await cache.match(key)
      
      if (response) {
        const data = await response.json()
        return data as T
      }
    }
    
    return null
  }, [])

  return {
    isOnline,
    isServiceWorkerReady,
    offlineQueue,
    addToOfflineQueue,
    removeFromOfflineQueue,
    syncOfflineQueue,
    cacheData,
    getCachedData
  }
}