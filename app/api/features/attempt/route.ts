import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { upgradeTriggerManager } from "@/lib/upgrade-triggers"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

const featureAttemptSchema = z.object({
  feature: z.string()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const body = await req.json()
    const { feature } = featureAttemptSchema.parse(body)
    
    // Record the attempt
    await upgradeTriggerManager.recordPremiumFeatureAttempt(
      session.user.id,
      feature
    )
    
    // Get upgrade prompt
    const upgradePrompt = await upgradeTriggerManager.getUpgradePrompt(session.user.id)
    
    return NextResponse.json({
      feature,
      upgradePrompt: upgradePrompt?.show ? upgradePrompt : null
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}