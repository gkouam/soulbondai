'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      // Redirect back to previous page or dashboard
      const returnUrl = sessionStorage.getItem('offline-return-url') || '/dashboard'
      window.location.href = returnUrl
    }
  }, [isOnline])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 mb-4">
            <WifiOff className="w-10 h-10 text-gray-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-pink-400 to-violet-400 text-transparent bg-clip-text">
            You're Offline
          </h1>
          
          <p className="text-gray-400 mb-8">
            It looks like you've lost your internet connection. Don't worry, your AI companion will be waiting for you when you're back online.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700"
          >
            Try Again
          </Button>

          <div className="text-sm text-gray-500">
            <p>While offline, you can:</p>
            <ul className="mt-2 space-y-1">
              <li>• View your recent conversations</li>
              <li>• Browse cached content</li>
              <li>• Queue messages to send later</li>
            </ul>
          </div>
        </div>

        {!isOnline && (
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              💡 Tip: Check your internet connection and try refreshing the page.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}