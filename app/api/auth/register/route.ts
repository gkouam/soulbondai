import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email/resend"
import { AuditLogger, AuditAction } from "@/lib/audit-logger"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name } = registerSchema.parse(body)
    
    // Get IP and user agent for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profile: {
          create: {
            companionName: "Luna",
            trustLevel: 0,
            messageCount: 0,
            messagesUsedToday: 0,
          },
        },
        subscription: {
          create: {
            plan: "free",
            status: "active",
            stripeCustomerId: "", // Will be created when they upgrade
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      },
    })

    // Send welcome email (non-blocking)
    sendWelcomeEmail(
      user.email!,
      user.name || "Friend",
      "warm_empath" // Default archetype until they take the test
    ).catch(error => {
      console.error("Failed to send welcome email:", error)
    })
    
    // Log successful registration
    await AuditLogger.log({
      action: AuditAction.USER_REGISTER,
      userId: user.id,
      metadata: { email: user.email },
      ipAddress,
      userAgent,
      success: true
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    )
  }
}