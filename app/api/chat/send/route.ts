import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queueManager } from '@/lib/queue/queue-manager'
import { checkMessageLimit, subscriptionLimits } from '@/lib/subscription-limits'
import { trackUsage } from '@/lib/stripe-pricing'
import { z } from 'zod'

const sendMessageSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1).max(5000),
  characterId: z.string(),
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { conversationId, message, characterId } = sendMessageSchema.parse(body)

    // Check message limits before proceeding
    try {
      await checkMessageLimit(session.user.id)
    } catch (error: any) {
      // Check if user can send message and get details
      const canSend = await subscriptionLimits.canSendMessage(session.user.id)
      return NextResponse.json(
        { 
          error: error.message,
          limitReached: true,
          remaining: canSend.remaining || 0,
          resetAt: canSend.resetAt,
          upgradeUrl: '/pricing'
        },
        { status: 429 }
      )
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check rate limit - prevent rapid messages
    const lastMessage = conversation.messages[0]
    if (lastMessage && lastMessage.createdAt > new Date(Date.now() - 2000)) {
      return NextResponse.json(
        { error: 'Please wait a moment before sending another message' },
        { status: 429 }
      )
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        conversationId,
        content: message,
        role: 'user',
      }
    })

    // Track usage for billing
    await trackUsage(session.user.id, "message", 1)

    // Queue AI response generation
    const job = await queueManager.addAIGenerationJob({
      conversationId,
      userId: session.user.id,
      message,
      characterId,
      context: {
        messageId: userMessage.id,
        timestamp: new Date().toISOString(),
      }
    }, {
      priority: conversation.messages.length === 0 ? 1 : 2, // Higher priority for first message
    })

    // Get remaining messages for today
    const canSend = await subscriptionLimits.canSendMessage(session.user.id)

    // Return immediately with job info
    return NextResponse.json({
      success: true,
      message: {
        id: userMessage.id,
        content: userMessage.content,
        role: userMessage.role,
        createdAt: userMessage.createdAt,
      },
      job: {
        id: job.id,
        status: 'queued',
      },
      usage: {
        remaining: canSend.remaining,
        resetAt: canSend.resetAt
      }
    })
  } catch (error) {
    console.error('Send message error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}