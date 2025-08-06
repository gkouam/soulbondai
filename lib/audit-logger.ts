import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest } from 'next/server'

export enum AuditAction {
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  OAUTH_LOGIN = 'OAUTH_LOGIN',
  
  // Profile
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  PHONE_VERIFY = 'PHONE_VERIFY',
  DEVICE_TRUST = 'DEVICE_TRUST',
  DEVICE_REMOVE = 'DEVICE_REMOVE',
  
  // Data Management
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_DELETE = 'DATA_DELETE',
  CONSENT_UPDATE = 'CONSENT_UPDATE',
  
  // Subscription
  SUBSCRIPTION_CREATE = 'SUBSCRIPTION_CREATE',
  SUBSCRIPTION_UPDATE = 'SUBSCRIPTION_UPDATE',
  SUBSCRIPTION_CANCEL = 'SUBSCRIPTION_CANCEL',
  
  // Content
  CHARACTER_CREATE = 'CHARACTER_CREATE',
  CHARACTER_UPDATE = 'CHARACTER_UPDATE',
  CHARACTER_DELETE = 'CHARACTER_DELETE',
  PHOTO_UPLOAD = 'PHOTO_UPLOAD',
  PHOTO_DELETE = 'PHOTO_DELETE',
  
  // AI Interactions
  CONVERSATION_START = 'CONVERSATION_START',
  VOICE_GENERATE = 'VOICE_GENERATE',
  
  // Security
  FAILED_LOGIN = 'FAILED_LOGIN',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export interface AuditLogData {
  action: AuditAction
  userId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  success: boolean
  errorMessage?: string
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          success: data.success,
          errorMessage: data.errorMessage,
        }
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
      // Don't throw - audit logging should not break the application
    }
  }
  
  static async logRequest(
    request: NextRequest,
    action: AuditAction,
    additionalData: Partial<AuditLogData> = {}
  ): Promise<void> {
    try {
      const session = await getServerSession(authOptions)
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
      const userAgent = request.headers.get('user-agent') || 'unknown'
      
      await this.log({
        action,
        userId: session?.user?.id,
        ipAddress,
        userAgent,
        success: true,
        ...additionalData
      })
    } catch (error) {
      console.error('Failed to log request:', error)
    }
  }
  
  static async getAuditLogs(
    filters: {
      userId?: string
      action?: AuditAction
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ) {
    const where: any = {}
    
    if (filters.userId) where.userId = filters.userId
    if (filters.action) where.action = filters.action
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = filters.startDate
      if (filters.endDate) where.createdAt.lte = filters.endDate
    }
    
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
  }
  
  static async getUserActivity(userId: string, days: number = 30) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const logs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Group by action type
    const activitySummary = logs.reduce((acc, log) => {
      if (!acc[log.action]) {
        acc[log.action] = 0
      }
      acc[log.action]++
      return acc
    }, {} as Record<string, number>)
    
    return {
      totalActions: logs.length,
      recentLogs: logs.slice(0, 10),
      summary: activitySummary,
      firstActivity: logs[logs.length - 1]?.createdAt,
      lastActivity: logs[0]?.createdAt
    }
  }
  
  static async getSecurityEvents(userId?: string, hours: number = 24) {
    const startDate = new Date()
    startDate.setHours(startDate.getHours() - hours)
    
    const securityActions = [
      AuditAction.FAILED_LOGIN,
      AuditAction.SUSPICIOUS_ACTIVITY,
      AuditAction.RATE_LIMIT_EXCEEDED,
      AuditAction.PASSWORD_RESET,
      AuditAction.PASSWORD_CHANGE,
      AuditAction.DEVICE_TRUST,
      AuditAction.DEVICE_REMOVE
    ]
    
    const where: any = {
      action: { in: securityActions },
      createdAt: { gte: startDate }
    }
    
    if (userId) where.userId = userId
    
    return prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })
  }
  
  static async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate }
      }
    })
    
    console.log(`Cleaned up ${result.count} old audit logs`)
    return result.count
  }
}