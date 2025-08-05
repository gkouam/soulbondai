import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateUploadUrl, uploadFile } from "@/lib/file-upload"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has premium subscription for file uploads
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription || subscription.plan === "free" || subscription.plan === "basic") {
      return NextResponse.json(
        { error: "File uploads require Premium subscription or higher" },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("type") as "image" | "voice" | null

    if (!file || !fileType) {
      return NextResponse.json(
        { error: "File and type are required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (fileType !== "image" && fileType !== "voice") {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'image' or 'voice'" },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload file
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      session.user.id,
      fileType
    )

    if (!result) {
      return NextResponse.json(
        { error: "File upload service not available" },
        { status: 503 }
      )
    }

    // Track upload in activity log
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: `${fileType}_uploaded`,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          s3Key: result.key
        }
      }
    })

    return NextResponse.json({
      url: result.url,
      key: result.key,
      type: fileType
    })

  } catch (error) {
    console.error("Upload error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}

// Get presigned URL for direct browser upload
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fileName = searchParams.get("fileName")
    const mimeType = searchParams.get("mimeType")
    const fileType = searchParams.get("type") as "image" | "voice" | null

    if (!fileName || !mimeType || !fileType) {
      return NextResponse.json(
        { error: "fileName, mimeType, and type are required" },
        { status: 400 }
      )
    }

    // Check subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id }
    })

    if (!subscription || subscription.plan === "free" || subscription.plan === "basic") {
      return NextResponse.json(
        { error: "File uploads require Premium subscription or higher" },
        { status: 403 }
      )
    }

    const result = await generateUploadUrl(
      fileName,
      mimeType,
      session.user.id,
      fileType
    )

    if (!result) {
      return NextResponse.json(
        { error: "File upload service not available" },
        { status: 503 }
      )
    }

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      method: "PUT"
    })

  } catch (error) {
    console.error("Generate upload URL error:", error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}