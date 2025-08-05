import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || `https://${process.env.VERCEL_URL}` || "https://soulbondai.vercel.app"
  
  return NextResponse.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set",
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? "Set" : "Not set",
    vercelUrl: process.env.VERCEL_URL,
    expectedCallbackUrl: `${baseUrl}/api/auth/callback/google`,
    actualGoogleClientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
    instructions: "Make sure the expectedCallbackUrl is added to your Google OAuth app's authorized redirect URIs"
  })
}