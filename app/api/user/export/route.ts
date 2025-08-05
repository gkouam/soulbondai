import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { exportUserData, ExportOptions } from "@/lib/data-export"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const options: ExportOptions = {
      includeMessages: body.includeMessages ?? true,
      includeProfile: body.includeProfile ?? true,
      includePreferences: body.includePreferences ?? true,
      includeSubscription: body.includeSubscription ?? true,
      includeAnalytics: body.includeAnalytics ?? false,
      format: body.format || 'json',
    }
    
    const data = await exportUserData(session.user.id, options)
    
    const headers = new Headers()
    headers.set('Content-Type', options.format === 'csv' ? 'text/csv' : 'application/json')
    headers.set('Content-Disposition', `attachment; filename="soulbondai-export.${options.format}"`)
    
    return new NextResponse(data, { headers })
    
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    )
  }
}