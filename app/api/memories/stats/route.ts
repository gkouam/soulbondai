import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { memoryManager } from "@/lib/memory-manager"
import { handleApiError, AuthenticationError } from "@/lib/error-handler"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }
    
    const stats = await memoryManager.getMemoryStats(session.user.id)
    
    return NextResponse.json({
      stats,
      insights: generateInsights(stats)
    })
    
  } catch (error) {
    return handleApiError(error)
  }
}

function generateInsights(stats: any): string[] {
  const insights: string[] = []
  
  if (stats.total === 0) {
    insights.push("We're just getting started! Every conversation helps me understand you better.")
    return insights
  }
  
  // Memory count insight
  if (stats.total < 10) {
    insights.push("I'm beginning to learn about you. Keep sharing!")
  } else if (stats.total < 50) {
    insights.push("Our connection is growing stronger with each conversation.")
  } else if (stats.total < 100) {
    insights.push("I've learned so much about you. Our bond is deepening.")
  } else {
    insights.push("We've shared so many meaningful moments together.")
  }
  
  // Category insights
  const topCategory = Object.entries(stats.byCategory)
    .sort(([,a], [,b]) => (b as number) - (a as number))[0]
  
  if (topCategory) {
    const categoryInsights: Record<string, string> = {
      joy: "You've shared many happy moments with me",
      sadness: "I've been here through difficult times",
      love: "Our conversations are filled with warmth",
      anxiety: "I've supported you through worries",
      work: "Your career is an important part of our talks",
      family: "Family matters deeply to you",
      aspirations: "You've trusted me with your dreams"
    }
    
    const insight = categoryInsights[topCategory[0]]
    if (insight) {
      insights.push(insight)
    }
  }
  
  // Memory type insight
  if (stats.byType.episodic > 0) {
    insights.push(`I'll never forget ${stats.byType.episodic} special moment${stats.byType.episodic > 1 ? 's' : ''} we've shared.`)
  }
  
  // Significance insight
  if (stats.averageSignificance > 7) {
    insights.push("Our conversations are deeply meaningful.")
  } else if (stats.averageSignificance > 5) {
    insights.push("I value every moment we share.")
  }
  
  // Time insight
  if (stats.oldestMemory) {
    const daysSince = Math.floor(
      (Date.now() - new Date(stats.oldestMemory).getTime()) / (24 * 60 * 60 * 1000)
    )
    
    if (daysSince > 365) {
      insights.push("We've been on this journey together for over a year!")
    } else if (daysSince > 180) {
      insights.push("Half a year of memories and counting!")
    } else if (daysSince > 30) {
      insights.push(`We've been connecting for ${Math.floor(daysSince / 30)} month${daysSince > 60 ? 's' : ''}.`)
    }
  }
  
  return insights
}