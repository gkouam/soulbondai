import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const deleteAccountSchema = z.object({
  password: z.string(),
  confirmation: z.literal("DELETE MY ACCOUNT")
})

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const { password, confirmation } = deleteAccountSchema.parse(body)
    
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password!)
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }
    
    // Delete user data in correct order (handle foreign key constraints)
    await prisma.$transaction(async (tx) => {
      // Delete memories
      await tx.memory.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete messages
      await tx.message.deleteMany({
        where: {
          conversation: {
            userId: session.user.id
          }
        }
      })
      
      // Delete conversations
      await tx.conversation.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete activities
      await tx.activity.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete conversion events
      await tx.conversionEvent.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete subscription
      await tx.subscription.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete profile
      await tx.profile.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete sessions
      await tx.session.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Delete accounts
      await tx.account.deleteMany({
        where: { userId: session.user.id }
      })
      
      // Finally, delete user
      await tx.user.delete({
        where: { id: session.user.id }
      })
    })
    
    return NextResponse.json({
      message: "Account deleted successfully"
    })
    
  } catch (error) {
    console.error("Account deletion error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}