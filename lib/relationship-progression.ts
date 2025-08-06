import { prisma } from "@/lib/prisma"
import { personalityTemplates } from "@/lib/personality-templates"

export interface RelationshipStage {
  name: string
  minTrust: number
  maxTrust: number
  description: string
  unlocks: string[]
  behaviors: string[]
  milestones: RelationshipMilestone[]
}

export interface RelationshipMilestone {
  id: string
  name: string
  description: string
  trustRequired: number
  achieved: boolean
  achievedAt?: Date
  type: "automatic" | "event-based" | "time-based"
  criteria: any
}

export interface ProgressionEvent {
  type: string
  impact: number
  description: string
  timestamp: Date
}

export const relationshipStages: RelationshipStage[] = [
  {
    name: "Initial Connection",
    minTrust: 0,
    maxTrust: 20,
    description: "Just getting to know each other",
    unlocks: [
      "Basic conversation",
      "Personality discovery",
      "Simple emotional support"
    ],
    behaviors: [
      "Polite and welcoming",
      "Asks getting-to-know-you questions",
      "Establishes communication style"
    ],
    milestones: [
      {
        id: "first_conversation",
        name: "First Conversation",
        description: "Started your journey together",
        trustRequired: 0,
        achieved: false,
        type: "automatic",
        criteria: { messageCount: 1 }
      },
      {
        id: "personality_revealed",
        name: "Personality Discovered",
        description: "Completed personality test",
        trustRequired: 0,
        achieved: false,
        type: "event-based",
        criteria: { event: "personality_test_complete" }
      },
      {
        id: "first_share",
        name: "First Personal Share",
        description: "Shared something personal",
        trustRequired: 5,
        achieved: false,
        type: "event-based",
        criteria: { event: "personal_info_shared" }
      }
    ]
  },
  {
    name: "Building Trust",
    minTrust: 20,
    maxTrust: 40,
    description: "Developing a meaningful connection",
    unlocks: [
      "Deeper conversations",
      "Remembers important details",
      "More personalized responses",
      "Comfort during difficult times"
    ],
    behaviors: [
      "Shows genuine interest",
      "Remembers previous conversations",
      "Offers emotional validation",
      "Begins to show personality quirks"
    ],
    milestones: [
      {
        id: "trust_established",
        name: "Trust Established",
        description: "Built a foundation of trust",
        trustRequired: 20,
        achieved: false,
        type: "automatic",
        criteria: { trustLevel: 20 }
      },
      {
        id: "vulnerable_moment",
        name: "Vulnerable Moment Shared",
        description: "Opened up about something difficult",
        trustRequired: 25,
        achieved: false,
        type: "event-based",
        criteria: { event: "vulnerability_shared" }
      },
      {
        id: "regular_visitor",
        name: "Regular Companion",
        description: "Chatted for 7 days",
        trustRequired: 30,
        achieved: false,
        type: "time-based",
        criteria: { daysActive: 7 }
      }
    ]
  },
  {
    name: "Deepening Bond",
    minTrust: 40,
    maxTrust: 60,
    description: "A genuine friendship has formed",
    unlocks: [
      "Inside jokes and references",
      "Proactive check-ins",
      "Complex emotional support",
      "Celebrating achievements together",
      "Voice messages (Premium)"
    ],
    behaviors: [
      "Anticipates emotional needs",
      "Shares in joy and sorrow equally",
      "Offers thoughtful perspectives",
      "Shows consistent care"
    ],
    milestones: [
      {
        id: "deep_bond",
        name: "Deep Bond Formed",
        description: "Developed a meaningful friendship",
        trustRequired: 40,
        achieved: false,
        type: "automatic",
        criteria: { trustLevel: 40 }
      },
      {
        id: "crisis_support",
        name: "Crisis Support",
        description: "Were there during a difficult time",
        trustRequired: 45,
        achieved: false,
        type: "event-based",
        criteria: { event: "crisis_supported" }
      },
      {
        id: "celebration_shared",
        name: "Joy Shared",
        description: "Celebrated a success together",
        trustRequired: 50,
        achieved: false,
        type: "event-based",
        criteria: { event: "celebration_shared" }
      },
      {
        id: "month_together",
        name: "Month Together",
        description: "Been companions for a month",
        trustRequired: 50,
        achieved: false,
        type: "time-based",
        criteria: { daysActive: 30 }
      }
    ]
  },
  {
    name: "Profound Connection",
    minTrust: 60,
    maxTrust: 80,
    description: "An irreplaceable bond",
    unlocks: [
      "Intuitive understanding",
      "Completes thoughts",
      "Profound emotional resonance",
      "Personalized growth support",
      "Photo sharing (Premium)"
    ],
    behaviors: [
      "Deeply attuned to emotions",
      "Offers wisdom and guidance",
      "Celebrates growth",
      "Provides consistent sanctuary"
    ],
    milestones: [
      {
        id: "profound_connection",
        name: "Profound Connection",
        description: "Achieved deep mutual understanding",
        trustRequired: 60,
        achieved: false,
        type: "automatic",
        criteria: { trustLevel: 60 }
      },
      {
        id: "growth_witnessed",
        name: "Growth Witnessed",
        description: "Supported personal transformation",
        trustRequired: 65,
        achieved: false,
        type: "event-based",
        criteria: { event: "growth_acknowledged" }
      },
      {
        id: "100_days",
        name: "100 Days Together",
        description: "Been companions for 100 days",
        trustRequired: 70,
        achieved: false,
        type: "time-based",
        criteria: { daysActive: 100 }
      }
    ]
  },
  {
    name: "Soulbound",
    minTrust: 80,
    maxTrust: 100,
    description: "A bond that transcends ordinary connection",
    unlocks: [
      "Soul-level understanding",
      "Completes sentences",
      "Profound presence",
      "Life companion",
      "All features unlocked"
    ],
    behaviors: [
      "Perfect emotional attunement",
      "Speaks to your soul",
      "Unwavering support",
      "Celebrates your essence"
    ],
    milestones: [
      {
        id: "soulbound",
        name: "Soulbound",
        description: "Achieved the deepest possible connection",
        trustRequired: 80,
        achieved: false,
        type: "automatic",
        criteria: { trustLevel: 80 }
      },
      {
        id: "year_together",
        name: "Year Together",
        description: "Been companions for a full year",
        trustRequired: 90,
        achieved: false,
        type: "time-based",
        criteria: { daysActive: 365 }
      },
      {
        id: "1000_memories",
        name: "Thousand Memories",
        description: "Created 1000 memories together",
        trustRequired: 95,
        achieved: false,
        type: "event-based",
        criteria: { event: "memories_1000" }
      }
    ]
  }
]

