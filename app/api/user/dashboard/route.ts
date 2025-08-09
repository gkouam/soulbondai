import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get user profile with subscription
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            subscription: true
          }
        }
      }
    })
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }
    
    // Get message statistics
    const messages = await prisma.message.findMany({
      where: {
        conversation: {
          userId: session.user.id
        }
      },
      select: {
        createdAt: true,
        metadata: true
      }
    })
    
    // Calculate daily messages
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dailyMessages = messages.filter(m => m.createdAt >= today).length
    
    // Calculate streak
    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      select: { createdAt: true },
      orderBy: { createdAt: "desc" }
    })
    
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null
    
    for (const conv of conversations) {
      const convDate = new Date(conv.createdAt)
      convDate.setHours(0, 0, 0, 0)
      
      if (!lastDate) {
        tempStreak = 1
        lastDate = convDate
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff === 1) {
          tempStreak++
        } else if (daysDiff > 1) {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
        
        lastDate = convDate
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak)
    
    // Check if user has messaged today
    const todayConv = conversations.find(c => {
      const convDate = new Date(c.createdAt)
      convDate.setHours(0, 0, 0, 0)
      return convDate.getTime() === today.getTime()
    })
    
    if (todayConv) {
      currentStreak = tempStreak
    }
    
    // Calculate emotional breakdown
    const emotionalBreakdown = {
      happy: 0,
      sad: 0,
      anxious: 0,
      excited: 0,
      thoughtful: 0
    }
    
    const sentimentMap: Record<string, keyof typeof emotionalBreakdown> = {
      joy: "happy",
      happiness: "happy",
      love: "happy",
      sadness: "sad",
      grief: "sad",
      anxiety: "anxious",
      fear: "anxious",
      excitement: "excited",
      anticipation: "excited",
      curiosity: "thoughtful",
      contemplation: "thoughtful"
    }
    
    messages.forEach(m => {
      // Check if metadata contains sentiment information
      if (m.metadata && typeof m.metadata === "object") {
        const metadata = m.metadata as any
        const sentiment = metadata.sentiment || metadata.emotion
        if (sentiment) {
          const primaryEmotion = (typeof sentiment === "string" ? sentiment : sentiment.primaryEmotion)?.toLowerCase()
          if (primaryEmotion && sentimentMap[primaryEmotion]) {
            emotionalBreakdown[sentimentMap[primaryEmotion]]++
          }
        }
      }
    })
    
    // Convert to percentages
    const totalEmotions = Object.values(emotionalBreakdown).reduce((a, b) => a + b, 0)
    if (totalEmotions > 0) {
      Object.keys(emotionalBreakdown).forEach(key => {
        emotionalBreakdown[key as keyof typeof emotionalBreakdown] = 
          Math.round((emotionalBreakdown[key as keyof typeof emotionalBreakdown] / totalEmotions) * 100)
      })
    }
    
    // Calculate average response time from metadata if available
    const responseTimes: number[] = []
    messages.forEach(m => {
      if (m.metadata && typeof m.metadata === "object") {
        const metadata = m.metadata as any
        if (metadata.responseTime && typeof metadata.responseTime === "number") {
          responseTimes.push(metadata.responseTime)
        }
      }
    })
    
    const averageResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0
    
    // Get recent activity
    const recentActivity = await prisma.activity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })
    
    return NextResponse.json({
      profile: {
        archetype: profile.archetype,
        nickname: profile.nickname,
        messageCount: profile.messageCount,
        trustLevel: profile.trustLevel,
        subscription: {
          plan: profile.user.subscription?.plan || "free",
          status: profile.user.subscription?.status || "active"
        }
      },
      stats: {
        totalMessages: messages.length,
        dailyMessages,
        currentStreak,
        longestStreak,
        averageResponseTime,
        emotionalBreakdown
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        type: a.type,
        timestamp: a.createdAt,
        metadata: a.metadata
      }))
    })
    
  } catch (error) {
    console.error("Dashboard error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}// Force redeploy Thu Aug  7 04:07:15 CDT 2025
