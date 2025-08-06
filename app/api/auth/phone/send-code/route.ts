import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PhoneVerificationService } from '@/lib/phone-verification'
import { rateLimiters } from '@/lib/rate-limiter'

export async function POST(req: Request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Rate limit
    const { success } = await rateLimiters.auth.limit(session.user.id)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }
    
    const { phoneNumber, type = 'sms' } = await req.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    // Send verification code
    const result = await PhoneVerificationService.sendVerificationCode({
      userId: session.user.id,
      phoneNumber,
      type
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send verification code' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      verificationId: result.verificationId
    })
  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}