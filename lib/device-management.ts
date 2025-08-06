import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import UAParser from 'ua-parser-js'

interface DeviceInfo {
  userAgent: string
  ip?: string
  fingerprint?: string
}

interface DeviceDetails {
  type: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  name: string
}

export class DeviceManagementService {
  private static generateDeviceId(fingerprint: string, userAgent: string): string {
    // Create a stable device ID from fingerprint and user agent
    const data = `${fingerprint}:${userAgent}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32)
  }
  
  private static parseDeviceDetails(userAgent: string): DeviceDetails {
    const parser = new UAParser(userAgent)
    const result = parser.getResult()
    
    // Determine device type
    let type: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (result.device.type === 'mobile') {
      type = 'mobile'
    } else if (result.device.type === 'tablet') {
      type = 'tablet'
    }
    
    // Get browser and OS info
    const browser = result.browser.name || 'Unknown Browser'
    const browserVersion = result.browser.version?.split('.')[0] || ''
    const os = result.os.name || 'Unknown OS'
    const osVersion = result.os.version?.split('.')[0] || ''
    
    // Generate friendly name
    const deviceModel = result.device.model || ''
    const name = deviceModel 
      ? `${deviceModel} (${browser})`
      : `${os} ${osVersion} - ${browser} ${browserVersion}`
    
    return {
      type,
      browser: `${browser} ${browserVersion}`.trim(),
      os: `${os} ${osVersion}`.trim(),
      name
    }
  }
  
  static async recordDevice(userId: string, deviceInfo: DeviceInfo): Promise<{
    device?: any
    isNew: boolean
    requiresVerification: boolean
  }> {
    try {
      const { userAgent, ip, fingerprint = 'default' } = deviceInfo
      const deviceId = this.generateDeviceId(fingerprint, userAgent)
      const details = this.parseDeviceDetails(userAgent)
      
      // Check if device exists
      const existingDevice = await prisma.device.findUnique({
        where: {
          userId_deviceId: {
            userId,
            deviceId
          }
        }
      })
      
      if (existingDevice) {
        // Update last active
        const device = await prisma.device.update({
          where: { id: existingDevice.id },
          data: {
            lastActiveAt: new Date(),
            lastIp: ip
          }
        })
        
        return {
          device,
          isNew: false,
          requiresVerification: !device.trusted
        }
      }
      
      // Check if this is a suspicious new device
      const recentDevices = await prisma.device.count({
        where: {
          userId,
          createdAt: {
            gt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
      
      const requiresVerification = recentDevices >= 2 // More than 2 new devices in 24h is suspicious
      
      // Create new device
      const device = await prisma.device.create({
        data: {
          userId,
          deviceId,
          name: details.name,
          type: details.type,
          browser: details.browser,
          os: details.os,
          lastIp: ip,
          trusted: !requiresVerification // Auto-trust if not suspicious
        }
      })
      
      return {
        device,
        isNew: true,
        requiresVerification
      }
    } catch (error) {
      console.error('Device recording error:', error)
      return {
        isNew: false,
        requiresVerification: false
      }
    }
  }
  
  static async getUserDevices(userId: string) {
    return prisma.device.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' }
    })
  }
  
  static async trustDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { userId, id: deviceId }
    })
    
    if (!device) {
      throw new Error('Device not found')
    }
    
    return prisma.device.update({
      where: { id: deviceId },
      data: { trusted: true }
    })
  }
  
  static async removeDevice(userId: string, deviceId: string) {
    const device = await prisma.device.findFirst({
      where: { userId, id: deviceId }
    })
    
    if (!device) {
      throw new Error('Device not found')
    }
    
    // Don't allow removing the current device
    // This check should be done at the API level with session info
    
    return prisma.device.delete({
      where: { id: deviceId }
    })
  }
  
  static async removeAllDevices(userId: string, exceptDeviceId?: string) {
    if (exceptDeviceId) {
      // Remove all except current device
      return prisma.device.deleteMany({
        where: {
          userId,
          id: { not: exceptDeviceId }
        }
      })
    }
    
    // Remove all devices
    return prisma.device.deleteMany({
      where: { userId }
    })
  }
  
  static async getDeviceStats(userId: string) {
    const devices = await this.getUserDevices(userId)
    
    const stats = {
      total: devices.length,
      trusted: devices.filter(d => d.trusted).length,
      untrusted: devices.filter(d => !d.trusted).length,
      byType: {
        desktop: devices.filter(d => d.type === 'desktop').length,
        mobile: devices.filter(d => d.type === 'mobile').length,
        tablet: devices.filter(d => d.type === 'tablet').length
      },
      recentlyActive: devices.filter(d => 
        d.lastActiveAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length
    }
    
    return stats
  }
  
  static async checkSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean
    reasons: string[]
  }> {
    const reasons: string[] = []
    
    // Check for multiple new devices
    const recentNewDevices = await prisma.device.count({
      where: {
        userId,
        createdAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    
    if (recentNewDevices > 3) {
      reasons.push(`${recentNewDevices} new devices in the last 24 hours`)
    }
    
    // Check for devices from different locations
    const devices = await this.getUserDevices(userId)
    const locations = new Set(devices.map(d => d.location).filter(Boolean))
    
    if (locations.size > 3) {
      reasons.push(`Devices from ${locations.size} different locations`)
    }
    
    // Check for untrusted devices
    const untrustedCount = devices.filter(d => !d.trusted).length
    if (untrustedCount > 2) {
      reasons.push(`${untrustedCount} untrusted devices`)
    }
    
    return {
      suspicious: reasons.length > 0,
      reasons
    }
  }
}