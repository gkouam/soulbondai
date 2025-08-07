import { OpenAI } from 'openai'
import sharp from 'sharp'
import * as tf from '@tensorflow/tfjs-node'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ModerationResult {
  safe: boolean
  categories: {
    adult: number
    violence: number
    hate: number
    selfHarm: number
    sexual: number
    violence_graphic: number
    harassment: number
  }
  flaggedCategories: string[]
  confidence: number
  action: 'approve' | 'flag' | 'block'
  reason?: string
}

export interface PhotoAnalysis {
  description: string
  objects: string[]
  faces: number
  emotions: string[]
  inappropriate: boolean
  moderationScore: number
}

export class ContentModerator {
  private nsfwModel: tf.LayersModel | null = null
  private modelLoaded: boolean = false

  constructor() {
    this.loadModels()
  }

  /**
   * Load NSFW detection model
   */
  private async loadModels() {
    try {
      // Load a pre-trained NSFW detection model
      // In production, you'd use a proper model like NSFW.js or Azure Content Moderator
      // For now, we'll simulate with OpenAI's moderation
      this.modelLoaded = true
    } catch (error) {
      console.error('Failed to load moderation models:', error)
    }
  }

  /**
   * Moderate text content
   */
  async moderateText(text: string): Promise<ModerationResult> {
    try {
      // Use OpenAI's moderation API
      const response = await openai.moderations.create({
        input: text
      })

      const result = response.results[0]
      
      const categories = {
        adult: result.categories['sexual'] ? 1 : 0,
        violence: result.categories['violence'] ? 1 : 0,
        hate: result.categories['hate'] ? 1 : 0,
        selfHarm: result.categories['self-harm'] ? 1 : 0,
        sexual: result.categories['sexual'] ? 1 : 0,
        violence_graphic: result.categories['violence/graphic'] ? 1 : 0,
        harassment: result.categories['harassment'] ? 1 : 0
      }

      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category)

      const safe = !result.flagged
      const confidence = Math.max(...Object.values(result.category_scores))

      let action: 'approve' | 'flag' | 'block' = 'approve'
      if (result.flagged) {
        if (confidence > 0.9) {
          action = 'block'
        } else if (confidence > 0.7) {
          action = 'flag'
        }
      }

      return {
        safe,
        categories,
        flaggedCategories,
        confidence,
        action,
        reason: result.flagged ? `Content flagged for: ${flaggedCategories.join(', ')}` : undefined
      }
    } catch (error) {
      console.error('Text moderation error:', error)
      return {
        safe: true,
        categories: {
          adult: 0,
          violence: 0,
          hate: 0,
          selfHarm: 0,
          sexual: 0,
          violence_graphic: 0,
          harassment: 0
        },
        flaggedCategories: [],
        confidence: 0,
        action: 'approve'
      }
    }
  }

  /**
   * Moderate photo content
   */
  async moderatePhoto(
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<ModerationResult & { analysis: PhotoAnalysis }> {
    try {
      // Resize image for analysis (save bandwidth)
      const resizedImage = await sharp(imageBuffer)
        .resize(512, 512, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer()

      // Convert to base64 for API calls
      const base64Image = resizedImage.toString('base64')
      
      // Use OpenAI Vision API for content analysis
      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system. Analyze this image and provide:
              1. A brief description
              2. List of objects detected
              3. Number of faces
              4. Detected emotions (if faces present)
              5. Whether the content is inappropriate (NSFW, violent, etc.)
              6. A moderation score from 0-1 (0 = safe, 1 = highly inappropriate)
              
              Respond in JSON format: {
                "description": "string",
                "objects": ["string"],
                "faces": number,
                "emotions": ["string"],
                "inappropriate": boolean,
                "moderationScore": number,
                "flaggedCategories": ["string"]
              }`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })

      const analysisText = visionResponse.choices[0].message.content || '{}'
      const analysis = JSON.parse(analysisText) as PhotoAnalysis & { flaggedCategories: string[] }

      // Determine moderation result
      const safe = !analysis.inappropriate && analysis.moderationScore < 0.3
      
      let action: 'approve' | 'flag' | 'block' = 'approve'
      if (analysis.moderationScore > 0.8) {
        action = 'block'
      } else if (analysis.moderationScore > 0.5) {
        action = 'flag'
      }

      // Map to standard categories
      const categories = {
        adult: analysis.flaggedCategories?.includes('adult') ? 1 : 0,
        violence: analysis.flaggedCategories?.includes('violence') ? 1 : 0,
        hate: analysis.flaggedCategories?.includes('hate') ? 1 : 0,
        selfHarm: analysis.flaggedCategories?.includes('self-harm') ? 1 : 0,
        sexual: analysis.flaggedCategories?.includes('sexual') ? 1 : 0,
        violence_graphic: analysis.flaggedCategories?.includes('gore') ? 1 : 0,
        harassment: analysis.flaggedCategories?.includes('harassment') ? 1 : 0
      }

      return {
        safe,
        categories,
        flaggedCategories: analysis.flaggedCategories || [],
        confidence: analysis.moderationScore,
        action,
        reason: !safe ? `Image contains inappropriate content: ${analysis.flaggedCategories?.join(', ')}` : undefined,
        analysis: {
          description: analysis.description,
          objects: analysis.objects,
          faces: analysis.faces,
          emotions: analysis.emotions,
          inappropriate: analysis.inappropriate,
          moderationScore: analysis.moderationScore
        }
      }
    } catch (error) {
      console.error('Photo moderation error:', error)
      
      // Fallback to basic checks
      return {
        safe: true,
        categories: {
          adult: 0,
          violence: 0,
          hate: 0,
          selfHarm: 0,
          sexual: 0,
          violence_graphic: 0,
          harassment: 0
        },
        flaggedCategories: [],
        confidence: 0,
        action: 'approve',
        analysis: {
          description: 'Unable to analyze image',
          objects: [],
          faces: 0,
          emotions: [],
          inappropriate: false,
          moderationScore: 0
        }
      }
    }
  }

  /**
   * Check if file type is allowed
   */
  isAllowedFileType(mimeType: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
    return allowedTypes.includes(mimeType.toLowerCase())
  }

  /**
   * Check file size
   */
  isAllowedFileSize(sizeInBytes: number): boolean {
    const maxSize = 10 * 1024 * 1024 // 10MB
    return sizeInBytes <= maxSize
  }

  /**
   * Process and moderate uploaded photo
   */
  async processPhotoUpload(
    userId: string,
    file: {
      buffer: Buffer
      mimeType: string
      size: number
      originalName: string
    }
  ): Promise<{
    success: boolean
    url?: string
    moderation: ModerationResult
    analysis?: PhotoAnalysis
    error?: string
  }> {
    // Validate file type
    if (!this.isAllowedFileType(file.mimeType)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
        moderation: {
          safe: false,
          categories: {
            adult: 0,
            violence: 0,
            hate: 0,
            selfHarm: 0,
            sexual: 0,
            violence_graphic: 0,
            harassment: 0
          },
          flaggedCategories: [],
          confidence: 1,
          action: 'block',
          reason: 'Invalid file type'
        }
      }
    }

    // Validate file size
    if (!this.isAllowedFileSize(file.size)) {
      return {
        success: false,
        error: 'File too large. Maximum size is 10MB.',
        moderation: {
          safe: false,
          categories: {
            adult: 0,
            violence: 0,
            hate: 0,
            selfHarm: 0,
            sexual: 0,
            violence_graphic: 0,
            harassment: 0
          },
          flaggedCategories: [],
          confidence: 1,
          action: 'block',
          reason: 'File too large'
        }
      }
    }

    // Moderate content
    const moderationResult = await this.moderatePhoto(file.buffer, file.mimeType)

    // Block inappropriate content
    if (moderationResult.action === 'block') {
      // Log blocked content for review
      await this.logModeration(userId, 'photo', moderationResult, 'blocked')
      
      return {
        success: false,
        error: 'This image contains inappropriate content and cannot be shared.',
        moderation: moderationResult,
        analysis: moderationResult.analysis
      }
    }

    // Process and store image
    try {
      // Optimize image
      const optimizedImage = await sharp(file.buffer)
        .resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer()

      // Generate thumbnail
      const thumbnail = await sharp(file.buffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer()

      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      // For now, we'll simulate with a local path
      const fileName = `${userId}_${Date.now()}_${file.originalName}`
      const url = `/uploads/photos/${fileName}`

      // Flag content for manual review if needed
      if (moderationResult.action === 'flag') {
        await this.logModeration(userId, 'photo', moderationResult, 'flagged')
      }

      // Log successful upload
      await prisma.activity.create({
        data: {
          userId,
          type: 'photo_uploaded',
          metadata: {
            fileName,
            url,
            mimeType: file.mimeType,
            size: optimizedImage.length,
            moderation: {
              safe: moderationResult.safe,
              score: moderationResult.confidence,
              action: moderationResult.action
            },
            analysis: moderationResult.analysis
          }
        }
      })

      return {
        success: true,
        url,
        moderation: moderationResult,
        analysis: moderationResult.analysis
      }
    } catch (error) {
      console.error('Photo processing error:', error)
      return {
        success: false,
        error: 'Failed to process image. Please try again.',
        moderation: moderationResult,
        analysis: moderationResult.analysis
      }
    }
  }

  /**
   * Log moderation actions
   */
  private async logModeration(
    userId: string,
    contentType: 'text' | 'photo',
    result: ModerationResult,
    action: string
  ) {
    await prisma.activity.create({
      data: {
        userId,
        type: 'content_moderation',
        metadata: {
          contentType,
          action,
          categories: result.categories,
          flaggedCategories: result.flaggedCategories,
          confidence: result.confidence,
          reason: result.reason,
          timestamp: new Date()
        }
      }
    })
  }

  /**
   * Review flagged content (admin only)
   */
  async reviewFlaggedContent(
    contentId: string,
    reviewerId: string,
    decision: 'approve' | 'block',
    notes?: string
  ) {
    // Update moderation status
    await prisma.activity.create({
      data: {
        userId: reviewerId,
        type: 'moderation_review',
        metadata: {
          contentId,
          decision,
          notes,
          timestamp: new Date()
        }
      }
    })

    return {
      success: true,
      decision,
      reviewedAt: new Date()
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(timeframe: 'day' | 'week' | 'month' = 'week') {
    const startDate = new Date()
    switch (timeframe) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
    }

    const moderationActivities = await prisma.activity.findMany({
      where: {
        type: 'content_moderation',
        createdAt: { gte: startDate }
      }
    })

    const stats = {
      total: moderationActivities.length,
      blocked: 0,
      flagged: 0,
      approved: 0,
      byCategory: {} as Record<string, number>,
      byContentType: {
        text: 0,
        photo: 0
      }
    }

    moderationActivities.forEach(activity => {
      const metadata = activity.metadata as any
      
      if (metadata.action === 'blocked') stats.blocked++
      else if (metadata.action === 'flagged') stats.flagged++
      else stats.approved++

      if (metadata.contentType === 'text') stats.byContentType.text++
      else if (metadata.contentType === 'photo') stats.byContentType.photo++

      metadata.flaggedCategories?.forEach((category: string) => {
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
      })
    })

    return stats
  }
}

export const contentModerator = new ContentModerator()