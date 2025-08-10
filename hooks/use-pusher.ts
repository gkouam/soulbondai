import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import PusherClient from 'pusher-js'
import { getUserChannel } from '@/lib/pusher'

export function usePusher() {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const pusherRef = useRef<PusherClient | null>(null)
  const channelRef = useRef<any>(null)
  const cleanupRef = useRef<boolean>(false)

  useEffect(() => {
    // Skip if Pusher is not configured
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY) {
      console.warn('Pusher is not configured - running without real-time features')
      return
    }

    if (!session?.user?.id) {
      return
    }

    let pusher: PusherClient | null = null
    let channel: any = null

    try {
      // Initialize Pusher client
      pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            'Content-Type': 'application/json'
          }
        },
        enabledTransports: ['ws', 'wss'],
        disableStats: true
      })

      // Subscribe to user's private channel
      const channelName = getUserChannel(session.user.id)
      channel = pusher.subscribe(channelName)

      channel.bind('pusher:subscription_succeeded', () => {
        if (!cleanupRef.current) {
          console.log('Connected to Pusher')
          setIsConnected(true)
        }
      })

      channel.bind('pusher:subscription_error', (error: any) => {
        console.error('Pusher subscription error:', error)
        setIsConnected(false)
      })

      pusher.connection.bind('connected', () => {
        if (!cleanupRef.current) {
          setIsConnected(true)
        }
      })

      pusher.connection.bind('disconnected', () => {
        setIsConnected(false)
      })

      pusher.connection.bind('error', (error: any) => {
        console.error('Pusher connection error:', error)
        setIsConnected(false)
      })

      pusherRef.current = pusher
      channelRef.current = channel
    } catch (error) {
      console.error('Failed to initialize Pusher:', error)
      setIsConnected(false)
    }

    return () => {
      cleanupRef.current = true
      try {
        if (channel) {
          channel.unbind_all()
          channel.unsubscribe()
        }
        if (pusher) {
          pusher.disconnect()
        }
      } catch (error) {
        console.error('Error cleaning up Pusher:', error)
      }
      pusherRef.current = null
      channelRef.current = null
    }
  }, [session])

  return {
    pusher: pusherRef.current,
    channel: channelRef.current,
    isConnected
  }
}