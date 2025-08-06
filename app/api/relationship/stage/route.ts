import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { relationshipProgression } from "@/lib/relationship-progression"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    // Get current stage information
    const stageInfo = await relationshipProgression.getCurrentStage(session.user.id)
    
    // Get progression history
    const history = await relationshipProgression.getProgressionHistory(session.user.id, 10)
    
    // Check for available milestones
    const milestones = await relationshipProgression.checkMilestones(session.user.id)
    
    return NextResponse.json({
      currentStage: {
        name: stageInfo.stage.name,
        description: stageInfo.stage.description,
        progress: stageInfo.progress,
        trustLevel: session.user.profile?.trustLevel || 0,
        unlocks: stageInfo.stage.unlocks,
        behaviors: stageInfo.stage.behaviors
      },
      nextStage: stageInfo.nextStage ? {
        name: stageInfo.nextStage.name,
        description: stageInfo.nextStage.description,
        trustRequired: stageInfo.nextStage.minTrust,
        unlocks: stageInfo.nextStage.unlocks
      } : null,
      milestones: stageInfo.stage.milestones.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description,
        achieved: milestones.some(achieved => achieved.id === m.id),
        trustRequired: m.trustRequired
      })),
      recentEvents: history.map(event => ({
        type: event.type,
        description: event.description,
        timestamp: event.timestamp,
        impact: event.impact > 0 ? `+${event.impact}` : `${event.impact}`
      }))
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}