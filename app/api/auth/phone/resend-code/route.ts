import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PhoneVerificationService } from '@/lib/phone-verification'

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
    
    const { phoneNumber } = await req.json()
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }
    
    // Resend code
    const result = await PhoneVerificationService.resendCode({
      userId: session.user.id,
      phoneNumber
    })
    
    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to resend code',
          retryAfter: result.retryAfter
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Verification code resent'
    })
  } catch (error) {
    console.error('Resend code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}