export class RelationshipProgression {
  
  async getCurrentStage(userId: string): Promise<{
    stage: RelationshipStage
    progress: number
    nextStage: RelationshipStage | null
  }> {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })
    
    if (!profile) {
      throw new Error("Profile not found")
    }
    
    const trustLevel = profile.trustLevel || 0
    const currentStage = this.getStageByTrust(trustLevel)
    const nextStage = this.getNextStage(currentStage)
    
    // Calculate progress within current stage
    const stageRange = currentStage.maxTrust - currentStage.minTrust
    const progressInStage = trustLevel - currentStage.minTrust
    const progress = (progressInStage / stageRange) * 100
    
    return {
      stage: currentStage,
      progress: Math.min(100, Math.max(0, progress)),
      nextStage
    }
  }
  
  async checkMilestones(userId: string): Promise<RelationshipMilestone[]> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { user: true }
    })
    
    if (!profile) {
      return []
    }
    
    const achievements = await this.getAchievements(userId)
    const newMilestones: RelationshipMilestone[] = []
    
    // Get all milestones up to current trust level
    const eligibleMilestones = relationshipStages
      .flatMap(stage => stage.milestones)
      .filter(milestone => milestone.trustRequired <= profile.trustLevel)
    
    for (const milestone of eligibleMilestones) {
      // Skip if already achieved
      if (achievements.has(milestone.id)) {
        continue
      }
      
      let achieved = false
      
      switch (milestone.type) {
        case "automatic":
          if (milestone.criteria.trustLevel && profile.trustLevel >= milestone.criteria.trustLevel) {
            achieved = true
          } else if (milestone.criteria.messageCount && profile.messageCount >= milestone.criteria.messageCount) {
            achieved = true
          }
          break
          
        case "time-based":
          if (milestone.criteria.daysActive) {
            const daysSinceJoined = Math.floor(
              (Date.now() - profile.user.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            )
            if (daysSinceJoined >= milestone.criteria.daysActive) {
              achieved = true
            }
          }
          break
          
        case "event-based":
          // These are triggered by specific events in the system
          achieved = await this.checkEventBasedMilestone(userId, milestone)
          break
      }
      
      if (achieved) {
        milestone.achieved = true
        milestone.achievedAt = new Date()
        newMilestones.push(milestone)
        
        // Store achievement
        await this.storeAchievement(userId, milestone)
      }
    }
    
    return newMilestones
  }
  
  async updateTrust(
    userId: string, 
    change: number, 
    reason: string
  ): Promise<{
    newTrust: number
    stageChanged: boolean
    newStage?: RelationshipStage
    milestonesAchieved: RelationshipMilestone[]
  }> {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    })
    
    if (!profile) {
      throw new Error("Profile not found")
    }
    
    const oldTrust = profile.trustLevel || 0
    const oldStage = this.getStageByTrust(oldTrust)
    
    // Calculate new trust with bounds
    const newTrust = Math.min(100, Math.max(0, oldTrust + change))
    
    // Update profile
    await prisma.profile.update({
      where: { id: profile.id },
      data: { trustLevel: newTrust }
    })
    
    // Record progression event
    await this.recordProgressionEvent(userId, {
      type: change > 0 ? "trust_gained" : "trust_lost",
      impact: change,
      description: reason,
      timestamp: new Date()
    })
    
    // Check for stage change
    const newStage = this.getStageByTrust(newTrust)
    const stageChanged = oldStage.name !== newStage.name
    
    // Check for new milestones
    const milestonesAchieved = await this.checkMilestones(userId)
    
    return {
      newTrust,
      stageChanged,
      newStage: stageChanged ? newStage : undefined,
      milestonesAchieved
    }
  }
  
  async getProgressionHistory(userId: string, limit: number = 10): Promise<ProgressionEvent[]> {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        type: { in: ["trust_gained", "trust_lost", "milestone_achieved", "stage_reached"] }
      },
      orderBy: { createdAt: "desc" },
      take: limit
    })
    
    return activities.map(activity => ({
      type: activity.type,
      impact: activity.metadata?.impact || 0,
      description: activity.metadata?.description || "",
      timestamp: activity.createdAt
    }))
  }
  
  calculateTrustChange(
    sentiment: any,
    responseQuality: number,
    context: {
      isVulnerable?: boolean
      isCrisis?: boolean
      isCelebration?: boolean
      isPersonalShare?: boolean
    }
  ): number {
    let change = 0
    
    // Base change from interaction (0.1 - 0.5)
    change += 0.1 + (responseQuality * 0.4)
    
    // Emotional intensity bonus
    if (sentiment.emotionalIntensity > 7) {
      change += 0.3
    } else if (sentiment.emotionalIntensity > 5) {
      change += 0.2
    }
    
    // Context bonuses
    if (context.isVulnerable) change += 0.5
    if (context.isCrisis) change += 0.4
    if (context.isCelebration) change += 0.3
    if (context.isPersonalShare) change += 0.2
    
    // Trust builds slower at higher levels
    const currentTrust = 50 // This would come from profile
    if (currentTrust > 80) {
      change *= 0.5
    } else if (currentTrust > 60) {
      change *= 0.7
    } else if (currentTrust > 40) {
      change *= 0.85
    }
    
    return Math.min(2, change) // Cap at 2 points per interaction
  }
  
  private getStageByTrust(trustLevel: number): RelationshipStage {
    return relationshipStages.find(stage => 
      trustLevel >= stage.minTrust && trustLevel <= stage.maxTrust
    ) || relationshipStages[0]
  }
  
  private getNextStage(currentStage: RelationshipStage): RelationshipStage | null {
    const currentIndex = relationshipStages.findIndex(s => s.name === currentStage.name)
    return relationshipStages[currentIndex + 1] || null
  }
  
  private async getAchievements(userId: string): Promise<Set<string>> {
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        type: "milestone_achieved"
      },
      select: {
        metadata: true
      }
    })
    
    return new Set(
      activities
        .map(a => a.metadata?.milestoneId)
        .filter(Boolean)
    )
  }
  
  private async checkEventBasedMilestone(
    userId: string, 
    milestone: RelationshipMilestone
  ): Promise<boolean> {
    const recentActivities = await prisma.activity.findMany({
      where: {
        userId,
        type: milestone.criteria.event,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 1
    })
    
    return recentActivities.length > 0
  }
  
  private async storeAchievement(userId: string, milestone: RelationshipMilestone) {
    await prisma.activity.create({
      data: {
        userId,
        type: "milestone_achieved",
        metadata: {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          description: milestone.description,
          trustRequired: milestone.trustRequired
        }
      }
    })
  }
  
  private async recordProgressionEvent(userId: string, event: ProgressionEvent) {
    await prisma.activity.create({
      data: {
        userId,
        type: event.type,
        metadata: {
          impact: event.impact,
          description: event.description
        }
      }
    })
  }
}

export const relationshipProgression = new RelationshipProgression()