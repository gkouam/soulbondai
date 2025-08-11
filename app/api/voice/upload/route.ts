import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"
import { featureGate } from "@/lib/feature-gates"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { getOpenAIClient } from "@/lib/vector-store"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    // Check feature access
    const access = await featureGate.checkAndLog(session.user.id, "voice_messages")
    if (!access.allowed) {
      throw new AppError(access.message || "Voice messages not available", 403, "FEATURE_LOCKED")
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as File
    const conversationId = formData.get("conversationId") as string

    if (!audioFile || !conversationId) {
      throw new AppError("Missing audio file or conversation ID", 400)
    }

    // Validate file size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      throw new AppError("Audio file too large. Maximum 10MB allowed", 400)
    }

    // Validate file type
    const validTypes = ["audio/webm", "audio/mp3", "audio/mpeg", "audio/wav", "audio/ogg"]
    if (!validTypes.includes(audioFile.type)) {
      throw new AppError("Invalid audio format. Supported: WebM, MP3, WAV, OGG", 400)
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    })

    if (!conversation) {
      throw new AppError("Conversation not found", 404)
    }

    // Convert audio to buffer
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary (or your preferred storage)
    const uploadResult = await uploadToCloudinary(buffer, {
      resource_type: "video", // Cloudinary uses "video" for audio files
      folder: "voice-messages",
      public_id: `${session.user.id}_${Date.now()}`,
      format: "mp3"
    })

    // Transcribe audio using OpenAI Whisper (optional)
    let transcription = ""
    const openai = getOpenAIClient()
    if (openai) {
      try {
        const file = new File([buffer], "audio.webm", { type: audioFile.type })
        const response = await openai.audio.transcriptions.create({
          file,
          model: "whisper-1",
          language: "en"
        })
        transcription = response.text
      } catch (error) {
        console.error("Transcription failed:", error)
        // Continue without transcription
      }
    }

    // Save voice message to database
    const message = await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: transcription || "🎤 Voice message",
        audioUrl: uploadResult.secure_url,
        metadata: {
          type: "voice",
          duration: formData.get("duration") || 0,
          transcription
        }
      }
    })

    // Update user metrics
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: {
        interactionCount: { increment: 1 },
        lastInteraction: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        audioUrl: uploadResult.secure_url,
        transcription,
        createdAt: message.createdAt
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET endpoint to retrieve voice messages
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      throw new AppError("Conversation ID required", 400)
    }

    // Verify conversation belongs to user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id
      }
    })

    if (!conversation) {
      throw new AppError("Conversation not found", 404)
    }

    // Get voice messages
    const voiceMessages = await prisma.message.findMany({
      where: {
        conversationId,
        audioUrl: { not: null }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        content: true,
        audioUrl: true,
        role: true,
        createdAt: true,
        metadata: true
      }
    })

    return NextResponse.json({
      messages: voiceMessages,
      count: voiceMessages.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}