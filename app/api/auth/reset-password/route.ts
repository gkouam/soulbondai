import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { sendPasswordReset } from "@/lib/email/resend"

const requestResetSchema = z.object({
  email: z.string().email()
})

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100)
})

// Request password reset
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "request") {
      // Request password reset
      const body = await req.json()
      const { email } = requestResetSchema.parse(body)

      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user) {
        // Don't reveal if email exists
        return NextResponse.json({
          message: "If an account exists with this email, you will receive a password reset link."
        })
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.NEXTAUTH_SECRET!,
        { expiresIn: "1h" }
      )

      // Save token hash to database
      const tokenHash = await bcrypt.hash(resetToken, 10)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: tokenHash,
          passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour
        }
      })

      // Send reset email
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
      await sendPasswordReset(user.email!, user.name || "User", resetUrl)

      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link."
      })

    } else if (action === "reset") {
      // Reset password
      const body = await req.json()
      const { token, password } = resetPasswordSchema.parse(body)

      // Verify token
      let decoded: any
      try {
        decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!)
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 }
        )
      }

      // Find user and verify token
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      })

      if (!user || !user.passwordResetToken || !user.passwordResetExpires) {
        return NextResponse.json(
          { error: "Invalid reset request" },
          { status: 400 }
        )
      }

      // Check if token expired
      if (user.passwordResetExpires < new Date()) {
        return NextResponse.json(
          { error: "Reset token has expired" },
          { status: 400 }
        )
      }

      // Verify token hash
      const validToken = await bcrypt.compare(token, user.passwordResetToken)
      if (!validToken) {
        return NextResponse.json(
          { error: "Invalid token" },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Update password and clear reset tokens
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      })

      return NextResponse.json({
        message: "Password reset successfully"
      })
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}