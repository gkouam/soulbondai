import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

let s3Client: S3Client | null = null

// Initialize S3 client
export function getS3Client(): S3Client | null {
  if (!s3Client && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

// File type configurations
const ALLOWED_FILE_TYPES = {
  image: {
    mimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"]
  },
  voice: {
    mimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: [".mp3", ".wav", ".ogg", ".webm"]
  }
} as const

// Generate unique file name
function generateFileName(originalName: string): string {
  const ext = originalName.substring(originalName.lastIndexOf("."))
  const hash = crypto.randomBytes(16).toString("hex")
  const timestamp = Date.now()
  return `${timestamp}-${hash}${ext}`
}

// Upload file to S3
export async function uploadFile(
  file: Buffer,
  originalName: string,
  mimeType: string,
  userId: string,
  fileType: "image" | "voice"
): Promise<{ url: string; key: string } | null> {
  const s3 = getS3Client()
  if (!s3) {
    console.warn("S3 client not initialized, file upload disabled")
    return null
  }

  // Validate file type
  const config = ALLOWED_FILE_TYPES[fileType]
  if (!config.mimeTypes.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${config.mimeTypes.join(", ")}`)
  }

  // Validate file size
  if (file.length > config.maxSize) {
    throw new Error(`File too large. Maximum size: ${config.maxSize / 1024 / 1024}MB`)
  }

  const fileName = generateFileName(originalName)
  const key = `${fileType}s/${userId}/${fileName}`

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      Body: file,
      ContentType: mimeType,
      Metadata: {
        userId,
        originalName,
        uploadedAt: new Date().toISOString()
      }
    })

    await s3.send(command)

    // Return CloudFront URL if configured, otherwise S3 URL
    const baseUrl = process.env.CLOUDFRONT_URL || 
      `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`
    
    return {
      url: `${baseUrl}/${key}`,
      key
    }
  } catch (error) {
    console.error("File upload error:", error)
    throw new Error("Failed to upload file")
  }
}

// Generate presigned URL for direct upload
export async function generateUploadUrl(
  fileName: string,
  mimeType: string,
  userId: string,
  fileType: "image" | "voice"
): Promise<{ uploadUrl: string; key: string } | null> {
  const s3 = getS3Client()
  if (!s3) {
    return null
  }

  const config = ALLOWED_FILE_TYPES[fileType]
  if (!config.mimeTypes.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed types: ${config.mimeTypes.join(", ")}`)
  }

  const generatedFileName = generateFileName(fileName)
  const key = `${fileType}s/${userId}/${generatedFileName}`

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: mimeType,
      Metadata: {
        userId,
        originalName: fileName,
        uploadedAt: new Date().toISOString()
      }
    })

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 minutes

    return { uploadUrl, key }
  } catch (error) {
    console.error("Generate upload URL error:", error)
    throw new Error("Failed to generate upload URL")
  }
}

// Delete file from S3
export async function deleteFile(key: string): Promise<boolean> {
  const s3 = getS3Client()
  if (!s3) {
    return false
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key
    })

    await s3.send(command)
    return true
  } catch (error) {
    console.error("File deletion error:", error)
    return false
  }
}

// Cloudflare R2 Alternative (if using R2 instead of S3)
export function getR2Client(): S3Client | null {
  if (!s3Client && process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
    s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return s3Client
}