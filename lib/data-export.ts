import { prisma } from "@/lib/prisma"

export interface ExportOptions {
  includeMessages: boolean
  includeProfile: boolean
  includePreferences: boolean
  includeSubscription: boolean
  includeAnalytics: boolean
  format: 'json' | 'csv'
}

export async function exportUserData(userId: string, options: ExportOptions): Promise<Buffer> {
  const userData: any = {
    exportDate: new Date().toISOString(),
    exportVersion: '1.0',
    user: {},
  }

  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: options.includeProfile,
      subscription: options.includeSubscription,
      conversations: options.includeMessages ? {
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      } : false,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Build export data
  userData.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  }

  if (options.includeProfile && user.profile) {
    userData.profile = {
      id: user.profile.id,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      personalityScores: user.profile.personalityScores,
      archetype: user.profile.archetype,
      preferences: user.profile.preferences,
      createdAt: user.profile.createdAt,
      updatedAt: user.profile.updatedAt,
    }
  }

  if (options.includePreferences) {
    userData.preferences = {
      emailVerified: user.emailVerified,
      notificationPreferences: user.notificationPreferences,
      metadata: user.metadata,
    }
  }

  if (options.includeSubscription && user.subscription) {
    userData.subscription = {
      id: user.subscription.id,
      plan: user.subscription.plan,
      status: user.subscription.status,
      startDate: user.subscription.startDate,
      endDate: user.subscription.endDate,
      createdAt: user.subscription.createdAt,
    }
  }

  if (options.includeMessages && user.conversations) {
    userData.conversations = user.conversations.map(conv => ({
      id: conv.id,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        sentiment: msg.sentiment,
      })),
    }))
  }

  if (options.includeAnalytics) {
    // Get analytics data
    const analytics = await prisma.message.groupBy({
      by: ['role'],
      where: { conversation: { userId } },
      _count: { id: true },
    })

    const messagesByDay = await prisma.message.findMany({
      where: { conversation: { userId } },
      select: { createdAt: true },
    })

    const dailyActivity = messagesByDay.reduce((acc, msg) => {
      const date = msg.createdAt.toISOString().split('T')[0]
      acc[date] = (acc[date] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    userData.analytics = {
      totalMessages: analytics.reduce((sum, a) => sum + a._count.id, 0),
      messagesByRole: analytics,
      dailyActivity,
    }
  }

  // Convert to requested format
  if (options.format === 'csv') {
    return convertToCSV(userData)
  }

  return Buffer.from(JSON.stringify(userData, null, 2))
}

function convertToCSV(data: any): Buffer {
  const csvLines: string[] = []
  
  // User info
  csvLines.push('User Information')
  csvLines.push('Field,Value')
  Object.entries(data.user).forEach(([key, value]) => {
    csvLines.push(`${key},"${value}"`)
  })
  csvLines.push('')

  // Messages
  if (data.conversations) {
    csvLines.push('Conversation History')
    csvLines.push('Date,Role,Message')
    
    data.conversations.forEach((conv: any) => {
      conv.messages.forEach((msg: any) => {
        const date = new Date(msg.createdAt).toLocaleString()
        const content = msg.content.replace(/"/g, '""')
        csvLines.push(`"${date}","${msg.role}","${content}"`)
      })
    })
  }

  return Buffer.from(csvLines.join('\n'))
}

export async function deleteUserData(userId: string): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  
  // Delete messages
  await prisma.message.deleteMany({
    where: { conversation: { userId } },
  })

  // Delete conversations  
  await prisma.conversation.deleteMany({
    where: { userId },
  })

  // Delete profile
  await prisma.profile.deleteMany({
    where: { userId },
  })

  // Delete subscription
  await prisma.subscription.deleteMany({
    where: { userId },
  })

  // Delete notifications
  await prisma.notification.deleteMany({
    where: { userId },
  })

  // Finally, delete user
  await prisma.user.delete({
    where: { id: userId },
  })
}

export async function anonymizeUserData(userId: string): Promise<void> {
  const anonymousEmail = `deleted-${userId}@anonymous.local`
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: anonymousEmail,
      name: 'Deleted User',
      image: null,
      emailVerified: null,
      notificationPreferences: {},
      pushSubscriptions: {},
      metadata: {},
    },
  })

  // Anonymize profile
  await prisma.profile.updateMany({
    where: { userId },
    data: {
      bio: null,
      avatar: null,
      preferences: {},
    },
  })

  // Remove message content but keep structure for analytics
  await prisma.message.updateMany({
    where: { conversation: { userId } },
    data: {
      content: '[Content Removed]',
    },
  })
}

export function generateGDPRReport(userId: string): Promise<any> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      lastLogin: true,
      _count: {
        select: {
          conversations: true,
        },
      },
      profile: {
        select: {
          createdAt: true,
          updatedAt: true,
        },
      },
      subscription: {
        select: {
          plan: true,
          status: true,
        },
      },
    },
  })
}