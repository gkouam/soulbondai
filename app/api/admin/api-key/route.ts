import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Check if user is authenticated and is admin
    if (!session?.user?.email || session.user.email !== "kouam7@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Generate a secure API key
    const apiKey = `sk-admin-${crypto.randomBytes(32).toString('hex')}`
    
    // Store the hashed API key in the database
    const hashedKey = crypto
      .createHash('sha256')
      .update(apiKey)
      .digest('hex')
    
    // Find or create admin user record
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!adminUser) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }
    
    // Store the API key (in a real app, you'd have a separate AdminApiKey table)
    // For now, we'll store it in user metadata
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        metadata: {
          ...((adminUser.metadata as any) || {}),
          adminApiKeyHash: hashedKey,
          adminApiKeyCreatedAt: new Date().toISOString()
        }
      }
    })
    
    return NextResponse.json({ apiKey })
    
  } catch (error) {
    console.error("API key generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    )
  }
}