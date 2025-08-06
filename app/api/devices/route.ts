import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { DeviceManagementService } from '@/lib/device-management'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const devices = await DeviceManagementService.getUserDevices(session.user.id)
    const stats = await DeviceManagementService.getDeviceStats(session.user.id)
    const suspiciousActivity = await DeviceManagementService.checkSuspiciousActivity(session.user.id)
    
    return NextResponse.json({
      devices,
      stats,
      suspiciousActivity
    })
  } catch (error) {
    console.error('Get devices error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}