import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  // Simple security check - only allow from your domain or with a secret
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")
  
  if (secret !== "init-soulbond-db-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Test connection
    await prisma.$connect()
    
    // Check tables
    const tables = {
      users: 0,
      accounts: 0,
      sessions: 0,
      profiles: 0,
    }
    
    try {
      tables.users = await prisma.user.count()
    } catch (e) {
      console.error("User table error:", e)
    }
    
    try {
      tables.accounts = await prisma.account.count()
    } catch (e) {
      console.error("Account table error:", e)
    }
    
    try {
      tables.sessions = await prisma.session.count()
    } catch (e) {
      console.error("Session table error:", e)
    }
    
    try {
      tables.profiles = await prisma.profile.count()
    } catch (e) {
      console.error("Profile table error:", e)
    }
    
    return NextResponse.json({
      message: "Database connection successful",
      tables,
      databaseUrl: process.env.DATABASE_URL ? "Set" : "Not set",
      directUrl: process.env.DIRECT_URL ? "Set" : "Not set",
    })
  } catch (error: any) {
    console.error("Database initialization error:", error)
    return NextResponse.json({
      error: "Database initialization failed",
      details: error.message,
      code: error.code,
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}