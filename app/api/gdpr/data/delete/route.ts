import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GDPRConsentManager } from "@/lib/gdpr-consent"
import { handleApiError, AuthenticationError, AppError } from "@/lib/error-handler"
import { z } from "zod"
import { signOut } from "next-auth/react"

const deleteSchema = z.object({
  confirmation: z.literal("DELETE_MY_DATA"),
  options: z.object({
    deleteAccount: z.boolean().optional(),
    preserveAnonymized: z.boolean().optional()
  }).optional()
})

// Delete user data
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { confirmation, options } = deleteSchema.parse(body)
    
    if (confirmation !== "DELETE_MY_DATA") {
      throw new AppError("Invalid confirmation", 400)
    }
    
    // Record the deletion request for audit
    console.log(`Data deletion requested by user ${session.user.id}`, {
      userId: session.user.id,
      timestamp: new Date(),
      options
    })
    
    await GDPRConsentManager.deleteUserData(session.user.id, options)
    
    // If account was deleted, sign out the user
    if (options?.deleteAccount) {
      // Return a response that tells the client to sign out
      return NextResponse.json({
        success: true,
        message: "Your data has been deleted",
        signOutRequired: true
      })
    }
    
    return NextResponse.json({
      success: true,
      message: options?.preserveAnonymized 
        ? "Your data has been anonymized" 
        : "Your data has been deleted"
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}