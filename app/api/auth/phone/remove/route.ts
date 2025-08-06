import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PhoneVerificationService } from '@/lib/phone-verification'

export async function DELETE(req: Request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Remove phone number
    const result = await PhoneVerificationService.removePhoneNumber(session.user.id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove phone number' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Phone number removed'
    })
  } catch (error) {
    console.error('Remove phone error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}