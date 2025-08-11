import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AppError("Unauthorized", 401)
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const conversationId = searchParams.get("conversationId")

    // Build query filters
    const where: any = {
      conversation: {
        userId: session.user.id
      },
      imageUrl: { not: null }
    }

    if (conversationId) {
      where.conversationId = conversationId
    }

    // Get total count
    const totalCount = await prisma.message.count({ where })

    // Get photos with pagination
    const photos = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        metadata: true,
        conversation: {
          select: {
            id: true,
            character: {
              select: {
                name: true,
                avatar: true
              }
            }
          }
        }
      }
    })

    // Group photos by date
    const groupedPhotos = photos.reduce((acc, photo) => {
      const date = new Date(photo.createdAt).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(photo)
      return acc
    }, {} as Record<string, typeof photos>)

    return NextResponse.json({
      photos: groupedPhotos,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      },
      stats: {
        totalPhotos: totalCount,
        firstPhoto: photos[photos.length - 1]?.createdAt,
        lastPhoto: photos[0]?.createdAt
      }
    })

  } catch (error) {
    return handleApiError(error)
  }
}