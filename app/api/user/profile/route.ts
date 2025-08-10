import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AuditLogger, AuditAction } from "@/lib/audit-logger"
// Redis cache disabled for now
// import { userCache } from "@/lib/cache/redis-cache"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Cache disabled for production
    // const cacheKey = `profile:${session.user.id}`
    // const cached = await userCache.get(cacheKey)
    // if (cached) {
    //   return NextResponse.json(cached)
    // }
    
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
    
    const profileData = {
      id: profile.id,
      archetype: profile.archetype,
      nickname: profile.nickname,
      messageCount: profile.messageCount,
      trustLevel: profile.trustLevel,
      preferredTone: profile.preferredTone,
      preferredTopics: profile.preferredTopics,
      conversationStyle: profile.conversationStyle,
      creativityLevel: profile.creativityLevel,
      emotionalDepth: profile.emotionalDepth,
      subscription: {
        plan: profile.user.subscription?.plan || "free",
        status: profile.user.subscription?.status || "active"
      }
    }
    
    // Cache disabled for production
    // await userCache.set(cacheKey, profileData, 300) // Cache for 5 minutes
    
    return NextResponse.json(profileData)
    
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { nickname, preferredTone, preferredTopics, conversationStyle } = body
    
    const profile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        ...(nickname && { nickname }),
        ...(preferredTone && { preferredTone }),
        ...(preferredTopics && { preferredTopics }),
        ...(conversationStyle && { conversationStyle })
      }
    })
    
    // Cache disabled for production
    // const cacheKey = `profile:${session.user.id}`
    // await userCache.delete(cacheKey)
    
    // Log profile update
    await AuditLogger.log({
      action: AuditAction.PROFILE_UPDATE,
      userId: session.user.id,
      metadata: { 
        fieldsUpdated: Object.keys(body).filter(key => body[key] !== undefined)
      },
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      success: true
    })
    
    return NextResponse.json({
      success: true,
      profile
    })
    
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}