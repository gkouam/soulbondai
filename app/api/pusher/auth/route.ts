import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pusherServer, isPusherConfigured } from '@/lib/pusher'

export async function POST(req: Request) {
  try {
    // Check if Pusher is configured
    if (!isPusherConfigured || !pusherServer) {
      return NextResponse.json({ error: 'Pusher not configured' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get('socket_id')
    const channelName = params.get('channel_name')

    if (!socketId || !channelName) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Verify user has access to this channel
    const expectedChannels = [
      `private-user-${session.user.id}`,
      `private-conversation-` // Allow any conversation channel for now
    ]

    const isAuthorized = expectedChannels.some(prefix => channelName.startsWith(prefix))

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate auth response
    const authResponse = pusherServer.authorizeChannel(socketId, channelName, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name || session.user.email
      }
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}