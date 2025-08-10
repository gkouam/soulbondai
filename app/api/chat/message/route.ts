import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PersonalityEngine } from "@/lib/personality-engine"
import { cache } from "@/lib/redis"
import { upgradeTriggerManager } from "@/lib/upgrade-triggers"
import { withChatRateLimit } from "@/lib/rate-limiter"
import { pusherServer, getUserChannel, isPusherConfigured } from "@/lib/pusher"
import crypto from "crypto"

const messageSchema = z.object({
  content: z.string().min(1).max(1000),
  imageUrl: z.string().url().optional(),
  audioUrl: z.string().url().optional()
})

import { handleApiError, AuthenticationError, RateLimitError, NotFoundError } from "@/lib/error-handler"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { content, imageUrl, audioUrl } = messageSchema.parse(body)
    
    // Get user's subscription plan for rate limiting
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { plan: true }
    })
    
    // Apply plan-based rate limiting
    const rateLimitResult = await withChatRateLimit(req, session.user.id, subscription?.plan || "free")
    if (rateLimitResult) {
      return rateLimitResult
    }
    
    // Try to get cached profile first
    const cacheKey = `profile:${session.user.id}`
    let profile = await cache.get<any>(cacheKey)
    
    if (!profile) {
      profile = await prisma.profile.findUnique({
        where: { userId: session.user.id },
        include: { user: { include: { subscription: true } } }
      })
      
      // Cache profile for 5 minutes
      if (profile) {
        await cache.set(cacheKey, profile, 300)
      }
    }
    
    if (!profile) {
      throw new NotFoundError("Profile not found")
    }
    
    // Check free tier limits based on interaction count
    // For simplicity, using interaction count instead of daily limits
    const dailyLimit = profile.user.subscription?.plan === "free" ? 50 : 10000
    
    // Check if user has exceeded limits (simplified check)
    if (profile.user.subscription?.plan === "free" && profile.interactionCount >= 500) {
      // Check for upgrade triggers when hitting limit
      const upgradePrompt = await upgradeTriggerManager.getUpgradePrompt(session.user.id)
      
      return NextResponse.json(
        { 
          error: "Message limit reached. Please upgrade to continue.",
          upgradePrompt
        },
        { status: 429 }
      )
    }
    
    // Get or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId: session.user.id,
        archived: false
      }
    })
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId: session.user.id }
      })
    }
    
    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content,
        imageUrl,
        audioUrl
      }
    })
    
    // Get conversation history
    const history = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      take: 20
    })
    
    // Generate AI response
    const engine = new PersonalityEngine()
    const response = await engine.generateResponse(
      content,
      session.user.id,
      history
    )
    
    // Trigger typing indicator via Pusher (if configured)
    if (isPusherConfigured && pusherServer) {
      const userChannel = getUserChannel(session.user.id)
      await pusherServer.trigger(userChannel, 'companion-typing', {
        duration: Math.min(response.suggestedDelay * 1000, 3000)
      })
    }

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, Math.min(response.suggestedDelay * 1000, 3000)))

    // Save AI response
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: response.content,
        metadata: {
          sentiment: response.sentiment,
          responseTime: Math.round(response.suggestedDelay)
        }
      }
    })

    // Send AI message via Pusher (if configured)
    if (isPusherConfigured && pusherServer) {
      const userChannel = getUserChannel(session.user.id)
      await pusherServer.trigger(userChannel, 'message-received', {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt,
        sentiment: response.sentiment
      })
    }
    
    // Update user metrics (trust is now handled by PersonalityEngine)
    await prisma.profile.update({
      where: { id: profile.id },
      data: {
        interactionCount: { increment: 1 },
        lastInteraction: new Date()
      }
    })
    
    // Invalidate cached profile
    await cache.delete(cacheKey)
    
    // Track activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "message_sent",
        metadata: {
          sentiment: response.sentiment.primaryEmotion,
          intensity: response.sentiment.emotionalIntensity
        }
      }
    })
    
    // Check for conversion trigger
    if (response.shouldTriggerConversion) {
      await prisma.conversionEvent.create({
        data: {
          userId: session.user.id,
          eventType: "conversion_trigger",
          archetype: profile.archetype,
          metadata: {
            triggerType: "emotional_moment",
            trustLevel: profile.trustLevel,
            messageCount: profile.interactionCount
          }
        }
      })
    }
    
    // Check for upgrade triggers
    const upgradePrompt = await upgradeTriggerManager.getUpgradePrompt(session.user.id)
    
    return NextResponse.json({
      response: {
        id: aiMessage.id,
        role: aiMessage.role,
        content: aiMessage.content,
        createdAt: aiMessage.createdAt
      },
      messagesRemaining: profile.user.subscription?.plan === "free" 
        ? Math.max(0, 500 - profile.interactionCount) 
        : null,
      shouldShowUpgrade: response.shouldTriggerConversion,
      trustUpdate: response.trustUpdate,
      upgradePrompt: upgradePrompt?.show ? upgradePrompt : null
    })
    
  } catch (error) {
    console.error("Message API Error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    
    // Check for specific OpenAI errors
    if (error instanceof Error && error.message.includes("API key")) {
      return NextResponse.json(
        { error: "AI service not configured. Please contact support." },
        { status: 503 }
      )
    }
    
    if (error instanceof Error && error.message.includes("rate limit")) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again in a moment." },
        { status: 429 }
      )
    }
    
    return handleApiError(error)
  }
}