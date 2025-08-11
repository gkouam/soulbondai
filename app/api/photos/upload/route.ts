import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"
import { featureGate } from "@/lib/feature-gates"
import { uploadImage, getThumbnailUrl } from "@/lib/cloudinary"
import { getOpenAIClient } from "@/lib/vector-store"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    // Check feature access
    const access = await featureGate.checkAndLog(session.user.id, "photo_sharing")
    if (!access.allowed) {
      throw new AppError(access.message || "Photo sharing not available", 403, "FEATURE_LOCKED")
    }

    const formData = await req.formData()
    const imageFile = formData.get("image") as File
    const conversationId = formData.get("conversationId") as string
    const caption = formData.get("caption") as string

    if (!imageFile || !conversationId) {
      throw new AppError("Missing image file or conversation ID", 400)
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new AppError("Image file too large. Maximum 5MB allowed", 400)
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(imageFile.type)) {
      throw new AppError("Invalid image format. Supported: JPEG, PNG, GIF, WebP", 400)
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

    // Convert image to buffer
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary with optimization
    const imageUrl = await uploadImage(buffer, session.user.id, 'chat')
    const thumbnailUrl = getThumbnailUrl(imageUrl, 400, 400)

    // Analyze image with AI (optional)
    let imageAnalysis = null
    const openai = getOpenAIClient()
    if (openai) {
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an AI analyzing an image shared in a conversation. Describe what you see briefly and note any emotional context."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: caption || "What's in this image?"
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl,
                    detail: "low"
                  }
                }
              ]
            }
          ],
          max_tokens: 150
        })
        
        imageAnalysis = response.choices[0].message.content
      } catch (error) {
        console.error("Image analysis failed:", error)
        // Continue without analysis
      }
    }

    // Save photo message to database
    const message = await prisma.message.create({
      data: {
        conversationId,
        role: "user",
        content: caption || "📸 Shared a photo",
        imageUrl,
        metadata: {
          type: "photo",
          thumbnailUrl,
          analysis: imageAnalysis,
          originalName: imageFile.name,
          size: imageFile.size,
          mimeType: imageFile.type
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

    // Track activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "photo_shared",
        metadata: {
          conversationId,
          hasCaption: !!caption
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        imageUrl,
        thumbnailUrl,
        caption,
        analysis: imageAnalysis,
        createdAt: message.createdAt
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// GET endpoint to retrieve photo messages
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

    // Get photo messages
    const photoMessages = await prisma.message.findMany({
      where: {
        conversationId,
        imageUrl: { not: null }
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        role: true,
        createdAt: true,
        metadata: true
      }
    })

    return NextResponse.json({
      photos: photoMessages,
      count: photoMessages.length
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE endpoint to remove a photo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get("messageId")

    if (!messageId) {
      throw new AppError("Message ID required", 400)
    }

    // Verify message belongs to user
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversation: {
          userId: session.user.id
        }
      }
    })

    if (!message) {
      throw new AppError("Message not found", 404)
    }

    // Soft delete by clearing the image URL
    await prisma.message.update({
      where: { id: messageId },
      data: {
        imageUrl: null,
        content: "📸 [Photo removed]",
        metadata: {
          ...((message.metadata as any) || {}),
          deleted: true,
          deletedAt: new Date().toISOString()
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Photo removed successfully"
    })

  } catch (error) {
    return handleApiError(error)
  }
}