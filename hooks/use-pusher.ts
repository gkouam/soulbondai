import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import PusherClient from 'pusher-js'
import { getUserChannel } from '@/lib/pusher'

export function usePusher() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const pusherRef = useRef<PusherClient | null>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!session?.user?.id || !process.env.NEXT_PUBLIC_PUSHER_KEY) {
      return
    }

    // Initialize Pusher client
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    })

    // Subscribe to user's private channel
    const channelName = getUserChannel(session.user.id)
    const channel = pusher.subscribe(channelName)

    channel.bind('pusher:subscription_succeeded', () => {
      console.log('Connected to Pusher')
      setIsConnected(true)
    })

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Pusher subscription error:', error)
      setIsConnected(false)
    })

    pusher.connection.bind('connected', () => {
      setIsConnected(true)
    })

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false)
    })

    pusherRef.current = pusher
    channelRef.current = channel

    return () => {
      channel.unbind_all()
      channel.unsubscribe()
      pusher.disconnect()
    }
  }, [session])

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected
  }
}