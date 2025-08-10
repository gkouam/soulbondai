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
    
    // Get user profile and stats
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
      // Create default profile if doesn't exist
      const newProfile = await prisma.profile.create({
        data: {
          userId: session.user.id,
          archetype: "warm_empath",
          nickname: session.user.name || "Beautiful Soul",
          messageCount: 0,
          messagesUsedToday: 0,
          trustLevel: 50,
          lastMessageReset: new Date()
        },
        include: {
          user: {
            include: {
              subscription: true
            }
          }
        }
      })
      
      return NextResponse.json({
        totalMessages: 0,
        trustLevel: 50,
        dayStreak: 0,
        subscription: newProfile.user.subscription?.plan || "free",
        messagesUsedToday: 0,
        messageLimit: 50,
        lastActive: null
      })
    }
    
    // Calculate day streak
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        type: "message_sent"
      },
      orderBy: { createdAt: "desc" },
      take: 30
    })
    
    let dayStreak = 0
    if (activities.length > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      // Check if user was active today or yesterday to maintain streak
      const lastActivity = activities[0].createdAt
      if (lastActivity >= yesterday) {
        dayStreak = 1
        
        // Count consecutive days
        let currentDate = new Date(yesterday)
        for (let i = 1; i < activities.length; i++) {
          const activityDate = new Date(activities[i].createdAt)
          activityDate.setHours(0, 0, 0, 0)
          
          if (activityDate.getTime() === currentDate.getTime()) {
            dayStreak++
            currentDate.setDate(currentDate.getDate() - 1)
          } else if (activityDate.getTime() < currentDate.getTime()) {
            break
          }
        }
      }
    }
    
    // Get message limit based on plan
    const messageLimit = profile.user.subscription?.plan === "free" ? 50 : 
                        profile.user.subscription?.plan === "basic" ? 1000 :
                        profile.user.subscription?.plan === "premium" ? 10000 : 
                        99999 // Ultimate
    
    return NextResponse.json({
      totalMessages: profile.messageCount,
      trustLevel: profile.trustLevel,
      dayStreak,
      subscription: profile.user.subscription?.plan || "free",
      messagesUsedToday: profile.messagesUsedToday,
      messageLimit,
      lastActive: activities.length > 0 ? activities[0].createdAt : null
    })
    
  } catch (error) {
    console.error("Dashboard stats error:", error)
    
    // Return default stats on error
    return NextResponse.json({
      totalMessages: 0,
      trustLevel: 50,
      dayStreak: 0,
      subscription: "free",
      messagesUsedToday: 0,
      messageLimit: 50,
      lastActive: null
    })
  }
}