import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { getOpenAIClient } from "@/lib/vector-store"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    // Check if user has premium subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: { 
        status: true,
        plan: true
      }
    })

    if (!subscription || subscription.status !== "active" || subscription.plan === "basic") {
      throw new AppError("Voice messages require a premium subscription", 403, "PREMIUM_REQUIRED")
    }

    const { text, voice = "alloy" } = await req.json()

    if (!text || typeof text !== "string") {
      throw new AppError("Invalid text provided", 400)
    }

    // Limit text length to prevent abuse
    if (text.length > 1000) {
      throw new AppError("Text too long. Maximum 1000 characters allowed", 400)
    }

    const openai = getOpenAIClient()
    if (!openai) {
      throw new AppError("Voice synthesis not available", 503)
    }

    // Generate speech using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice as any, // alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    })

    // Get the audio buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Return the audio file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}