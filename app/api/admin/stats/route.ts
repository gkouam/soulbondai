import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session?.user?.email || session.user.email !== "kouam7@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get total users
    const totalUsers = await prisma.user.count()
    
    // Get active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: thirtyDaysAgo
        }
      }
    })
    
    // Get daily active users (logged in today)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const dailyActiveUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: today
        }
      }
    })
    
    // Get total messages
    const totalMessages = await prisma.message.count()
    
    // Get active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
      where: {
        status: "active"
      }
    })
    
    // Calculate total revenue (in cents)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: {
          in: ["active", "canceled", "past_due"]
        }
      }
    })
    
    const totalRevenue = subscriptions.reduce((total, sub) => {
      const monthlyAmount = sub.plan === "premium" ? 1999 : sub.plan === "pro" ? 999 : 0
      const months = Math.floor(
        (new Date().getTime() - sub.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
      )
      return total + (monthlyAmount * Math.max(1, months))
    }, 0) / 100 // Convert to dollars
    
    // Calculate average messages per user
    const avgMessagesPerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0
    
    // Calculate conversion rate
    const paidUsers = await prisma.subscription.count({
      where: {
        plan: {
          not: "free"
        }
      }
    })
    
    const conversionRate = totalUsers > 0 ? (paidUsers / totalUsers * 100).toFixed(2) : "0"
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      dailyActiveUsers,
      totalMessages,
      activeSubscriptions,
      totalRevenue: totalRevenue.toFixed(2),
      avgMessagesPerUser,
      conversionRate
    })
    
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    )
  }
}