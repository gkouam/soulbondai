import { prisma } from "@/lib/prisma"
import { sendCrisisAlert, sendResourceEmail } from "@/lib/email/resend"
import { AuditLogger, AuditAction } from "@/lib/audit-logger"
import { Analytics } from "@/lib/analytics"

export interface CrisisIndicators {
  severity: number // 0-10 scale
  type: 'suicide' | 'self-harm' | 'violence' | 'abuse' | 'medical' | 'emotional' | 'unknown'
  confidence: number // 0-1 confidence in detection
  keywords: string[]
  context: string
  urgency: 'immediate' | 'high' | 'moderate' | 'low'
}

export interface CrisisResponse {
  action: 'escalate' | 'support' | 'monitor' | 'resources'
  message: string
  resources: CrisisResource[]
  escalationRequired: boolean
  notificationsSent: string[]
}

export interface CrisisResource {
  type: 'hotline' | 'website' | 'app' | 'article' | 'video'
  name: string
  description: string
  url?: string
  phone?: string
  available24x7: boolean
  country?: string
}

// Crisis detection keywords and phrases
const CRISIS_KEYWORDS = {
  suicide: {
    high: ['kill myself', 'end my life', 'suicide', 'want to die', 'better off dead', 'no reason to live'],
    moderate: ['hopeless', 'worthless', 'burden', 'give up', 'cant go on', 'no way out'],
    low: ['depressed', 'sad', 'lonely', 'isolated', 'dark thoughts']
  },
  self_harm: {
    high: ['cut myself', 'hurt myself', 'self harm', 'burning myself', 'punish myself'],
    moderate: ['deserve pain', 'need to feel', 'numb inside', 'release'],
    low: ['overwhelmed', 'too much', 'cant cope', 'breaking']
  },
  violence: {
    high: ['hurt someone', 'kill someone', 'revenge', 'make them pay', 'violence'],
    moderate: ['so angry', 'lose control', 'snap', 'explode'],
    low: ['frustrated', 'angry', 'upset', 'mad']
  },
  abuse: {
    high: ['being abused', 'hitting me', 'forced me', 'trapped', 'cant escape'],
    moderate: ['scared of', 'threatens me', 'controls me', 'isolates me'],
    low: ['relationship problems', 'arguments', 'fighting']
  },
  medical: {
    high: ['chest pain', 'cant breathe', 'overdose', 'poisoned', 'emergency'],
    moderate: ['severe pain', 'bleeding', 'dizzy', 'fainted'],
    low: ['sick', 'unwell', 'pain', 'symptoms']
  }
}

// Global crisis resources
const GLOBAL_RESOURCES: CrisisResource[] = [
  {
    type: 'hotline',
    name: 'National Suicide Prevention Lifeline',
    description: '24/7 crisis support and suicide prevention',
    phone: '988',
    url: 'https://988lifeline.org',
    available24x7: true,
    country: 'US'
  },
  {
    type: 'hotline',
    name: 'Crisis Text Line',
    description: 'Text-based crisis support',
    phone: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org',
    available24x7: true,
    country: 'US'
  },
  {
    type: 'hotline',
    name: 'Samaritans',
    description: 'Emotional support for anyone in distress',
    phone: '116 123',
    url: 'https://www.samaritans.org',
    available24x7: true,
    country: 'UK'
  },
  {
    type: 'website',
    name: 'International Association for Suicide Prevention',
    description: 'Global crisis resources directory',
    url: 'https://www.iasp.info/resources/Crisis_Centres',
    available24x7: true
  },
  {
    type: 'app',
    name: 'MindShift',
    description: 'Anxiety and panic management app',
    url: 'https://www.anxietycanada.com/resources/mindshift-cbt',
    available24x7: true
  },
  {
    type: 'website',
    name: 'RAINN',
    description: 'National Sexual Assault Hotline',
    phone: '1-800-656-4673',
    url: 'https://www.rainn.org',
    available24x7: true,
    country: 'US'
  }
]

