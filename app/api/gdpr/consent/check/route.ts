import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GDPRConsentManager } from "@/lib/gdpr-consent"
import { handleApiError } from "@/lib/error-handler"

// Check if consent is required
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      // For non-authenticated users, always show consent
      return NextResponse.json({
        required: true,
        reason: "not_authenticated"
      })
    }
    
    const required = await GDPRConsentManager.checkConsentRequired(session.user.id)
    
    return NextResponse.json({
      required,
      reason: required ? "consent_needed" : "consent_given"
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}