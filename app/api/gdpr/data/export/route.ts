import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GDPRConsentManager } from "@/lib/gdpr-consent"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

// Export user data
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const data = await GDPRConsentManager.exportUserData(session.user.id)
    
    // Return as downloadable JSON file
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="soulbond-data-export-${session.user.id}-${Date.now()}.json"`
      }
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}