import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { featureGate } from "@/lib/feature-gates"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

const checkFeaturesSchema = z.object({
  features: z.array(z.string())
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { features } = checkFeaturesSchema.parse(body)
    
    // Check multiple features at once
    const access = await featureGate.checkFeatures(session.user.id, features)
    
    return NextResponse.json({
      access
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

// Get all available features for user
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const { available, locked } = await featureGate.getAvailableFeatures(session.user.id)
    
    return NextResponse.json({
      available: available.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        category: f.category
      })),
      locked: locked.map(f => ({
        id: f.id,
        name: f.name,
        description: f.description,
        category: f.category,
        requiredPlan: f.requiredPlan,
        reason: f.reason
      }))
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}