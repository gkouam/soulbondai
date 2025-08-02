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
    
    return NextResponse.json({
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
    })
    
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