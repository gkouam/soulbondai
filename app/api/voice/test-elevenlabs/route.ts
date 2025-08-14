import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { getElevenLabsService } from "@/lib/elevenlabs"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const elevenLabs = getElevenLabsService()
    
    if (!elevenLabs) {
      return NextResponse.json({
        status: "not_configured",
        message: "ElevenLabs API key not configured",
        fallback: "OpenAI TTS"
      })
    }

    try {
      // Test the API connection
      const [voices, subscription] = await Promise.all([
        elevenLabs.getVoices(),
        elevenLabs.getSubscriptionInfo()
      ])

      return NextResponse.json({
        status: "connected",
        message: "ElevenLabs API connected successfully",
        data: {
          availableVoices: voices.length,
          subscription: {
            tier: subscription.tier,
            character_count: subscription.character_count,
            character_limit: subscription.character_limit,
            can_use_instant_voice_cloning: subscription.can_use_instant_voice_cloning,
            can_use_professional_voice_cloning: subscription.can_use_professional_voice_cloning
          },
          personalityVoices: {
            "The Gentle": "Sarah",
            "The Strong": "Rachel", 
            "The Creative": "Domi",
            "The Intellectual": "Dorothy",
            "The Adventurer": "Freya"
          }
        }
      })
    } catch (error) {
      console.error("ElevenLabs API test failed:", error)
      return NextResponse.json({
        status: "error",
        message: "ElevenLabs API connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: "OpenAI TTS available"
      })
    }

  } catch (error) {
    return handleApiError(error)
  }
}

// Test voice synthesis
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const { text = "Hello! This is a test of the ElevenLabs voice synthesis.", personality = "The Gentle" } = await req.json()

    const elevenLabs = getElevenLabsService()
    
    if (!elevenLabs) {
      throw new AppError("ElevenLabs not configured", 503)
    }

    const buffer = await elevenLabs.synthesizeSpeech(text, personality)

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      },
    })

  } catch (error) {
    return handleApiError(error)
  }
}