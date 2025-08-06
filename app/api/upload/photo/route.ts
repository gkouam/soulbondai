import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { handleApiError, AppError } from "@/lib/error-handling"
import { featureGate } from "@/lib/feature-gates"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
})

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
    const file = formData.get("file") as File
    
    if (!file) {
      throw new AppError("No file provided", 400)
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      throw new AppError("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed", 400)
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new AppError("File too large. Maximum size is 5MB", 400)
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop()
    const fileName = `${session.user.id}/${crypto.randomUUID()}.${fileExt}`
    
    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer())
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: `photos/${fileName}`,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        userId: session.user.id,
        uploadedAt: new Date().toISOString()
      }
    }))

    // Generate signed URL for viewing (expires in 7 days)
    const url = await getSignedUrl(
      s3Client,
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: `photos/${fileName}`
      }),
      { expiresIn: 7 * 24 * 60 * 60 }
    )

    // Track usage
    await import("@/lib/stripe-pricing").then(({ trackUsage }) => 
      trackUsage(session.user.id, "photo", 1)
    )

    return NextResponse.json({
      url,
      fileName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    return handleApiError(error)
  }
}

// Get presigned upload URL
export async function GET(req: NextRequest) {
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

    const searchParams = req.nextUrl.searchParams
    const fileName = searchParams.get("fileName")
    const fileType = searchParams.get("fileType")

    if (!fileName || !fileType) {
      throw new AppError("Missing fileName or fileType", 400)
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(fileType)) {
      throw new AppError("Invalid file type", 400)
    }

    // Generate unique key
    const fileExt = fileName.split(".").pop()
    const key = `photos/${session.user.id}/${crypto.randomUUID()}.${fileExt}`

    // Create presigned POST URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: fileType,
      Metadata: {
        userId: session.user.id,
        originalName: fileName
      }
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({
      uploadUrl,
      key,
      expiresIn: 3600
    })

  } catch (error) {
    return handleApiError(error)
  }
}