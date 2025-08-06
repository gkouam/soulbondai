import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { DeviceManagementService } from '@/lib/device-management'
import { AuditLogger, AuditAction } from '@/lib/audit-logger'

export async function PUT(
  req: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { action } = await req.json()
    
    if (action === 'trust') {
      const device = await DeviceManagementService.trustDevice(
        session.user.id,
        params.deviceId
      )
      
      // Log device trust action
      await AuditLogger.log({
        action: AuditAction.DEVICE_TRUST,
        userId: session.user.id,
        resourceType: 'device',
        resourceId: params.deviceId,
        metadata: { deviceName: device.name },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        success: true
      })
      
      return NextResponse.json({
        success: true,
        device
      })
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Update device error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    await DeviceManagementService.removeDevice(
      session.user.id,
      params.deviceId
    )
    
    // Log device removal
    await AuditLogger.log({
      action: AuditAction.DEVICE_REMOVE,
      userId: session.user.id,
      resourceType: 'device',
      resourceId: params.deviceId,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true
    })
    
    return NextResponse.json({
      success: true,
      message: 'Device removed'
    })
  } catch (error) {
    console.error('Delete device error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}