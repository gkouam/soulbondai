import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/resend"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }
    
    const result = await sendEmail({
      to: email,
      subject: "Test Email from SoulBond AI",
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your SoulBond AI application.</p>
        <p>If you're receiving this, your email configuration is working correctly!</p>
        <p>Best regards,<br>The SoulBond AI Team</p>
      `,
      text: "This is a test email from SoulBond AI. If you're receiving this, your email configuration is working correctly!"
    })
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: "Test email sent successfully!",
        data: result.data 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Failed to send test email" },
      { status: 500 }
    )
  }
}