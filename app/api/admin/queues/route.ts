import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { queueManager } from '@/lib/queue/queue-manager'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get queue statistics
    const stats = await queueManager.getQueueStats()

    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Get queue stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get queue statistics' },
      { status: 500 }
    )
  }
}