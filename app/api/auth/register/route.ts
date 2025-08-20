import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendWelcomeEmail } from "@/lib/email/resend"
import { AuditLogger, AuditAction } from "@/lib/audit-logger"
import { verifyRecaptcha /*, isSuspiciousRequest*/ } from "@/lib/recaptcha"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
  recaptchaToken: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, recaptchaToken } = registerSchema.parse(body)
    
    // Get IP and user agent for audit logging
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Skip reCAPTCHA verification if token not provided (temporarily disabled)
    if (recaptchaToken) {
      try {
        const recaptchaResult = await verifyRecaptcha(recaptchaToken, "register")
        
        if (!recaptchaResult.success) {
          // Log failed registration attempt
          await AuditLogger.log({
            action: AuditAction.USER_REGISTER,
            userId: null,
            metadata: { 
              email, 
              reason: "reCAPTCHA failed",
              score: recaptchaResult.score,
              errors: recaptchaResult.errors
            },
            ipAddress,
            userAgent,
            success: false
          })

          return NextResponse.json(
            { error: "Bot detection failed. Please try again." },
            { status: 403 }
          )
        }

        // Log reCAPTCHA score for monitoring
        console.log(`Registration reCAPTCHA score for ${email}: ${recaptchaResult.score}`)
      } catch (error) {
        console.warn("reCAPTCHA verification skipped:", error)
        // Continue without reCAPTCHA for now
      }
    }

    // Additional bot detection (temporarily disabled)
    // const headers = new Headers(req.headers)
    // if (isSuspiciousRequest(headers)) {
    //   await AuditLogger.log({
    //     action: AuditAction.USER_REGISTER,
    //     userId: null,
    //     metadata: { 
    //       email, 
    //       reason: "Suspicious request patterns detected"
    //     },
    //     ipAddress,
    //     userAgent,
    //     success: false
    //   })

    //   return NextResponse.json(
    //     { error: "Registration blocked. Please use a standard web browser." },
    //     { status: 403 }
    //   )
    // }

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

    // Create user with minimal data first
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        profile: {
          create: {
            companionName: "Luna",
            trustLevel: 0,
            interactionCount: 0,
          },
        },
      },
    })
    
    // Create subscription separately to handle potential issues
    try {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: "free",
          status: "active",
        },
      })
    } catch (subError) {
      console.error("Failed to create subscription:", subError)
      // Continue anyway - user can still use the app
    }

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
  } catch (error: any) {
    console.error("Registration error:", error)
    
    // Check for specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }
    
    if (error.code === 'P2021') {
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 503 }
      )
    }
    
    // Return a proper JSON error response
    return NextResponse.json(
      { 
        error: "Failed to register user", 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: 500 }
    )
  }
}