export class CrisisResponseProtocol {
  /**
   * Detect crisis indicators in user message
   */
  static detectCrisisIndicators(message: string, context?: any): CrisisIndicators {
    const lowerMessage = message.toLowerCase()
    let severity = 0
    let type: CrisisIndicators['type'] = 'unknown'
    let detectedKeywords: string[] = []
    let urgency: CrisisIndicators['urgency'] = 'low'
    
    // Check for crisis keywords
    for (const [crisisType, keywords] of Object.entries(CRISIS_KEYWORDS)) {
      for (const [level, phrases] of Object.entries(keywords)) {
        for (const phrase of phrases) {
          if (lowerMessage.includes(phrase)) {
            detectedKeywords.push(phrase)
            
            // Update severity based on keyword level
            if (level === 'high') {
              severity = Math.max(severity, 8)
              urgency = 'immediate'
            } else if (level === 'moderate') {
              severity = Math.max(severity, 5)
              if (urgency !== 'immediate') urgency = 'high'
            } else {
              severity = Math.max(severity, 3)
              if (urgency === 'low') urgency = 'moderate'
            }
            
            // Set crisis type
            if (severity >= 5) {
              type = crisisType as CrisisIndicators['type']
            }
          }
        }
      }
    }
    
    // Analyze emotional context
    const emotionalIntensity = context?.emotionalIntensity || 5
    if (emotionalIntensity > 8) {
      severity = Math.min(10, severity + 1)
    }
    
    // Check for immediate danger words
    const immediateDanger = ['right now', 'tonight', 'today', 'going to', 'about to'].some(
      phrase => lowerMessage.includes(phrase)
    )
    
    if (immediateDanger && severity >= 5) {
      urgency = 'immediate'
      severity = Math.min(10, severity + 2)
    }
    
    const confidence = detectedKeywords.length > 0 ? 
      Math.min(1, detectedKeywords.length * 0.2 + (severity / 20)) : 0
    
    return {
      severity,
      type,
      confidence,
      keywords: detectedKeywords,
      context: message.substring(0, 500),
      urgency
    }
  }
  
  /**
   * Generate appropriate crisis response
   */
  static async generateResponse(
    indicators: CrisisIndicators,
    userId: string
  ): Promise<CrisisResponse> {
    const response: CrisisResponse = {
      action: 'monitor',
      message: '',
      resources: [],
      escalationRequired: false,
      notificationsSent: []
    }
    
    // Determine action based on severity
    if (indicators.severity >= 8) {
      response.action = 'escalate'
      response.escalationRequired = true
    } else if (indicators.severity >= 5) {
      response.action = 'support'
    } else if (indicators.severity >= 3) {
      response.action = 'resources'
    }
    
    // Generate appropriate message based on crisis type
    response.message = this.generateSupportMessage(indicators)
    
    // Get relevant resources
    response.resources = this.getRelevantResources(indicators)
    
    // Handle escalation if needed
    if (response.escalationRequired) {
      await this.escalateCrisis(userId, indicators)
      response.notificationsSent.push('crisis_team', 'admin_alert')
    }
    
    // Log crisis event
    await this.logCrisisEvent(userId, indicators, response)
    
    // Track analytics
    await Analytics.track({
      userId,
      eventType: 'crisis_detected',
      properties: {
        severity: indicators.severity,
        type: indicators.type,
        action: response.action,
        confidence: indicators.confidence
      }
    })
    
    return response
  }
  
