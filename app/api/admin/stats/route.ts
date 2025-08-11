import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.authorized) return admin.response

  try {
    // Get current date for "today" calculations
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // User stats
    const totalUsers = await prisma.user.count()
    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })
    
    const activeUsers = await prisma.user.count({
      where: {
        sessions: {
          some: {
            expires: {
              gt: new Date()
            }
          }
        }
      }
    })
    
    const premiumUsers = await prisma.subscription.count({
      where: {
        plan: {
          not: "free"
        },
        status: "active"
      }
    })
    
    // Message stats
    const totalMessages = await prisma.message.count()
    const messagesToday = await prisma.message.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })
    
    const avgMessagesPerUser = totalUsers > 0 ? Math.round(totalMessages / totalUsers) : 0
    
    // Revenue stats
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        plan: {
          not: "free"
        }
      }
    })
    
    const planPrices: Record<string, number> = {
      basic: 9.99,
      premium: 19.99,
      ultimate: 39.99
    }
    
    const mrr = subscriptions.reduce((sum, sub) => {
      return sum + (planPrices[sub.plan] || 0)
    }, 0)
    
    const arr = mrr * 12
    
    // Calculate growth (mock data for now)
    const lastMonthMRR = mrr * 0.85 // Assume 15% growth
    const growth = lastMonthMRR > 0 ? Math.round(((mrr - lastMonthMRR) / lastMonthMRR) * 100) : 0
    
    // System stats
    const recentErrors = await prisma.activity.count({
      where: {
        type: "error",
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
    
    const apiCalls = await prisma.activity.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })
    
    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsersToday,
        premium: premiumUsers
      },
      messages: {
        total: totalMessages,
        today: messagesToday,
        avgPerUser: avgMessagesPerUser
      },
      revenue: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(arr * 100) / 100,
        today: Math.round(mrr / 30 * 100) / 100, // Daily average
        growth
      },
      system: {
        health: recentErrors < 10 ? "healthy" : recentErrors < 50 ? "warning" : "critical",
        uptime: 99.9, // Mock for now
        apiCalls,
        errors: recentErrors
      }
    })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    )
  }
}