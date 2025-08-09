import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const voiceSettingsSchema = z.object({
  voiceEnabled: z.boolean().optional(),
  selectedVoice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
  autoPlayVoice: z.boolean().optional(),
  voiceSpeed: z.number().min(0.5).max(2.0).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: {
        voiceEnabled: true,
        companionVoice: true,  // Changed from selectedVoice to companionVoice
        autoPlayVoice: true,
        voiceSpeed: true,
      }
    })

    return NextResponse.json({
      voiceEnabled: profile?.voiceEnabled ?? false,
      selectedVoice: profile?.companionVoice ?? "alloy",  // Map companionVoice to selectedVoice
      autoPlayVoice: profile?.autoPlayVoice ?? false,
      voiceSpeed: profile?.voiceSpeed ?? 1.0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const body = await req.json()
    const validatedData = voiceSettingsSchema.parse(body)

    // Map selectedVoice to companionVoice for database
    const dataToUpdate: any = { ...validatedData }
    if (validatedData.selectedVoice) {
      dataToUpdate.companionVoice = validatedData.selectedVoice
      delete dataToUpdate.selectedVoice
    }

    const updatedProfile = await prisma.profile.update({
      where: { userId: session.user.id },
      data: dataToUpdate,
      select: {
        voiceEnabled: true,
        companionVoice: true,  // Changed from selectedVoice to companionVoice
        autoPlayVoice: true,
        voiceSpeed: true,
      }
    })

    // Map back for response
    return NextResponse.json({
      voiceEnabled: updatedProfile.voiceEnabled,
      selectedVoice: updatedProfile.companionVoice,
      autoPlayVoice: updatedProfile.autoPlayVoice,
      voiceSpeed: updatedProfile.voiceSpeed,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleApiError(new AppError("Invalid voice settings", 400))
    }
    return handleApiError(error)
  }
}