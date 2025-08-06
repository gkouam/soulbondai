'use client'

import { useOffline } from '@/hooks/use-offline'
import { WifiOff, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineIndicator() {
  const { isOnline, offlineQueue } = useOffline()

  if (isOnline && offlineQueue.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className={`
          px-4 py-2 rounded-full backdrop-blur-sm
          ${isOnline ? 'bg-blue-500/20 border-blue-500/30' : 'bg-red-500/20 border-red-500/30'}
          border flex items-center gap-2
        `}>
          {isOnline ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              <span className="text-sm text-blue-400">
                Syncing {offlineQueue.length} item{offlineQueue.length !== 1 ? 's' : ''}...
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">
                Offline mode
                {offlineQueue.length > 0 && ` (${offlineQueue.length} pending)`}
              </span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}