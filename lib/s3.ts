import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'soulbondai-uploads'

interface UploadParams {
  key: string
  body: Buffer | Uint8Array | string
  contentType?: string
  metadata?: Record<string, string>
}

export async function uploadToS3(params: UploadParams): Promise<string> {
  const { key, body, contentType = 'application/octet-stream', metadata } = params
  
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    })
    
    await s3Client.send(command)
    
    // Return the URL
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new Error('Failed to upload to S3')
  }
}

export async function getSignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })
  
  await s3Client.send(command)
}