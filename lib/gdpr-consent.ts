import { prisma } from "@/lib/prisma"

export interface ConsentType {
  id: string
  name: string
  description: string
  required: boolean
  defaultValue: boolean
}

export const consentTypes: ConsentType[] = [
  {
    id: "essential",
    name: "Essential Cookies",
    description: "Required for the website to function properly. Cannot be disabled.",
    required: true,
    defaultValue: true
  },
  {
    id: "analytics",
    name: "Analytics & Performance",
    description: "Help us understand how you use our service to improve your experience.",
    required: false,
    defaultValue: false
  },
  {
    id: "marketing",
    name: "Marketing & Advertising",
    description: "Used to show you relevant ads and measure their effectiveness.",
    required: false,
    defaultValue: false
  },
  {
    id: "personalization",
    name: "AI Personalization",
    description: "Allows our AI to learn from your conversations to provide better responses.",
    required: false,
    defaultValue: true
  },
  {
    id: "data_sharing",
    name: "Third-party Data Sharing",
    description: "Share anonymized data with partners for research and improvement.",
    required: false,
    defaultValue: false
  }
]

export interface UserConsent {
  userId: string
  consentType: string
  granted: boolean
  timestamp: Date
  ipAddress?: string
  userAgent?: string
}

export interface ConsentRecord {
  id: string
  userId: string
  consentType: string
  granted: boolean
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  version: string
}

export class GDPRConsentManager {
  private static CONSENT_VERSION = "1.0"
  
  static async recordConsent(
    userId: string,
    consents: Record<string, boolean>,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    const consentRecords = Object.entries(consents).map(([type, granted]) => ({
      userId,
      consentType: type,
      granted,
      timestamp: new Date(),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      version: this.CONSENT_VERSION
    }))
    
    await prisma.consentRecord.createMany({
      data: consentRecords
    })
    
    // Update user's consent preferences
    await prisma.user.update({
      where: { id: userId },
      data: {
        consentGiven: true,
        consentTimestamp: new Date()
      }
    })
  }
  
  static async getUserConsents(userId: string): Promise<Record<string, boolean>> {
    const records = await prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    })
    
    // Get the latest consent for each type
    const consents: Record<string, boolean> = {}
    const seen = new Set<string>()
    
    for (const record of records) {
      if (!seen.has(record.consentType)) {
        consents[record.consentType] = record.granted
        seen.add(record.consentType)
      }
    }
    
    // Fill in defaults for any missing consent types
    for (const type of consentTypes) {
      if (!(type.id in consents)) {
        consents[type.id] = type.defaultValue
      }
    }
    
    return consents
  }
  
  static async revokeConsent(
    userId: string,
    consentType: string,
    metadata?: {
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    await prisma.consentRecord.create({
      data: {
        userId,
        consentType,
        granted: false,
        timestamp: new Date(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        version: this.CONSENT_VERSION
      }
    })
  }
  
  static async exportUserData(userId: string): Promise<any> {
    const [user, profile, messages, memories, consents] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          lastLogin: true
        }
      }),
      prisma.profile.findUnique({
        where: { userId }
      }),
      prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit to recent messages
      }),
      prisma.memory.findMany({
        where: { userId }
      }),
      this.getUserConsents(userId)
    ])
    
    return {
      exportDate: new Date(),
      userData: {
        user,
        profile,
        messages,
        memories,
        consents
      }
    }
  }
  
  static async deleteUserData(
    userId: string,
    options: {
      deleteAccount?: boolean
      preserveAnonymized?: boolean
    } = {}
  ): Promise<void> {
    // Delete or anonymize user data based on options
    if (options.preserveAnonymized) {
      // Anonymize data instead of deleting
      await prisma.$transaction([
        prisma.message.updateMany({
          where: { userId },
          data: { content: "[REDACTED]", userId: "anonymous" }
        }),
        prisma.memory.updateMany({
          where: { userId },
          data: { content: "[REDACTED]", userId: "anonymous" }
        }),
        prisma.profile.update({
          where: { userId },
          data: {
            companionName: "Deleted User",
            preferences: {}
          }
        })
      ])
    } else {
      // Hard delete all user data
      await prisma.$transaction([
        prisma.message.deleteMany({ where: { userId } }),
        prisma.memory.deleteMany({ where: { userId } }),
        prisma.consentRecord.deleteMany({ where: { userId } }),
        prisma.profile.delete({ where: { userId } }),
        prisma.subscription.deleteMany({ where: { userId } })
      ])
    }
    
    if (options.deleteAccount) {
      await prisma.user.delete({ where: { id: userId } })
    } else {
      // Mark account as deleted but keep for audit
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.com`,
          name: "Deleted User",
          image: null,
          passwordHash: null
        }
      })
    }
  }
  
  static async checkConsentRequired(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { consentGiven: true, consentTimestamp: true }
    })
    
    if (!user) return true
    
    // Check if consent was never given
    if (!user.consentGiven) return true
    
    // Check if consent is older than 1 year (re-consent required)
    if (user.consentTimestamp) {
      const oneYearAgo = new Date()
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
      
      if (user.consentTimestamp < oneYearAgo) {
        return true
      }
    }
    
    return false
  }
}