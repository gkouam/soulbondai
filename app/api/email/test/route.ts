import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  sendWelcomeEmail, 
  sendSubscriptionConfirmation,
  sendPasswordReset,
  sendDailyDigest,
  sendTeamInvitation
} from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { type, testEmail } = body
    
    const email = testEmail || session.user.email
    const name = session.user.name || "User"
    
    let result
    
    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail(email, name, "warm_empath")
        break
        
      case "subscription":
        result = await sendSubscriptionConfirmation(email, name, "Premium")
        break
        
      case "password_reset":
        const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=test123`
        result = await sendPasswordReset(email, name, resetUrl)
        break
        
      case "daily_digest":
        result = await sendDailyDigest(email, name, {
          daysSinceLastChat: 3,
          totalMessages: 150
        })
        break
        
      case "team_invitation":
        const inviteUrl = `${process.env.NEXTAUTH_URL}/team/join?token=test456`
        result = await sendTeamInvitation(email, "John Doe", "AI Enthusiasts", inviteUrl)
        break
        
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: result.success,
      message: result.success ? "Test email sent successfully" : "Failed to send email",
      data: result.data,
      error: result.error
    })
    
  } catch (error) {
    console.error("Email test error:", error)
    return NextResponse.json({ 
      error: "Failed to send test email",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint to check if email service is configured
export async function GET() {
  const isConfigured = !!process.env.RESEND_API_KEY
  
  return NextResponse.json({
    configured: isConfigured,
    service: "Resend",
    templates: [
      "welcome",
      "subscription",
      "password_reset",
      "daily_digest",
      "team_invitation"
    ]
  })
}