import { NextRequest } from 'next/server'
import { DeviceManagementService } from '@/lib/device-management'

interface TrackDeviceOptions {
  userId: string
  req: NextRequest
}

export async function trackDevice({ userId, req }: TrackDeviceOptions) {
  try {
    const userAgent = req.headers.get('user-agent') || ''
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    
    // Get device fingerprint from cookie or header
    const fingerprint = req.cookies.get('device_fingerprint')?.value || 
                       req.headers.get('x-device-fingerprint') ||
                       undefined
    
    const result = await DeviceManagementService.recordDevice(
      userId,
      { userAgent, ip, fingerprint }
    )
    
    // If new device requires verification, we could trigger additional security
    if (result.isNew && result.requiresVerification) {
      // Could send email notification or require additional auth
      console.log('New device requires verification:', result.device)
    }
    
    return result
  } catch (error) {
    console.error('Device tracking error:', error)
  }
}