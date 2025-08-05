import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteUserData } from "@/lib/data-export"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Delete all user data
    await deleteUserData(session.user.id)
    
    // The session will be invalidated automatically
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    )
  }
}