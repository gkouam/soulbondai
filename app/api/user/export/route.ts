import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        accounts: true,
        sessions: true,
        conversations: {
          include: {
            messages: true
          }
        },
        subscription: true,
        activities: true,
        conversions: true,
        memories: true
      }
    })
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Remove sensitive data
    const { password, passwordResetToken, passwordResetExpires, ...safeUserData } = userData
    
    // Format data for export
    const exportData = {
      exportedAt: new Date().toISOString(),
      userData: safeUserData,
      statistics: {
        totalMessages: userData.conversations.reduce((acc, conv) => acc + conv.messages.length, 0),
        totalConversations: userData.conversations.length,
        accountCreated: userData.createdAt,
        lastActive: userData.profile?.lastActiveAt
      }
    }
    
    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="soulbond-ai-data-export-${session.user.id}.json"`
      }
    })
    
  } catch (error) {
    console.error("Data export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}