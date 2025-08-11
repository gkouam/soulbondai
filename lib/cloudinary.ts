import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export interface UploadOptions {
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  folder?: string
  public_id?: string
  format?: string
  transformation?: any[]
  tags?: string[]
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<any> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: options.resource_type || 'auto',
        folder: options.folder || 'soulbondai',
        public_id: options.public_id,
        format: options.format,
        transformation: options.transformation,
        tags: options.tags,
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
        } else {
          resolve(result)
        }
      }
    )

    uploadStream.end(buffer)
  })
}

/**
 * Upload image with optimization
 */
export async function uploadImage(
  buffer: Buffer,
  userId: string,
  type: 'profile' | 'chat' | 'memory' = 'chat'
): Promise<string> {
  const result = await uploadToCloudinary(buffer, {
    resource_type: 'image',
    folder: `images/${type}`,
    public_id: `${userId}_${Date.now()}`,
    transformation: [
      { width: 1200, height: 1200, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ]
  })

  return result.secure_url
}

/**
 * Upload audio file
 */
export async function uploadAudio(
  buffer: Buffer,
  userId: string
): Promise<string> {
  const result = await uploadToCloudinary(buffer, {
    resource_type: 'video', // Cloudinary uses 'video' for audio
    folder: 'voice-messages',
    public_id: `voice_${userId}_${Date.now()}`,
    format: 'mp3'
  })

  return result.secure_url
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    })
    return result.result === 'ok'
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    return false
  }
}

/**
 * Get optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality: 'auto' | 'auto:low' | 'auto:eco' | 'auto:good' | 'auto:best' = 'auto:good'
): string {
  if (!url.includes('cloudinary.com')) {
    return url
  }

  // Extract public ID from URL
  const parts = url.split('/')
  const uploadIndex = parts.indexOf('upload')
  if (uploadIndex === -1) return url

  // Build transformation string
  const transformations = []
  if (width || height) {
    transformations.push(`w_${width || 'auto'},h_${height || 'auto'},c_limit`)
  }
  transformations.push(`q_${quality}`)
  transformations.push('f_auto')

  // Insert transformations after 'upload'
  parts.splice(uploadIndex + 1, 0, transformations.join(','))
  
  return parts.join('/')
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(
  url: string,
  width: number = 200,
  height: number = 200
): string {
  return getOptimizedImageUrl(url, width, height, 'auto:eco')
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}

// Export configured instance
export { cloudinary }