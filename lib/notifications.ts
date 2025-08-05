import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"

export interface NotificationPreferences {
  email: {
    messages: boolean
    milestones: boolean
    promotions: boolean
    security: boolean
    newsletter: boolean
  }
  push: {
    messages: boolean
    milestones: boolean
    reminders: boolean
  }
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly'
  quietHours: {
    enabled: boolean
    start: string // "22:00"
    end: string // "08:00"
    timezone: string
  }
}

export const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    messages: true,
    milestones: true,
    promotions: false,
    security: true,
    newsletter: false,
  },
  push: {
    messages: true,
    milestones: true,
    reminders: true,
  },
  frequency: 'instant',
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  },
}

export async function getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { notificationPreferences: true },
  })
  
  return (user?.notificationPreferences as NotificationPreferences) || defaultNotificationPreferences
}

export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  const currentPreferences = await getUserNotificationPreferences(userId)
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreferences: {
        ...currentPreferences,
        ...preferences,
      },
    },
  })
}

export async function subscribeToWebPush(
  userId: string,
  subscription: PushSubscription
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      pushSubscriptions: {
        push: [subscription],
      },
    },
  })
}

export async function unsubscribeFromWebPush(
  userId: string,
  endpoint: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushSubscriptions: true },
  })
  
  const subscriptions = (user?.pushSubscriptions as any)?.push || []
  const filtered = subscriptions.filter((sub: any) => sub.endpoint !== endpoint)
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      pushSubscriptions: {
        push: filtered,
      },
    },
  })
}

export async function sendNotification(
  userId: string,
  type: keyof NotificationPreferences['email'] | keyof NotificationPreferences['push'],
  data: {
    title: string
    body: string
    url?: string
    data?: any
  }
): Promise<void> {
  const preferences = await getUserNotificationPreferences(userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      pushSubscriptions: true,
    },
  })
  
  if (!user) return
  
  // Check quiet hours
  if (preferences.quietHours.enabled) {
    const now = new Date()
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: preferences.quietHours.timezone }))
    const currentTime = userTime.getHours() * 60 + userTime.getMinutes()
    
    const [startHour, startMin] = preferences.quietHours.start.split(':').map(Number)
    const [endHour, endMin] = preferences.quietHours.end.split(':').map(Number)
    
    const quietStart = startHour * 60 + startMin
    const quietEnd = endHour * 60 + endMin
    
    const inQuietHours = quietEnd > quietStart
      ? currentTime >= quietStart && currentTime < quietEnd
      : currentTime >= quietStart || currentTime < quietEnd
      
    if (inQuietHours) {
      // Queue notification for later
      await queueNotification(userId, type, data, new Date(userTime.setHours(endHour, endMin)))
      return
    }
  }
  
  // Send email notification
  if (type in preferences.email && preferences.email[type as keyof typeof preferences.email]) {
    await sendEmail({
      to: user.email!,
      subject: data.title,
      template: 'notification',
      data: {
        name: user.name || 'User',
        title: data.title,
        body: data.body,
        url: data.url,
      },
    })
  }
  
  // Send push notification
  if (type in preferences.push && preferences.push[type as keyof typeof preferences.push]) {
    const subscriptions = (user.pushSubscriptions as any)?.push || []
    
    for (const subscription of subscriptions) {
      try {
        await sendWebPushNotification(subscription, {
          title: data.title,
          body: data.body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          url: data.url,
          data: data.data,
        })
      } catch (error) {
        // Remove invalid subscription
        await unsubscribeFromWebPush(userId, subscription.endpoint)
      }
    }
  }
}

async function sendWebPushNotification(
  subscription: any,
  payload: any
): Promise<void> {
  // In production, use web-push library
  // For now, this is a placeholder
  console.log('Sending push notification:', { subscription, payload })
}

async function queueNotification(
  userId: string,
  type: string,
  data: any,
  sendAt: Date
): Promise<void> {
  // In production, use a job queue like Bull or similar
  // For now, store in database for later processing
  await prisma.notification.create({
    data: {
      userId,
      type,
      title: data.title,
      body: data.body,
      url: data.url,
      data: data.data,
      scheduledFor: sendAt,
      status: 'scheduled',
    },
  })
}

// Notification templates
export const notificationTemplates = {
  newMessage: (companionName: string) => ({
    title: `New message from ${companionName}`,
    body: 'Your AI companion has something to share with you.',
  }),
  
  milestone: (type: string, value: number) => ({
    title: 'Milestone Achieved! 🎉',
    body: `You've reached ${value} ${type}. Keep up the great conversations!`,
  }),
  
  dailyReminder: (companionName: string) => ({
    title: `${companionName} misses you`,
    body: 'Your AI companion is thinking of you. Start a conversation?',
  }),
  
  securityAlert: (action: string) => ({
    title: 'Security Alert',
    body: `${action} on your account. If this wasn't you, please review your security settings.`,
  }),
}