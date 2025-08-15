import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Allow CEO and admin to reset limits
    const allowedEmails = ["ceo@quantumdense.com", "admin@soulbondai.com"]
    if (!allowedEmails.includes(session.user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const { email } = await request.json()
    const targetEmail = email || session.user.email
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: { subscription: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Clear today's messages count by deleting recent activity records
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await prisma.activity.deleteMany({
      where: {
        userId: user.id,
        type: { startsWith: "usage_" },
        createdAt: { gte: today }
      }
    })
    
    // Also clear any rate limit tracking in messages
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversation: {
          userId: user.id
        },
        role: "user",
        createdAt: { gte: today }
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Rate limits reset successfully",
      user: {
        email: user.email,
        plan: user.subscription?.plan || "free",
        messagesDeleted: deletedMessages.count
      }
    })
    
  } catch (error) {
    console.error("Reset limits error:", error)
    return NextResponse.json(
      { error: "Failed to reset limits" },
      { status: 500 }
    )
  }
}