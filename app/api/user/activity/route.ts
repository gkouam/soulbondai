import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AuditLogger } from '@/lib/audit-logger'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    // Get user's activity summary
    const activity = await AuditLogger.getUserActivity(session.user.id, days)
    
    // Get recent security events
    const securityEvents = await AuditLogger.getSecurityEvents(session.user.id, 24)
    
    return NextResponse.json({
      activity,
      securityEvents,
      days
    })
  } catch (error) {
    console.error('Get user activity error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}