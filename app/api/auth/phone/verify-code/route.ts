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
    
    const { phoneNumber, code } = await req.json()
    
    if (!phoneNumber || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      )
    }
    
    // Verify code
    const result = await PhoneVerificationService.verifyCode({
      userId: session.user.id,
      phoneNumber,
      code
    })
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Invalid or expired code' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully'
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}