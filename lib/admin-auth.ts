import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

// Admin email addresses
const ADMIN_EMAILS = [
  "kouam7@gmail.com",
  // Add more admin emails here as needed
]

export async function isAdmin(email?: string | null): Promise<boolean> {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }
  
  if (!await isAdmin(session.user.email)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
  }
  
  return {
    authorized: true,
    session,
    user: session.user
  }
}

export function adminGuard(handler: Function) {
  return async function(req: Request, ...args: any[]) {
    const admin = await requireAdmin()
    
    if (!admin.authorized) {
      return admin.response
    }
    
    // Add admin context to request
    (req as any).admin = admin
    
    return handler(req, ...args)
  }
}