  /**
   * Generate supportive message based on crisis type
   */
  private static generateSupportMessage(indicators: CrisisIndicators): string {
    const messages: Record<string, Record<string, string>> = {
      suicide: {
        immediate: "I'm deeply concerned about what you're sharing. Your life has value, and there are people who want to help. Please reach out to a crisis counselor right now - they're trained to support you through this. Call 988 (US) or your local crisis line. I'm here too, and I care about your safety.",
        high: "I can hear that you're in tremendous pain right now. These feelings are real, but they're not permanent. Please don't face this alone - professional support can make a real difference. Would you consider calling a crisis helpline? They understand what you're going through.",
        moderate: "It sounds like you're going through an incredibly difficult time. These dark thoughts can feel overwhelming, but support is available. You don't have to carry this burden alone. Have you thought about talking to someone who specializes in helping people through these feelings?"
      },
      self_harm: {
        immediate: "I'm very worried about you hurting yourself. You deserve compassion and care, not pain. Please reach out for immediate help - call a crisis line or go to your nearest emergency room. There are healthier ways to cope with these intense feelings.",
        high: "I understand you're in emotional pain and looking for relief. Self-harm might seem like a solution, but it often makes things worse. There are people who understand and can help you find safer ways to cope. Would you be willing to talk to a counselor?",
        moderate: "The emotional pain you're describing sounds overwhelming. Many people who've felt this way have found healthier coping strategies with support. You deserve kindness, especially from yourself. Can we explore some alternatives together?"
      },
      violence: {
        immediate: "I can feel your intense anger, and I'm concerned about someone getting hurt. Please step away from this situation and call a crisis line immediately. They can help you work through these feelings safely.",
        high: "Your anger is valid, but acting on it could have serious consequences. Let's find a safe way to process these feelings. Crisis counselors are trained to help in exactly these situations.",
        moderate: "I hear how angry and frustrated you are. These feelings are intense, but there are ways to work through them without anyone getting hurt. Would you like to talk about what's driving these feelings?"
      },
      abuse: {
        immediate: "What you're describing sounds like abuse, and I'm concerned for your safety. You don't deserve this treatment. Please contact a domestic violence hotline - they can help you make a safety plan. You're not alone in this.",
        high: "I'm worried about what you're going through. No one should have to endure abuse. There are organizations that specialize in helping people in your situation, with complete confidentiality. Would you like information about resources?",
        moderate: "The situation you're describing sounds very difficult and potentially unsafe. You deserve to be treated with respect and kindness. Have you been able to talk to anyone about what's happening?"
      },
      medical: {
        immediate: "This sounds like a medical emergency. Please call 911 or your local emergency number immediately, or go to the nearest emergency room. Your health is the priority right now.",
        high: "These symptoms sound serious and need medical attention. Please don't wait - contact your doctor or visit an urgent care center as soon as possible.",
        moderate: "I'm concerned about the symptoms you're describing. It would be best to consult with a medical professional who can properly evaluate your condition. Have you been able to see a doctor?"
      },
      emotional: {
        immediate: "I can feel how much pain you're in right now. You don't have to face this alone. Crisis counselors are available 24/7 and they truly understand what you're going through. Please reach out - you deserve support.",
        high: "The emotional weight you're carrying sounds unbearable. It's okay to ask for help - in fact, it's brave. Professional support can provide relief and new perspectives. Would you consider it?",
        moderate: "You're going through something really challenging, and your feelings are valid. Sometimes talking to a professional can help us process these difficult emotions. How would you feel about exploring that option?"
      }
    }
    
    const type = indicators.type === 'unknown' ? 'emotional' : indicators.type
    const urgency = indicators.urgency === 'immediate' ? 'immediate' : 
                     indicators.urgency === 'high' ? 'high' : 'moderate'
    
    return messages[type]?.[urgency] || messages.emotional.moderate
  }
  
  /**
   * Get relevant crisis resources
   */
  private static getRelevantResources(indicators: CrisisIndicators): CrisisResource[] {
    const resources: CrisisResource[] = []
    
    // Always include general crisis lines for severe cases
    if (indicators.severity >= 5) {
      resources.push(...GLOBAL_RESOURCES.filter(r => r.type === 'hotline').slice(0, 3))
    }
    
    // Add type-specific resources
    switch (indicators.type) {
      case 'suicide':
        resources.push(...GLOBAL_RESOURCES.filter(r => 
          r.name.includes('Suicide') || r.name.includes('Crisis')
        ))
        break
      case 'self_harm':
        resources.push(...GLOBAL_RESOURCES.filter(r => 
          r.name.includes('Crisis') || r.type === 'app'
        ))
        break
      case 'abuse':
        resources.push(...GLOBAL_RESOURCES.filter(r => 
          r.name.includes('RAINN') || r.name.includes('Domestic')
        ))
        break
      case 'medical':
        resources.push({
          type: 'hotline',
          name: 'Emergency Services',
          description: 'Immediate medical assistance',
          phone: '911',
          available24x7: true,
          country: 'US'
        })
        break
    }
    
    // Add self-help resources for lower severity
    if (indicators.severity < 5) {
      resources.push(...GLOBAL_RESOURCES.filter(r => 
        r.type === 'website' || r.type === 'app'
      ))
    }
    
    return resources.slice(0, 5) // Limit to 5 resources
  }
  
