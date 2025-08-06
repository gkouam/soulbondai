import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Mock Twilio client for development
// In production, use actual Twilio SDK: import twilio from 'twilio'
class MockTwilioClient {
  messages = {
    create: async (options: { to: string; from: string; body: string }) => {
      console.log('[MOCK SMS]', options)
      return { sid: 'mock_' + crypto.randomBytes(16).toString('hex') }
    }
  }
}

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? null // In production: twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : new MockTwilioClient()

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+1234567890'

export interface PhoneVerificationOptions {
  userId: string
  phoneNumber: string
  type?: 'sms' | 'voice'
}

export class PhoneVerificationService {
  private static generateCode(): string {
    // Generate 6-digit verification code
    return Math.floor(100000 + Math.random() * 900000).toString()
  }
  
  private static formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    const cleaned = phoneNumber.replace(/\D/g, '')
    
    // Add country code if not present (assuming US)
    if (cleaned.length === 10) {
      return `+1${cleaned}`
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+${cleaned}`
    }
    
    // Assume international format if starts with +
    if (phoneNumber.startsWith('+')) {
      return `+${cleaned}`
    }
    
    return phoneNumber
  }
  
  static async sendVerificationCode(options: PhoneVerificationOptions): Promise<{
    success: boolean
    verificationId?: string
    error?: string
  }> {
    try {
      const { userId, phoneNumber, type = 'sms' } = options
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      const code = this.generateCode()
      
      // Store verification record
      const verification = await prisma.phoneVerification.create({
        data: {
          userId,
          phoneNumber: formattedPhone,
          code,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      })
      
      // Send SMS
      if (twilioClient) {
        const message = `Your SoulBond AI verification code is: ${code}. This code expires in 10 minutes.`
        
        if (type === 'sms') {
          await twilioClient.messages.create({
            to: formattedPhone,
            from: TWILIO_PHONE_NUMBER,
            body: message
          })
        } else {
          // Voice call option (for accessibility)
          // In production, use Twilio's voice API
          console.log('[VOICE CALL]', { to: formattedPhone, message })
        }
      }
      
      return {
        success: true,
        verificationId: verification.id
      }
    } catch (error) {
      console.error('Phone verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      }
    }
  }
  
  static async verifyCode(options: {
    userId: string
    phoneNumber: string
    code: string
  }): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const { userId, phoneNumber, code } = options
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      
      // Find valid verification
      const verification = await prisma.phoneVerification.findFirst({
        where: {
          userId,
          phoneNumber: formattedPhone,
          code,
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      if (!verification) {
        return {
          success: false,
          error: 'Invalid or expired verification code'
        }
      }
      
      // Mark as verified
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { verified: true }
      })
      
      // Update user profile with verified phone
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: formattedPhone,
          phoneVerified: true
        }
      })
      
      return { success: true }
    } catch (error) {
      console.error('Code verification error:', error)
      return {
        success: false,
        error: 'Failed to verify code'
      }
    }
  }
  
  static async resendCode(options: {
    userId: string
    phoneNumber: string
  }): Promise<{
    success: boolean
    error?: string
    retryAfter?: number
  }> {
    try {
      const { userId, phoneNumber } = options
      const formattedPhone = this.formatPhoneNumber(phoneNumber)
      
      // Check rate limit (max 3 attempts per hour)
      const recentAttempts = await prisma.phoneVerification.count({
        where: {
          userId,
          phoneNumber: formattedPhone,
          createdAt: {
            gt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour
          }
        }
      })
      
      if (recentAttempts >= 3) {
        const oldestAttempt = await prisma.phoneVerification.findFirst({
          where: {
            userId,
            phoneNumber: formattedPhone,
            createdAt: {
              gt: new Date(Date.now() - 60 * 60 * 1000)
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        })
        
        const retryAfter = oldestAttempt 
          ? Math.ceil((oldestAttempt.createdAt.getTime() + 60 * 60 * 1000 - Date.now()) / 1000)
          : 3600
          
        return {
          success: false,
          error: 'Too many attempts. Please try again later.',
          retryAfter
        }
      }
      
      // Send new code
      return await this.sendVerificationCode({ userId, phoneNumber })
    } catch (error) {
      console.error('Resend code error:', error)
      return {
        success: false,
        error: 'Failed to resend code'
      }
    }
  }
  
  static async removePhoneNumber(userId: string): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: null,
          phoneVerified: false
        }
      })
      
      // Delete verification records
      await prisma.phoneVerification.deleteMany({
        where: { userId }
      })
      
      return { success: true }
    } catch (error) {
      console.error('Remove phone error:', error)
      return {
        success: false,
        error: 'Failed to remove phone number'
      }
    }
  }
}