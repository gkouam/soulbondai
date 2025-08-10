import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Check if Pusher is configured
export const isPusherConfigured = !!(
  process.env.PUSHER_APP_ID &&
  process.env.PUSHER_SECRET &&
  process.env.NEXT_PUBLIC_PUSHER_KEY &&
  process.env.NEXT_PUBLIC_PUSHER_CLUSTER
)

// Server-side Pusher instance (only if configured)
export const pusherServer = isPusherConfigured ? new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true
}) : null

// Client-side Pusher configuration
export const pusherClient = (authToken?: string) => {
  const client = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    auth: authToken ? {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    } : undefined
  })
  
  return client
}

// Helper function to get channel name for a user
export const getUserChannel = (userId: string) => `private-user-${userId}`

// Helper function to get conversation channel
export const getConversationChannel = (conversationId: string) => `private-conversation-${conversationId}`