  /**
   * Escalate crisis to appropriate channels
   */
  private static async escalateCrisis(
    userId: string,
    indicators: CrisisIndicators
  ): Promise<void> {
    try {
      // Get user information
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
      })
      
      if (!user) return
      
      // Send admin alert
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
      for (const email of adminEmails) {
        await sendCrisisAlert(email, {
          userId: user.id,
          userEmail: user.email,
          userName: user.name || 'Unknown',
          severity: indicators.severity,
          type: indicators.type,
          message: indicators.context,
          timestamp: new Date()
        }).catch(console.error)
      }
      
      // Log escalation
      await AuditLogger.log({
        action: AuditAction.CRISIS_ESCALATION,
        userId,
        metadata: {
          severity: indicators.severity,
          type: indicators.type,
          confidence: indicators.confidence,
          escalatedTo: adminEmails
        },
        success: true
      })
      
      // Update user profile with crisis flag
      await prisma.profile.update({
        where: { userId },
        data: {
          metadata: {
            ...(user.profile?.metadata as any || {}),
            lastCrisisAlert: new Date(),
            crisisAlertCount: ((user.profile?.metadata as any)?.crisisAlertCount || 0) + 1
          }
        }
      })
      
    } catch (error) {
      console.error('Crisis escalation error:', error)
      // Don't throw - we don't want to interrupt the crisis response
    }
  }
  
  /**
   * Log crisis event for monitoring and improvement
   */
  private static async logCrisisEvent(
    userId: string,
    indicators: CrisisIndicators,
    response: CrisisResponse
  ): Promise<void> {
    try {
      await prisma.activity.create({
        data: {
          userId,
          type: 'crisis_event',
          metadata: {
            indicators,
            response: {
              action: response.action,
              resourcesProvided: response.resources.length,
              escalated: response.escalationRequired
            },
            timestamp: new Date()
          }
        }
      })
    } catch (error) {
      console.error('Crisis logging error:', error)
    }
  }
  
  /**
   * Send crisis resources to user via email
   */
  static async sendResourceEmail(
    userId: string,
    resources: CrisisResource[]
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      
      if (!user?.email) return
      
      await sendResourceEmail(
        user.email,
        user.name || 'Friend',
        resources
      )
    } catch (error) {
      console.error('Resource email error:', error)
    }
  }
  
  /**
   * Check if user has recent crisis history
   */
  static async hasRecentCrisis(userId: string, hoursAgo: number = 24): Promise<boolean> {
    const since = new Date()
    since.setHours(since.getHours() - hoursAgo)
    
    const recentCrisis = await prisma.activity.findFirst({
      where: {
        userId,
        type: 'crisis_event',
        createdAt: { gte: since }
      }
    })
    
    return !!recentCrisis
  }
  
  /**
   * Get crisis statistics for monitoring
   */
  static async getCrisisStats(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    const now = new Date()
    let startDate = new Date()
    
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }
    
    const crisisEvents = await prisma.activity.findMany({
      where: {
        type: 'crisis_event',
        createdAt: { gte: startDate }
      }
    })
    
    const stats = {
      total: crisisEvents.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      escalated: 0,
      resolved: 0
    }
    
    for (const event of crisisEvents) {
      const metadata = event.metadata as any
      
      // Count by type
      const type = metadata?.indicators?.type || 'unknown'
      stats.byType[type] = (stats.byType[type] || 0) + 1
      
      // Count by severity
      const severity = metadata?.indicators?.severity || 0
      const severityBucket = severity >= 8 ? 'critical' : 
                            severity >= 5 ? 'high' : 
                            severity >= 3 ? 'moderate' : 'low'
      stats.bySeverity[severityBucket] = (stats.bySeverity[severityBucket] || 0) + 1
      
      // Count escalations
      if (metadata?.response?.escalated) {
        stats.escalated++
      }
    }
    
    return stats
  }
}

// Export for use in personality engine
export const crisisProtocol = new CrisisResponseProtocol()