import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GDPRConsentManager } from "@/lib/gdpr-consent"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"
import { z } from "zod"

const consentSchema = z.object({
  consents: z.record(z.boolean())
})

// Record user consent
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { consents } = consentSchema.parse(body)
    
    // Get metadata
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined
    const userAgent = req.headers.get("user-agent") || undefined
    
    await GDPRConsentManager.recordConsent(
      session.user.id,
      consents,
      { ipAddress, userAgent }
    )
    
    return NextResponse.json({
      success: true,
      message: "Consent preferences saved"
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

// Get current user consents
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const consents = await GDPRConsentManager.getUserConsents(session.user.id)
    
    return NextResponse.json({
      consents
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}