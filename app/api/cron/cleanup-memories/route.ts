import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { memoryManager } from "@/lib/memory-manager"

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 })
    }
    
    console.log("Starting memory cleanup job...")
    
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    })
    
    let totalDeleted = 0
    const results = []
    
    for (const user of users) {
      try {
        const deletedCount = await memoryManager.cleanupExpiredMemories(user.id)
        if (deletedCount > 0) {
          totalDeleted += deletedCount
          results.push({
            userId: user.id,
            deletedCount
          })
        }
      } catch (error) {
        console.error(`Failed to cleanup memories for user ${user.id}:`, error)
      }
    }
    
    console.log(`Memory cleanup complete. Total deleted: ${totalDeleted}`)
    
    return NextResponse.json({
      success: true,
      totalDeleted,
      userCount: results.length,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error("Memory cleanup job failed:", error)
    return NextResponse.json(
      { error: "Memory cleanup failed" },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: Request) {
  return GET(request)
}